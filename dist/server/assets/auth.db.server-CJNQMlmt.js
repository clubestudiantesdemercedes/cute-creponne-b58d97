import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { d as db, u as users } from "./db.server-CxddXRZa.js";
import "drizzle-orm/netlify-db";
import "drizzle-orm/pg-core";
async function authenticateUser(username, password) {
  const [user] = await db.select().from(users).where(eq(users.username, username));
  if (!user || !user.active) {
    return null;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return null;
  }
  return {
    userId: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role
  };
}
export {
  authenticateUser
};
