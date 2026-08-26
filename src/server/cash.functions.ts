import { createServerFn } from '@tanstack/react-start'
import { eq, ne } from 'drizzle-orm'
import { db } from './db.server'
import { sales, cashClosures, auditLogs } from '../../db/schema'
import { requireUser } from './auth.server'

const PAYMENT_METHODS = ['efectivo', 'transferencia', 'mercadopago', 'tarjeta', 'otro'] as const

function toDateISO(value: unknown): string {
  if (!value) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).slice(0, 10)
}

function toISOStringOrNull(value: unknown): string | null {
  if (value == null) return null
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

function filterSalesForDate(
  rows: Array<{ totalAmount: number; status: string; paymentMethod: string; createdAt: unknown }>,
  date: string,
) {
  return rows.filter((s) => {
    if (s.status === 'anulada') return false
    return toDateISO(s.createdAt) === date
  })
}

function buildTotals(
  rows: Array<{ totalAmount: number; paymentMethod: string }>,
) {
  const totals: Record<string, number> = Object.fromEntries(
    PAYMENT_METHODS.map((m) => [m, 0]),
  )
  for (const s of rows) {
    totals[s.paymentMethod] = (totals[s.paymentMethod] ?? 0) + s.totalAmount
  }
  const totalAmount = rows.reduce((acc, s) => acc + s.totalAmount, 0)
  return { totals, totalAmount, salesCount: rows.length }
}

function serializeClosure(
  closure: {
    id: number
    closureDate: string
    closedByUserId: number | null
    totals: unknown
    salesCount: number
    totalAmount: number
    status: string
    closedAt: Date | string | null
  } | null,
) {
  if (!closure) return null
  return {
    id: closure.id,
    closureDate: closure.closureDate,
    closedByUserId: closure.closedByUserId,
    totals: (closure.totals ?? {}) as Record<string, number>,
    salesCount: closure.salesCount,
    totalAmount: closure.totalAmount,
    status: closure.status,
    closedAt: toISOStringOrNull(closure.closedAt),
  }
}

export const getCashSummary = createServerFn({ method: 'GET' })
  .inputValidator((data: { date: string }) => data)
  .handler(async ({ data }) => {
    await requireUser()

    const allSales = await db
      .select({
        totalAmount: sales.totalAmount,
        status: sales.status,
        paymentMethod: sales.paymentMethod,
        createdAt: sales.createdAt,
      })
      .from(sales)

    const daySales = filterSalesForDate(allSales, data.date)
    const { totals, totalAmount, salesCount } = buildTotals(daySales)

    const [closure] = await db
      .select()
      .from(cashClosures)
      .where(eq(cashClosures.closureDate, data.date))

    return {
      date: data.date,
      totals,
      totalAmount,
      salesCount,
      closure: serializeClosure(closure ?? null),
    }
  })

export const closeCashRegister = createServerFn({ method: 'POST' })
  .inputValidator((data: { date: string }) => data)
  .handler(async ({ data }) => {
    const user = await requireUser()
    if (user.role !== 'admin') {
      throw new Error('Solo un administrador puede cerrar la caja.')
    }

    const [existing] = await db
      .select()
      .from(cashClosures)
      .where(eq(cashClosures.closureDate, data.date))

    if (existing && existing.status === 'cerrada') {
      throw new Error('Esta caja ya fue cerrada.')
    }

    const allSales = await db
      .select({
        totalAmount: sales.totalAmount,
        status: sales.status,
        paymentMethod: sales.paymentMethod,
        createdAt: sales.createdAt,
      })
      .from(sales)

    const daySales = filterSalesForDate(allSales, data.date)
    const { totals, totalAmount, salesCount } = buildTotals(daySales)

    let closure
    if (existing) {
      ;[closure] = await db
        .update(cashClosures)
        .set({
          totals,
          salesCount,
          totalAmount,
          status: 'cerrada',
          closedByUserId: user.userId,
          closedAt: new Date(),
        })
        .where(eq(cashClosures.id, existing.id))
        .returning()
    } else {
      ;[closure] = await db
        .insert(cashClosures)
        .values({
          closureDate: data.date,
          totals,
          salesCount,
          totalAmount,
          status: 'cerrada',
          closedByUserId: user.userId,
          closedAt: new Date(),
        })
        .returning()
    }

    await db.insert(auditLogs).values({
      userId: user.userId,
      action: 'cerrar_caja',
      entityType: 'cash_closure',
      entityId: data.date,
      details: { totalAmount, salesCount },
    })

    return serializeClosure(closure)
  })