import { createServerFn } from '@tanstack/react-start'
import {
  eq,
  desc,
  and,
  gte,
  lte,
} from 'drizzle-orm'
import { z } from 'zod'
import {
  permits,
  people,
  plans,
  entries,
  auditLogs,
} from '../../db/schema'
import { requireUser } from './auth.server'
import { computeLiveStatus } from '@/lib/permit-status'

// ============================================================
// TIPOS
// ============================================================

type EntryType = 'campo_deportes' | 'pileta'



// ============================================================
// INPUT
// ============================================================

const RegisterEntryInput = z.object({
  // QR de un permiso
  code: z.string().optional(),

  // Búsqueda manual por persona
  personId: z.number().optional(),

  method: z.enum(['qr', 'manual']),

  // Campo de deportes o pileta
  entryType: z.enum([
    'campo_deportes',
    'pileta',
  ]),

  // Permite registrar aunque exista un ingreso reciente
  force: z.boolean().optional().default(false),
})

// ============================================================
// REGISTRAR INGRESO
// ============================================================

export const registerEntry = createServerFn({
  method: 'POST',
})
  .inputValidator(RegisterEntryInput)
  .handler(async ({ data }) => {
    const {
      lastEntryFor,
      findPermitByCode,
      findActivePermitForPerson,
    } = await import('./entries.helpers.server')

    const { db } = await import('./db.server')

    const user = await requireUser()

    if (
      ![
        'admin',
        'encargado',
        'control_ingreso',
      ].includes(user.role)
    ) {
      throw new Error(
        'No tenés permisos para registrar ingresos.',
      )
    }

    if (!data.code && !data.personId) {
      throw new Error(
        'Tenés que indicar un código QR o una persona.',
      )
    }

    // ==========================================================
    // CASO 1: INGRESO AL CAMPO DE DEPORTES
    // ==========================================================
    //
    // El campo NO necesita permiso.
    //
    // Si viene personId:
    //     buscamos directamente la persona.
    //
    // Si viene code:
    //     usamos el QR para identificar a la persona,
    //     pero NO validamos la vigencia del permiso.
    // ==========================================================

    if (data.entryType === 'campo_deportes') {
      let person

      if (data.personId) {
        const [row] = await db
          .select()
          .from(people)
          .where(eq(people.id, data.personId))

        person = row
      } else if (data.code) {
        const permitRow = await findPermitByCode(
          data.code,
        )

        if (!permitRow) {
          return {
            authorized: false as const,
            reason: 'no_person' as const,
          }
        }

        person = permitRow.person
      }

      if (!person) {
        return {
          authorized: false as const,
          reason: 'no_person' as const,
        }
      }

      // --------------------------------------------------------
      // Verificar estado de la persona
      // --------------------------------------------------------

      if (person.status !== 'activo') {
        return {
          authorized: false as const,
          reason: 'person_inactive' as const,
          person,
        }
      }

      // --------------------------------------------------------
      // Evitar duplicados
      // --------------------------------------------------------

        const lastDay = String(last.occurredAt).slice(0, 10)
        const todayDay = new Date().toISOString().slice(0, 10)

        if (lastDay === todayDay) {
          const minutesAgo = Math.round(
            (Date.now() - new Date(last.occurredAt).getTime()) /
              60000,
          )
          return {
            authorized: false as const,
            reason: 'duplicate' as const,
            minutesAgo,
            person,
            entryType: 'campo_deportes' as const,
          }
        }

      // --------------------------------------------------------
      // Registrar ingreso
      // --------------------------------------------------------
      //
      // permitId = null
      //
      // porque el campo de deportes no necesita permiso.
      // --------------------------------------------------------

      const [entry] = await db
        .insert(entries)
        .values({
          personId: person.id,
          permitId: null,
          checkedInByUserId: user.userId,
          method: data.method,
          entryType: 'campo_deportes',
        })
        .returning()

      await db.insert(auditLogs).values({
        userId: user.userId,
        action: 'registrar_ingreso',
        entityType: 'entry',
        entityId: String(entry.id),
        details: {
          personId: person.id,
          method: data.method,
          entryType: 'campo_deportes',
        },
      })

      return {
        authorized: true as const,
        person,
        permit: null,
        plan: null,
        entry,
      }
    }

    // ==========================================================
    // CASO 2: INGRESO A PILETA
    // ==========================================================
    //
    // La pileta SI necesita un permiso vigente.
    // ==========================================================

    let permitRow

    // ----------------------------------------------------------
    // Buscar por QR
    // ----------------------------------------------------------

    if (data.code) {
      permitRow = await findPermitByCode(
        data.code,
      )
    }

    // ----------------------------------------------------------
    // Buscar por persona
    // ----------------------------------------------------------

    if (!permitRow && data.personId) {
      permitRow = await findActivePermitForPerson(
        data.personId,
      )
    }

    // ----------------------------------------------------------
    // No existe permiso
    // ----------------------------------------------------------

    if (!permitRow) {
      return {
        authorized: false as const,
        reason: 'no_permit' as const,
      }
    }

    // ----------------------------------------------------------
    // Verificar estado de la persona
    // ----------------------------------------------------------

    if (permitRow.person.status !== 'activo') {
      return {
        authorized: false as const,
        reason: 'person_inactive' as const,
        person: permitRow.person,
        permit: permitRow.permit,
        plan: permitRow.plan,
      }
    }

    // ----------------------------------------------------------
    // Verificar vigencia del permiso
    // ----------------------------------------------------------

    const liveStatus = computeLiveStatus(
      permitRow.permit,
    )

    if (liveStatus !== 'activo') {
      return {
        authorized: false as const,

        reason:
          liveStatus === 'vencido'
            ? ('expired' as const)
            : liveStatus === 'pendiente'
              ? ('not_valid_yet' as const)
              : ('cancelled' as const),

        person: permitRow.person,
        permit: permitRow.permit,
        plan: permitRow.plan,
      }
    }

    // ----------------------------------------------------------
    // Evitar ingresos duplicados
    // ----------------------------------------------------------

        const lastDay = String(last.occurredAt).slice(0, 10)
        const todayDay = new Date().toISOString().slice(0, 10)

        if (lastDay === todayDay) {
          const minutesAgo = Math.round(
            (Date.now() - new Date(last.occurredAt).getTime()) /
              60000,
          )
          return {
            authorized: false as const,
            reason: 'duplicate' as const,
            minutesAgo,
            person,
            entryType: 'campo_deportes' as const,
          }
        }

    // ----------------------------------------------------------
    // Registrar ingreso a pileta
    // ----------------------------------------------------------

    const [entry] = await db
      .insert(entries)
      .values({
        personId: permitRow.person.id,
        permitId: permitRow.permit.id,
        checkedInByUserId: user.userId,
        method: data.method,
        entryType: 'pileta',
      })
      .returning()

    // ----------------------------------------------------------
    // Auditoría
    // ----------------------------------------------------------

    await db.insert(auditLogs).values({
      userId: user.userId,
      action: 'registrar_ingreso',
      entityType: 'entry',
      entityId: String(entry.id),
      details: {
        personId: permitRow.person.id,
        permitId: permitRow.permit.id,
        method: data.method,
        entryType: 'pileta',
      },
    })

    return {
      authorized: true as const,
      person: permitRow.person,
      permit: permitRow.permit,
      plan: permitRow.plan,
      entry,
    }
  })

