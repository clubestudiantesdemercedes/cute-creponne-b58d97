import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { and, eq, ne, or } from 'drizzle-orm'
import { db } from './db.server'
import {
  users,
  auditLogs,
  sales,
  payments,
  entries,
  cashClosures,
} from '../../db/schema'
import { requireUser } from './auth.server'

export const listUsers = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await requireUser()
  if (user.role !== 'admin') throw new Error('Solo un administrador puede ver los usuarios.')
  const rows = await db
    .select({ id: users.id, username: users.username, fullName: users.fullName, role: users.role, active: users.active })
    .from(users)
    .orderBy(users.fullName)
  return rows
})

const UserInput = z.object({
  username: z.string().trim().min(3, 'El usuario debe tener al menos 3 caracteres.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.').optional(),
  fullName: z.string().trim().min(1, 'Ingresá el nombre completo.'),
  role: z.enum(['admin', 'operador']),
  active: z.boolean().default(true),
})

export const createUser = createServerFn({ method: 'POST' })
  .inputValidator(UserInput)
  .handler(async ({ data }) => {
    const requester = await requireUser()
    if (requester.role !== 'admin') throw new Error('Solo un administrador puede crear usuarios.')
    if (!data.password) throw new Error('La contraseña es obligatoria para crear un usuario.')
    const username = data.username.toLowerCase()
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.username, username))
    if (existing) throw new Error('Ya existe un usuario con ese nombre de usuario.')
    const passwordHash = await bcrypt.hash(data.password, 10)
    const [created] = await db
      .insert(users)
      .values({
        username,
        passwordHash,
        fullName: data.fullName,
        role: data.role,
        active: data.active,
      })
      .returning()
    await db.insert(auditLogs).values({
      userId: requester.userId,
      action: 'crear_usuario',
      entityType: 'user',
      entityId: String(created.id),
      details: { username, fullName: data.fullName, role: data.role, active: data.active },
    })
    return { id: created.id, username: created.username, fullName: created.fullName, role: created.role }
  })

