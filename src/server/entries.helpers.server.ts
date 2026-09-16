import { eq, desc, and } from 'drizzle-orm'
import { db } from './db.server'
import {
  permits,
  people,
  plans,
  entries,
} from '../../db/schema'
import { computeLiveStatus } from '@/lib/permit-status'

type EntryType = 'campo_deportes' | 'pileta'

export async function lastEntryFor(
  personId: number,
  entryType: EntryType,
) {
  const [row] = await db
    .select()
    .from(entries)
    .where(
      and(
        eq(entries.personId, personId),
        eq(entries.entryType, entryType),
      ),
    )
    .orderBy(desc(entries.occurredAt))
    .limit(1)

  return row ?? null
}

export async function findPermitByCode(code: string) {
  const [row] = await db
    .select({
      permit: permits,
      person: people,
      plan: plans,
    })
    .from(permits)
    .innerJoin(people, eq(permits.personId, people.id))
    .innerJoin(plans, eq(permits.planId, plans.id))
    .where(eq(permits.code, code.trim()))

  return row ?? null
}

export async function findActivePermitForPerson(personId: number) {
  const rows = await db
    .select({
      permit: permits,
      person: people,
      plan: plans,
    })
    .from(permits)
    .innerJoin(people, eq(permits.personId, people.id))
    .innerJoin(plans, eq(permits.planId, plans.id))
    .where(eq(permits.personId, personId))
    .orderBy(desc(permits.createdAt))

  for (const row of rows) {
    const liveStatus = computeLiveStatus(row.permit)
    if (liveStatus === 'activo') {
      return row
    }
  }

  return null
}