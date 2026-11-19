/**
 * Autenticación y administración de usuarios — Natatorio CAE.
 *
 * Las contraseñas se almacenan como hash SHA-256 con salt individual.
 * Los tokens de sesión viven en caché de servidor y no se guardan en Sheets.
 */

const AUTH_CONFIG = Object.freeze({
  sessionTtlSeconds: 21600,
  setupCodeTtlSeconds: 1800,
  maxLoginAttempts: 5,
  lockoutSeconds: 900,
  minPasswordLength: 10
});

/**
 * Ejecutar UNA SOLA VEZ desde el editor de Apps Script.
 * Genera un código de un solo uso, válido por 30 minutos.
 * Ver el código en el registro de ejecución y copiarlo al formulario inicial.
 */
function generateAdminSetupCode() {
  return withScriptLock_(function() {
    const sheet = getDatabase_().getSheetByName('Usuarios');
    if (sheet.getLastRow() > 1) {
      throw new Error('Ya existe al menos un usuario. No se puede generar otro código inicial.');
    }
    const code = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
    const props = PropertiesService.getScriptProperties();
    props.setProperty('ADMIN_SETUP_CODE_HASH', hashText_(code));
    props.setProperty('ADMIN_SETUP_CODE_EXPIRES', String(Date.now() + AUTH_CONFIG.setupCodeTtlSeconds * 1000));
    Logger.log('CÓDIGO INICIAL DE ADMINISTRADOR (copialo ahora): ' + code);
    return 'Código generado. Copialo desde el registro de ejecución; vence en 30 minutos.';
  });
}

/** Estado público mínimo para decidir si mostrar configuración inicial o login. */
function getAuthStatus() {
  const sheet = getDatabase_().getSheetByName('Usuarios');
  return { initialized: sheet.getLastRow() > 1 };
}

/** Crea el primer administrador usando el código temporal generado desde el editor. */
function createFirstAdmin(setupCode, username, fullName, password) {
  return withScriptLock_(function() {
    const sheet = getDatabase_().getSheetByName('Usuarios');
    if (sheet.getLastRow() > 1) throw new Error('La configuración inicial ya fue completada.');
    const props = PropertiesService.getScriptProperties();
    const expectedHash = props.getProperty('ADMIN_SETUP_CODE_HASH');
    const expires = Number(props.getProperty('ADMIN_SETUP_CODE_EXPIRES') || 0);
    if (!expectedHash || Date.now() > expires || hashText_(String(setupCode || '').trim()) !== expectedHash) {
      throw new Error('El código inicial no es válido o venció. Generá uno nuevo desde Apps Script.');
    }
    const user = validateNewUser_(username, fullName, password);
    const salt = Utilities.getUuid();
    const now = new Date();
    sheet.appendRow([Utilities.getUuid(), user.username, user.fullName, passwordHash_(password, salt) + ':' + salt, 'admin', true, now]);
    props.deleteProperty('ADMIN_SETUP_CODE_HASH');
    props.deleteProperty('ADMIN_SETUP_CODE_EXPIRES');
    auditAuth_('CREAR_ADMIN_INICIAL', user.username, 'Administrador inicial creado');
    return { ok: true, message: 'Administrador creado. Ya podés iniciar sesión.' };
  });
}

