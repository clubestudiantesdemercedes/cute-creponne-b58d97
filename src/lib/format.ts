export function formatARS(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * En este proyecto Postgres guarda timestamps "naive" (sin zona).
 * Node a menudo los trata como UTC. Si formateamos otra vez con
 * America/Argentina, se restan 3 horas de más.
 * Por eso la hora se muestra con timeZone UTC (los números de reloj
 * que vinieron de la base), o tal cual si ya es texto local.
 */
export function formatDateAR(value: string | Date | null | undefined): string {
  if (!value) return '-'

  if (typeof value === 'string') {
    const s = value.trim()
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (m) return `${m[3]}/${m[2]}/${m[1]}`
  }

  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return '-'

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d)
}

export function formatDateTimeAR(value: string | Date | null | undefined): string {
  if (!value) return '-'

  if (typeof value === 'string') {
    const s = value.trim()

    // Texto sin zona: "2026-08-25 10:14:00" → mostrar tal cual
    const naive = s.match(
      /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/,
    )
    if (naive && !/[zZ]|[+-]\d{2}:?\d{2}/.test(s)) {
      return `${naive[3]}/${naive[2]}/${naive[1]}, ${naive[4]}:${naive[5]}`
    }
  }

  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return '-'

  // ISO con Z o Date: usar UTC para no restar 3 h otra vez
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(d)
}

export function todayISO(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const y = parts.find((p) => p.type === 'year')!.value
  const m = parts.find((p) => p.type === 'month')!.value
  const d = parts.find((p) => p.type === 'day')!.value

  return `${y}-${m}-${d}`
}

export function addDaysISO(startISO: string, days: number): string {
  const d = new Date(startISO + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function isBeforeOrEqualToday(dateISO: string): boolean {
  return dateISO <= todayISO()
}

export function daysUntil(dateISO: string): number {
  const today = new Date(todayISO() + 'T00:00:00Z')
  const target = new Date(dateISO + 'T00:00:00Z')
  return Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  )
}