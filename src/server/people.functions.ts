import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { and, eq, or, ilike } from 'drizzle-orm'
import { db } from '../../db'
import { people, members, conventionBeneficiaries, conventions } from '../../db/schema'
import { requireUser } from './auth.server'

const PersonInput = z.object({
  dni: z.string().min(6).max(15),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  birthDate: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

function normalizeDni(dni: string) {
  return dni.replace(/\D/g, '')
}

export const findPersonByDni = createServerFn({ method: 'GET' })
  .inputValidator((data: { dni: string }) => data)
  .handler(async ({ data }) => {
    await requireUser()
    const dni = normalizeDni(data.dni)
    const [person] = await db.select().from(people).where(eq(people.dni, dni))
    if (!person) return null
    const [member] = await db.select().from(members).where(eq(members.personId, person.id))
    return { person, member: member ?? null }
  })

export const searchMembers = createServerFn({ method: 'GET' })
  .inputValidator((data: { query: string }) => data)
  .handler(async ({ data }) => {
    await requireUser()
    const q = data.query.trim()
    if (!q) return []
    const dniLike = normalizeDni(q)
    const rows = await db
      .select({ member: members, person: people })
      .from(members)
      .innerJoin(people, eq(members.personId, people.id))
      .where(
        or(
          dniLike ? eq(people.dni, dniLike) : undefined,
          ilike(members.memberNumber, `%${q}%`),
          ilike(people.firstName, `%${q}%`),
          ilike(people.lastName, `%${q}%`),
        ),
      )
      .limit(20)
    return rows
  })

export const createOrUpdatePerson = createServerFn({ method: 'POST' })
  .inputValidator(PersonInput.extend({ id: z.number().optional() }))
  .handler(async ({ data }) => {
    await requireUser()
    const dni = normalizeDni(data.dni)
    const [existing] = await db.select().from(people).where(eq(people.dni, dni))

    if (existing && existing.id !== data.id) {
      // Prevent duplicates: if a person with this DNI already exists and we're
      // not explicitly editing that same record, return it instead of creating a new one.
      return { person: existing, created: false }
    }

    if (data.id) {
      const [updated] = await db
        .update(people)
        .set({
          dni,
          firstName: data.firstName,
          lastName: data.lastName,
          birthDate: data.birthDate || null,
          phone: data.phone || null,
          email: data.email || null,
          address: data.address || null,
          notes: data.notes || null,
          updatedAt: new Date(),
        })
        .where(eq(people.id, data.id))
        .returning()
      return { person: updated, created: false }
    }

    const [created] = await db
      .insert(people)
      .values({
        dni,
        firstName: data.firstName,
        lastName: data.lastName,
        birthDate: data.birthDate || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        notes: data.notes || null,
      })
      .returning()
    return { person: created, created: true }
  })

export const setPersonStatus = createServerFn({ method: 'POST' })
  .inputValidator((data: { personId: number; status: 'activo' | 'inactivo' }) => data)
  .handler(async ({ data }) => {
    const user = await requireUser()
    if (user.role !== 'admin' && user.role !== 'encargado') {
      throw new Error('No tenés permisos para modificar el estado de la persona.')
    }
    await db.update(people).set({ status: data.status, updatedAt: new Date() }).where(eq(people.id, data.personId))
    return { ok: true }
  })

export const getPersonHistory = createServerFn({ method: 'GET' })
  .inputValidator((data: { personId: number }) => data)
  .handler(async ({ data }) => {
    await requireUser()
    const [person] = await db.select().from(people).where(eq(people.id, data.personId))
    return person ?? null
  })

// ---------- Convention beneficiaries ----------

export const listActiveConventions = createServerFn({ method: 'GET' }).handler(async () => {
  await requireUser()
  return db.select().from(conventions).where(eq(conventions.status, 'activo')).orderBy(conventions.name)
})

export const findConventionBeneficiary = createServerFn({ method: 'GET' })
  .inputValidator((data: { conventionId: number; dni: string }) => data)
  .handler(async ({ data }) => {
    await requireUser()
    const dni = normalizeDni(data.dni)
    const [person] = await db.select().from(people).where(eq(people.dni, dni))
    if (!person) return null
    const [beneficiary] = await db
      .select()
      .from(conventionBeneficiaries)
      .where(
        and(
          eq(conventionBeneficiaries.conventionId, data.conventionId),
          eq(conventionBeneficiaries.personId, person.id),
        ),
      )
    return { person, beneficiary: beneficiary ?? null }
  })

export const createConventionBeneficiary = createServerFn({ method: 'POST' })
  .inputValidator(
    PersonInput.extend({
      conventionId: z.number(),
      employeeCode: z.string().optional().nullable(),
    }),
  )
  .handler(async ({ data }) => {
    await requireUser()
    const dni = normalizeDni(data.dni)
    let [person] = await db.select().from(people).where(eq(people.dni, dni))
    if (!person) {
      ;[person] = await db
        .insert(people)
        .values({
          dni,
          firstName: data.firstName,
          lastName: data.lastName,
          birthDate: data.birthDate || null,
          phone: data.phone || null,
          email: data.email || null,
          address: data.address || null,
        })
        .returning()
    }
    const [existingBeneficiary] = await db
      .select()
      .from(conventionBeneficiaries)
      .where(
        and(
          eq(conventionBeneficiaries.conventionId, data.conventionId),
          eq(conventionBeneficiaries.personId, person.id),
        ),
      )
    if (existingBeneficiary) {
      return { person, beneficiary: existingBeneficiary }
    }
    const [beneficiary] = await db
      .insert(conventionBeneficiaries)
      .values({
        conventionId: data.conventionId,
        personId: person.id,
        employeeCode: data.employeeCode || null,
      })
      .returning()
    return { person, beneficiary }
  })
