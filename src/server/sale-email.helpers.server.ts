export type SaleEmailPerson = {
  email?: string | null
  firstName?: string | null
  lastName?: string | null
}

export type SaleEmailRecipient = {
  recipientEmail: string
  normalizedEmail: string
  recipientName: string
}

export function normalizeSaleEmailAddress(
  value: string | null | undefined,
): string | null {
  const email = value?.trim() ?? ''
  if (!email || email.length > 254 || /[\s,;]/.test(email)) return null

  const parts = email.split('@')
  if (parts.length !== 2) return null

  const [localPart, domainPart] = parts
  const local = localPart.toLowerCase()
  const domain = domainPart.toLowerCase()

  if (
    !local ||
    local.length > 64 ||
    local.startsWith('.') ||
    local.endsWith('.') ||
    local.includes('..') ||
    !/^[a-z0-9.!#$%&'*+/=?^_\x60{|}~-]+$/i.test(local)
  ) {
    return null
  }

  if (!domain || domain.length > 253 || !domain.includes('.')) return null
  const labels = domain.split('.')
  if (
    labels.some(
      (label) =>
        !label ||
        label.length > 63 ||
        !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label),
    )
  ) {
    return null
  }

  return local + '@' + domain
}

export function getSaleEmailRecipients(
  people: SaleEmailPerson[],
): SaleEmailRecipient[] {
  const recipients = new Map<string, SaleEmailRecipient>()

  for (const person of people) {
    const normalizedEmail = normalizeSaleEmailAddress(person.email)
    if (!normalizedEmail || recipients.has(normalizedEmail)) continue

    const recipientName = [person.firstName, person.lastName]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(' ')

    recipients.set(normalizedEmail, {
      recipientEmail: normalizedEmail,
      normalizedEmail,
      recipientName: recipientName || 'Beneficiario',
    })
  }

  return [...recipients.values()]
}

export function safeDeliveryErrorMessage(error: unknown): string {
  const message = typeof error === 'string'
    ? error
    : error instanceof Error
      ? error.message
      : 'Error desconocido al enviar el correo.'

  return message
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/Bearer\s+\S+/gi, 'Bearer [oculto]')
    .slice(0, 500)
}

export class DeliveryOutcomeUncertainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DeliveryOutcomeUncertainError'
  }
}

/** Captura errores del proveedor para que no se propaguen a la operación de venta. */
export async function captureEmailDeliveryAttempt(
  send: () => Promise<string>,
): Promise<{
  status: 'enviado' | 'fallido' | 'en_revision'
  providerMessageId: string | null
  lastError: string | null
}> {
  try {
    return {
      status: 'enviado',
      providerMessageId: await send(),
      lastError: null,
    }
  } catch (error) {
    return {
      status: error instanceof DeliveryOutcomeUncertainError
        ? 'en_revision'
        : 'fallido',
      providerMessageId: null,
      lastError: safeDeliveryErrorMessage(error),
    }
  }
}

/** Captura un fallo al persistir la cola, después de que la venta ya fue confirmada. */
export async function captureEmailQueueCreation<T>(
  enqueue: () => Promise<T>,
): Promise<{ value: T | null; error: string | null }> {
  try {
    return { value: await enqueue(), error: null }
  } catch (error) {
    return { value: null, error: safeDeliveryErrorMessage(error) }
  }
}
