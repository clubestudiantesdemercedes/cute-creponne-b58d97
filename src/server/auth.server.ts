import { redirect } from '@tanstack/react-router'
import { getAppSession, type SessionUser } from '@/lib/session.server'

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getAppSession()
  return session.data.user ?? null
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) {
    throw redirect({ to: '/login' })
  }
  return user
}

export function requireRole(user: SessionUser, roles: SessionUser['role'][]) {
  if (!roles.includes(user.role)) {
    throw new Error('No tenés permisos para realizar esta acción.')
  }
}

export { ROLE_LABELS } from '@/lib/roles'