// ============================================================
// LISTAR INGRESOS
// ============================================================

export const listEntries = createServerFn({
  method: 'GET',
})
  .inputValidator(
    (data: {
      dateFrom?: string
      dateTo?: string
    }) => data,
  )
  .handler(async ({ data }) => {
    const { db } = await import('./db.server')

    await requireUser()

    const rows = await db
      .select({
        entry: entries,
        person: people,
        permit: permits,
        plan: plans,
      })
      .from(entries)
      .innerJoin(people, eq(entries.personId, people.id))
      .leftJoin(permits, eq(entries.permitId, permits.id))
      .leftJoin(plans, eq(permits.planId, plans.id))
      .orderBy(desc(entries.occurredAt))
      .limit(500)

    const filtered = rows.filter((r) => {
      const day =
        r.entry.occurredAt instanceof Date
          ? r.entry.occurredAt.toISOString().slice(0, 10)
          : String(r.entry.occurredAt).slice(0, 10)
      if (data.dateFrom && day < data.dateFrom) return false
      if (data.dateTo && day > data.dateTo) return false
      return true
    })

    return filtered.slice(0, 300).map((r) => ({
      entry: {
        id: r.entry.id,
        personId: r.entry.personId,
        permitId: r.entry.permitId,
        method: r.entry.method,
        entryType: r.entry.entryType,
        occurredAt:
          r.entry.occurredAt instanceof Date
            ? r.entry.occurredAt.toISOString()
            : String(r.entry.occurredAt),
      },
      person: {
        id: r.person.id,
        firstName: r.person.firstName,
        lastName: r.person.lastName,
        dni: r.person.dni,
      },
      permit: r.permit
        ? {
            id: r.permit.id,
            code: r.permit.code,
          }
        : null,
      plan: r.plan
        ? {
            id: r.plan.id,
            name: r.plan.name,
          }
        : null,
    }))
  })