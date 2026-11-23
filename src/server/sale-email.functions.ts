import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { and, eq, inArray, lt } from 'drizzle-orm'
import QRCode from 'qrcode'
import { db } from './db.server'
import {
  people,
  permits,
  plans,
  saleEmailDeliveries,
  saleItems,
  sales,
} from '../../db/schema'
import { requireUser } from './auth.server'
import {
  captureEmailDeliveryAttempt,
  DeliveryOutcomeUncertainError,
  normalizeSaleEmailAddress,
  safeDeliveryErrorMessage,
} from './sale-email.helpers.server'
import { formatARS, formatDateAR, formatDateTimeAR } from '@/lib/format'

type GmailConfig = {
  clientId: string
  clientSecret: string
  refreshToken: string
  senderEmail: string
}

type InlineQrImage = {
  contentId: string
  filename: string
  content: Buffer
}

type ReceiptItem = {
  itemId: number
  firstName: string
  lastName: string
  dni: string
  planName: string
  conditionType: string
  unitPrice: number
  permitId: number | null
  permitCode: string | null
  startDate: string | null
  endDate: string | null
}

type SaleReceipt = {
  sale: typeof sales.$inferSelect
  items: ReceiptItem[]
  images: InlineQrImage[]
}

let cachedAccessToken: {
  value: string
  expiresAt: number
  refreshToken: string
  clientId: string
} | null = null

function readGmailConfig(): GmailConfig {
  const clientId = process.env.GMAIL_CLIENT_ID?.trim()
  const clientSecret = process.env.GMAIL_CLIENT_SECRET?.trim()
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN?.trim()
  const senderEmail = normalizeSaleEmailAddress(process.env.GMAIL_SENDER_EMAIL)

  const missing = [
    !clientId ? 'GMAIL_CLIENT_ID' : null,
    !clientSecret ? 'GMAIL_CLIENT_SECRET' : null,
    !refreshToken ? 'GMAIL_REFRESH_TOKEN' : null,
    !senderEmail ? 'GMAIL_SENDER_EMAIL' : null,
  ].filter(Boolean)

  if (missing.length) {
    throw new Error(
      'Falta configurar en Netlify: ' + missing.join(', ') +
      '. La venta ya quedó registrada; los comprobantes siguen pendientes.',
    )
  }

  return {
    clientId: clientId!,
    clientSecret: clientSecret!,
    refreshToken: refreshToken!,
    senderEmail: senderEmail!,
  }
}

async function getGmailAccessToken(config: GmailConfig): Promise<string> {
  const now = Date.now()
  if (
    cachedAccessToken &&
    cachedAccessToken.refreshToken === config.refreshToken &&
    cachedAccessToken.clientId === config.clientId &&
    cachedAccessToken.expiresAt > now + 60_000
  ) {
    return cachedAccessToken.value
  }

  let response: Response
  try {
    response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: config.refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
      signal: AbortSignal.timeout(15_000),
    })
  } catch {
    throw new Error('No se pudo conectar con el servicio de autorización de Google.')
  }

  const payload = await response.json().catch(() => null) as {
    access_token?: string
    expires_in?: number
    error?: string
    error_description?: string
  } | null

  if (!response.ok || !payload?.access_token) {
    const description = payload?.error_description || payload?.error || 'respuesta no válida'
    throw new Error(
      'Google no autorizó la renovación del acceso (' + response.status + '): ' +
      safeDeliveryErrorMessage(description),
    )
  }

  const expiresIn = Number(payload.expires_in) || 3600
  cachedAccessToken = {
    value: payload.access_token,
    refreshToken: config.refreshToken,
    clientId: config.clientId,
    expiresAt: Date.now() + expiresIn * 1000,
  }

  return payload.access_token
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function conditionLabel(conditionType: string): string {
  const labels: Record<string, string> = {
    socio: 'Socio',
    deportista: 'Deportista / tarifa reducida',
    no_socio: 'No socio',
    convenio: 'Convenio',
  }
  return labels[conditionType] ?? conditionType
}

function paymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    efectivo: 'Efectivo',
    transferencia: 'Transferencia bancaria',
    mercadopago: 'Mercado Pago',
    tarjeta: 'Tarjeta',
    otro: 'Otro',
    sin_cargo: 'Sin cargo',
  }
  return labels[method] ?? method
}

function buildReceiptHtml(
  sale: typeof sales.$inferSelect,
  items: ReceiptItem[],
  recipientName: string,
): string {
  const itemCards = items.map((item, index) => {
    const qr = item.permitId && item.permitCode
      ? '<img src="cid:qr-' + item.permitId +
        '" width="170" height="170" alt="Código QR del permiso ' +
        escapeHtml(item.permitCode) +
        '" style="display:block;width:170px;height:170px;max-width:100%;border:1px solid #dbe3ef;border-radius:8px;background:#fff;padding:6px;" />'
      : '<p style="color:#64748b;font-size:12px;">QR no disponible para este permiso.</p>'

    const permitDetails = item.permitCode
      ? '<p style="margin:10px 0 4px;color:#0c1e4d;font-size:12px;font-weight:700;">Código de permiso</p>' +
        '<p style="margin:0 0 8px;color:#0c1e4d;font-family:monospace;font-size:17px;font-weight:700;letter-spacing:1px;">' +
        escapeHtml(item.permitCode) + '</p>' +
        '<p style="margin:0;color:#475569;font-size:12px;">Vigencia: ' +
        escapeHtml(formatDateAR(item.startDate)) + ' al ' +
        escapeHtml(formatDateAR(item.endDate)) + '</p>'
      : '<p style="color:#b45309;font-size:12px;">No se encontró un permiso asociado a este ítem.</p>'

    return '<tr><td style="padding:18px 0;border-top:1px solid #e2e8f0;">' +
      '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">' +
      '<tr><td style="vertical-align:top;padding-right:16px;">' +
      '<p style="margin:0 0 5px;color:#0c1e4d;font-size:16px;font-weight:700;">' +
      (index + 1) + '. ' + escapeHtml(item.firstName) + ' ' + escapeHtml(item.lastName) + '</p>' +
      '<p style="margin:0 0 8px;color:#475569;font-size:13px;">DNI ' +
      escapeHtml(item.dni) + ' · ' + escapeHtml(item.planName) + '</p>' +
      '<p style="margin:0 0 5px;color:#475569;font-size:12px;">' +
      escapeHtml(conditionLabel(item.conditionType)) + ' · ' +
      escapeHtml(formatARS(item.unitPrice)) + '</p>' + permitDetails +
      '</td><td width="180" align="center" style="vertical-align:top;padding:0 0 0 8px;">' +
      qr + '</td></tr></table></td></tr>'
  }).join('')

  const notes = sale.notes
    ? '<p style="margin:12px 0 0;color:#475569;font-size:12px;">Observaciones: ' +
      escapeHtml(sale.notes) + '</p>'
    : ''

  return '<!doctype html><html lang="es"><head><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
    '<body style="margin:0;padding:24px 10px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#1e293b;">' +
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:720px;margin:0 auto;background:#fff;border:1px solid #dbe3ef;border-radius:14px;border-collapse:separate;">' +
    '<tr><td style="padding:24px 26px;background:#0c1e4d;border-radius:14px 14px 0 0;color:#fff;">' +
    '<p style="margin:0 0 5px;font-size:12px;letter-spacing:1.4px;font-weight:700;">CLUB ATLÉTICO ESTUDIANTES</p>' +
    '<h1 style="margin:0;font-size:24px;line-height:1.25;">Comprobante de compra</h1>' +
    '<p style="margin:8px 0 0;color:#dbeafe;font-size:13px;">Natatorio · Mercedes, Buenos Aires</p>' +
    '</td></tr><tr><td style="padding:24px 26px;">' +
    '<p style="margin:0 0 16px;color:#334155;font-size:14px;">Hola ' +
    escapeHtml(recipientName || 'Beneficiario') +
    ', te compartimos el comprobante completo de la compra.</p>' +
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f8fafc;border:1px solid #e2e8f0;border-radius:9px;">' +
    '<tr><td style="padding:12px 14px;color:#64748b;font-size:12px;">Venta</td><td align="right" style="padding:12px 14px;color:#0c1e4d;font-size:14px;font-weight:700;">' +
    escapeHtml(sale.saleNumber) + '</td></tr>' +
    '<tr><td style="padding:0 14px 12px;color:#64748b;font-size:12px;">Fecha</td><td align="right" style="padding:0 14px 12px;color:#334155;font-size:13px;">' +
    escapeHtml(formatDateTimeAR(sale.createdAt)) + '</td></tr>' +
    '<tr><td style="padding:0 14px 12px;color:#64748b;font-size:12px;">Medio de pago</td><td align="right" style="padding:0 14px 12px;color:#334155;font-size:13px;">' +
    escapeHtml(paymentMethodLabel(sale.paymentMethod)) + '</td></tr>' +
    '<tr><td style="padding:0 14px 12px;color:#64748b;font-size:12px;">Personas incluidas</td><td align="right" style="padding:0 14px 12px;color:#334155;font-size:13px;">' +
    items.length + '</td></tr>' +
    '<tr><td style="padding:12px 14px;border-top:1px solid #e2e8f0;color:#0c1e4d;font-size:14px;font-weight:700;">TOTAL</td><td align="right" style="padding:12px 14px;border-top:1px solid #e2e8f0;color:#b91c1c;font-size:20px;font-weight:700;">' +
    escapeHtml(formatARS(sale.totalAmount)) + '</td></tr></table>' + notes +
    '<h2 style="margin:26px 0 4px;color:#0c1e4d;font-size:17px;">Personas y permisos incluidos</h2>' +
    '<p style="margin:0 0 8px;color:#64748b;font-size:12px;">Este comprobante incluye a todas las personas de la compra, aunque no todas tengan una dirección de correo registrada. Presentá el QR correspondiente al permiso de cada persona.</p>' +
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">' +
    itemCards + '</table>' +
    '<p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;line-height:1.5;">Conservá este correo como comprobante. Los códigos QR son individuales y verifican los permisos registrados en el sistema del Club Atlético Estudiantes.</p>' +
    '<p style="margin:14px 0 0;color:#0c1e4d;font-size:13px;font-weight:700;">¡Gracias por elegir el Club Atlético Estudiantes!</p>' +
    '</td></tr></table></body></html>'
}