/** Inicio de sesión. Devuelve un token opaco; nunca devuelve hashes ni salts. */
function login(username, password) {
  const normalized = normalizeUsername_(username);
  if (!normalized || typeof password !== 'string' || !password) {
    throw new Error('Usuario o contraseña incorrectos.');
  }

  const lockKey = loginLockKey_(normalized);
  const props = PropertiesService.getScriptProperties();
  const lockedUntil = Number(props.getProperty(lockKey + '_UNTIL') || 0);
  if (Date.now() < lockedUntil) throw new Error('Demasiados intentos. Esperá 15 minutos antes de volver a intentar.');

  const user = findUserByUsername_(normalized);
  if (!user || !user.activo || !verifyPassword_(password, user.hash_contrasena)) {
    const attempts = Number(props.getProperty(lockKey + '_COUNT') || 0) + 1;
    props.setProperty(lockKey + '_COUNT', String(attempts));
    if (attempts >= AUTH_CONFIG.maxLoginAttempts) {
      props.setProperty(lockKey + '_UNTIL', String(Date.now() + AUTH_CONFIG.lockoutSeconds * 1000));
      props.deleteProperty(lockKey + '_COUNT');
    }
    throw new Error('Usuario o contraseña incorrectos.');
  }

  props.deleteProperty(lockKey + '_COUNT');
  props.deleteProperty(lockKey + '_UNTIL');
  const token = Utilities.getUuid() + Utilities.getUuid();
  const session = { id: user.id, username: user.usuario, name: user.nombre_completo, role: user.rol };
  CacheService.getScriptCache().put('AUTH_' + token, JSON.stringify(session), AUTH_CONFIG.sessionTtlSeconds);
  auditAuth_('INICIO_SESION', user.usuario, 'Inicio de sesión');
  return { token: token, user: publicUser_(session) };
}

/** Recupera la sesión actual; si la caché venció, el cliente deberá ingresar nuevamente. */
function getCurrentUser(token) {
  const session = getSession_(token);
  return { user: publicUser_(session) };
}

function logout(token) {
  if (token) CacheService.getScriptCache().remove('AUTH_' + String(token));
  return { ok: true };
}

/** Lista usuarios sin exponer campos de autenticación. Sólo administrador. */
function adminListUsers(token) {
  requireAdmin_(token);
  return readTable_('Usuarios').map(function(user) {
    return {
      id: String(user.id),
      username: String(user.usuario),
      name: String(user.nombre_completo),
      role: String(user.rol),
      active: user.activo === true || String(user.activo).toLowerCase() === 'true',
      createdAt: user.creado_en instanceof Date ? user.creado_en.toISOString() : String(user.creado_en || '')
    };
  });
}

/** Crea una cuenta de operador. Sólo administrador. */
function adminCreateOperator(token, username, fullName, password) {
  const admin = requireAdmin_(token);
  const user = validateNewUser_(username, fullName, password);
  return withScriptLock_(function() {
    if (findUserByUsername_(user.username)) throw new Error('Ese nombre de usuario ya está en uso.');
    const salt = Utilities.getUuid();
    getDatabase_().getSheetByName('Usuarios').appendRow([
      Utilities.getUuid(), user.username, user.fullName,
      passwordHash_(password, salt) + ':' + salt, 'operador', true, new Date()
    ]);
    auditAuth_('CREAR_OPERADOR', user.username, 'Creado por ' + admin.username);
    return { ok: true, message: 'Operador creado correctamente.' };
  });
}

/** Activa o desactiva una cuenta de operador. No permite modificar administradores. */
function adminSetOperatorActive(token, userId, active) {
  const admin = requireAdmin_(token);
  if (typeof active !== 'boolean') throw new Error('Estado inválido.');
  return withScriptLock_(function() {
    const sheet = getDatabase_().getSheetByName('Usuarios');
    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    const idCol = headers.indexOf('id');
    const roleCol = headers.indexOf('rol');
    const activeCol = headers.indexOf('activo');
    const usernameCol = headers.indexOf('usuario');
    let rowNumber = -1;
    let targetName = '';
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][idCol]) === String(userId)) {
        if (String(values[i][roleCol]) !== 'operador') throw new Error('Por seguridad, esta pantalla sólo permite modificar operadores.');
        rowNumber = i + 1;
        targetName = String(values[i][usernameCol]);
        break;
      }
    }
    if (rowNumber < 0) throw new Error('No se encontró el operador.');
    sheet.getRange(rowNumber, activeCol + 1).setValue(active);
    auditAuth_(active ? 'ACTIVAR_OPERADOR' : 'DESACTIVAR_OPERADOR', targetName, 'Modificado por ' + admin.username);
    return { ok: true };
  });
}

