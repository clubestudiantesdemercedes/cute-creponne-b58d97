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

## Usuarios y acceso (primera etapa)

1. Agregar el archivo de servidor `Auth.gs` al proyecto de Apps Script.
2. Reemplazar el contenido de `Index.html`, `Styles.html` y `Client.html` por las versiones actuales de esta carpeta.
3. Guardar el proyecto.
4. Desde el editor, seleccionar y ejecutar `generateAdminSetupCode`. La función sólo funciona si la pestaña **Usuarios** está vacía.
5. Copiar el código de un solo uso desde el registro de ejecución. Vence a los 30 minutos.
6. Abrir la aplicación (cuando se despliegue como Web App restringida) y completar el formulario para crear el primer administrador.
7. Iniciar sesión con ese usuario. Desde **Usuarios**, el administrador puede crear las cuentas de los operadores y activar/desactivar esas cuentas.

### Reglas de seguridad actuales

- No hay usuarios ni contraseñas predeterminados.
- Las contraseñas se guardan con hash PBKDF2-HMAC-SHA256 y salt individual; no se guardan en texto plano.
- El código de creación inicial se genera desde el editor, tiene vencimiento y sólo se acepta una vez.
- Los intentos fallidos de inicio de sesión tienen bloqueo temporal después de cinco intentos.
- Los tokens de sesión se validan en el servidor y se almacenan en caché; al vencer, el usuario debe ingresar nuevamente.
- La interfaz no recibe hashes, salts ni el ID de la planilla.
- Sólo el administrador puede crear, listar o desactivar cuentas de operador.

**Importante:** esto es una primera implementación para pruebas. Antes de producción hay que revisar el despliegue y sus permisos de acceso, probar sesiones y concurrencia, definir recuperación/cambio de contraseñas y completar la auditoría de acciones. No compartir la planilla con los operadores.

## Desarrollo con GitHub

El código fuente se conserva en `apps-script/`. Para sincronizar con el proyecto real se recomienda usar Google clasp desde una computadora de desarrollo. No subir `.clasp.json` con IDs privados ni archivos con credenciales.

## Estado

Base de datos inicial verificada por el usuario. Autenticación y administración inicial de usuarios implementadas en el código fuente de la rama `apps-script`, pendientes de incorporar al editor y probar. No está lista para uso operativo ni para publicar como aplicación de producción.

## Próximas etapas

1. Probar creación del administrador, inicio/cierre de sesión y gestión de operadores.
2. Revisar roles, sesiones, recuperación de contraseñas y despliegue restringido.
3. Personas, socios, familias y convenios.
4. Planes y tarifas.
5. Ventas, pagos, permisos y QR.
6. Ingreso por QR/DNI.
7. Caja, anulaciones, auditoría y reportes.
8. Gmail, comprobantes y respaldos.
9. Pruebas integrales y despliegue.