function base64Lines(value: Buffer): string {
  const encoded = value.toString('base64')
  return encoded.match(/.{1,76}/g)?.join('\r\n') ?? ''
}

function buildRawEmail({
  senderEmail,
  recipientEmail,
  saleId,
  saleNumber,
  deliveryId,
  html,
  images,
}: {
  senderEmail: string
  recipientEmail: string
  saleId: number
  saleNumber: string
  deliveryId: number
  html: string
  images: InlineQrImage[]
}): string {
  const boundary = 'natatorio-' + saleId + '-' + deliveryId + '-' + Date.now()
  const domain = senderEmail.split('@')[1]
  const subject = 'Comprobante de compra — Venta ' + saleNumber
  const encodedSubject = Buffer.from(subject, 'utf8').toString('base64')
  const encodedFromName = Buffer.from('Club Atlético Estudiantes', 'utf8').toString('base64')
  const safeRecipient = normalizeSaleEmailAddress(recipientEmail)

  if (!safeRecipient || safeRecipient !== recipientEmail) {
    throw new Error('La dirección de correo del destinatario no es válida.')
  }

  const parts = [
    'From: =?UTF-8?B?' + encodedFromName + '?= <' + senderEmail + '>',
    'To: ' + safeRecipient,
    'Subject: =?UTF-8?B?' + encodedSubject + '?=',
    'Date: ' + new Date().toUTCString(),
    'Message-ID: <natatorio-sale-' + saleId + '-delivery-' + deliveryId + '@' + domain + '>',
    'MIME-Version: 1.0',
    'Content-Type: multipart/related; boundary="' + boundary + '"',
    '',
    '--' + boundary,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    base64Lines(Buffer.from(html, 'utf8')),
  ]

  for (const image of images) {
    parts.push(
      '--' + boundary,
      'Content-Type: image/png; name="' + image.filename + '"',
      'Content-Transfer-Encoding: base64',
      'Content-ID: <' + image.contentId + '>',
      'Content-Disposition: inline; filename="' + image.filename + '"',
      '',
      base64Lines(image.content),
    )
  }

  parts.push('--' + boundary + '--', '')
  return Buffer.from(parts.join('\r\n'), 'utf8').toString('base64url')
}

