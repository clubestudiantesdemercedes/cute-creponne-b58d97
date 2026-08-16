import type { SessionUser } from '@/lib/session.server'

export const ROLE_LABELS: Record<SessionUser['role'], string> = {
  admin: 'Administrador',
  encargado: 'Encargado de pileta',
  control_ingreso: 'Control de ingreso',
  consulta: 'Consulta',
}
