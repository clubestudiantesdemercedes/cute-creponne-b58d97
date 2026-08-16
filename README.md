# Sistema de Gestión de Natatorio — Club Atlético Estudiantes

Aplicación web para gestionar la temporada de pileta del Club Atlético Estudiantes (Mercedes, Buenos Aires): venta de pases a socios, no socios y beneficiarios de convenios, generación de permisos con código QR, control de ingreso, reportes, cierre de caja e importación de la base de socios.

## Funcionalidades principales

- **Venta rápida**: selección de tipo de persona (socio / no socio / convenio), búsqueda o alta de persona, selección de plan con precio automático, carga de varias personas en una misma venta y pago único.
- **Permisos y QR**: cada persona recibe un permiso individual con fechas de vigencia calculadas automáticamente y un código QR verificable.
- **Control de ingreso**: pantalla mobile-first para escanear el QR (usando la API `BarcodeDetector` del navegador) o buscar por DNI, con aviso de ingresos duplicados y bloqueo de permisos vencidos.
- **Socios**: importación masiva desde CSV/Excel (con vista previa de nuevos/actualizados/errores) y búsqueda por número de socio o DNI.
- **Convenios**: administración de convenios con empresas, sindicatos o instituciones, y sus beneficiarios y tarifas propias.
- **Planes y tarifas**: configuración de planes (diario, semanal, quincenal, mensual, temporada) y tarifas por tipo de condición, sin precios fijos en el código.
- **Reportes y exportación**: ventas, ingresos, convenios y vencimientos de permisos, todos exportables a CSV.
- **Cierre de caja**: totales diarios por método de pago, con cierre definitivo habilitado solo para administradores.
- **Roles**: administrador, encargado de pileta, control de ingreso y consulta (solo lectura).

## Stack técnico

- [TanStack Start](https://tanstack.com/start) (React 19) con ruteo basado en archivos
- Tailwind CSS v4
- Netlify Database (Postgres) + Drizzle ORM
- Autenticación por cookie de sesión firmada (sin dependencias externas)
- Despliegue en Netlify

## Desarrollo local

```bash
pnpm install
pnpm dev
```

### Variables de entorno

- `SESSION_SECRET`: clave usada para firmar la cookie de sesión. **Obligatoria en producción** — en desarrollo existe un valor de respaldo, pero no debe usarse fuera de local.
- La conexión a la base de datos la provee automáticamente Netlify Database (Netlify DB) al vincular el sitio; no requiere configuración manual en local si se usa `netlify dev`.

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
| `encargado` | Encargado de pileta |
| `ingreso` | Control de ingreso |
| `consulta` | Consulta (solo lectura) |

Ver `AGENTS.md` para el detalle de la arquitectura y decisiones de diseño.
