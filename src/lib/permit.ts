import { addDaysISO } from './format'

export type PlanForCalc = {
  durationUnit: string // 'dia' | 'temporada'
  durationValue: number
  seasonStart: string | null
  seasonEnd: string | null
}

/** Computes permit start/end dates given a plan and the purchase date (ISO). */
/** Calcula inicio/fin del permiso.
 *  purchaseDateISO = día desde el que corre el plan (hoy o día siguiente al permiso actual).
 */
export function computePermitDates(
  plan: PlanForCalc,
  purchaseDateISO: string,
): { startDate: string; endDate: string } {
  // Temporada: el fin es siempre el de la temporada, no depende de días restantes.
  if (plan.durationUnit === 'temporada') {
    const seasonStart = plan.seasonStart ?? purchaseDateISO
    const seasonEnd = plan.seasonEnd ?? purchaseDateISO
    // Inicio = el mayor entre la cola (purchaseDate) y el inicio de temporada
    const startDate =
      purchaseDateISO > seasonStart ? purchaseDateISO : seasonStart
    return {
      startDate,
      endDate: seasonEnd,
    }
  }

  const startDate = purchaseDateISO
  const endDate = addDaysISO(
    startDate,
    Math.max(plan.durationValue, 1) - 1,
  )

  return { startDate, endDate }
}

/** Día siguiente a una fecha ISO YYYY-MM-DD */
export function dayAfterISO(dateISO: string): string {
  return addDaysISO(dateISO, 1)
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