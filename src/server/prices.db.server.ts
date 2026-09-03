import { and, eq, isNull } from 'drizzle-orm'
import { db } from './db.server'
import { prices } from '../../db/schema'

/** Resolves the price to charge a person with a given condition for a plan. */
export async function resolvePrice(
  planId: number,
  conditionType: 'socio' | 'deportista' | 'no_socio' | 'convenio',
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

  // ... después de buscar precio específico de convenio y genérico ...

  const amount = specific?.amount ?? generic?.amount

  if (amount == null || amount <= 0) {
    throw new Error(
      'No hay tarifa configurada para este plan y tipo de persona. Revisá Planes y tarifas.',
    )
  }

  return amount
}