async function buildSaleReceipt(saleId: number): Promise<SaleReceipt> {
  const [sale] = await db
    .select()
    .from(sales)
    .where(eq(sales.id, saleId))

  if (!sale) throw new Error('La venta no existe.')
  if (sale.status === 'anulada') {
    throw new Error('La venta está anulada; no se enviarán comprobantes.')
  }

  // Incluye todos los ítems de la venta. El email del beneficiario no filtra el comprobante.
  const items = await db
    .select({
      itemId: saleItems.id,
      firstName: people.firstName,
      lastName: people.lastName,
      dni: people.dni,
      planName: plans.name,
      conditionType: saleItems.conditionType,
      unitPrice: saleItems.unitPrice,
      permitId: permits.id,
      permitCode: permits.code,
      startDate: permits.startDate,
      endDate: permits.endDate,
    })
    .from(saleItems)
    .innerJoin(people, eq(saleItems.personId, people.id))
    .innerJoin(plans, eq(saleItems.planId, plans.id))
    .leftJoin(permits, eq(permits.saleItemId, saleItems.id))
    .where(eq(saleItems.saleId, saleId))
    .orderBy(saleItems.id)

  const receiptItems = items as ReceiptItem[]
  const images = await Promise.all(
    receiptItems
      .filter((item) => item.permitId != null && item.permitCode)
      .map(async (item) => ({
        contentId: 'qr-' + item.permitId,
        filename: 'permiso-' + item.permitId + '-qr.png',
        content: await QRCode.toBuffer(item.permitCode!, {
          type: 'png',
          errorCorrectionLevel: 'M',
          width: 280,
          margin: 2,
          color: { dark: '#0c1e4d', light: '#ffffff' },
        }),
      })),
  )

  return { sale, items: receiptItems, images }
}

async function sendSaleReceiptEmail({
  accessToken,
  senderEmail,
  recipientEmail,
  recipientName,
  deliveryId,
  receipt,
}: {
  accessToken: string
  senderEmail: string
  recipientEmail: string
  recipientName: string
  deliveryId: number
  receipt: SaleReceipt
}): Promise<string> {
  const html = buildReceiptHtml(receipt.sale, receipt.items, recipientName)
  const raw = buildRawEmail({
    senderEmail,
    recipientEmail,
    saleId: receipt.sale.id,
    saleNumber: receipt.sale.saleNumber,
    deliveryId,
    html,
    images: receipt.images,
  })

  let response: Response
  try {
    response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
      signal: AbortSignal.timeout(20_000),
    })
  } catch {
    throw new DeliveryOutcomeUncertainError(
      'No se pudo confirmar la respuesta de Gmail. Revisá la carpeta Enviados antes de reintentar.',
    )
  }

  const payload = await response.json().catch(() => null) as {
    id?: string
    error?: { message?: string }
  } | null

  if (!response.ok) {
    if (response.status >= 500) {
      throw new DeliveryOutcomeUncertainError(
        'Gmail respondió con un error ' + response.status +
        '; el resultado del envío es incierto. Revisá Enviados antes de reintentar.',
      )
    }

    const message = payload?.error?.message || 'HTTP ' + response.status
    throw new Error(
      'Gmail rechazó el envío (' + response.status + '): ' +
      safeDeliveryErrorMessage(message),
    )
  }

  if (!payload?.id) {
    throw new DeliveryOutcomeUncertainError(
      'Gmail respondió sin confirmar el identificador del mensaje. Revisá Enviados antes de reintentar.',
    )
  }

  return payload.id
}

const ProcessSaleEmailInput = z.object({
  saleId: z.number().int().positive(),
  retryUncertain: z.boolean().optional().default(false),
})

