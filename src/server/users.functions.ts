import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { users } from '../../db/schema'
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
  username: z.string().min(3),
  password: z.string().min(6).optional(),
  fullName: z.string().min(1),
  role: z.enum(['admin', 'encargado', 'control_ingreso', 'consulta']),
  active: z.boolean().default(true),
})

export const createUser = createServerFn({ method: 'POST' })
  .inputValidator(UserInput)
  .handler(async ({ data }) => {
    const requester = await requireUser()
    if (requester.role !== 'admin') throw new Error('Solo un administrador puede crear usuarios.')
    if (!data.password) throw new Error('La contraseña es obligatoria para crear un usuario.')
    const passwordHash = await bcrypt.hash(data.password, 10)
    const [created] = await db
      .insert(users)
      .values({
        username: data.username.trim().toLowerCase(),
        passwordHash,
        fullName: data.fullName,
        role: data.role,
        active: data.active,
      })
      .returning()
    return { id: created.id, username: created.username, fullName: created.fullName, role: created.role }
  })

export const updateUser = createServerFn({ method: 'POST' })
  .inputValidator(UserInput.extend({ id: z.number() }))
  .handler(async ({ data }) => {
    const requester = await requireUser()
    if (requester.role !== 'admin') throw new Error('Solo un administrador puede modificar usuarios.')
    const updateValues: Record<string, unknown> = {
      fullName: data.fullName,
      role: data.role,
      active: data.active,
    }
    if (data.password) {
      updateValues.passwordHash = await bcrypt.hash(data.password, 10)
    }
    await db.update(users).set(updateValues).where(eq(users.id, data.id))
    return { ok: true }
  })
