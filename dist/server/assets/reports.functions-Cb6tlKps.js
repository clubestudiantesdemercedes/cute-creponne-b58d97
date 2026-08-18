import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { eq, count, sum } from "drizzle-orm";
import { d as db, p as people, m as members, s as sales, k as payments, i as entries, b as plans, h as permits, c as conventions, a as conventionBeneficiaries, j as saleItems } from "./db.server-CxddXRZa.js";
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
function toCsv(headers, rows) {
  const esc = (v) => {
    const s = v === null || v === void 0 ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
}
const exportPeopleCsv_createServerFn_handler = createServerRpc({
  id: "80e46f8157b1dc4d553a171bf41a33d921e679be46adf2c6d1547bb5b50cdf2a",
  name: "exportPeopleCsv",
  filename: "src/server/reports.functions.ts"
}, (opts) => exportPeopleCsv.__executeServer(opts));
const exportPeopleCsv = createServerFn({
  method: "GET"
}).handler(exportPeopleCsv_createServerFn_handler, async () => {
  await requireUser();
  const rows = await db.select().from(people);
  return toCsv(["id", "dni", "nombre", "apellido", "telefono", "email", "domicilio", "estado"], rows.map((p) => [p.id, p.dni, p.firstName, p.lastName, p.phone, p.email, p.address, p.status]));
});
const exportMembersCsv_createServerFn_handler = createServerRpc({
  id: "9714bbdad7d45bce9d9479fe9eaeb3dd8dbed3b79a11e54a29bb59fb8d205efb",
  name: "exportMembersCsv",
  filename: "src/server/reports.functions.ts"
}, (opts) => exportMembersCsv.__executeServer(opts));
const exportMembersCsv = createServerFn({
  method: "GET"
}).handler(exportMembersCsv_createServerFn_handler, async () => {
  await requireUser();
  const rows = await db.select({
    member: members,
    person: people
  }).from(members).innerJoin(people, eq(members.personId, people.id));
  return toCsv(["numero_socio", "dni", "nombre", "apellido", "estado_socio"], rows.map((r) => [r.member.memberNumber, r.person.dni, r.person.firstName, r.person.lastName, r.member.memberStatus]));
});
const exportSalesCsv_createServerFn_handler = createServerRpc({
  id: "c0393032ea96aedaee93263021edd4cf5b6c31061f8e1525539e80d6e96d9da0",
  name: "exportSalesCsv",
  filename: "src/server/reports.functions.ts"
}, (opts) => exportSalesCsv.__executeServer(opts));
const exportSalesCsv = createServerFn({
  method: "GET"
}).handler(exportSalesCsv_createServerFn_handler, async () => {
  await requireUser();
  const rows = await db.select().from(sales);
  return toCsv(["numero_venta", "fecha", "total", "metodo_pago", "estado"], rows.map((s) => [s.saleNumber, s.createdAt.toISOString(), s.totalAmount, s.paymentMethod, s.status]));
});
const exportPaymentsCsv_createServerFn_handler = createServerRpc({
  id: "93d0ee4ce70fa19ad399854751f592ff874f1b90d45529939632a80b9525e396",
  name: "exportPaymentsCsv",
  filename: "src/server/reports.functions.ts"
}, (opts) => exportPaymentsCsv.__executeServer(opts));
const exportPaymentsCsv = createServerFn({
  method: "GET"
}).handler(exportPaymentsCsv_createServerFn_handler, async () => {
  await requireUser();
  const rows = await db.select().from(payments);
  return toCsv(["id", "venta_id", "importe", "metodo", "estado", "fecha"], rows.map((p) => [p.id, p.saleId, p.amount, p.method, p.status, p.createdAt.toISOString()]));
});
const exportEntriesCsv_createServerFn_handler = createServerRpc({
  id: "86aa94fd029062e96eb745f366363a4c0fbdb7a54148a826caf86a7d776b6895",
  name: "exportEntriesCsv",
  filename: "src/server/reports.functions.ts"
}, (opts) => exportEntriesCsv.__executeServer(opts));
const exportEntriesCsv = createServerFn({
  method: "GET"
}).handler(exportEntriesCsv_createServerFn_handler, async () => {
  await requireUser();
  const rows = await db.select({
    entry: entries,
    person: people
  }).from(entries).innerJoin(people, eq(entries.personId, people.id));
  return toCsv(["fecha_hora", "dni", "nombre", "apellido", "metodo"], rows.map((r) => [r.entry.occurredAt.toISOString(), r.person.dni, r.person.firstName, r.person.lastName, r.entry.method]));
});
const exportPermitsCsv_createServerFn_handler = createServerRpc({
  id: "09d266134e26762c0f104998f9376ce87de96e6a512c7c6bc4ef13cc88a36a0a",
  name: "exportPermitsCsv",
  filename: "src/server/reports.functions.ts"
}, (opts) => exportPermitsCsv.__executeServer(opts));
const exportPermitsCsv = createServerFn({
  method: "GET"
}).handler(exportPermitsCsv_createServerFn_handler, async () => {
  await requireUser();
  const rows = await db.select({
    permit: permits,
    person: people,
    plan: plans
  }).from(permits).innerJoin(people, eq(permits.personId, people.id)).innerJoin(plans, eq(permits.planId, plans.id));
  return toCsv(["codigo", "dni", "nombre", "apellido", "plan", "condicion", "inicio", "vencimiento", "estado"], rows.map((r) => [r.permit.code, r.person.dni, r.person.firstName, r.person.lastName, r.plan.name, r.permit.conditionType, r.permit.startDate, r.permit.endDate, r.permit.status]));
});
const exportConventionsCsv_createServerFn_handler = createServerRpc({
  id: "9de22fbafe3ead1ea024a02a3f30bb317a795d2babc0109b3d700de16da8544d",
  name: "exportConventionsCsv",
  filename: "src/server/reports.functions.ts"
}, (opts) => exportConventionsCsv.__executeServer(opts));
const exportConventionsCsv = createServerFn({
  method: "GET"
}).handler(exportConventionsCsv_createServerFn_handler, async () => {
  await requireUser();
  const rows = await db.select().from(conventions);
  return toCsv(["nombre", "tipo", "estado", "inicio", "fin", "beneficio"], rows.map((c) => [c.name, c.type, c.status, c.startDate, c.endDate, c.benefit]));
});
const exportBeneficiariesCsv_createServerFn_handler = createServerRpc({
  id: "3bf26307f73b029d5d5051b60b9244005c214d64085956209f4a5cabe52e9b4a",
  name: "exportBeneficiariesCsv",
  filename: "src/server/reports.functions.ts"
}, (opts) => exportBeneficiariesCsv.__executeServer(opts));
const exportBeneficiariesCsv = createServerFn({
  method: "GET"
}).handler(exportBeneficiariesCsv_createServerFn_handler, async () => {
  await requireUser();
  const rows = await db.select({
    beneficiary: conventionBeneficiaries,
    person: people,
    convention: conventions
  }).from(conventionBeneficiaries).innerJoin(people, eq(conventionBeneficiaries.personId, people.id)).innerJoin(conventions, eq(conventionBeneficiaries.conventionId, conventions.id));
  return toCsv(["convenio", "dni", "nombre", "apellido", "codigo_empleado", "estado"], rows.map((r) => [r.convention.name, r.person.dni, r.person.firstName, r.person.lastName, r.beneficiary.employeeCode, r.beneficiary.status]));
});
const getConventionsReport_createServerFn_handler = createServerRpc({
  id: "2b4e8b30d5b3cb18237b6347dbb703c2e15cbe7e1bb1e05e8c1aad87701b6514",
  name: "getConventionsReport",
  filename: "src/server/reports.functions.ts"
}, (opts) => getConventionsReport.__executeServer(opts));
const getConventionsReport = createServerFn({
  method: "GET"
}).handler(getConventionsReport_createServerFn_handler, async () => {
  await requireUser();
  const conventionRows = await db.select().from(conventions);
  const results = [];
  for (const c of conventionRows) {
    const [beneficiaryCount] = await db.select({
      n: count()
    }).from(conventionBeneficiaries).where(eq(conventionBeneficiaries.conventionId, c.id));
    const [activePermits] = await db.select({
      n: count()
    }).from(permits).where(eq(permits.conventionId, c.id));
    const entryRows = await db.select({
      entry: entries
    }).from(entries).innerJoin(permits, eq(entries.permitId, permits.id)).where(eq(permits.conventionId, c.id));
    const [recaudacionRow] = await db.select({
      total: sum(saleItems.unitPrice)
    }).from(saleItems).where(eq(saleItems.conventionId, c.id));
    results.push({
      convention: c,
      beneficiaryCount: beneficiaryCount?.n ?? 0,
      activePermits: activePermits?.n ?? 0,
      entryCount: entryRows.length,
      recaudacion: Number(recaudacionRow?.total ?? 0)
    });
  }
  return results;
});
export {
  exportBeneficiariesCsv_createServerFn_handler,
  exportConventionsCsv_createServerFn_handler,
  exportEntriesCsv_createServerFn_handler,
  exportMembersCsv_createServerFn_handler,
  exportPaymentsCsv_createServerFn_handler,
  exportPeopleCsv_createServerFn_handler,
  exportPermitsCsv_createServerFn_handler,
  exportSalesCsv_createServerFn_handler,
  getConventionsReport_createServerFn_handler
};
