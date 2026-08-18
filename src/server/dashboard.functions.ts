import { createServerFn } from '@tanstack/react-start'
import { and, gte, lte, ne } from 'drizzle-orm'
import { db } from './db.server'
import { sales, entries, permits, payments } from '../../db/schema'
import { requireUser } from './auth.server'
import { todayISO } from '@/lib/format'
import { computeLiveStatus } from './permits.functions'

export const getDashboardStats = createServerFn({ method: 'GET' }).handler(async () => {
  await requireUser()
  const today = todayISO()
  const start = new Date(today + 'T00:00:00')
  const end = new Date(today + 'T23:59:59')

  const allPermits = await db.select().from(permits).where(ne(permits.status, 'anulado'))
  const activePermits = allPermits.filter((p) => computeLiveStatus(p) === 'activo')

  const bySocio = activePermits.filter((p) => p.conditionType === 'socio').length
  const byNoSocio = activePermits.filter((p) => p.conditionType === 'no_socio').length
  const byConvenio = activePermits.filter((p) => p.conditionType === 'convenio').length

  const salesToday = await db
    .select()
    .from(sales)
    .where(and(gte(sales.createdAt, start), lte(sales.createdAt, end), ne(sales.status, 'anulada')))

  const entriesToday = await db
    .select()
    .from(entries)
    .where(and(gte(entries.occurredAt, start), lte(entries.occurredAt, end)))

  const recaudacionHoy = salesToday.reduce((acc, s) => acc + s.totalAmount, 0)

  return {
    personasHabilitadas: activePermits.length,
    socios: bySocio,
    noSocios: byNoSocio,
    convenios: byConvenio,
    ventasHoy: salesToday.length,
    ingresosHoy: entriesToday.length,
    recaudacionHoy,
  }
})
