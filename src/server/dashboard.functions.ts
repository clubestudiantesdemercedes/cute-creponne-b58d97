import { createServerFn } from '@tanstack/react-start'
import { ne } from 'drizzle-orm'
import { db } from './db.server'
import { sales, entries, permits } from '../../db/schema'
import { requireUser } from './auth.server'
import { todayISO } from '@/lib/format'

/** Estado en vivo del permiso (local al dashboard para evitar dependencias circulares). */
function computeLiveStatus(permit: {
  status: string
  startDate: string
  endDate: string
}): 'activo' | 'vencido' | 'pendiente' | 'anulado' {
  if (permit.status === 'anulado') return 'anulado'
  const today = todayISO()
  if (permit.endDate < today) return 'vencido'
  if (permit.startDate > today) return 'pendiente'
  return 'activo'
}

/** Normaliza un timestamp de la DB a YYYY-MM-DD (Argentina-friendly). */
function toDateISO(value: unknown): string {
  if (!value) return ''
  if (value instanceof Date) {
    // Usamos la fecha UTC del instante; para el club alcanza comparar el día.
    return value.toISOString().slice(0, 10)
  }
  const s = String(value)
  // "2026-08-21T15:00:00.000Z" o "2026-08-21 15:00:00"
  return s.slice(0, 10)
}

export const getDashboardStats = createServerFn({ method: 'GET' }).handler(async () => {
  await requireUser()
  const today = todayISO()

  // Solo campos necesarios y serializables (sin devolver filas crudas con Date).
  const allPermits = await db
    .select({
      status: permits.status,
      startDate: permits.startDate,
      endDate: permits.endDate,
      conditionType: permits.conditionType,
    })
    .from(permits)
    .where(ne(permits.status, 'anulado'))

  const activePermits = allPermits.filter((p) => computeLiveStatus(p) === 'activo')

    const bySocio = activePermits.filter((p) => p.conditionType === 'socio').length
    const byNoSocio = activePermits.filter(
      (p) => p.conditionType === 'no_socio' || p.conditionType === 'convenio',
    ).length

  // No filtramos por Date en SQL (rompe con netlify-db). Traemos montos/fechas y filtramos en JS.
  const allSales = await db
    .select({
      totalAmount: sales.totalAmount,
      status: sales.status,
      createdAt: sales.createdAt,
    })
    .from(sales)

  const salesToday = allSales.filter((s) => {
    if (s.status === 'anulada') return false
    return toDateISO(s.createdAt) === today
  })

  const allEntries = await db
    .select({
      occurredAt: entries.occurredAt,
    })
    .from(entries)

  const entriesToday = allEntries.filter((e) => toDateISO(e.occurredAt) === today)

  const recaudacionHoy = salesToday.reduce((acc, s) => acc + (s.totalAmount ?? 0), 0)

  // Solo números/strings: siempre serializable para TanStack Start.
    return {
      personasHabilitadas: activePermits.length,
      socios: bySocio,
      noSocios: byNoSocio,
      ventasHoy: salesToday.length,
      ingresosHoy: entriesToday.length,
      recaudacionHoy,
    }
})