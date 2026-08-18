import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { d as db, u as users } from "./db.server-CxddXRZa.js";
import { r as requireUser } from "./auth.server-D_Q0GJcF.js";
import { c as createServerFn } from "../server.js";
import "drizzle-orm/netlify-db";
import "drizzle-orm/pg-core";
import "@tanstack/react-router";
import "node:async_hooks";
import "node:stream";
import "react";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
const listUsers_createServerFn_handler = createServerRpc({
  id: "35ac0f5f832574d75cebf47b67ba396d5bd05c7d14699366c07bd7771b7dbaa4",
  name: "listUsers",
  filename: "src/server/users.functions.ts"
}, (opts) => listUsers.__executeServer(opts));
const listUsers = createServerFn({
  method: "GET"
}).handler(listUsers_createServerFn_handler, async () => {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("Solo un administrador puede ver los usuarios.");
  const rows = await db.select({
    id: users.id,
    username: users.username,
    fullName: users.fullName,
    role: users.role,
    active: users.active
  }).from(users).orderBy(users.fullName);
  return rows;
});
const UserInput = z.object({
  username: z.string().min(3),
  password: z.string().min(6).optional(),
  fullName: z.string().min(1),
  role: z.enum(["admin", "encargado", "control_ingreso", "consulta"]),
  active: z.boolean().default(true)
});
const createUser_createServerFn_handler = createServerRpc({
  id: "08dbef7bbe43d802c40129d43cb49f6c5ed9d5367d7f51e6e23aacd763751fc8",
  name: "createUser",
  filename: "src/server/users.functions.ts"
}, (opts) => createUser.__executeServer(opts));
const createUser = createServerFn({
  method: "POST"
}).inputValidator(UserInput).handler(createUser_createServerFn_handler, async ({
  data
}) => {
  const requester = await requireUser();
  if (requester.role !== "admin") throw new Error("Solo un administrador puede crear usuarios.");
  if (!data.password) throw new Error("La contraseña es obligatoria para crear un usuario.");
  const passwordHash = await bcrypt.hash(data.password, 10);
  const [created] = await db.insert(users).values({
    username: data.username.trim().toLowerCase(),
    passwordHash,
    fullName: data.fullName,
    role: data.role,
    active: data.active
  }).returning();
  return {
    id: created.id,
    username: created.username,
    fullName: created.fullName,
    role: created.role
  };
});
const updateUser_createServerFn_handler = createServerRpc({
  id: "46fdacbffcf90e4fd11aea8a0204971ae5c8176cb91fa82347b53942a3a8fbc0",
  name: "updateUser",
  filename: "src/server/users.functions.ts"
}, (opts) => updateUser.__executeServer(opts));
const updateUser = createServerFn({
  method: "POST"
}).inputValidator(UserInput.extend({
  id: z.number()
})).handler(updateUser_createServerFn_handler, async ({
  data
}) => {
  const requester = await requireUser();
  if (requester.role !== "admin") throw new Error("Solo un administrador puede modificar usuarios.");
  const updateValues = {
    fullName: data.fullName,
    role: data.role,
    active: data.active
  };
  if (data.password) {
    updateValues.passwordHash = await bcrypt.hash(data.password, 10);
  }
  await db.update(users).set(updateValues).where(eq(users.id, data.id));
  return {
    ok: true
  };
});
export {
  createUser_createServerFn_handler,
  listUsers_createServerFn_handler,
  updateUser_createServerFn_handler
};
