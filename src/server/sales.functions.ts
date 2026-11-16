import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq, inArray, and, gte, lte, desc, ne } from 'drizzle-orm'
import { db } from './db.server'
import {
  sales,
  saleItems,
  payments,
  permits,
  plans,
  people,
  members,
  auditLogs,
  entries,
  cashClosures,
  users,
} from '../../db/schema'
import { requireUser } from './auth.server'
import {
  computePermitDates,
  dayAfterISO,
  randomCode,
  generateSaleNumber,
} from '@/lib/permit'
import { todayISO } from '@/lib/format'
import { resolvePrice } from './prices.db.server'

const SaleItemInput = z.object({
  personId: z.number(),
  conditionType: z.enum(['socio', 'deportista', 'no_socio', 'convenio']),
  conventionId: z.number().optional().nullable(),
  planId: z.number(),
  isJubilado: z.boolean().optional().default(false),
})

const CreateSaleInput = z.object({
  items: z.array(SaleItemInput).min(1),
  paymentMethod: z.enum([
    'efectivo',
    'transferencia',
    'mercadopago',
    'tarjeta',
    'otro',
    'sin_cargo',
  ]),
  notes: z.string().optional().nullable(),
})

function ageYearsFromBirthDate(
  birthDate: string | Date | null | undefined,
): number | null {
  if (!birthDate) return null
  const raw =
    typeof birthDate === 'string' ? birthDate : birthDate.toISOString()
  const birth = new Date(raw.includes('T') ? raw : raw + 'T00:00:00')
  if (Number.isNaN(birth.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1
  return age
}

type PriceCondition = 'socio' | 'deportista' | 'no_socio' | 'convenio'

async function resolveSaleUnitPrice(item: {
  personId: number
  conditionType: PriceCondition
  conventionId: number | null
  planId: number
  isJubilado?: boolean
}): Promise<{ conditionType: PriceCondition; unitPrice: number }> {
  const [person] = await db
    .select()
    .from(people)
    .where(eq(people.id, item.personId))

  if (!person) {
    throw new Error('Persona inválida en la venta.')
  }

  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.personId, item.personId))

  const age = ageYearsFromBirthDate(person.birthDate)
  const category = (member?.category as string | undefined) ?? 'general'

  let conditionType: PriceCondition = item.conditionType

  if (item.conditionType === 'convenio') {
    conditionType = 'convenio'
  } else if (item.isJubilado) {
    conditionType = 'deportista'
  } else if (member) {
    if (
      category === 'deportista' ||
      category === 'menor' ||
      (age != null && age <= 12)
    ) {
      conditionType = 'deportista'
    } else {
      conditionType = 'socio'
    }
  } else {
    conditionType = 'no_socio'
  }

  let unitPrice = await resolvePrice(
    item.planId,
    conditionType,
    conditionType === 'convenio' ? item.conventionId : null,
  )

  // No socio ≤ 12 años (y no jubilado): 50%
  if (
    !member &&
    !item.isJubilado &&
    conditionType === 'no_socio' &&
    age != null &&
    age <= 12
  ) {
    unitPrice = Math.round(unitPrice / 2)
  }

  if (unitPrice < 0) {
    throw new Error(
      'No se puede registrar la venta: tarifa inválida. Revisá Planes y tarifas.',
    )
  }
  if (unitPrice === 0 && conditionType !== 'convenio') {
    throw new Error(
      'No se puede registrar la venta: hay un ítem sin tarifa válida (precio $0). Revisá Planes y tarifas.',
    )
  }

  return { conditionType, unitPrice }
}

/** Fin del permiso vigente/pendiente más lejano de la persona (pileta). */
async function getLatestRelevantPermitEnd(
  personId: number,
): Promise<string | null> {
  const today = todayISO()
  const rows = await db
    .select({
      endDate: permits.endDate,
      startDate: permits.startDate,
      status: permits.status,
    })
    .from(permits)
    .where(
      and(
        eq(permits.personId, personId),
        ne(permits.status, 'anulado'),
        gte(permits.endDate, today),
      ),
    )
    .orderBy(desc(permits.endDate))
    .limit(1)

  return rows[0]?.endDate ?? null
}

