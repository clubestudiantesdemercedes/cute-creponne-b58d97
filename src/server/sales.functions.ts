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
  auditLogs,
} from '../../db/schema'
import { requireUser } from './auth.server'
import { computePermitDates } from '@/lib/permit'
import { randomCode, generateSaleNumber } from '@/lib/permit'
import { todayISO } from '@/lib/format'
import { resolvePrice } from './prices.db.server'

const SaleItemInput = z.object({
  personId: z.number(),
  conditionType: z.enum(['socio', 'no_socio', 'convenio']),
  conventionId: z.number().optional().nullable(),
  planId: z.number(),
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
      conditionType: 'socio' | 'no_socio' | 'convenio'
      conventionId: number | null
      planId: number
      unitPrice: number
    }> = []

    for (const item of data.items) {
      const plan = planById.get(item.planId)

      if (!plan) {
        throw new Error('Plan inválido.')
      }

      const unitPrice = await resolvePrice(
        item.planId,
        item.conditionType,
        item.conventionId ?? null,
      )

      total += unitPrice

      resolvedItems.push({
        personId: item.personId,
        conditionType: item.conditionType,
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
          item.conditionType === 'socio'
            ? randomCode('SOC')
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
    // AUDITORÍA
    // ------------------------------------------------------------
    //
    // Ya NO registramos un ingreso acá.
    //
    // Una venta y un ingreso son acontecimientos diferentes:
    //
    //   Venta  -> registra dinero/pago
    //   Permiso -> habilita el acceso
    //   Entry   -> registra que efectivamente ingresó
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
    //
    // "entries: []" se mantiene por compatibilidad con el código
    // de frontend que eventualmente pueda esperar esta propiedad.
    //
    // La venta NO crea ningún entry.
    // ------------------------------------------------------------

    return {
      sale,

      items: insertedItems.map((item) => ({
        ...item,
        person: personById.get(item.personId)!,
        plan: planById.get(item.planId)!,
      })),

      permits: insertedPermits,

      entries: [],
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

    const conditions = []

    if (data.dateFrom) {
      conditions.push(
        gte(
          sales.createdAt,
          new Date(data.dateFrom + 'T00:00:00'),
        ),
      )
    }

    if (data.dateTo) {
      conditions.push(
        lte(
          sales.createdAt,
          new Date(data.dateTo + 'T23:59:59'),
        ),
      )
    }

    const rows = await db
      .select()
      .from(sales)
      .where(
        conditions.length
          ? and(...conditions)
          : undefined,
      )
      .orderBy(desc(sales.createdAt))
      .limit(200)

    return rows
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