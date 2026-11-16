import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from './db.server'
import { users, auditLogs } from '../../db/schema'
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
