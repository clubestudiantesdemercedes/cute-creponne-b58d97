import { todayISO } from '@/lib/format'

export type PermitLiveStatus =
  | 'activo'
  | 'vencido'
  | 'pendiente'
  | 'anulado'

export function computeLiveStatus(permit: {
  status: string
  startDate: string
  endDate: string
}): PermitLiveStatus {
  if (permit.status === 'anulado') return 'anulado'
  const today = todayISO()
  if (permit.endDate < today) return 'vencido'
  if (permit.startDate > today) return 'pendiente'
  return 'activo'
}