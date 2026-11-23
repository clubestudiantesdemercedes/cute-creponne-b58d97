# Sistema de Gestión de Natatorio — Club Atlético Estudiantes

Aplicación web para gestionar la temporada de pileta del Club Atlético Estudiantes (Mercedes, Buenos Aires): venta de pases a socios, no socios y beneficiarios de convenios, generación de permisos con código QR, control de ingreso, reportes, cierre de caja e importación de la base de socios.

## Funcionalidades principales

- **Venta rápida**: selección de tipo de persona (socio / no socio / convenio / deportista), búsqueda o alta de persona, selección de plan con precio automático, carga de varias personas en una misma venta y pago único.
- **Permisos y QR**: cada persona recibe un permiso individual con fechas de vigencia calculadas automáticamente y un código QR verificable.
- **Control de ingreso**: pantalla mobile-first para escanear el QR (usando la API `BarcodeDetector` del navegador) o buscar por DNI, con aviso de ingresos duplicados y bloqueo de permisos vencidos.
- **Socios**: importación masiva desde CSV/Excel (con vista previa de nuevos/actualizados/errores), fecha de alta, categoría y búsqueda por número de socio o DNI.
- **Convenios**: administración de convenios con empresas, sindicatos o instituciones, y sus beneficiarios y tarifas propias.
- **Planes y tarifas**: configuración de planes (diario, semanal, mensual, temporada) y tarifas por tipo de condición, sin precios fijos en el código.
- **Anulación de ventas**: motivo clasificado, notas opcionales, registro de quién anuló y cuándo; se anulan pagos y permisos asociados.
- **Reportes y exportación**: ventas, ingresos, convenios y vencimientos de permisos, exportables a CSV.
- **Cierre de caja**: totales diarios por método de pago, con cierre definitivo habilitado solo para administradores.
- **PWA**: instalable en el dispositivo (pantalla de inicio), con service worker, página offline y aviso de actualizaciones.

## Roles

| Rol | Descripción |
|---|---|
| `admin` | Administrador general: acceso completo (usuarios, planes, convenios, caja, configuración). |
| `operador` | Operaciones diarias: ventas, ingreso, personas, socios y reportes. |

## Stack técnico

- [TanStack Start](https://tanstack.com/start) (React 19) con ruteo basado en archivos
- Tailwind CSS v4
- Netlify Database (Postgres) + Drizzle ORM
- Autenticación por cookie de sesión firmada (sin dependencias externas)
- PWA (manifest + service worker)
- Despliegue en Netlify

## Desarrollo local

```bash
pnpm install
pnpm dev
```

### Variables de entorno

- `SESSION_SECRET`: clave usada para firmar la cookie de sesión. **Obligatoria en producción** — en desarrollo existe un valor de respaldo, pero no debe usarse fuera de local.
- La conexión a la base de datos la provee automáticamente Netlify Database (Netlify DB) al vincular el sitio; no requiere configuración manual en local si se usa `netlify dev`.

### Comprobantes automáticos por correo

Al confirmar una venta, el sistema prepara un envío por cada dirección válida y única de los beneficiarios. Cada destinatario recibe su propio correo con el comprobante completo: todas las personas de la venta, importes, vigencias y los QR reales de todos los permisos, aunque otros integrantes no tengan correo.

La entrega es independiente de la venta: un error al preparar la cola o enviar un correo no revierte la venta ni los permisos. Los estados por destinatario son `pendiente`, `procesando`, `enviado`, `fallido` y `en_revision`. Los pendientes y fallidos se pueden reintentar desde la confirmación o desde el detalle de la venta en Reportes. Un resultado incierto (por ejemplo, pérdida de conexión después de enviar) exige revisar Gmail > Enviados antes de autorizar un reintento, para reducir el riesgo de duplicados.

Configuración requerida en los secretos del entorno de Netlify (solo servidor):

- `GMAIL_CLIENT_ID`
- `GMAIL_CLIENT_SECRET`
- `GMAIL_REFRESH_TOKEN`
- `GMAIL_SENDER_EMAIL`

El administrador debe configurar Gmail API en Google Cloud, habilitar el alcance OAuth `https://www.googleapis.com/auth/gmail.send` y autorizar acceso sin conexión (`offline access`) para obtener el refresh token. La cuenta autenticada debe coincidir con la dirección remitente o tenerla configurada como alias autorizado. Nunca guardar estas credenciales en GitHub, en variables públicas del frontend ni compartirlas por chat. Si el consentimiento OAuth permanece en modo de prueba, los refresh tokens de una aplicación externa pueden caducar a los siete días; conviene publicar/configurar correctamente la pantalla de consentimiento antes de habilitar el servicio.

Pruebas unitarias de la lógica de destinatarios y clasificación de fallos (Node 22 o superior):

```bash
pnpm test:emails
```

### Base de datos

El esquema vive en `db/schema.ts`. Ante cualquier cambio, generar una migración con:

```bash
npx drizzle-kit generate --name <nombre_del_cambio>
```

Netlify aplica las migraciones de `netlify/database/migrations/` automáticamente al desplegar.

### Datos de demostración

Desde **Configuración → Cargar datos de demostración** se pueden cargar usuarios, planes, tarifas, convenios, socios, no socios, beneficiarios, ventas e ingresos de ejemplo (nombres y DNI ficticios). La acción es segura de ejecutar una sola vez: si ya existen usuarios cargados, no hace nada.

Usuarios de demostración (contraseña `estudiantes2026` para todos):

| Usuario | Rol |
|---|---|
| `admin` | Administrador |
| `operador` | Operador |

Ver `AGENTS.md` para el detalle de la arquitectura y decisiones de diseño.