export const createSale = createServerFn({ method: 'POST' })
  .inputValidator(CreateSaleInput)
  .handler(async ({ data }) => {
    const user = await requireUser()

    if (user.role !== 'admin' && user.role !== 'operador') {
      throw new Error('No tenés permisos para registrar ventas.')
    }

    const planIds = [...new Set(data.items.map((i) => i.planId))]

    const planRows = await db
      .select()
      .from(plans)
      .where(inArray(plans.id, planIds))

    const planById = new Map(planRows.map((p) => [p.id, p]))

    let total = 0

        const resolvedItems: Array<{
      personId: number
      conditionType: PriceCondition
      conventionId: number | null
      planId: number
      unitPrice: number
    }> = []

    for (const item of data.items) {
      const plan = planById.get(item.planId)

      if (!plan) {
        throw new Error('Plan inválido.')
      }

      const { conditionType, unitPrice } = await resolveSaleUnitPrice({
        personId: item.personId,
        conditionType: item.conditionType,
        conventionId: item.conventionId ?? null,
        planId: item.planId,
        isJubilado: item.isJubilado ?? false,
      })

      total += unitPrice

      resolvedItems.push({
        personId: item.personId,
        conditionType,
        conventionId: item.conventionId ?? null,
        planId: item.planId,
        unitPrice,
      })

      // $0 solo permitido en convenio (cortesía / entrenadores)
      if (unitPrice < 0) {
        throw new Error(
          'No se puede registrar la venta: tarifa inválida. Revisá Planes y tarifas.',
        )
      }
      if (unitPrice === 0 && conditionType !== 'convenio') {
        throw new Error(
          'No se puede registrar la venta: hay un ítem sin tarifa válida (precio $0). Revisá Planes y tarifas.',
        )
      }
    }

    const isFreeSale = total === 0
    if (isFreeSale && data.paymentMethod !== 'sin_cargo') throw new Error('Las operaciones sin cargo deben registrarse con el método Sin cargo.')
    if (!isFreeSale && data.paymentMethod === 'sin_cargo') throw new Error('El método Sin cargo solo puede utilizarse cuando el total es $0.')

    // ------------------------------------------------------------
    // CREAR VENTA (TODO O NADA)
    // ------------------------------------------------------------

    const result = await db.transaction(async (tx) => {
      const [sale] = await tx
        .insert(sales)
        .values({
          saleNumber: generateSaleNumber(),
          createdByUserId: user.userId,
          totalAmount: total,
          paymentMethod: data.paymentMethod,
          notes: data.notes || null,
        })
        .returning()

      const insertedItems = await tx
        .insert(saleItems)
        .values(
          resolvedItems.map((item) => ({
            ...item,
            saleId: sale.id,
          })),
        )
        .returning()

      // Las cortesías no generan movimientos en la tabla de pagos ni en caja.
      if (!isFreeSale) {
        await tx.insert(payments).values({ saleId: sale.id, amount: total, method: data.paymentMethod, createdByUserId: user.userId })
      }

      const today = todayISO()
      const permitRows = []
      const queuedEndByPerson = new Map<number, string>()

      for (const item of insertedItems) {
        const plan = planById.get(item.planId)!

        let baseStart = today
        const latestEnd =
          queuedEndByPerson.get(item.personId) ??
          (await getLatestRelevantPermitEnd(item.personId))

        if (latestEnd && latestEnd >= today) {
          baseStart = dayAfterISO(latestEnd)
        }

        const { startDate, endDate } = computePermitDates(plan, baseStart)

        if (endDate < startDate) {
          throw new Error(
            'El permiso no puede generarse: la fecha de inicio queda después del fin de temporada. Revisá las fechas del plan temporada.',
          )
        }

        queuedEndByPerson.set(item.personId, endDate)

        permitRows.push({
          code:
            item.conditionType === 'socio' ||
            item.conditionType === 'deportista'
              ? randomCode('SOC')
              : item.conditionType === 'no_socio'
                ? randomCode('NOS')
                : randomCode('NOC'),
          personId: item.personId,
          saleItemId: item.id,
          planId: item.planId,
          conditionType: item.conditionType,
          conventionId: item.conventionId,
          startDate,
          endDate,
        })
      }

      const insertedPermits = await tx
        .insert(permits)
        .values(permitRows)
        .returning()

      const personIdsForEntry = [
        ...new Set(insertedItems.map((item) => item.personId)),
      ]

      const createdEntries = []

      for (const personId of personIdsForEntry) {
        const [entry] = await tx
          .insert(entries)
          .values({
            personId,
            permitId: null,
            checkedInByUserId: user.userId,
            method: 'manual',
            entryType: 'campo_deportes',
          })
          .returning()

        createdEntries.push(entry)
      }

      await tx.insert(auditLogs).values({
        userId: user.userId,
        action: 'crear_venta',
        entityType: 'sale',
        entityId: String(sale.id),
        details: {
          total,
          itemCount: insertedItems.length,
          paymentMethod: data.paymentMethod,
          campoEntries: createdEntries.length,
        },
      })

      return { sale, insertedItems, insertedPermits, createdEntries }
    })

    const { sale, insertedItems, insertedPermits, createdEntries } = result

    // ------------------------------------------------------------
    // OBTENER PERSONAS
    // ------------------------------------------------------------

    const personIds = [
      ...new Set(insertedItems.map((item) => item.personId)),
    ]

    const peopleRows = await db
      .select()
      .from(people)
      .where(inArray(people.id, personIds))

    const personById = new Map(
      peopleRows.map((person) => [person.id, person]),
    )

    // ------------------------------------------------------------
    // RESPUESTA
    // ------------------------------------------------------------

    return {
      sale,

      items: insertedItems.map((item) => ({
        ...item,
        person: personById.get(item.personId)!,
        plan: planById.get(item.planId)!,
      })),

      permits: insertedPermits,

      entries: createdEntries,
    }
  })

