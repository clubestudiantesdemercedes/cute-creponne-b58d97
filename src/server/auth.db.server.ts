import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from './db.server'
import { users } from '../../db/schema'

export async function authenticateUser(username: string, password: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))

  if (!user || !user.active) {
    return null
  }

  const valid = await bcrypt.compare(password, user.passwordHash)

  if (!valid) {
    return null
  }

  return {
    userId: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role as 'admin' | 'encargado' | 'control_ingreso' | 'consulta',
  }
}