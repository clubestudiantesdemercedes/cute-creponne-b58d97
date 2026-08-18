import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getAppSession } from '@/lib/session.server'
import { getSessionUser } from './auth.server'

export const getCurrentUser = createServerFn({ method: 'GET' }).handler(async () => {
  return getSessionUser()
})

export const login = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      username: z.string().min(1),
      password: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const username = data.username.trim().toLowerCase()

    // Usuario administrador de prueba.
    if (username === 'admin' && data.password === 'estudiantes2026') {
      const session = await getAppSession()

      await session.update({
        user: {
          userId: 1,
          username: 'admin',
          fullName: 'Administrador de prueba',
          role: 'admin',
        },
      })

      return { ok: true as const }
    }

    // La base de datos se carga únicamente dentro del código servidor.
    const { authenticateUser } = await import('./auth.db.server')

    const user = await authenticateUser(username, data.password)

    if (!user) {
      return {
        ok: false as const,
        error: 'Usuario o contraseña incorrectos.',
      }
    }

    const session = await getAppSession()

    await session.update({
      user,
    })

    return { ok: true as const }
  })

export const logout = createServerFn({ method: 'POST' }).handler(async () => {
  const session = await getAppSession()
  await session.clear()

  return { ok: true as const }
})