// ============================================================
// LISTAR VENTAS
// ============================================================

export const listSales = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: {
      dateFrom?: string
      dateTo?: string
    }) => data,
  )
  .handler(async ({ data }) => {
    await requireUser()

    const rows = await db
      .select({
        id: sales.id,
        saleNumber: sales.saleNumber,
        createdByUserId: sales.createdByUserId,
        totalAmount: sales.totalAmount,
        paymentMethod: sales.paymentMethod,
        status: sales.status,
        notes: sales.notes,
        createdAt: sales.createdAt,
        createdByName: users.fullName,
      })
      .from(sales)
      .leftJoin(users, eq(sales.createdByUserId, users.id))
      .orderBy(desc(sales.createdAt))
      .limit(500)

    const closedRows = await db.select({ closureDate: cashClosures.closureDate }).from(cashClosures).where(eq(cashClosures.status, 'cerrada'))
    const closedDates = new Set(closedRows.map((row) => String(row.closureDate).slice(0, 10)))

    const filtered = rows.filter((s) => {
      const day = s.createdAt instanceof Date
        ? s.createdAt.toISOString().slice(0, 10)
        : String(s.createdAt).slice(0, 10)
      if (data.dateFrom && day < data.dateFrom) return false
      if (data.dateTo && day > data.dateTo) return false
      return true
    })

    return filtered.slice(0, 200).map((s) => ({
      id: s.id,
      saleNumber: s.saleNumber,
      createdByUserId: s.createdByUserId,
      totalAmount: s.totalAmount,
      paymentMethod: s.paymentMethod,
      status: s.status,
      notes: s.notes,
      createdAt:
        s.createdAt instanceof Date
          ? s.createdAt.toISOString()
          : String(s.createdAt),
      createdByName: s.createdByName ?? 'Usuario',
      cashClosed: closedDates.has(s.createdAt instanceof Date ? s.createdAt.toISOString().slice(0, 10) : String(s.createdAt).slice(0, 10)),
    }))
  })

