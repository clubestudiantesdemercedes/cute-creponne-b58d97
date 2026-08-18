import { drizzle } from 'drizzle-orm/netlify-db'
import * as schema from '../../db/schema.js'

export const db = drizzle({
  schema,
})