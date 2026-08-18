import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { eq, desc } from "drizzle-orm";
import { d as db, c as conventions, b as plans, p as people, h as permits, i as entries } from "./db.server-CxddXRZa.js";
import { r as requireUser } from "./auth.server-D_Q0GJcF.js";
import { d as daysUntil, t as todayISO } from "./format-COLuSK5l.js";
import { c as createServerFn } from "../server.js";
import "drizzle-orm/netlify-db";
import "drizzle-orm/pg-core";
import "@tanstack/react-router";
import "node:async_hooks";
import "node:stream";
import "react";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
function computeLiveStatus(permit) {
  if (permit.status === "anulado") {
    return "anulado";
  }
  const today = todayISO();
  if (permit.endDate < today) {
    return "vencido";
  }
  if (permit.startDate > today) {
    return "pendiente";
  }
  return "activo";
}
const verifyPermitByCode_createServerFn_handler = createServerRpc({
  id: "e6d8706d7a3c4f36dddf4d073c45696539c512a3db7ce985072f47db383356d0",
  name: "verifyPermitByCode",
  filename: "src/server/permits.functions.ts"
}, (opts) => verifyPermitByCode.__executeServer(opts));
const verifyPermitByCode = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(verifyPermitByCode_createServerFn_handler, async ({
  data
}) => {
  await requireUser();
  const code = data.code.trim();
  if (!code) {
    return null;
  }
  const [row] = await db.select({
    permit: permits,
    person: people,
    plan: plans,
    convention: conventions
  }).from(permits).innerJoin(people, eq(permits.personId, people.id)).innerJoin(plans, eq(permits.planId, plans.id)).leftJoin(conventions, eq(permits.conventionId, conventions.id)).where(eq(permits.code, code));
  if (!row) {
    return null;
  }
  const [lastEntry] = await db.select().from(entries).where(eq(entries.permitId, row.permit.id)).orderBy(desc(entries.occurredAt)).limit(1);
  return {
    ...row,
    liveStatus: computeLiveStatus(row.permit),
    lastEntry: lastEntry ?? null
  };
});
const findActivePermitsByDni_createServerFn_handler = createServerRpc({
  id: "c3cb10608ec63f28940153f463d6947c5c3a4d9605e68db01700f59c02398719",
  name: "findActivePermitsByDni",
  filename: "src/server/permits.functions.ts"
}, (opts) => findActivePermitsByDni.__executeServer(opts));
const findActivePermitsByDni = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(findActivePermitsByDni_createServerFn_handler, async ({
  data
}) => {
  await requireUser();
  const dni = data.dni.replace(/\D/g, "");
  if (!dni) {
    return null;
  }
  const [person] = await db.select().from(people).where(eq(people.dni, dni));
  if (!person) {
    return null;
  }
  const rows = await db.select({
    permit: permits,
    plan: plans,
    convention: conventions
  }).from(permits).innerJoin(plans, eq(permits.planId, plans.id)).leftJoin(conventions, eq(permits.conventionId, conventions.id)).where(eq(permits.personId, person.id)).orderBy(desc(permits.createdAt));
  const permitsWithStatus = rows.map((r) => ({
    ...r,
    liveStatus: computeLiveStatus(r.permit)
  }));
  const [lastEntry] = await db.select().from(entries).where(eq(entries.personId, person.id)).orderBy(desc(entries.occurredAt)).limit(1);
  return {
    person,
    permits: permitsWithStatus,
    lastEntry: lastEntry ?? null
  };
});
const listExpiringPermits_createServerFn_handler = createServerRpc({
  id: "89e5512f7aeb35257b46f6597a73aa1035ea8521326edbc8fe0337b670a852b4",
  name: "listExpiringPermits",
  filename: "src/server/permits.functions.ts"
}, (opts) => listExpiringPermits.__executeServer(opts));
const listExpiringPermits = createServerFn({
  method: "GET"
}).handler(listExpiringPermits_createServerFn_handler, async () => {
  await requireUser();
  const rows = await db.select({
    permit: permits,
    person: people,
    plan: plans
  }).from(permits).innerJoin(people, eq(permits.personId, people.id)).innerJoin(plans, eq(permits.planId, plans.id)).where(eq(permits.status, "activo"));
  const withDays = rows.map((r) => ({
    ...r,
    daysUntil: daysUntil(r.permit.endDate)
  }));
  return {
    vencidos: withDays.filter((r) => r.daysUntil < 0),
    hoy: withDays.filter((r) => r.daysUntil === 0),
    en3dias: withDays.filter((r) => r.daysUntil > 0 && r.daysUntil <= 3),
    en7dias: withDays.filter((r) => r.daysUntil > 3 && r.daysUntil <= 7)
  };
});
export {
  findActivePermitsByDni_createServerFn_handler,
  listExpiringPermits_createServerFn_handler,
  verifyPermitByCode_createServerFn_handler
};
