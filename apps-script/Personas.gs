/**
 * Gestión de personas — Natatorio CAE.
 *
 * Todas las funciones públicas reciben el token de sesión y validan
 * que el usuario esté autenticado. Administradores y operadores pueden
 * consultar y gestionar personas.
 *
 * Hoja utilizada: Personas
 * Encabezados definidos en Code.gs:
 * id, dni, nombre, apellido, fecha_nacimiento, telefono, email,
 * domicilio, notas, estado, creado_en, actualizado_en
 */

/** Crea una persona nueva. El DNI no puede estar repetido. */
function createPerson(token, data) {
  const session = requirePersonUser_(token);
  const person = validatePersonData_(data);

  return withScriptLock_(function() {
    if (findPersonByDni_(person.dni)) {
      throw new Error('Ya existe una persona registrada con ese DNI.');
    }

    const now = new Date();
    const id = Utilities.getUuid();
    const sheet = getDatabase_().getSheetByName('Personas');

    sheet.appendRow([
      id,
      person.dni,
      person.nombre,
      person.apellido,
      person.fechaNacimiento,
      person.telefono,
      person.email,
      person.domicilio,
      person.notas,
      person.estado,
      now,
      now
    ]);

    auditPerson_(session, 'CREAR_PERSONA', id, {
      dni: person.dni,
      nombre: person.nombre,
      apellido: person.apellido
    });

    return {
      ok: true,
      message: 'Persona registrada correctamente.',
      person: getPersonById_(id)
    };
  });
}

/** Busca personas por DNI, nombre o apellido. Devuelve hasta 500 resultados. */
function searchPeople(token, searchText) {
  requirePersonUser_(token);

  const query = normalizePersonSearch_(searchText);
  const people = readTable_('Personas');
  const results = [];

  for (let i = 0; i < people.length; i++) {
    const person = people[i];
    const dni = normalizeDni_(person.dni);
    const fullName = normalizePersonSearch_(
      String(person.apellido || '') + ' ' + String(person.nombre || '')
    );

    const queryDni = query.replace(/\D/g, '');
    const matchesDni = queryDni.length > 0 && dni.indexOf(queryDni) !== -1;
    if (!query || matchesDni || fullName.indexOf(query) !== -1) {
      results.push(serializePerson_(person));
      if (results.length >= 500) break;
    }
  }

  results.sort(function(a, b) {
    return (a.apellido + ' ' + a.nombre).localeCompare(b.apellido + ' ' + b.nombre, 'es');
  });

  return { people: results, total: results.length };
}

/** Obtiene una persona por su ID. */
function getPerson(token, personId) {
  requirePersonUser_(token);
  const person = getPersonById_(personId);
  if (!person) throw new Error('No se encontró la persona solicitada.');
  return { person: person };
}

/** Actualiza los datos de una persona existente. */
function updatePerson(token, personId, data) {
  const session = requirePersonUser_(token);
  const id = String(personId || '').trim();
  if (!id) throw new Error('Falta identificar a la persona.');

  const person = validatePersonData_(data);

  return withScriptLock_(function() {
    const sheet = getDatabase_().getSheetByName('Personas');
    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    const idCol = headers.indexOf('id');
    const rowIndex = values.findIndex(function(row, index) {
      return index > 0 && String(row[idCol]) === id;
    });

    if (rowIndex < 1) throw new Error('No se encontró la persona que querés modificar.');

    const duplicate = findPersonByDni_(person.dni);
    if (duplicate && String(duplicate.id) !== id) {
      throw new Error('El DNI ingresado ya pertenece a otra persona.');
    }

    const rowNumber = rowIndex + 1;
    const columnMap = {
      dni: person.dni,
      nombre: person.nombre,
      apellido: person.apellido,
      fecha_nacimiento: person.fechaNacimiento,
      telefono: person.telefono,
      email: person.email,
      domicilio: person.domicilio,
      notas: person.notas,
      estado: person.estado,
      actualizado_en: new Date()
    };

    Object.keys(columnMap).forEach(function(header) {
      const col = headers.indexOf(header);
      if (col < 0) throw new Error('Falta la columna "' + header + '" en la hoja Personas.');
      sheet.getRange(rowNumber, col + 1).setValue(columnMap[header]);
    });

    auditPerson_(session, 'MODIFICAR_PERSONA', id, {
      dni: person.dni,
      nombre: person.nombre,
      apellido: person.apellido
    });

    return {
      ok: true,
      message: 'Los datos de la persona se actualizaron correctamente.',
      person: getPersonById_(id)
    };
  });
}

/** Desactiva una persona sin eliminarla ni romper futuras relaciones. */
function deactivatePerson(token, personId) {
  const session = requirePersonUser_(token);
  const id = String(personId || '').trim();
  if (!id) throw new Error('Falta identificar a la persona.');

  return withScriptLock_(function() {
    const sheet = getDatabase_().getSheetByName('Personas');
    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    const idCol = headers.indexOf('id');
    const stateCol = headers.indexOf('estado');
    const updatedCol = headers.indexOf('actualizado_en');

    for (let i = 1; i < values.length; i++) {
      if (String(values[i][idCol]) === id) {
        sheet.getRange(i + 1, stateCol + 1).setValue('inactivo');
        sheet.getRange(i + 1, updatedCol + 1).setValue(new Date());
        auditPerson_(session, 'DESACTIVAR_PERSONA', id, {});
        return { ok: true, message: 'Persona desactivada correctamente.' };
      }
    }

    throw new Error('No se encontró la persona solicitada.');
  });
}