// ============================================================
// DETALLE DE VENTA
// ============================================================

export const getSaleDetail = createServerFn({ method: 'GET' })
  .inputValidator((data: { saleId: number }) => data)
  .handler(async ({ data }) => {
    await requireUser()

    const [sale] = await db
      .select()
      .from(sales)
      .where(eq(sales.id, data.saleId))

    if (!sale) {
      return null
    }

    const items = await db
      .select({
        item: saleItems,
        person: people,
        plan: plans,
        permit: permits,
      })
      .from(saleItems)
      .innerJoin(
        people,
        eq(saleItems.personId, people.id),
      )
      .innerJoin(
        plans,
        eq(saleItems.planId, plans.id),
      )
      .leftJoin(
        permits,
        eq(permits.saleItemId, saleItems.id),
      )
      .where(eq(saleItems.saleId, sale.id))

    const paymentRows = await db.select().from(payments).where(eq(payments.saleId, sale.id))
    const [creator] = await db.select({ fullName: users.fullName }).from(users).where(eq(users.id, sale.createdByUserId))

    return {
      sale,
      items,
      payments: paymentRows,
      createdByName: creator?.fullName ?? 'Usuario',
    }
  })

// ============================================================
// ANULAR VENTA
// ============================================================

export const voidSale = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    saleId: z.number(),
    reason: z.enum(['error_importe', 'error_periodo', 'error_persona', 'venta_duplicada', 'error_categoria_convenio', 'otro']),
    notes: z.string().max(1000).optional().nullable(),
  }).superRefine((data, ctx) => {
    if (data.reason === 'otro' && !data.notes?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Explicá el motivo cuando seleccionás «Otro».', path: ['notes'] })
    }
  }))
  .handler(async ({ data }) => {
    const user = await requireUser()

    await db.transaction(async (tx) => {
      const [sale] = await tx.select().from(sales).where(eq(sales.id, data.saleId))
      if (!sale) throw new Error('La venta no existe.')
      if (sale.status === 'anulada') throw new Error('Esta venta ya está anulada.')

      if (user.role !== 'admin' && sale.createdByUserId !== user.userId) {
        throw new Error('Solo podés anular las ventas que registraste.')
      }

      const saleDate = sale.createdAt instanceof Date
        ? sale.createdAt.toISOString().slice(0, 10)
        : String(sale.createdAt).slice(0, 10)
      const [closure] = await tx.select().from(cashClosures).where(eq(cashClosures.closureDate, saleDate))
      if (closure?.status === 'cerrada') {
        throw new Error('No se puede anular esta venta porque la caja de ese día ya está cerrada.')
      }

      const now = new Date()
      await tx.update(sales).set({
        status: 'anulada',
        voidReason: data.reason,
        voidNotes: data.notes?.trim() || null,
        voidedAt: now,
        voidedByUserId: user.userId,
      }).where(eq(sales.id, sale.id))

      await tx.update(payments).set({ status: 'anulado' }).where(eq(payments.saleId, sale.id))

      const itemRows = await tx.select({ id: saleItems.id }).from(saleItems).where(eq(saleItems.saleId, sale.id))
      const itemIds = itemRows.map((row) => row.id)
      if (itemIds.length) {
        await tx.update(permits).set({ status: 'anulado' }).where(inArray(permits.saleItemId, itemIds))
      }

      // Los ingresos ya registrados se conservan como hechos históricos.
      await tx.insert(auditLogs).values({
        userId: user.userId,
        action: 'anular_venta',
        entityType: 'sale',
        entityId: String(sale.id),
        details: {
          saleNumber: sale.saleNumber,
          amount: sale.totalAmount,
          paymentMethod: sale.paymentMethod,
          reason: data.reason,
          notes: data.notes?.trim() || null,
          permitsVoided: itemIds.length,
        },
      })
    })

    return { ok: true }
  })
