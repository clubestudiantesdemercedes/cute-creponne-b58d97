import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { and, eq, or, ilike, isNull, ne } from 'drizzle-orm'
import { db } from './db.server'
import {
  people,
  members,
  conventionBeneficiaries,
  conventions,
} from '../../db/schema'
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

// ============================================================
// BUSCAR PERSONA POR DNI
// ============================================================

export const findPersonByDni = createServerFn({ method: 'GET' })
  .inputValidator((data: { dni: string }) => data)
  .handler(async ({ data }) => {
    await requireUser()

    const dni = normalizeDni(data.dni)

    const [person] = await db
      .select()
      .from(people)
      .where(eq(people.dni, dni))

    if (!person) return null

    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.personId, person.id))

    return {
      person,
      member: member ?? null,
    }
  })

// ============================================================
// BÚSQUEDA DE SOCIOS
// ============================================================
// Utilizada por el módulo de VENTAS.

export const searchMembers = createServerFn({ method: 'GET' })
  .inputValidator((data: { query: string }) => data)
  .handler(async ({ data }) => {
    await requireUser()

    const q = data.query.trim()

    if (!q) return []

    const dniLike = normalizeDni(q)

    const rows = await db
      .select({
        member: members,
        person: people,
      })
      .from(members)
      .innerJoin(
        people,
        eq(members.personId, people.id),
      )
      .where(
        or(
          dniLike
            ? eq(people.dni, dniLike)
            : undefined,
          ilike(
            members.memberNumber,
            `%${q}%`,
          ),
          ilike(
            people.firstName,
            `%${q}%`,
          ),
          ilike(
            people.lastName,
            `%${q}%`,
          ),
        ),
      )
      .limit(20)

    return rows
  })

// ============================================================
// BÚSQUEDA DE PERSONAS NO SOCIAS
// ============================================================
// Devuelve solamente personas que NO tienen registro en members.
//
// Permite buscar por:
// - DNI
// - Nombre
// - Apellido
//
// Si query está vacío devuelve todas las personas no socias.
//
// Esta función será utilizada tanto por:
// - Venta de NO SOCIOS
// - Selección de personas para CONVENIOS

export const searchNonMembers = createServerFn({
  method: 'GET',
})
  .inputValidator(
    (data: { query: string }) => data,
  )
  .handler(async ({ data }) => {
    await requireUser()

    const q = data.query.trim()
    const dni = normalizeDni(q)

    const baseQuery = db
      .select({ person: people })
      .from(people)
      .leftJoin(members, eq(members.personId, people.id))
      .where(
        and(
          isNull(members.id),
          q
            ? or(
                dni ? eq(people.dni, dni) : undefined,
                ilike(people.firstName, `%${q}%`),
                ilike(people.lastName, `%${q}%`),
                ilike(people.phone, `%${q}%`),
              )
            : undefined,
        ),
      )
      .orderBy(people.lastName, people.firstName)
      .limit(q ? 200 : 2000)

    const rows = await baseQuery

    const result = []
    for (const row of rows) {
      const [conv] = await db
        .select({
          conventionId: conventions.id,
          conventionName: conventions.name,
        })
        .from(conventionBeneficiaries)
        .innerJoin(
          conventions,
          eq(conventionBeneficiaries.conventionId, conventions.id),
        )
        .where(
          and(
            eq(conventionBeneficiaries.personId, row.person.id),
            eq(conventionBeneficiaries.status, 'activo'),
            eq(conventions.status, 'activo'),
          ),
        )
        .limit(1)

      result.push({
        person: row.person,
        convention: conv ?? null,
      })
    }

    return result
  })

// ============================================================
// CREAR / MODIFICAR PERSONA
// ============================================================

export const createOrUpdatePerson = createServerFn({
  method: 'POST',
})
  .inputValidator(
    PersonInput.extend({
      id: z.number().optional(),
      conventionId: z.number().nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await requireUser()

    const dni = normalizeDni(data.dni)

    const [existing] = await db
      .select()
      .from(people)
      .where(eq(people.dni, dni))

    // Si existe otra persona con el mismo DNI,
    // no permitimos duplicarla.
    if (existing && existing.id !== data.id) {
      return {
        person: existing,
        created: false,
        duplicate: true,
      }
    }

    // ========================================================
    // MODIFICAR
    // ========================================================

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

      return {
        person: updated,
        created: false,
        duplicate: false,
      }
    }

    // ========================================================
    // CREAR
    // ========================================================

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

    return {
      person: created,
      created: true,
      duplicate: false,
    }
  })

// ============================================================
// CAMBIAR ESTADO
// ============================================================

export const setPersonStatus = createServerFn({
  method: 'POST',
})
  .inputValidator(
    (data: {
      personId: number
      status: 'activo' | 'inactivo'
    }) => data,
  )
  .handler(async ({ data }) => {
    const user = await requireUser()

    if (
      user.role !== 'admin' &&
      user.role !== 'encargado'
    ) {
      throw new Error(
        'No tenés permisos para modificar el estado de la persona.',
      )
    }

    await db
      .update(people)
      .set({
        status: data.status,
        updatedAt: new Date(),
      })
      .where(eq(people.id, data.personId))

    return {
      ok: true,
    }
  })

