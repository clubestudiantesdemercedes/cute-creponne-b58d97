import { and, eq, isNull } from 'drizzle-orm'
import { db } from './db.server'
import { prices } from '../../db/schema'

/** Resolves the price to charge a person with a given condition for a plan. */
export async function resolvePrice(
  planId: number,
  conditionType: 'socio' | 'no_socio' | 'convenio',
  conventionId: number | null,
) {
  if (conditionType === 'convenio' && conventionId) {
    const [specific] = await db
      .select()
      .from(prices)
      .where(
        and(
          eq(prices.planId, planId),
          eq(prices.conditionType, 'convenio'),
          eq(prices.conventionId, conventionId),
        ),
      )

    if (specific) return specific.amount
  }

  const [generic] = await db
    .select()
    .from(prices)
    .where(
      and(
        eq(prices.planId, planId),
        eq(prices.conditionType, conditionType),
        isNull(prices.conventionId),
      ),
    )

  return generic ? generic.amount : 0
}