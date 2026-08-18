import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { and, gte, lte, ne, eq } from "drizzle-orm";
import { d as db, s as sales, f as cashClosures, g as auditLogs } from "./db.server-CxddXRZa.js";
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
const PAYMENT_METHODS = ["efectivo", "transferencia", "mercadopago", "tarjeta", "otro"];
const getCashSummary_createServerFn_handler = createServerRpc({
  id: "d166681f657ff5dbf1fdab2c29f1531edf9c4aa96144f2bb13db086f0bdf6b9b",
  name: "getCashSummary",
  filename: "src/server/cash.functions.ts"
}, (opts) => getCashSummary.__executeServer(opts));
const getCashSummary = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getCashSummary_createServerFn_handler, async ({
  data
}) => {
  await requireUser();
  const start = /* @__PURE__ */ new Date(data.date + "T00:00:00");
  const end = /* @__PURE__ */ new Date(data.date + "T23:59:59");
  const rows = await db.select().from(sales).where(and(gte(sales.createdAt, start), lte(sales.createdAt, end), ne(sales.status, "anulada")));
  const totals = Object.fromEntries(PAYMENT_METHODS.map((m) => [m, 0]));
  for (const s of rows) {
    totals[s.paymentMethod] = (totals[s.paymentMethod] ?? 0) + s.totalAmount;
  }
  const totalAmount = rows.reduce((acc, s) => acc + s.totalAmount, 0);
  const [closure] = await db.select().from(cashClosures).where(eq(cashClosures.closureDate, data.date));
  return {
    date: data.date,
    totals,
    totalAmount,
    salesCount: rows.length,
    closure: closure ?? null
  };
});
const closeCashRegister_createServerFn_handler = createServerRpc({
  id: "1fc00d26b45020a756a0d3e19b6104f745db755d430a77df1eb01e152e6460ad",
  name: "closeCashRegister",
  filename: "src/server/cash.functions.ts"
}, (opts) => closeCashRegister.__executeServer(opts));
const closeCashRegister = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(closeCashRegister_createServerFn_handler, async ({
  data
}) => {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("Solo un administrador puede cerrar la caja.");
  const [existing] = await db.select().from(cashClosures).where(eq(cashClosures.closureDate, data.date));
  if (existing && existing.status === "cerrada") {
    throw new Error("Esta caja ya fue cerrada.");
  }
  const start = /* @__PURE__ */ new Date(data.date + "T00:00:00");
  const end = /* @__PURE__ */ new Date(data.date + "T23:59:59");
  const rows = await db.select().from(sales).where(and(gte(sales.createdAt, start), lte(sales.createdAt, end), ne(sales.status, "anulada")));
  const totals = Object.fromEntries(PAYMENT_METHODS.map((m) => [m, 0]));
  for (const s of rows) {
    totals[s.paymentMethod] = (totals[s.paymentMethod] ?? 0) + s.totalAmount;
  }
  const totalAmount = rows.reduce((acc, s) => acc + s.totalAmount, 0);
  let closure;
  if (existing) {
    [closure] = await db.update(cashClosures).set({
      totals,
      salesCount: rows.length,
      totalAmount,
      status: "cerrada",
      closedByUserId: user.userId,
      closedAt: /* @__PURE__ */ new Date()
    }).where(eq(cashClosures.id, existing.id)).returning();
  } else {
    [closure] = await db.insert(cashClosures).values({
      closureDate: data.date,
      totals,
      salesCount: rows.length,
      totalAmount,
      status: "cerrada",
      closedByUserId: user.userId,
      closedAt: /* @__PURE__ */ new Date()
    }).returning();
  }
  await db.insert(auditLogs).values({
    userId: user.userId,
    action: "cerrar_caja",
    entityType: "cash_closure",
    entityId: data.date,
    details: {
      totalAmount,
      salesCount: rows.length
    }
  });
  return closure;
});
export {
  closeCashRegister_createServerFn_handler,
  getCashSummary_createServerFn_handler
};
