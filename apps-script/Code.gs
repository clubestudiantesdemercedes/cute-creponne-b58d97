/**
 * Pileta Temporada 26/27 CAE — versión Google Apps Script.
 *
 * La aplicación se ejecuta como Web App. El ID de la planilla se guarda
 * en Script Properties (SPREADSHEET_ID); nunca se expone al navegador.
 */
const APP_CONFIG = Object.freeze({
  name: 'Pileta Temporada 26/27 CAE',
  spreadsheetProperty: 'SPREADSHEET_ID',
  timezone: 'America/Argentina/Buenos_Aires',
  version: '0.2.0'
});

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle(APP_CONFIG.name)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/** Ejecutar manualmente desde el editor, una vez vinculada la planilla. */
function setupDatabase() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('Abrí Apps Script desde la planilla del natatorio y volvé a ejecutar setupDatabase().');
  PropertiesService.getScriptProperties().setProperty(APP_CONFIG.spreadsheetProperty, spreadsheet.getId());
  const definitions = getTableDefinitions_();
  const created = [], existing = [];
  Object.keys(definitions).forEach(function(name) {
    const headers = definitions[name];
    let sheet = spreadsheet.getSheetByName(name);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(name);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setWrap(true);
      sheet.autoResizeColumns(1, headers.length); created.push(name); return;
    }
    const lastColumn = Math.max(sheet.getLastColumn(), headers.length);
    const current = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0];
    const actual = current.slice(0, headers.length);
    if (actual.every(value => value === '')) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1); sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setWrap(true); created.push(name);
    } else if (JSON.stringify(actual) !== JSON.stringify(headers)) {
      throw new Error('La hoja "' + name + '" ya existe pero sus encabezados no coinciden. No se modificó.');
    } else existing.push(name);
  });
  return {ok:true,spreadsheetId:spreadsheet.getId(),created:created,alreadyConfigured:existing,message:'Estructura inicial verificada. No se cargaron datos ficticios ni usuarios predeterminados.'};
}

function getDatabase_() {
  const id = PropertiesService.getScriptProperties().getProperty(APP_CONFIG.spreadsheetProperty);
  if (!id) throw new Error('La base todavía no está configurada. Ejecutá setupDatabase() desde el editor.');
  return SpreadsheetApp.openById(id);
}

function readTable_(tableName) {
  const definitions = getTableDefinitions_();
  if (!Object.prototype.hasOwnProperty.call(definitions, tableName)) throw new Error('Tabla no permitida: ' + tableName);
  const sheet = getDatabase_().getSheetByName(tableName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const values = sheet.getRange(1,1,sheet.getLastRow(),definitions[tableName].length).getValues();
  const headers = values.shift();
  return values.map(row => headers.reduce((record,header,index) => {record[header]=row[index];return record;},{}));
}

function withScriptLock_(callback) {
  const lock=LockService.getScriptLock();lock.waitLock(20000);
  try{return callback();}finally{lock.releaseLock();}
}

function getTableDefinitions_() {
  return {
    Usuarios:['id','usuario','nombre_completo','hash_contrasena','rol','activo','creado_en'],
    Personas:['id','dni','nombre','apellido','fecha_nacimiento','telefono','email','domicilio','notas','estado','creado_en','actualizado_en'],
    Socios:['id','persona_id','numero_socio','fecha_alta','estado_socio','categoria','creado_en','actualizado_en'],
    Familias:['id','nombre','creado_en'],
    IntegrantesFamilia:['id','familia_id','persona_id','parentesco'],
    Convenios:['id','nombre','tipo','descripcion','fecha_desde','fecha_hasta','estado','gratuito','max_beneficiarios','beneficio','notas','creado_en'],
    BeneficiariosConvenio:['id','convenio_id','persona_id','codigo_empleado','estado','creado_en'],
    Planes:['id','nombre','descripcion','duracion_valor','unidad_duracion','temporada_desde','temporada_hasta','activo','orden','creado_en'],
    Tarifas:['id','plan_id','tipo_condicion','convenio_id','importe','activo'],
    Ventas:['id','numero_venta','usuario_id','importe_total','medio_pago','estado','notas','motivo_anulacion','detalle_anulacion','anulada_en','anulada_por','creada_en'],
    DetalleVentas:['id','venta_id','persona_id','tipo_condicion','convenio_id','plan_id','precio_unitario'],
    Pagos:['id','venta_id','importe','medio_pago','estado','usuario_id','creado_en'],
    Permisos:['id','codigo','persona_id','detalle_venta_id','plan_id','tipo_condicion','convenio_id','fecha_desde','fecha_hasta','estado','creado_en'],
    Ingresos:['id','persona_id','permiso_id','usuario_id','metodo','tipo_ingreso','fecha_hora'],
    CierresCaja:['id','fecha','usuario_cierre_id','totales_json','cantidad_ventas','importe_total','estado','cerrado_en'],
    Auditoria:['id','usuario_id','accion','tipo_entidad','entidad_id','detalle_json','creado_en'],
    Configuracion:['clave','valor']
  };
}

function healthCheck() {
  const spreadsheet=getDatabase_();
  return {ok:true,app:APP_CONFIG.name,version:APP_CONFIG.version,spreadsheetConnected:Boolean(spreadsheet.getId()),spreadsheetName:spreadsheet.getName(),tables:Object.keys(getTableDefinitions_()).length};
}
