import test from 'node:test'
import assert from 'node:assert/strict'
import {
  captureEmailDeliveryAttempt,
  captureEmailQueueCreation,
  DeliveryOutcomeUncertainError,
  getSaleEmailRecipients,
  normalizeSaleEmailAddress,
} from '../src/server/sale-email.helpers.server.ts'

test('una persona con email válido genera un destinatario', () => {
  assert.deepEqual(
    getSaleEmailRecipients([
      { firstName: 'Ana', lastName: 'Pérez', email: 'Ana@Ejemplo.com ' },
    ]),
    [{
      recipientEmail: 'ana@ejemplo.com',
      normalizedEmail: 'ana@ejemplo.com',
      recipientName: 'Ana Pérez',
    }],
  )
})

test('direcciones repetidas se deduplican ignorando mayúsculas y espacios', () => {
  const recipients = getSaleEmailRecipients([
    { firstName: 'Ana', lastName: 'Pérez', email: 'familia@ejemplo.com' },
    { firstName: 'Juan', lastName: 'Pérez', email: ' FAMILIA@EJEMPLO.COM ' },
    { firstName: 'Luz', lastName: 'Pérez', email: 'otra@ejemplo.com' },
  ])
  assert.equal(recipients.length, 2)
  assert.deepEqual(recipients.map((row) => row.normalizedEmail), [
    'familia@ejemplo.com',
    'otra@ejemplo.com',
  ])
})

test('beneficiarios sin email o con email inválido no generan destinatarios', () => {
  const recipients = getSaleEmailRecipients([
    { firstName: 'Sin', lastName: 'Correo', email: null },
    { firstName: 'Inválido', lastName: 'Uno', email: 'correo-sin-arroba' },
    { firstName: 'Inválido', lastName: 'Dos', email: 'a@ejemplo' },
    { firstName: 'Válido', lastName: 'Tres', email: 'ok@ejemplo.com' },
  ])
  assert.equal(recipients.length, 1)
  assert.equal(recipients[0].recipientEmail, 'ok@ejemplo.com')
})

test('si nadie tiene email válido, no se crea ningún destinatario', () => {
  assert.deepEqual(
    getSaleEmailRecipients([
      { email: null },
      { email: '' },
      { email: 'malformado' },
    ]),
    [],
  )
})

test('el fallo al crear la cola no se propaga a la operación que ya terminó', async () => {
  const committedSale = { id: 42, saleNumber: 'V-TEST-001' }
  const queue = await captureEmailQueueCreation(async () => {
    throw new Error('Postgres no disponible')
  })
  assert.equal(committedSale.id, 42)
  assert.equal(queue.value, null)
  assert.match(queue.error ?? '', /Postgres no disponible/)
})

test('un rechazo del proveedor queda como fallido sin propagar el error', async () => {
  const result = await captureEmailDeliveryAttempt(async () => {
    throw new Error('Gmail rechazó el mensaje (403)')
  })
  assert.equal(result.status, 'fallido')
  assert.equal(result.providerMessageId, null)
  assert.match(result.lastError ?? '', /403/)
})

test('una respuesta incierta requiere revisión antes de reintentar', async () => {
  const result = await captureEmailDeliveryAttempt(async () => {
    throw new DeliveryOutcomeUncertainError('No se pudo confirmar la respuesta')
  })
  assert.equal(result.status, 'en_revision')
  assert.equal(result.providerMessageId, null)
})

test('el envío exitoso registra el identificador del proveedor', async () => {
  const result = await captureEmailDeliveryAttempt(async () => 'gmail-message-123')
  assert.deepEqual(result, {
    status: 'enviado',
    providerMessageId: 'gmail-message-123',
    lastError: null,
  })
})

test('la validación rechaza múltiples direcciones dentro del mismo campo', () => {
  assert.equal(normalizeSaleEmailAddress('a@ejemplo.com, b@ejemplo.com'), null)
})

test('los errores almacenados ocultan posibles tokens bearer', async () => {
  const result = await captureEmailDeliveryAttempt(async () => {
    throw new Error('Bearer abc.def.ghi')
  })
  assert.equal(result.status, 'fallido')
  assert.doesNotMatch(result.lastError ?? '', /abc\.def\.ghi/)
})

test('los mensajes de error de texto se conservan y se limpian', async () => {
  const result = await captureEmailDeliveryAttempt(async () => {
    throw 'Gmail devolvió un error de autorización'
  })
  assert.equal(result.status, 'fallido')
  assert.match(result.lastError ?? '', /autorización/)
})
