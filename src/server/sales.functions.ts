import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq, inArray, and, gte, lte, desc } from 'drizzle-orm'
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
} from '../../db/schema'
import { requireUser } from './auth.server'
import { computePermitDates } from '@/lib/permit'
import { randomCode, generateSaleNumber } from '@/lib/permit'
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

  return { conditionType, unitPrice }
}

export const createSale = createServerFn({ method: 'POST' })
  .inputValidator(CreateSaleInput)
  .handler(async ({ data }) => {
    const user = await requireUser()

    if (user.role !== 'admin' && user.role !== 'encargado') {
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
    }

    // ------------------------------------------------------------
    // CREAR VENTA
    // ------------------------------------------------------------

    const [sale] = await db
      .insert(sales)
      .values({
        saleNumber: generateSaleNumber(),
        createdByUserId: user.userId,
        totalAmount: total,
        paymentMethod: data.paymentMethod,
        notes: data.notes || null,
      })
      .returning()

    // ------------------------------------------------------------
    // CREAR ITEMS DE LA VENTA
    // ------------------------------------------------------------

    const insertedItems = await db
      .insert(saleItems)
      .values(
        resolvedItems.map((item) => ({
          ...item,
          saleId: sale.id,
        })),
      )
      .returning()

    // ------------------------------------------------------------
    // REGISTRAR PAGO
    // ------------------------------------------------------------

    await db.insert(payments).values({
      saleId: sale.id,
      amount: total,
      method: data.paymentMethod,
      createdByUserId: user.userId,
    })

    // ------------------------------------------------------------
    // CREAR PERMISOS
    // ------------------------------------------------------------
    //
    // La venta genera el permiso correspondiente.
    //
    // IMPORTANTE:
    // Crear un permiso NO significa que la persona haya ingresado.
    //
    // El ingreso se registrará posteriormente desde entries.functions.ts
    // cuando la persona efectivamente acceda al campo o a la pileta.
    // ------------------------------------------------------------

    const purchaseDate = todayISO()

    const permitRows = []

    for (const item of insertedItems) {
      const plan = planById.get(item.planId)!

      const { startDate, endDate } = computePermitDates(
        plan,
        purchaseDate,
      )

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

    const insertedPermits = await db
      .insert(permits)
      .values(permitRows)
      .returning()

    // ------------------------------------------------------------
    // INGRESO AUTOMÁTICO AL CAMPO DE DEPORTES
    // ------------------------------------------------------------
    //
    // La venta registra el paso por el campo.
    // La pileta sigue requiriendo control de ingreso aparte.
    // ------------------------------------------------------------

    const personIdsForEntry = [
      ...new Set(insertedItems.map((item) => item.personId)),
    ]

    const createdEntries = []

    for (const personId of personIdsForEntry) {
      const [entry] = await db
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

    // ------------------------------------------------------------
    // AUDITORÍA
    // ------------------------------------------------------------

    await db.insert(auditLogs).values({
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
      })
      .from(sales)
      .orderBy(desc(sales.createdAt))
      .limit(500)

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

    return {
      sale,
      items,
    }
  })

// ============================================================
// ANULAR VENTA
// ============================================================

export const voidSale = createServerFn({ method: 'POST' })
  .inputValidator((data: { saleId: number }) => data)
  .handler(async ({ data }) => {
    const user = await requireUser()

    if (user.role !== 'admin') {
      throw new Error(
        'Solo un administrador puede anular ventas.',
      )
    }

    // ----------------------------------------------------------
    // Comprobar que la venta existe
    // ----------------------------------------------------------

    const [sale] = await db
      .select()
      .from(sales)
      .where(eq(sales.id, data.saleId))

    if (!sale) {
      throw new Error('La venta no existe.')
    }

    if (sale.status === 'anulada') {
      return {
        ok: true,
      }
    }

    // ----------------------------------------------------------
    // ANULAR VENTA
    // ----------------------------------------------------------

    await db
      .update(sales)
      .set({
        status: 'anulada',
      })
      .where(eq(sales.id, data.saleId))

    // ----------------------------------------------------------
    // BUSCAR ITEMS
    // ----------------------------------------------------------

    const itemRows = await db
      .select({
        id: saleItems.id,
      })
      .from(saleItems)
      .where(eq(saleItems.saleId, data.saleId))

    const itemIds = itemRows.map((row) => row.id)

    // ----------------------------------------------------------
    // ANULAR PERMISOS
    // ----------------------------------------------------------

    if (itemIds.length) {
      await db
        .update(permits)
        .set({
          status: 'anulado',
        })
        .where(inArray(permits.saleItemId, itemIds))
    }

    // ----------------------------------------------------------
    // IMPORTANTE:
    //
    // NO eliminamos ni anulamos entries existentes.
    //
    // Un ingreso es un hecho histórico.
    // ----------------------------------------------------------

    await db.insert(auditLogs).values({
      userId: user.userId,
      action: 'anular_venta',
      entityType: 'sale',
      entityId: String(data.saleId),
    })

    return {
      ok: true,
    }
  })