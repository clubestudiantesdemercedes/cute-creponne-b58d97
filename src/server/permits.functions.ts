import { createServerFn } from '@tanstack/react-start'
import { eq, desc, and, ne, gte } from 'drizzle-orm'
import { db } from './db.server'
import {
  permits,
  people,
  plans,
  entries,
  conventions,
} from '../../db/schema'
import { requireUser } from './auth.server'
import { todayISO, daysUntil } from '@/lib/format'

// ============================================================
// ESTADO DEL PERMISO
// ============================================================

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

/** Convierte timestamps de la DB a string ISO (serializable). */
function toISOStringOrNull(value: unknown): string | null {
  if (value == null) return null
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

function serializePerson(p: {
  id: number
  dni: string
  firstName: string
  lastName: string
  birthDate: string | null
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  status: string
}) {
  return {
    id: p.id,
    dni: p.dni,
    firstName: p.firstName,
    lastName: p.lastName,
    birthDate: p.birthDate,
    phone: p.phone,
    email: p.email,
    address: p.address,
    notes: p.notes,
    status: p.status,
  }
}

function serializePermit(p: {
  id: number
  code: string
  personId: number
  saleItemId: number
  planId: number
  conditionType: string
  conventionId: number | null
  startDate: string
  endDate: string
  status: string
}) {
  return {
    id: p.id,
    code: p.code,
    personId: p.personId,
    saleItemId: p.saleItemId,
    planId: p.planId,
    conditionType: p.conditionType,
    conventionId: p.conventionId,
    startDate: p.startDate,
    endDate: p.endDate,
    status: p.status,
  }
}

function serializePlan(p: {
  id: number
  name: string
  description: string | null
  durationValue: number
  durationUnit: string
  seasonStart: string | null
  seasonEnd: string | null
  active: boolean
  sortOrder: number
}) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    durationValue: p.durationValue,
    durationUnit: p.durationUnit,
    seasonStart: p.seasonStart,
    seasonEnd: p.seasonEnd,
    active: p.active,
    sortOrder: p.sortOrder,
  }
}

function serializeConvention(
  c: {
    id: number
    name: string
    type: string
    description: string | null
    startDate: string | null
    endDate: string | null
    status: string
    maxBeneficiaries: number | null
    benefit: string | null
    notes: string | null
  } | null,
) {
  if (!c) return null
  return {
    id: c.id,
    name: c.name,
    type: c.type,
    description: c.description,
    startDate: c.startDate,
    endDate: c.endDate,
    status: c.status,
    maxBeneficiaries: c.maxBeneficiaries,
    benefit: c.benefit,
    notes: c.notes,
  }
}

function serializeEntry(
  e: {
    id: number
    personId: number
    permitId: number | null
    checkedInByUserId: number
    method: string
    entryType: string
    occurredAt: Date | string
  } | null,
) {
  if (!e) return null
  return {
    id: e.id,
    personId: e.personId,
    permitId: e.permitId,
    checkedInByUserId: e.checkedInByUserId,
    method: e.method,
    entryType: e.entryType,
    occurredAt: toISOStringOrNull(e.occurredAt),
  }
}

// ============================================================
// VERIFICAR PERMISO POR QR
// ============================================================

export const verifyPermitByCode = createServerFn({
  method: 'GET',
})
  .inputValidator((data: { code: string }) => data)
  .handler(async ({ data }) => {
    await requireUser()

    const code = data.code.trim()
    if (!code) return null

    const [row] = await db
      .select({
        permit: permits,
        person: people,
        plan: plans,
        convention: conventions,
      })
      .from(permits)
      .innerJoin(people, eq(permits.personId, people.id))
      .innerJoin(plans, eq(permits.planId, plans.id))
      .leftJoin(conventions, eq(permits.conventionId, conventions.id))
      .where(eq(permits.code, code))

    if (!row) return null

    const [lastEntry] = await db
      .select()
      .from(entries)
      .where(eq(entries.permitId, row.permit.id))
      .orderBy(desc(entries.occurredAt))
      .limit(1)

    return {
      permit: serializePermit(row.permit),
      person: serializePerson(row.person),
      plan: serializePlan(row.plan),
      convention: serializeConvention(row.convention),
      liveStatus: computeLiveStatus(row.permit),
      lastEntry: serializeEntry(lastEntry ?? null),
    }
  })

// ============================================================
// BUSCAR PERMISOS DE UNA PERSONA POR DNI
// ============================================================

export const findActivePermitsByDni = createServerFn({
  method: 'GET',
})
  .inputValidator((data: { dni: string }) => data)
  .handler(async ({ data }) => {
    await requireUser()

    const dni = data.dni.replace(/\D/g, '')
    if (!dni) return null

    const [person] = await db.select().from(people).where(eq(people.dni, dni))
    if (!person) return null

    const rows = await db
      .select({
        permit: permits,
        plan: plans,
        convention: conventions,
      })
      .from(permits)
      .innerJoin(plans, eq(permits.planId, plans.id))
      .leftJoin(conventions, eq(permits.conventionId, conventions.id))
      .where(eq(permits.personId, person.id))
      .orderBy(desc(permits.createdAt))

    const permitsWithStatus = rows.map((r) => ({
      permit: serializePermit(r.permit),
      plan: serializePlan(r.plan),
      convention: serializeConvention(r.convention),
      liveStatus: computeLiveStatus(r.permit),
    }))

    const [lastEntry] = await db
      .select()
      .from(entries)
      .where(eq(entries.personId, person.id))
      .orderBy(desc(entries.occurredAt))
      .limit(1)

    return {
      person: serializePerson(person),
      permits: permitsWithStatus,
      lastEntry: serializeEntry(lastEntry ?? null),
    }
  })

// ============================================================
// PERMISOS POR VENCER (Panel + Reportes)
// ============================================================

export const listExpiringPermits = createServerFn({
  method: 'GET',
}).handler(async () => {
  await requireUser()

  const rows = await db
    .select({
      permit: permits,
      person: people,
      plan: plans,
    })
    .from(permits)
    .innerJoin(people, eq(permits.personId, people.id))
    .innerJoin(plans, eq(permits.planId, plans.id))
    .where(eq(permits.status, 'activo'))

  const withDays = rows.map((r) => {
    const days = daysUntil(r.permit.endDate)
    return {
      permit: serializePermit(r.permit),
      person: serializePerson(r.person),
      plan: serializePlan(r.plan),
      daysUntil: days,
    }
  })

  return {
    vencidos: withDays.filter((r) => r.daysUntil < 0),
    hoy: withDays.filter((r) => r.daysUntil === 0),
    en3dias: withDays.filter((r) => r.daysUntil > 0 && r.daysUntil <= 3),
    en7dias: withDays.filter((r) => r.daysUntil > 3 && r.daysUntil <= 7),
  }
})

export const getPersonPermitQueueEnd = createServerFn({ method: 'GET' })
  .inputValidator((data: { personId: number }) => data)
  .handler(async ({ data }) => {
    await requireUser()
    const today = todayISO()
    const [row] = await db
      .select({ endDate: permits.endDate })
      .from(permits)
      .where(
        and(
          eq(permits.personId, data.personId),
          ne(permits.status, 'anulado'),
          gte(permits.endDate, today),
        ),
      )
      .orderBy(desc(permits.endDate))
      .limit(1)
    return row?.endDate ?? null
  })