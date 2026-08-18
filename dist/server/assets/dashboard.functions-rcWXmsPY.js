import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { ne, and, gte, lte } from "drizzle-orm";
import { d as db, h as permits, s as sales, i as entries } from "./db.server-CxddXRZa.js";
import { r as requireUser } from "./auth.server-D_Q0GJcF.js";
import { t as todayISO } from "./format-COLuSK5l.js";
import { a as computeLiveStatus } from "./permits.functions-DTMs4qjC.js";
import { c as createServerFn } from "../server.js";
import "drizzle-orm/netlify-db";
import "drizzle-orm/pg-core";
import "@tanstack/react-router";
import "node:async_hooks";
import "node:stream";
import "react";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
const getDashboardStats_createServerFn_handler = createServerRpc({
  id: "a99e984c6e003acf02fb89fc4e6d112a131286a384e2fdffc4fbd4c89ada9477",
  name: "getDashboardStats",
  filename: "src/server/dashboard.functions.ts"
}, (opts) => getDashboardStats.__executeServer(opts));
const getDashboardStats = createServerFn({
  method: "GET"
}).handler(getDashboardStats_createServerFn_handler, async () => {
  await requireUser();
  const today = todayISO();
  const start = /* @__PURE__ */ new Date(today + "T00:00:00");
  const end = /* @__PURE__ */ new Date(today + "T23:59:59");
  const allPermits = await db.select().from(permits).where(ne(permits.status, "anulado"));
  const activePermits = allPermits.filter((p) => computeLiveStatus(p) === "activo");
  const bySocio = activePermits.filter((p) => p.conditionType === "socio").length;
  const byNoSocio = activePermits.filter((p) => p.conditionType === "no_socio").length;
  const byConvenio = activePermits.filter((p) => p.conditionType === "convenio").length;
  const salesToday = await db.select().from(sales).where(and(gte(sales.createdAt, start), lte(sales.createdAt, end), ne(sales.status, "anulada")));
  const entriesToday = await db.select().from(entries).where(and(gte(entries.occurredAt, start), lte(entries.occurredAt, end)));
  const recaudacionHoy = salesToday.reduce((acc, s) => acc + s.totalAmount, 0);
  return {
    personasHabilitadas: activePermits.length,
    socios: bySocio,
    noSocios: byNoSocio,
    convenios: byConvenio,
    ventasHoy: salesToday.length,
    ingresosHoy: entriesToday.length,
    recaudacionHoy
  };
});
export {
  getDashboardStats_createServerFn_handler
};
