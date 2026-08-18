import { createServerFn } from '@tanstack/react-start'
import { sql } from 'drizzle-orm'
import { db } from './db.server'
import { requireUser } from './auth.server'

export const resetTestEnvironment = createServerFn({ method: 'POST' }).handler(async () => {
  const user = await requireUser()

  // Solamente el administrador puede reiniciar el entorno.
  if (user.role !== 'admin') {
    throw new Error('Solo un administrador puede reiniciar el entorno de prueba.')
  }

  // Borramos primero las tablas que dependen de otras tablas.
  // Las relaciones están configuradas como NO ACTION,
  // por lo que el orden es importante.

  await db.transaction(async (tx) => {
    // Registros de acceso
    await tx.execute(sql`DELETE FROM entries`)

    // Permisos generados por las ventas
    await tx.execute(sql`DELETE FROM permits`)

    // Detalle de ventas
    await tx.execute(sql`DELETE FROM sale_items`)

    // Pagos
    await tx.execute(sql`DELETE FROM payments`)

    // Ventas
    await tx.execute(sql`DELETE FROM sales`)

    // Beneficiarios de convenios
    await tx.execute(sql`DELETE FROM convention_beneficiaries`)

    // Socios
    await tx.execute(sql`DELETE FROM members`)

    // Integrantes de familias
    await tx.execute(sql`DELETE FROM family_members`)

    // Familias
    await tx.execute(sql`DELETE FROM families`)

    // Personas
    await tx.execute(sql`DELETE FROM people`)

    // Tarifas
    await tx.execute(sql`DELETE FROM prices`)

    // Convenios
    await tx.execute(sql`DELETE FROM conventions`)

    // Planes
    await tx.execute(sql`DELETE FROM plans`)

    // Cierres de caja
    await tx.execute(sql`DELETE FROM cash_closures`)

    // Registros de auditoría
    await tx.execute(sql`DELETE FROM audit_logs`)

    // Configuración de prueba
    await tx.execute(sql`DELETE FROM app_config`)

    // IMPORTANTE:
    // No borramos users.
    // El usuario administrador queda disponible para volver a ingresar.
  })

  return {
    ok: true as const,
    message: 'Entorno de prueba reiniciado correctamente.',
  }
})