export const processSaleEmailDeliveries = createServerFn({ method: 'POST' })
  .inputValidator(ProcessSaleEmailInput)
  .handler(async ({ data }) => {
    const user = await requireUser()
    if (user.role !== 'admin' && user.role !== 'operador') {
      throw new Error('No tenés permisos para enviar comprobantes.')
    }

    const [sale] = await db
      .select({ id: sales.id, status: sales.status })
      .from(sales)
      .where(eq(sales.id, data.saleId))

    if (!sale) throw new Error('La venta no existe.')

    const listCurrentDeliveries = () => db
      .select({
        id: saleEmailDeliveries.id,
        recipientEmail: saleEmailDeliveries.recipientEmail,
        recipientName: saleEmailDeliveries.recipientName,
        status: saleEmailDeliveries.status,
        attempts: saleEmailDeliveries.attempts,
        lastAttemptAt: saleEmailDeliveries.lastAttemptAt,
        sentAt: saleEmailDeliveries.sentAt,
        providerMessageId: saleEmailDeliveries.providerMessageId,
        lastError: saleEmailDeliveries.lastError,
      })
      .from(saleEmailDeliveries)
      .where(eq(saleEmailDeliveries.saleId, data.saleId))
      .orderBy(saleEmailDeliveries.id)

    if (sale.status === 'anulada') return listCurrentDeliveries()

    // Un proceso interrumpido no se reenvía a ciegas: pasa a revisión manual.
    const staleBefore = new Date(Date.now() - 10 * 60 * 1000)
    await db
      .update(saleEmailDeliveries)
      .set({
        status: 'en_revision',
        lastError: 'El intento anterior quedó interrumpido. Revisá Gmail / Enviados antes de reintentar.',
        updatedAt: new Date(),
      })
      .where(and(
        eq(saleEmailDeliveries.saleId, data.saleId),
        eq(saleEmailDeliveries.status, 'procesando'),
        lt(saleEmailDeliveries.lastAttemptAt, staleBefore),
      ))

    const retryStatuses = data.retryUncertain
      ? ['pendiente', 'fallido', 'en_revision']
      : ['pendiente', 'fallido']

    const candidates = await db
      .select()
      .from(saleEmailDeliveries)
      .where(and(
        eq(saleEmailDeliveries.saleId, data.saleId),
        inArray(saleEmailDeliveries.status, retryStatuses),
      ))
      .orderBy(saleEmailDeliveries.id)

    if (!candidates.length) return listCurrentDeliveries()

    const receipt = await buildSaleReceipt(data.saleId)

    let config: GmailConfig | null = null
    let accessToken: string | null = null
    let authenticationError: unknown = null

    try {
      config = readGmailConfig()
      accessToken = await getGmailAccessToken(config)
    } catch (error) {
      authenticationError = error
    }

    for (const candidate of candidates) {
      const now = new Date()
      const [claimed] = await db
        .update(saleEmailDeliveries)
        .set({
          status: 'procesando',
          attempts: candidate.attempts + 1,
          lastAttemptAt: now,
          lastError: null,
          updatedAt: now,
        })
        .where(and(
          eq(saleEmailDeliveries.id, candidate.id),
          eq(saleEmailDeliveries.saleId, data.saleId),
          inArray(saleEmailDeliveries.status, retryStatuses),
        ))
        .returning({ id: saleEmailDeliveries.id })

      // Evita que dos clics simultáneos envíen dos veces al mismo destinatario.
      if (!claimed) continue

      const attempt = await captureEmailDeliveryAttempt(async () => {
        if (authenticationError) throw authenticationError
        if (!config || !accessToken) {
          throw new Error('No se pudo iniciar la sesión con Gmail.')
        }

        return sendSaleReceiptEmail({
          accessToken,
          senderEmail: config.senderEmail,
          recipientEmail: candidate.normalizedEmail,
          recipientName: candidate.recipientName,
          deliveryId: candidate.id,
          receipt,
        })
      })

      await db
        .update(saleEmailDeliveries)
        .set({
          status: attempt.status,
          providerMessageId: attempt.providerMessageId,
          lastError: attempt.lastError,
          sentAt: attempt.status === 'enviado' ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(saleEmailDeliveries.id, candidate.id))
    }

    return listCurrentDeliveries()
  })
