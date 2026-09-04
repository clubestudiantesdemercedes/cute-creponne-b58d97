import { and, eq, isNull } from 'drizzle-orm'
import { db } from './db.server'
import { prices } from '../../db/schema'

/** Resolves the price to charge a person with a given condition for a plan. */
export async function resolvePrice(
  planId: number,
  conditionType: 'socio' | 'deportista' | 'no_socio' | 'convenio',
  conventionId: number | null,
) {
  // Precio de un convenio concreto (puede ser $0 = cortesía)
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

    if (specific) {
      if (specific.amount < 0) {
        throw new Error(
          'Tarifa de convenio inválida. Revisá Planes y tarifas.',
        )
      }
      return specific.amount
    }

    throw new Error(
      'No hay tarifa configurada para este convenio y plan. Revisá Planes y tarifas.',
    )
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

  if (!generic) {
    throw new Error(
      'No hay tarifa configurada para este plan y tipo de persona. Revisá Planes y tarifas.',
    )
  }

  if (generic.amount <= 0) {
    throw new Error(
      'No hay tarifa configurada para este plan y tipo de persona. Revisá Planes y tarifas.',
    )
  }

  return generic.amount
}