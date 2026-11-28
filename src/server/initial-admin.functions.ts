import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { sql } from 'drizzle-orm'
import { db } from './db.server'
import { users } from '../../db/schema'
import { getAppSession } from '@/lib/session.server'

const SetupInput = z.object({
  setupKey: z.string().min(1),
  fullName: z.string().trim().min(1, 'Ingresá el nombre completo.'),
  password: z.string().min(12, 'La contraseña debe tener al menos 12 caracteres.'),
})

export const getInitialAdminSetupStatus = createServerFn({ method: 'GET' }).handler(async () => {
  const [existingUser] = await db.select({ id: users.id }).from(users).limit(1)
  return {
    available: !existingUser,
    configured: Boolean(process.env.INITIAL_ADMIN_SETUP_KEY),
  }
})

export const createInitialAdmin = createServerFn({ method: 'POST' })
  .inputValidator(SetupInput)
  .handler(async ({ data }) => {
    const expectedKey = process.env.INITIAL_ADMIN_SETUP_KEY

    if (!expectedKey) {
      return { ok: false as const, error: 'La configuración inicial todavía no está habilitada en el servidor.' }
    }

    if (data.setupKey !== expectedKey) {
      return { ok: false as const, error: 'La clave de configuración no es correcta.' }
    }

    const passwordHash = await bcrypt.hash(data.password, 12)

    const created = await db.transaction(async (tx) => {
      // Serializa intentos simultáneos: solo una solicitud puede inicializar la cuenta.
      await tx.execute(sql`SELECT pg_advisory_xact_lock(2026112801)`)

      const [existingUser] = await tx.select({ id: users.id }).from(users).limit(1)
      if (existingUser) return null

      const [user] = await tx
        .insert(users)
        .values({
          username: 'jsiri',
          passwordHash,
          fullName: data.fullName,
          role: 'admin',
          active: true,
        })
        .returning({
          id: users.id,
          username: users.username,
          fullName: users.fullName,
          role: users.role,
        })

      return user
    })

    if (!created) {
      return { ok: false as const, error: 'La configuración inicial ya fue realizada. Ingresá con tu usuario.' }
    }

    const session = await getAppSession()
    await session.update({
      user: {
        userId: created.id,
        username: created.username,
        fullName: created.fullName,
        role: 'admin' as const,
      },
    })

    return { ok: true as const }
  })
