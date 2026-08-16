import { createServerFn } from '@tanstack/react-start'
import { eq, desc } from 'drizzle-orm'
import { db } from '../../db'
import { permits, people, plans, entries, conventions } from '../../db/schema'
import { requireUser } from './auth.server'
import { todayISO, daysUntil } from '@/lib/format'

export type PermitLiveStatus = 'activo' | 'vencido' | 'pendiente' | 'anulado'

export function computeLiveStatus(permit: { status: string; startDate: string; endDate: string }): PermitLiveStatus {
  if (permit.status === 'anulado') return 'anulado'
  const today = todayISO()
  if (permit.endDate < today) return 'vencido'
  if (permit.startDate > today) return 'pendiente'
  return 'activo'
}

export const verifyPermitByCode = createServerFn({ method: 'GET' })
  .inputValidator((data: { code: string }) => data)
  .handler(async ({ data }) => {
    await requireUser()
    const [row] = await db
      .select({ permit: permits, person: people, plan: plans, convention: conventions })
      .from(permits)
      .innerJoin(people, eq(permits.personId, people.id))
      .innerJoin(plans, eq(permits.planId, plans.id))
      .leftJoin(conventions, eq(permits.conventionId, conventions.id))
      .where(eq(permits.code, data.code.trim()))
    if (!row) return null

    const [lastEntry] = await db
      .select()
      .from(entries)
      .where(eq(entries.personId, row.person.id))
      .orderBy(desc(entries.occurredAt))
      .limit(1)

    return {
      ...row,
      liveStatus: computeLiveStatus(row.permit),
      lastEntry: lastEntry ?? null,
    }
  })

export const findActivePermitsByDni = createServerFn({ method: 'GET' })
  .inputValidator((data: { dni: string }) => data)
  .handler(async ({ data }) => {
    await requireUser()
    const dni = data.dni.replace(/\D/g, '')
    const [person] = await db.select().from(people).where(eq(people.dni, dni))
    if (!person) return null
    const rows = await db
      .select({ permit: permits, plan: plans, convention: conventions })
      .from(permits)
      .innerJoin(plans, eq(permits.planId, plans.id))
      .leftJoin(conventions, eq(permits.conventionId, conventions.id))
      .where(eq(permits.personId, person.id))
      .orderBy(desc(permits.createdAt))
    const [lastEntry] = await db
      .select()
      .from(entries)
      .where(eq(entries.personId, person.id))
      .orderBy(desc(entries.occurredAt))
      .limit(1)
    return {
      person,
      permits: rows.map((r) => ({ ...r, liveStatus: computeLiveStatus(r.permit) })),
      lastEntry: lastEntry ?? null,
    }
  })

export const listExpiringPermits = createServerFn({ method: 'GET' }).handler(async () => {
  await requireUser()
  const rows = await db
    .select({ permit: permits, person: people, plan: plans })
    .from(permits)
    .innerJoin(people, eq(permits.personId, people.id))
    .innerJoin(plans, eq(permits.planId, plans.id))
    .where(eq(permits.status, 'activo'))

  const withDays = rows.map((r) => ({ ...r, daysUntil: daysUntil(r.permit.endDate) }))
  return {
    vencidos: withDays.filter((r) => r.daysUntil < 0),
    hoy: withDays.filter((r) => r.daysUntil === 0),
    en3dias: withDays.filter((r) => r.daysUntil > 0 && r.daysUntil <= 3),
    en7dias: withDays.filter((r) => r.daysUntil > 3 && r.daysUntil <= 7),
  }
})
