import { createServerFn } from '@tanstack/react-start'
import { eq, count, sum } from 'drizzle-orm'
import { db } from './db.server'
import {
  people,
  members,
  sales,
  saleItems,
  payments,
  entries,
  permits,
  conventions,
  conventionBeneficiaries,
  plans,
} from '../../db/schema'
import { requireUser } from './auth.server'

function toCsv(headers: string[], rows: (string | number | null | undefined)[][]) {
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v)
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n')
}

function toDateISO(value: unknown): string {
  if (!value) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).slice(0, 10)
}

function toISOString(value: unknown): string {
  if (!value) return ''
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

const DateRangeInput = (data: { dateFrom?: string; dateTo?: string } | undefined) =>
  data ?? {}

function inDateRange(day: string, dateFrom?: string, dateTo?: string) {
  if (dateFrom && day < dateFrom) return false
  if (dateTo && day > dateTo) return false
  return true
}

export const exportPeopleCsv = createServerFn({ method: 'GET' })
  .inputValidator(DateRangeInput)
  .handler(async () => {
    await requireUser()
    const rows = await db.select().from(people)
    return toCsv(
      ['id', 'dni', 'nombre', 'apellido', 'telefono', 'email', 'domicilio', 'estado'],
      rows.map((p) => [p.id, p.dni, p.firstName, p.lastName, p.phone, p.email, p.address, p.status]),
    )
  })

export const exportMembersCsv = createServerFn({ method: 'GET' })
  .inputValidator(DateRangeInput)
  .handler(async () => {
    await requireUser()
    const rows = await db
      .select({ member: members, person: people })
      .from(members)
      .innerJoin(people, eq(members.personId, people.id))
    return toCsv(
      ['numero_socio', 'dni', 'nombre', 'apellido', 'estado_socio'],
      rows.map((r) => [
        r.member.memberNumber,
        r.person.dni,
        r.person.firstName,
        r.person.lastName,
        r.member.memberStatus,
      ]),
    )
  })

export const exportSalesCsv = createServerFn({ method: 'GET' })
  .inputValidator(DateRangeInput)
  .handler(async ({ data }) => {
    await requireUser()
    const rows = await db.select().from(sales)
    const filtered = rows.filter((s) =>
      inDateRange(toDateISO(s.createdAt), data.dateFrom, data.dateTo),
    )
    return toCsv(
      ['numero_venta', 'fecha', 'total', 'metodo_pago', 'estado'],
      filtered.map((s) => [
        s.saleNumber,
        toISOString(s.createdAt),
        s.totalAmount,
        s.paymentMethod,
        s.status,
      ]),
    )
  })

export const exportPaymentsCsv = createServerFn({ method: 'GET' })
  .inputValidator(DateRangeInput)
  .handler(async ({ data }) => {
    await requireUser()
    const rows = await db.select().from(payments)
    const filtered = rows.filter((p) =>
      inDateRange(toDateISO(p.createdAt), data.dateFrom, data.dateTo),
    )
    return toCsv(
      ['id', 'venta_id', 'importe', 'metodo', 'estado', 'fecha'],
      filtered.map((p) => [
        p.id,
        p.saleId,
        p.amount,
        p.method,
        p.status,
        toISOString(p.createdAt),
      ]),
    )
  })

export const exportEntriesCsv = createServerFn({ method: 'GET' })
  .inputValidator(DateRangeInput)
  .handler(async ({ data }) => {
    await requireUser()
    const rows = await db
      .select({ entry: entries, person: people })
      .from(entries)
      .innerJoin(people, eq(entries.personId, people.id))

    const filtered = rows.filter((r) =>
      inDateRange(toDateISO(r.entry.occurredAt), data.dateFrom, data.dateTo),
    )

    return toCsv(
      ['fecha_hora', 'dni', 'nombre', 'apellido', 'tipo', 'metodo'],
      filtered.map((r) => [
        toISOString(r.entry.occurredAt),
        r.person.dni,
        r.person.firstName,
        r.person.lastName,
        r.entry.entryType,
        r.entry.method,
      ]),
    )
  })

export const exportPermitsCsv = createServerFn({ method: 'GET' })
  .inputValidator(DateRangeInput)
  .handler(async ({ data }) => {
    await requireUser()
    const rows = await db
      .select({ permit: permits, person: people, plan: plans })
      .from(permits)
      .innerJoin(people, eq(permits.personId, people.id))
      .innerJoin(plans, eq(permits.planId, plans.id))

    // Filtra por fecha de vencimiento del permiso
    const filtered = rows.filter((r) =>
      inDateRange(r.permit.endDate, data.dateFrom, data.dateTo),
    )

    return toCsv(
      ['codigo', 'dni', 'nombre', 'apellido', 'plan', 'condicion', 'inicio', 'vencimiento', 'estado'],
      filtered.map((r) => [
        r.permit.code,
        r.person.dni,
        r.person.firstName,
        r.person.lastName,
        r.plan.name,
        r.permit.conditionType,
        r.permit.startDate,
        r.permit.endDate,
        r.permit.status,
      ]),
    )
  })

export const exportConventionsCsv = createServerFn({ method: 'GET' })
  .inputValidator(DateRangeInput)
  .handler(async () => {
    await requireUser()
    const rows = await db.select().from(conventions)
    return toCsv(
      ['nombre', 'tipo', 'estado', 'inicio', 'fin', 'beneficio'],
      rows.map((c) => [c.name, c.type, c.status, c.startDate, c.endDate, c.benefit]),
    )
  })

export const exportBeneficiariesCsv = createServerFn({ method: 'GET' })
  .inputValidator(DateRangeInput)
  .handler(async () => {
    await requireUser()
    const rows = await db
      .select({
        beneficiary: conventionBeneficiaries,
        person: people,
        convention: conventions,
      })
      .from(conventionBeneficiaries)
      .innerJoin(people, eq(conventionBeneficiaries.personId, people.id))
      .innerJoin(conventions, eq(conventionBeneficiaries.conventionId, conventions.id))
    return toCsv(
      ['convenio', 'dni', 'nombre', 'apellido', 'codigo_empleado', 'estado'],
      rows.map((r) => [
        r.convention.name,
        r.person.dni,
        r.person.firstName,
        r.person.lastName,
        r.beneficiary.employeeCode,
        r.beneficiary.status,
      ]),
    )
  })

export const getConventionsReport = createServerFn({ method: 'GET' }).handler(async () => {
  await requireUser()
  const conventionRows = await db.select().from(conventions)
  const results = []
  for (const c of conventionRows) {
    const [beneficiaryCount] = await db
      .select({ n: count() })
      .from(conventionBeneficiaries)
      .where(eq(conventionBeneficiaries.conventionId, c.id))
    const [activePermits] = await db
      .select({ n: count() })
      .from(permits)
      .where(eq(permits.conventionId, c.id))
    const entryRows = await db
      .select({ entry: entries })
      .from(entries)
      .innerJoin(permits, eq(entries.permitId, permits.id))
      .where(eq(permits.conventionId, c.id))
    const [recaudacionRow] = await db
      .select({ total: sum(saleItems.unitPrice) })
      .from(saleItems)
      .where(eq(saleItems.conventionId, c.id))
    results.push({
      convention: {
        id: c.id,
        name: c.name,
        type: c.type,
        status: c.status,
      },
      beneficiaryCount: beneficiaryCount?.n ?? 0,
      activePermits: activePermits?.n ?? 0,
      entryCount: entryRows.length,
      recaudacion: Number(recaudacionRow?.total ?? 0),
    })
  }
  return results
})