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
  const endDate = addDaysISO(
    startDate,
    Math.max(plan.durationValue, 1) - 1,
  )

  return { startDate, endDate }
}

/**
 * Genera el código de un permiso.
 *
 * Formatos:
 * SOC-XXXX → socio
 * NOS-XXXX → no socio
 * NOC-XXXX → convenio
 *
 * Si se llama sin prefijo, genera un código de 24 caracteres (compatibilidad).
 */
export function randomCode(
  prefix?: 'SOC' | 'NOS' | 'NOC',
): string {
  const alphabet =
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

  // Compatibilidad con cualquier lugar del sistema
  // que todavía utilice randomCode() sin prefijo.
  if (!prefix) {
    const length = 24
    const bytes = crypto.getRandomValues(
      new Uint8Array(length),
    )

    let out = ''

    for (let i = 0; i < length; i++) {
      out += alphabet[bytes[i] % alphabet.length]
    }

    return out
  }

  // Formato: SOC-XXXX / NOS-XXXX / NOC-XXXX
  const length = 4

  const bytes = crypto.getRandomValues(
    new Uint8Array(length),
  )

  let out = ''

  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i] % alphabet.length]
  }

  return `${prefix}-${out}`
}

export function generateSaleNumber(): string {
  const now = new Date()
  const stamp = now
    .toISOString()
    .replace(/[-:TZ.]/g, '')
    .slice(0, 14)

  const rand = Math.floor(
    Math.random() * 900 + 100,
  )

  return `V-${stamp}-${rand}`
}