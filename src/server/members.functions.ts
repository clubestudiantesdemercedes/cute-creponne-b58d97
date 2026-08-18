import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq, inArray } from 'drizzle-orm'
import { db } from './db.server'
import { people, members } from '../../db/schema'
import { requireUser } from './auth.server'

const ImportRow = z.object({
  memberNumber: z.string().min(1),
  dni: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  birthDate: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  status: z.enum(['activo', 'inactivo']).default('activo'),
})
export type ImportRowT = z.infer<typeof ImportRow>

function normalizeDni(dni: string) {
  return dni.replace(/\D/g, '')
}

const HEADER_ALIASES: Record<string, keyof ImportRowT> = {
  socio: 'memberNumber',
  numerosocio: 'memberNumber',
  'nsocio': 'memberNumber',
  dni: 'dni',
  nombre: 'firstName',
  apellido: 'lastName',
  fechanacimiento: 'birthDate',
  nacimiento: 'birthDate',
  telefono: 'phone',
  email: 'email',
  correo: 'email',
  domicilio: 'address',
  direccion: 'address',
  estado: 'status',
}

function slug(s: string) {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let cur: string[] = []
  let field = ''
  let inQuotes = false
  const delimiter = text.includes(';') && !text.includes(',') ? ';' : ','
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === delimiter) {
      cur.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      cur.push(field)
      rows.push(cur)
      cur = []
      field = ''
    } else {
      field += c
    }
  }
  if (field.length || cur.length) {
    cur.push(field)
    rows.push(cur)
  }
  return rows.filter((r) => r.some((v) => v.trim() !== ''))
}

export const previewMembersImport = createServerFn({ method: 'POST' })
  .inputValidator((data: { csv: string }) => data)
  .handler(async ({ data }) => {
    const user = await requireUser()
    if (user.role !== 'admin') throw new Error('Solo un administrador puede importar socios.')

    const rows = parseCsv(data.csv)
    if (rows.length < 2) {
      return { rows: [], newCount: 0, updateCount: 0, errors: ['El archivo no tiene datos.'] }
    }
    const header = rows[0].map((h) => slug(h))
    const dataRows = rows.slice(1)

    const existingMembers = await db.select().from(members)
    const existingByNumber = new Map(existingMembers.map((m) => [m.memberNumber, m]))
    const existingPeople = await db.select().from(people)
    const existingByDni = new Map(existingPeople.map((p) => [p.dni, p]))

    const parsed: Array<{ row: Partial<ImportRowT>; errors: string[]; action: 'nuevo' | 'actualizar' }> = []

    for (const raw of dataRows) {
      const obj: Partial<ImportRowT> = {}
      header.forEach((h, idx) => {
        const key = HEADER_ALIASES[h]
        if (key) (obj as any)[key] = raw[idx]?.trim()
      })
      const errors: string[] = []
      if (!obj.memberNumber) errors.push('Falta número de socio')
      if (!obj.dni) errors.push('Falta DNI')
      else obj.dni = normalizeDni(obj.dni)
      if (!obj.firstName) errors.push('Falta nombre')
      if (!obj.lastName) errors.push('Falta apellido')
      if (obj.status) {
        const s = slug(obj.status)
        obj.status = s.startsWith('inact') ? 'inactivo' : 'activo'
      } else {
        obj.status = 'activo'
      }

      const action = obj.memberNumber && existingByNumber.has(obj.memberNumber) ? 'actualizar' : 'nuevo'
      parsed.push({ row: obj, errors, action })
    }

    return {
      rows: parsed,
      newCount: parsed.filter((p) => p.action === 'nuevo' && p.errors.length === 0).length,
      updateCount: parsed.filter((p) => p.action === 'actualizar' && p.errors.length === 0).length,
      errorCount: parsed.filter((p) => p.errors.length > 0).length,
    }
  })

export const confirmMembersImport = createServerFn({ method: 'POST' })
  .inputValidator((data: { rows: ImportRowT[] }) => data)
  .handler(async ({ data }) => {
    const user = await requireUser()
    if (user.role !== 'admin') throw new Error('Solo un administrador puede importar socios.')

    let created = 0
    let updated = 0

    for (const row of data.rows) {
      const dni = normalizeDni(row.dni)
      let [person] = await db.select().from(people).where(eq(people.dni, dni))
      if (!person) {
        ;[person] = await db
          .insert(people)
          .values({
            dni,
            firstName: row.firstName,
            lastName: row.lastName,
            birthDate: row.birthDate || null,
            phone: row.phone || null,
            email: row.email || null,
            address: row.address || null,
          })
          .returning()
      } else {
        ;[person] = await db
          .update(people)
          .set({
            firstName: row.firstName,
            lastName: row.lastName,
            birthDate: row.birthDate || person.birthDate,
            phone: row.phone || person.phone,
            email: row.email || person.email,
            address: row.address || person.address,
            updatedAt: new Date(),
          })
          .where(eq(people.id, person.id))
          .returning()
      }

      const [existingMember] = await db.select().from(members).where(eq(members.memberNumber, row.memberNumber))
      if (existingMember) {
        await db
          .update(members)
          .set({ personId: person.id, memberStatus: row.status, updatedAt: new Date() })
          .where(eq(members.id, existingMember.id))
        updated++
      } else {
        await db.insert(members).values({
          personId: person.id,
          memberNumber: row.memberNumber,
          memberStatus: row.status,
        })
        created++
      }
    }

    return { created, updated }
  })

export const listMembers = createServerFn({ method: 'GET' }).handler(async () => {
  await requireUser()
  const rows = await db
    .select({ member: members, person: people })
    .from(members)
    .innerJoin(people, eq(members.personId, people.id))
    .orderBy(members.memberNumber)
    .limit(500)
  return rows
})
