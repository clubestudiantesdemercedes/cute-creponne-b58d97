import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../../db/schema.js'

const connectionString =
  process.env.DATABASE_URL ??
  process.env.NETLIFY_DB_URL ??
  'postgresql://postgres:postgres@localhost:5432/natatorio'

if (!process.env.DATABASE_URL && !process.env.NETLIFY_DB_URL) {
  console.warn(
    '[db] Usando DATABASE_URL por defecto (local). Defini DATABASE_URL en .env para produccion.',
  )
}

const client = postgres(connectionString, { prepare: false })

export const db = drizzle({
  client,
  schema,
})