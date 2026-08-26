import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema.js'

const connectionString =
  process.env.DATABASE_URL ??
  process.env.NETLIFY_DB_URL ??
  'postgresql://postgres:pincharrata@localhost:5432/natatorio'

const client = postgres(connectionString, { prepare: false })

export const db = drizzle({
  client,
  schema,
})