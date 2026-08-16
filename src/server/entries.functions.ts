import { createServerFn } from '@tanstack/react-start'
import { eq, desc, and, gte, lte } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db'
import { permits, people, plans, entries, auditLogs } from '../../db/schema'
import { requireUser } from './auth.server'
import { computeLiveStatus } from './permits.functions'

async function lastEntryFor(personId: number) {
  const [row] = await db
    .select()
    .from(entries)
    .where(eq(entries.personId, personId))
    .orderBy(desc(entries.occurredAt))
    .limit(1)
  return row ?? null
}

const RegisterEntryInput = z.object({
  code: z.string().optional(),
  personId: z.number().optional(),
  method: z.enum(['qr', 'manual']),
  force: z.boolean().optional().default(false),
})

export const registerEntry = createServerFn({ method: 'POST' })
  .inputValidator(RegisterEntryInput)
  .handler(async ({ data }) => {
    const user = await requireUser()
    if (!['admin', 'encargado', 'control_ingreso'].includes(user.role)) {
      throw new Error('No tenés permisos para registrar ingresos.')
    }

    let permitRow
    if (data.code) {
      const [row] = await db
        .select({ permit: permits, person: people, plan: plans })
        .from(permits)
        .innerJoin(people, eq(permits.personId, people.id))
        .innerJoin(plans, eq(permits.planId, plans.id))
        .where(eq(permits.code, data.code.trim()))
      permitRow = row
    } else if (data.personId) {
      const [row] = await db
        .select({ permit: permits, person: people, plan: plans })
        .from(permits)
        .innerJoin(people, eq(permits.personId, people.id))
        .innerJoin(plans, eq(permits.planId, plans.id))
        .where(eq(permits.personId, data.personId))
        .orderBy(desc(permits.createdAt))
        .limit(1)
      permitRow = row
    }

    if (!permitRow) {
      return { authorized: false as const, reason: 'no_permit' as const }
    }

    const liveStatus = computeLiveStatus(permitRow.permit)
    if (liveStatus !== 'activo') {
      return {
        authorized: false as const,
        reason: liveStatus === 'vencido' ? ('expired' as const) : ('not_valid_yet' as const),
        person: permitRow.person,
        permit: permitRow.permit,
        plan: permitRow.plan,
      }
    }

    const last = await lastEntryFor(permitRow.person.id)
    if (last && !data.force) {
      const minutesAgo = (Date.now() - new Date(last.occurredAt).getTime()) / 60000
      if (minutesAgo < 30) {
        return {
          authorized: false as const,
          reason: 'duplicate' as const,
          minutesAgo: Math.round(minutesAgo),
          person: permitRow.person,
          permit: permitRow.permit,
          plan: permitRow.plan,
        }
      }
    }

    const [entry] = await db
      .insert(entries)
      .values({
        personId: permitRow.person.id,
        permitId: permitRow.permit.id,
        checkedInByUserId: user.userId,
        method: data.method,
      })
      .returning()

    await db.insert(auditLogs).values({
      userId: user.userId,
      action: 'registrar_ingreso',
      entityType: 'entry',
      entityId: String(entry.id),
      details: { personId: permitRow.person.id, method: data.method },
    })

    return {
      authorized: true as const,
      person: permitRow.person,
      permit: permitRow.permit,
      plan: permitRow.plan,
      entry,
    }
  })

export const listEntries = createServerFn({ method: 'GET' })
  .inputValidator((data: { dateFrom?: string; dateTo?: string }) => data)
  .handler(async ({ data }) => {
    await requireUser()
    const conditions = []
    if (data.dateFrom) conditions.push(gte(entries.occurredAt, new Date(data.dateFrom + 'T00:00:00')))
    if (data.dateTo) conditions.push(lte(entries.occurredAt, new Date(data.dateTo + 'T23:59:59')))
    const rows = await db
      .select({ entry: entries, person: people, permit: permits, plan: plans })
      .from(entries)
      .innerJoin(people, eq(entries.personId, people.id))
      .innerJoin(permits, eq(entries.permitId, permits.id))
      .innerJoin(plans, eq(permits.planId, plans.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(entries.occurredAt))
      .limit(300)
    return rows
  })