/** Devuelve la hoja como objeto, sólo para uso interno del servidor. */
function getPersonById_(personId) {
  const people = readTable_('Personas');
  for (let i = 0; i < people.length; i++) {
    if (String(people[i].id) === String(personId)) {
      return serializePerson_(people[i]);
    }
  }
  return null;
}

/** Busca por DNI normalizado. Sólo para uso interno del servidor. */
function findPersonByDni_(dni) {
  const normalized = normalizeDni_(dni);
  const people = readTable_('Personas');
  for (let i = 0; i < people.length; i++) {
    if (normalizeDni_(people[i].dni) === normalized) return people[i];
  }
  return null;
}

/** Valida la sesión y el rol antes de permitir operaciones sobre personas. */
function requirePersonUser_(token) {
  const session = getSession_(token);
  if (session.role !== 'admin' && session.role !== 'operador') {
    throw new Error('No tenés permisos para gestionar personas.');
  }
  return session;
}

/** Normaliza y valida los campos recibidos desde el navegador. */
function validatePersonData_(data) {
  if (!data || typeof data !== 'object') throw new Error('No se recibieron los datos de la persona.');

  const dni = normalizeDni_(data.dni);
  const nombre = cleanPersonField_(data.nombre, 80, 'nombre', true);
  const apellido = cleanPersonField_(data.apellido, 80, 'apellido', true);
  const telefono = cleanPersonField_(data.telefono, 40, 'teléfono', false);
  const email = cleanPersonField_(data.email, 120, 'correo electrónico', false).toLowerCase();
  const domicilio = cleanPersonField_(data.domicilio, 180, 'domicilio', false);
  const notas = cleanPersonField_(data.notas, 1000, 'notas', false);
  const estado = String(data.estado || 'activo').trim().toLowerCase();

  if (!/^\d{7,8}$/.test(dni)) {
    throw new Error('El DNI debe contener 7 u 8 números.');
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('El correo electrónico no tiene un formato válido.');
  }
  if (estado !== 'activo' && estado !== 'inactivo') {
    throw new Error('El estado de la persona no es válido.');
  }

  return {
    dni: dni,
    nombre: nombre,
    apellido: apellido,
    fechaNacimiento: parseBirthDate_(data.fecha_nacimiento),
    telefono: telefono,
    email: email,
    domicilio: domicilio,
    notas: notas,
    estado: estado
  };
}

/** Convierte fecha YYYY-MM-DD a Date sin desplazar el día por zona horaria. */
function parseBirthDate_(value) {
  if (value === null || value === undefined || value === '') return '';
  const text = String(value).trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) throw new Error('La fecha de nacimiento debe tener el formato AAAA-MM-DD.');

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12, 0, 0);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw new Error('La fecha de nacimiento ingresada no es válida.');
  }
  if (date.getTime() > new Date().setHours(23, 59, 59, 999)) {
    throw new Error('La fecha de nacimiento no puede ser futura.');
  }
  return date;
}

/** Limpia campos de texto y limita su longitud. */
function cleanPersonField_(value, maxLength, label, required) {
  const text = String(value === null || value === undefined ? '' : value)
    .trim()
    .replace(/\s+/g, ' ');
  if (required && !text) throw new Error('El campo ' + label + ' es obligatorio.');
  if (text.length > maxLength) throw new Error('El campo ' + label + ' supera el máximo de ' + maxLength + ' caracteres.');
  return text;
}

/** Quita puntos, espacios y guiones del DNI. */
function normalizeDni_(value) {
  return String(value === null || value === undefined ? '' : value).replace(/\D/g, '');
}

/** Normaliza texto para búsquedas sin distinguir mayúsculas ni tildes. */
function normalizePersonSearch_(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/** Devuelve fechas como texto YYYY-MM-DD para el frontend. */
function serializePerson_(person) {
  let birthDate = '';
  if (person.fecha_nacimiento instanceof Date && !isNaN(person.fecha_nacimiento.getTime())) {
    birthDate = Utilities.formatDate(person.fecha_nacimiento, APP_CONFIG.timezone, 'yyyy-MM-dd');
  } else if (person.fecha_nacimiento) {
    birthDate = String(person.fecha_nacimiento);
  }

  return {
    id: String(person.id || ''),
    dni: String(person.dni || ''),
    nombre: String(person.nombre || ''),
    apellido: String(person.apellido || ''),
    fecha_nacimiento: birthDate,
    telefono: String(person.telefono || ''),
    email: String(person.email || ''),
    domicilio: String(person.domicilio || ''),
    notas: String(person.notas || ''),
    estado: String(person.estado || 'activo'),
    creado_en: person.creado_en instanceof Date
      ? person.creado_en.toISOString()
      : String(person.creado_en || ''),
    actualizado_en: person.actualizado_en instanceof Date
      ? person.actualizado_en.toISOString()
      : String(person.actualizado_en || '')
  };
}

/** Registra las operaciones de personas en la pestaña Auditoria. */
function auditPerson_(session, action, entityId, detail) {
  const sheet = getDatabase_().getSheetByName('Auditoria');
  sheet.appendRow([
    Utilities.getUuid(),
    session.id,
    action,
    'Persona',
    String(entityId),
    JSON.stringify(detail || {}),
    new Date()
  ]);
}
