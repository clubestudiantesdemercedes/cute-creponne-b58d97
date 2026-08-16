import { addDaysISO } from './format'

export type PlanForCalc = {
  durationUnit: string // 'dia' | 'temporada'
  durationValue: number
  seasonStart: string | null
  seasonEnd: string | null
}

/** Computes permit start/end dates given a plan and the purchase date (ISO). */
export function computePermitDates(
  plan: PlanForCalc,
  purchaseDateISO: string,
): { startDate: string; endDate: string } {
  if (plan.durationUnit === 'temporada') {
    return {
      startDate: plan.seasonStart ?? purchaseDateISO,
      endDate: plan.seasonEnd ?? purchaseDateISO,
    }
  }
  const startDate = purchaseDateISO
  const endDate = addDaysISO(startDate, Math.max(plan.durationValue, 1) - 1)
  return { startDate, endDate }
}

export function randomCode(length = 24): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  let out = ''
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length]
  return out
}

export function generateSaleNumber(): string {
  const now = new Date()
  const stamp = now.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)
  const rand = Math.floor(Math.random() * 900 + 100)
  return `V-${stamp}-${rand}`
}
