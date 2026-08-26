import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq, and, isNull } from 'drizzle-orm'
import { db } from './db.server'
import { plans, prices, conventions } from '../../db/schema'
import { requireUser } from './auth.server'

export const listPlans = createServerFn({ method: 'GET' }).handler(async () => {
  await requireUser()
  return db.select().from(plans).orderBy(plans.sortOrder)
})

export const listPricesForPlan = createServerFn({ method: 'GET' })
  .inputValidator((data: { planId: number }) => data)
  .handler(async ({ data }) => {
    await requireUser()
    return db.select().from(prices).where(eq(prices.planId, data.planId))
  })

export const listAllPrices = createServerFn({ method: 'GET' }).handler(async () => {
  await requireUser()
  return db.select().from(prices)
})

const PlanInput = z.object({
  id: z.number().optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  durationValue: z.number().int().positive(),
  durationUnit: z.enum(['dia', 'temporada']),
  seasonStart: z.string().optional().nullable(),
  seasonEnd: z.string().optional().nullable(),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
})

export const upsertPlan = createServerFn({ method: 'POST' })
  .inputValidator(PlanInput)
  .handler(async ({ data }) => {
    const user = await requireUser()
    if (user.role !== 'admin') throw new Error('Solo un administrador puede modificar planes.')
    if (data.id) {
      const [updated] = await db
        .update(plans)
        .set({
          name: data.name,
          description: data.description || null,
          durationValue: data.durationValue,
          durationUnit: data.durationUnit,
          seasonStart: data.seasonStart || null,
          seasonEnd: data.seasonEnd || null,
          active: data.active,
          sortOrder: data.sortOrder,
        })
        .where(eq(plans.id, data.id))
        .returning()
      return updated
    }
    const [created] = await db
      .insert(plans)
      .values({
        name: data.name,
        description: data.description || null,
        durationValue: data.durationValue,
        durationUnit: data.durationUnit,
        seasonStart: data.seasonStart || null,
        seasonEnd: data.seasonEnd || null,
        active: data.active,
        sortOrder: data.sortOrder,
      })
      .returning()
    return created
  })

const PriceInput = z.object({
  id: z.number().optional(),
  planId: z.number(),
  conditionType: z.enum(['socio', 'deportista', 'no_socio', 'convenio']),
  conventionId: z.number().optional().nullable(),
  amount: z.number().int().nonnegative(),
})

export const upsertPrice = createServerFn({ method: 'POST' })
  .inputValidator(PriceInput)
  .handler(async ({ data }) => {
    const user = await requireUser()
    if (user.role !== 'admin') throw new Error('Solo un administrador puede modificar tarifas.')

    const conventionId = data.conditionType === 'convenio' ? data.conventionId ?? null : null

    const whereClause = and(
      eq(prices.planId, data.planId),
      eq(prices.conditionType, data.conditionType),
      conventionId === null ? isNull(prices.conventionId) : eq(prices.conventionId, conventionId),
    )
    const [existing] = await db.select().from(prices).where(whereClause)
    if (existing) {
      const [updated] = await db
        .update(prices)
        .set({ amount: data.amount, active: true })
        .where(eq(prices.id, existing.id))
        .returning()
      return updated
    }
    const [created] = await db
      .insert(prices)
      .values({
        planId: data.planId,
        conditionType: data.conditionType,
        conventionId,
        amount: data.amount,
      })
      .returning()
    return created
  })


// ---------- Conventions CRUD ----------

const ConventionInput = z.object({
  id: z.number().optional(),
  name: z.string().min(1),
  type: z.enum(['empresa', 'sindicato', 'institucion', 'otro']),
  description: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  status: z.enum(['activo', 'inactivo']).default('activo'),
  maxBeneficiaries: z.number().int().positive().optional().nullable(),
  benefit: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const listConventionsAdmin = createServerFn({ method: 'GET' }).handler(async () => {
  await requireUser()
  return db.select().from(conventions).orderBy(conventions.name)
})

export const upsertConvention = createServerFn({ method: 'POST' })
  .inputValidator(ConventionInput)
  .handler(async ({ data }) => {
    const user = await requireUser()
    if (user.role !== 'admin') throw new Error('Solo un administrador puede modificar convenios.')
    if (data.id) {
      const [updated] = await db
        .update(conventions)
        .set({
          name: data.name,
          type: data.type,
          description: data.description || null,
          startDate: data.startDate || null,
          endDate: data.endDate || null,
          status: data.status,
          maxBeneficiaries: data.maxBeneficiaries || null,
          benefit: data.benefit || null,
          notes: data.notes || null,
        })
        .where(eq(conventions.id, data.id))
        .returning()
      return updated
    }
    const [created] = await db
      .insert(conventions)
      .values({
        name: data.name,
        type: data.type,
        description: data.description || null,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        status: data.status,
        maxBeneficiaries: data.maxBeneficiaries || null,
        benefit: data.benefit || null,
        notes: data.notes || null,
      })
      .returning()
    return created
  })
