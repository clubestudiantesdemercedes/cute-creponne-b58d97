import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { and, eq, gte, lte, ne } from 'drizzle-orm'
import { db } from '../../db'
import { sales, cashClosures, auditLogs } from '../../db/schema'
import { requireUser } from './auth.server'

const PAYMENT_METHODS = ['efectivo', 'transferencia', 'mercadopago', 'tarjeta', 'otro'] as const

export const getCashSummary = createServerFn({ method: 'GET' })
  .inputValidator((data: { date: string }) => data)
  .handler(async ({ data }) => {
    await requireUser()
    const start = new Date(data.date + 'T00:00:00')
    const end = new Date(data.date + 'T23:59:59')
    const rows = await db
      .select()
      .from(sales)
      .where(and(gte(sales.createdAt, start), lte(sales.createdAt, end), ne(sales.status, 'anulada')))

    const totals: Record<string, number> = Object.fromEntries(PAYMENT_METHODS.map((m) => [m, 0]))
    for (const s of rows) {
      totals[s.paymentMethod] = (totals[s.paymentMethod] ?? 0) + s.totalAmount
    }
    const totalAmount = rows.reduce((acc, s) => acc + s.totalAmount, 0)

    const [closure] = await db.select().from(cashClosures).where(eq(cashClosures.closureDate, data.date))

    return {
      date: data.date,
      totals,
      totalAmount,
      salesCount: rows.length,
      closure: closure ?? null,
    }
  })

export const closeCashRegister = createServerFn({ method: 'POST' })
  .inputValidator((data: { date: string }) => data)
  .handler(async ({ data }) => {
    const user = await requireUser()
    if (user.role !== 'admin') throw new Error('Solo un administrador puede cerrar la caja.')

    const [existing] = await db.select().from(cashClosures).where(eq(cashClosures.closureDate, data.date))
    if (existing && existing.status === 'cerrada') {
      throw new Error('Esta caja ya fue cerrada.')
    }

    const start = new Date(data.date + 'T00:00:00')
    const end = new Date(data.date + 'T23:59:59')
    const rows = await db
      .select()
      .from(sales)
      .where(and(gte(sales.createdAt, start), lte(sales.createdAt, end), ne(sales.status, 'anulada')))

    const totals: Record<string, number> = Object.fromEntries(PAYMENT_METHODS.map((m) => [m, 0]))
    for (const s of rows) {
      totals[s.paymentMethod] = (totals[s.paymentMethod] ?? 0) + s.totalAmount
    }
    const totalAmount = rows.reduce((acc, s) => acc + s.totalAmount, 0)

    let closure
    if (existing) {
      ;[closure] = await db
        .update(cashClosures)
        .set({
          totals,
          salesCount: rows.length,
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
          salesCount: rows.length,
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
      details: { totalAmount, salesCount: rows.length },
    })

    return closure
  })