export const updateUser = createServerFn({ method: 'POST' })
  .inputValidator(UserInput.extend({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    const requester = await requireUser()
    if (requester.role !== 'admin') throw new Error('Solo un administrador puede modificar usuarios.')

    const [target] = await db.select().from(users).where(eq(users.id, data.id))
    if (!target) throw new Error('No se encontró el usuario que querés modificar.')

    const username = data.username.toLowerCase()
    const [duplicate] = await db.select({ id: users.id }).from(users).where(eq(users.username, username))
    if (duplicate && duplicate.id !== data.id) {
      throw new Error('Ya existe otro usuario con ese nombre de usuario.')
    }

    if (requester.userId === data.id && (!data.active || data.role !== 'admin')) {
      throw new Error('No podés desactivar tu propia cuenta ni quitarte el rol de administrador.')
    }

    if (target.role === 'admin' && target.active && (!data.active || data.role !== 'admin')) {
      const activeAdmins = await db.select({ id: users.id, active: users.active }).from(users).where(eq(users.role, 'admin'))
      if (activeAdmins.filter((admin) => admin.active).length <= 1) {
        throw new Error('No podés quitar o desactivar al único administrador general activo.')
      }
    }

    const updateValues: Record<string, unknown> = {
      username,
      fullName: data.fullName,
      role: data.role,
      active: data.active,
    }
    if (data.password) {
      updateValues.passwordHash = await bcrypt.hash(data.password, 10)
    }

    await db.update(users).set(updateValues).where(eq(users.id, data.id))

    const changes: Record<string, unknown> = {
      username: { from: target.username, to: username },
      fullName: { from: target.fullName, to: data.fullName },
      role: { from: target.role, to: data.role },
      active: { from: target.active, to: data.active },
      passwordChanged: Boolean(data.password),
    }
    await db.insert(auditLogs).values({
      userId: requester.userId,
      action: 'modificar_usuario',
      entityType: 'user',
      entityId: String(data.id),
      details: changes,
    })

    return { ok: true }
  })

/**
 * Elimina definitivamente una cuenta únicamente si no tiene operaciones ni
 * auditorías asociadas. Las cuentas con historial deben conservarse inactivas.
 */
export const deleteUser = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    const requester = await requireUser()
    if (requester.role !== 'admin') throw new Error('Solo un administrador puede eliminar usuarios.')
    if (requester.userId === data.id) throw new Error('No podés eliminar la cuenta con la que estás conectado.')

    return db.transaction(async (tx) => {
      const [target] = await tx.select().from(users).where(eq(users.id, data.id))
      if (!target) throw new Error('No se encontró el usuario que querés eliminar.')
      if (target.username === 'jsiri') throw new Error('La cuenta jsiri es el administrador general y no se puede eliminar.')

      if (target.role === 'admin' && target.active) {
        const activeAdmins = await tx.select({ id: users.id }).from(users).where(and(eq(users.role, 'admin'), eq(users.active, true)))
        if (activeAdmins.length <= 1) {
          throw new Error('No podés eliminar al único administrador general activo.')
        }
      }

      const [saleCreated] = await tx.select({ id: sales.id }).from(sales).where(eq(sales.createdByUserId, data.id)).limit(1)
      const [saleVoided] = await tx.select({ id: sales.id }).from(sales).where(eq(sales.voidedByUserId, data.id)).limit(1)
      const [payment] = await tx.select({ id: payments.id }).from(payments).where(eq(payments.createdByUserId, data.id)).limit(1)
      const [entry] = await tx.select({ id: entries.id }).from(entries).where(eq(entries.checkedInByUserId, data.id)).limit(1)
      const [closure] = await tx.select({ id: cashClosures.id }).from(cashClosures).where(eq(cashClosures.closedByUserId, data.id)).limit(1)
      const [audit] = await tx.select({ id: auditLogs.id }).from(auditLogs).where(eq(auditLogs.userId, data.id)).limit(1)

      if (saleCreated || saleVoided || payment || entry || closure || audit) {
        throw new Error('Este usuario tiene ventas, cobros, ingresos, cierres o auditorías asociados. Para conservar el historial, no se puede eliminar; podés dejarlo inactivo.')
      }

      await tx.delete(users).where(eq(users.id, data.id))
      await tx.insert(auditLogs).values({
        userId: requester.userId,
        action: 'eliminar_usuario',
        entityType: 'user',
        entityId: String(data.id),
        details: { username: target.username, fullName: target.fullName, role: target.role },
      })

      return { ok: true, username: target.username }
    })
  })

/**
 * Deshabilita las demás cuentas conservando jsiri como administrador general.
 */
export const deactivateOtherUsers = createServerFn({ method: 'POST' }).handler(async () => {
  const requester = await requireUser()
  if (requester.role !== 'admin' || requester.username !== 'jsiri') {
    throw new Error('Solo jsiri, como administrador general, puede realizar esta limpieza.')
  }

  const [currentUser] = await db
    .select({ id: users.id, active: users.active, role: users.role })
    .from(users)
    .where(eq(users.id, requester.userId))

  if (!currentUser || !currentUser.active || currentUser.role !== 'admin') {
    throw new Error('La cuenta jsiri debe estar activa y ser administrador general.')
  }

  const disabled = await db
    .update(users)
    .set({ active: false })
    .where(ne(users.id, requester.userId))
    .returning({ id: users.id, username: users.username })

  await db.insert(auditLogs).values({
    userId: requester.userId,
    action: 'deshabilitar_otras_cuentas',
    entityType: 'user',
    entityId: String(requester.userId),
    details: {
      keptUsername: 'jsiri',
      disabledUsernames: disabled.map((u) => u.username),
    },
  })

  return { disabledCount: disabled.length, disabledUsernames: disabled.map((u) => u.username) }
})
