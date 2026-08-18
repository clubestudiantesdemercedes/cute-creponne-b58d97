import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { sql } from "drizzle-orm";
import { d as db } from "./db.server-CxddXRZa.js";
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
const resetTestEnvironment_createServerFn_handler = createServerRpc({
  id: "4246ef411e1eb73ad750342e42342bd11c2ef3cbf3c98f1b9cfe102f536ba467",
  name: "resetTestEnvironment",
  filename: "src/server/reset.functions.ts"
}, (opts) => resetTestEnvironment.__executeServer(opts));
const resetTestEnvironment = createServerFn({
  method: "POST"
}).handler(resetTestEnvironment_createServerFn_handler, async () => {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new Error("Solo un administrador puede reiniciar el entorno de prueba.");
  }
  await db.transaction(async (tx) => {
    await tx.execute(sql`DELETE FROM entries`);
    await tx.execute(sql`DELETE FROM permits`);
    await tx.execute(sql`DELETE FROM sale_items`);
    await tx.execute(sql`DELETE FROM payments`);
    await tx.execute(sql`DELETE FROM sales`);
    await tx.execute(sql`DELETE FROM convention_beneficiaries`);
    await tx.execute(sql`DELETE FROM members`);
    await tx.execute(sql`DELETE FROM family_members`);
    await tx.execute(sql`DELETE FROM families`);
    await tx.execute(sql`DELETE FROM people`);
    await tx.execute(sql`DELETE FROM prices`);
    await tx.execute(sql`DELETE FROM conventions`);
    await tx.execute(sql`DELETE FROM plans`);
    await tx.execute(sql`DELETE FROM cash_closures`);
    await tx.execute(sql`DELETE FROM audit_logs`);
    await tx.execute(sql`DELETE FROM app_config`);
  });
  return {
    ok: true,
    message: "Entorno de prueba reiniciado correctamente."
  };
});
export {
  resetTestEnvironment_createServerFn_handler
};
