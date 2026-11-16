import type { SessionUser } from '@/lib/session.server'

export const ROLE_LABELS: Record<SessionUser['role'], string> = {
  admin: 'Administrador general',
  operador: 'Operador',
}