function requireAdmin_(token) {
  const session = getSession_(token);
  if (session.role !== 'admin') throw new Error('No tenés permisos para realizar esta operación.');
  return session;
}

function getSession_(token) {
  if (typeof token !== 'string' || token.length < 30) throw new Error('La sesión venció. Iniciá sesión nuevamente.');
  const raw = CacheService.getScriptCache().get('AUTH_' + token);
  if (!raw) throw new Error('La sesión venció. Iniciá sesión nuevamente.');
  return JSON.parse(raw);
}

function findUserByUsername_(username) {
  const users = readTable_('Usuarios');
  for (let i = 0; i < users.length; i++) {
    if (normalizeUsername_(users[i].usuario) === username) return users[i];
  }
  return null;
}

function validateNewUser_(username, fullName, password) {
  const normalized = normalizeUsername_(username);
  const name = String(fullName || '').trim().replace(/\s+/g, ' ');
  if (!/^[a-z0-9._-]{3,30}$/.test(normalized)) {
    throw new Error('El usuario debe tener entre 3 y 30 caracteres: letras sin acentos, números, punto, guion o guion bajo.');
  }
  if (name.length < 2 || name.length > 80) throw new Error('Ingresá un nombre completo (2 a 80 caracteres).');
  if (typeof password !== 'string' || password.length < AUTH_CONFIG.minPasswordLength || password.length > 128) {
    throw new Error('La contraseña debe tener entre 10 y 128 caracteres.');
  }
  return { username: normalized, fullName: name };
}

function normalizeUsername_(value) {
  return String(value || '').trim().toLowerCase();
}

function passwordHash_(password, salt) {
  // PBKDF2-HMAC-SHA256 (10.000 iteraciones, un bloque de 256 bits).
  let u = Utilities.computeHmacSha256Signature(salt + '\\x00\\x00\\x00\\x01', password);
  const derived = u.slice();
  for (let i = 1; i < 10000; i++) {
    u = Utilities.computeHmacSha256Signature(u, password);
    for (let j = 0; j < derived.length; j++) derived[j] = derived[j] ^ u[j];
  }
  return 'pbkdf2-sha256$10000

function verifyPassword_(password, stored) {
  const parts = String(stored || '').split(':');
  if (parts.length !== 2) return false;
  return passwordHash_(password, parts[1]) === parts[0];
}

function hashText_(value) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value), Utilities.Charset.UTF_8);
  return Utilities.base64Encode(digest);
}

function loginLockKey_(username) {
  return 'LOGIN_' + hashText_(username).replace(/[^a-zA-Z0-9]/g, '').slice(0, 24);
}

function publicUser_(session) {
  return { id: session.id, username: session.username, name: session.name, role: session.role };
}

function auditAuth_(action, entityId, detail) {
  const sheet = getDatabase_().getSheetByName('Auditoria');
  sheet.appendRow([Utilities.getUuid(), 'sistema', action, 'Usuario', String(entityId), JSON.stringify({ detalle: detail }), new Date()]);
}
 + Utilities.base64Encode(derived);
}

function verifyPassword_(password, stored) {
  const parts = String(stored || '').split(':');
  if (parts.length !== 2) return false;
  return passwordHash_(password, parts[1]) === parts[0];
}

function hashText_(value) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value), Utilities.Charset.UTF_8);
  return Utilities.base64Encode(digest);
}

function loginLockKey_(username) {
  return 'LOGIN_' + hashText_(username).replace(/[^a-zA-Z0-9]/g, '').slice(0, 24);
}

function publicUser_(session) {
  return { id: session.id, username: session.username, name: session.name, role: session.role };
}

function auditAuth_(action, entityId, detail) {
  const sheet = getDatabase_().getSheetByName('Auditoria');
  sheet.appendRow([Utilities.getUuid(), 'sistema', action, 'Usuario', String(entityId), JSON.stringify({ detalle: detail }), new Date()]);
}