// ============================================================
// OBTENER PERSONA
// ============================================================

export const getPersonHistory = createServerFn({
  method: 'GET',
})
  .inputValidator(
    (data: { personId: number }) => data,
  )
  .handler(async ({ data }) => {
    await requireUser()

    const [person] = await db
      .select()
      .from(people)
      .where(eq(people.id, data.personId))

    return person ?? null
  })

// ============================================================
// CONVENIOS
// ============================================================

export const listActiveConventions = createServerFn({
  method: 'GET',
}).handler(async () => {
  await requireUser()

  return db
    .select()
    .from(conventions)
    .where(eq(conventions.status, 'activo'))
    .orderBy(conventions.name)
})

/** Convenio activo de una persona (uno solo), o null. */
export const getPersonConvention = createServerFn({ method: 'GET' })
  .inputValidator((data: { personId: number }) => data)
  .handler(async ({ data }) => {
    await requireUser()

    const [row] = await db
      .select({
        beneficiary: conventionBeneficiaries,
        convention: conventions,
      })
      .from(conventionBeneficiaries)
      .innerJoin(
        conventions,
        eq(conventionBeneficiaries.conventionId, conventions.id),
      )
      .where(
        and(
          eq(conventionBeneficiaries.personId, data.personId),
          eq(conventionBeneficiaries.status, 'activo'),
          eq(conventions.status, 'activo'),
        ),
      )
      .limit(1)

    if (!row) return null

    return {
      conventionId: row.convention.id,
      conventionName: row.convention.name,
      beneficiaryId: row.beneficiary.id,
    }
  })

/**
 * Asigna un solo convenio activo a la persona.
 * conventionId = null → sin convenio (desactiva todos).
 */
export const setPersonConvention = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { personId: number; conventionId: number | null }) => data,
  )
  .handler(async ({ data }) => {
    await requireUser()

    // Desactivar todos los beneficiarios activos de esta persona
    await db
      .update(conventionBeneficiaries)
      .set({ status: 'inactivo' })
      .where(
        and(
          eq(conventionBeneficiaries.personId, data.personId),
          eq(conventionBeneficiaries.status, 'activo'),
        ),
      )

    if (data.conventionId == null) {
      return { ok: true, conventionId: null as number | null }
    }

    const [existing] = await db
      .select()
      .from(conventionBeneficiaries)
      .where(
        and(
          eq(conventionBeneficiaries.personId, data.personId),
          eq(conventionBeneficiaries.conventionId, data.conventionId),
        ),
      )

    if (existing) {
      await db
        .update(conventionBeneficiaries)
        .set({ status: 'activo' })
        .where(eq(conventionBeneficiaries.id, existing.id))
    } else {
      await db.insert(conventionBeneficiaries).values({
        personId: data.personId,
        conventionId: data.conventionId,
        status: 'activo',
      })
    }

    return { ok: true, conventionId: data.conventionId }
  })

// ============================================================
// BUSCAR BENEFICIARIO DE CONVENIO POR DNI
// ============================================================

export const findConventionBeneficiary = createServerFn({
  method: 'GET',
})
  .inputValidator(
    (data: {
      conventionId: number
      dni: string
    }) => data,
  )
  .handler(async ({ data }) => {
    await requireUser()

    const dni = normalizeDni(data.dni)

    const [person] = await db
      .select()
      .from(people)
      .where(eq(people.dni, dni))

    if (!person) return null

    const [beneficiary] = await db
      .select()
      .from(conventionBeneficiaries)
      .where(
        and(
          eq(
            conventionBeneficiaries.conventionId,
            data.conventionId,
          ),
          eq(
            conventionBeneficiaries.personId,
            person.id,
          ),
        ),
      )

    return {
      person,
      beneficiary: beneficiary ?? null,
    }
  })

// ============================================================
// CREAR BENEFICIARIO DE CONVENIO
// ============================================================

export const createConventionBeneficiary = createServerFn({
  method: 'POST',
})
  .inputValidator(
    PersonInput.extend({
      conventionId: z.number(),
      employeeCode: z
        .string()
        .optional()
        .nullable(),
    }),
  )
  .handler(async ({ data }) => {
    await requireUser()

    const dni = normalizeDni(data.dni)

    let [person] = await db
      .select()
      .from(people)
      .where(eq(people.dni, dni))

    // Si la persona todavía no existe,
    // la creamos.
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
          notes: data.notes || null,
        })
        .returning()
    }

    // ========================================================
    // COMPROBAR SI YA ES BENEFICIARIO
    // ========================================================

    const [existingBeneficiary] = await db
      .select()
      .from(conventionBeneficiaries)
      .where(
        and(
          eq(
            conventionBeneficiaries.conventionId,
            data.conventionId,
          ),
          eq(
            conventionBeneficiaries.personId,
            person.id,
          ),
        ),
      )

    if (existingBeneficiary) {
      return {
        person,
        beneficiary: existingBeneficiary,
      }
    }

    // ========================================================
    // CREAR BENEFICIARIO
    // ========================================================

    const [beneficiary] = await db
      .insert(conventionBeneficiaries)
      .values({
        conventionId: data.conventionId,
        personId: person.id,
        employeeCode:
          data.employeeCode || null,
      })
      .returning()

    return {
      person,
      beneficiary,
    }
  })