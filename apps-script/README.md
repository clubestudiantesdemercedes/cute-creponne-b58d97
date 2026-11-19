# Natatorio CAE — Google Apps Script

Versión alternativa en desarrollo. Se mantiene aislada de la aplicación React/Netlify.

## Arquitectura

- Interfaz: HTML, CSS y JavaScript mediante HtmlService.
- Backend: Google Apps Script V8.
- Persistencia: Google Sheets.
- Correo: GmailApp/MailApp (a implementar).
- Archivos y comprobantes: Google Drive (a implementar).
- Zona horaria: America/Argentina/Buenos_Aires.

## Preparar la planilla

1. Iniciar sesión con la cuenta Gmail institucional del club.
2. Crear una planilla nueva llamada **Natatorio CAE - Base de datos**.
3. Desde la planilla, abrir **Extensiones → Apps Script**.
4. En el proyecto de Apps Script, crear/sincronizar los archivos de esta carpeta.
5. Ejecutar manualmente la función `setupDatabase` y conceder los permisos solicitados.
6. La función crea las pestañas y encabezados definidos en `getTableDefinitions_`. No carga datos ficticios, no crea usuarios con contraseñas conocidas y no borra hojas existentes.
7. La planilla queda vinculada al proyecto. El ID se guarda en Script Properties, no en el código fuente.

## Desarrollo con GitHub

El código fuente se conserva en `apps-script/`. Para sincronizar con el proyecto real se recomienda usar Google clasp desde una computadora de desarrollo. No subir `.clasp.json` con IDs privados ni archivos con credenciales. Usar un archivo de ejemplo sin valores reales si hace falta documentar la configuración.

## Estado

Esta es la primera base técnica: manifiesto, interfaz de diagnóstico, inicialización segura del esquema y utilidades de acceso/lock. Todavía no está lista para uso operativo ni para publicar como aplicación de producción.

## Próximas etapas

1. Autenticación segura y alta inicial del administrador.
2. Usuarios/roles (un administrador y tres operadores).
3. Personas, socios, familias y convenios.
4. Planes y tarifas.
5. Ventas, pagos, permisos y QR.
6. Ingreso por QR/DNI.
7. Caja, anulaciones, auditoría y reportes.
8. Gmail, comprobantes y respaldos.
9. Pruebas y despliegue restringido.
