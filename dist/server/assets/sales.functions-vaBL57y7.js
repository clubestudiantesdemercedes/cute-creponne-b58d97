import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { and, eq, isNull, inArray, gte, lte, desc } from "drizzle-orm";
import { d as db, e as prices, b as plans, s as sales, j as saleItems, k as payments, h as permits, g as auditLogs, p as people } from "./db.server-CxddXRZa.js";
import { r as requireUser } from "./auth.server-D_Q0GJcF.js";
import { g as generateSaleNumber, c as computePermitDates, r as randomCode } from "./permit-PpATxjxp.js";
import { t as todayISO } from "./format-COLuSK5l.js";
import { c as createServerFn } from "../server.js";
import "drizzle-orm/netlify-db";
import "drizzle-orm/pg-core";
import "@tanstack/react-router";
import "node:async_hooks";
import "node:stream";
import "react";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
async function resolvePrice(planId, conditionType, conventionId) {
  if (conditionType === "convenio" && conventionId) {
    const [specific] = await db.select().from(prices).where(
      and(
        eq(prices.planId, planId),
        eq(prices.conditionType, "convenio"),
        eq(prices.conventionId, conventionId)
      )
    );
    if (specific) return specific.amount;
  }
  const [generic] = await db.select().from(prices).where(
    and(
      eq(prices.planId, planId),
      eq(prices.conditionType, conditionType),
      isNull(prices.conventionId)
    )
  );
  return generic ? generic.amount : 0;
}
const SaleItemInput = z.object({
  personId: z.number(),
  conditionType: z.enum(["socio", "no_socio", "convenio"]),
  conventionId: z.number().optional().nullable(),
  planId: z.number()
});
const CreateSaleInput = z.object({
  items: z.array(SaleItemInput).min(1),
  paymentMethod: z.enum(["efectivo", "transferencia", "mercadopago", "tarjeta", "otro"]),
  notes: z.string().optional().nullable()
});
const createSale_createServerFn_handler = createServerRpc({
  id: "7777757842bcc141a292af6d409436d45f36b597bf4b52c694007bf4ea70b8c9",
  name: "createSale",
  filename: "src/server/sales.functions.ts"
}, (opts) => createSale.__executeServer(opts));
const createSale = createServerFn({
  method: "POST"
}).inputValidator(CreateSaleInput).handler(createSale_createServerFn_handler, async ({
  data
}) => {
  const user = await requireUser();
  if (user.role !== "admin" && user.role !== "encargado") {
    throw new Error("No tenés permisos para registrar ventas.");
  }
  const planIds = [...new Set(data.items.map((i) => i.planId))];
  const planRows = await db.select().from(plans).where(inArray(plans.id, planIds));
  const planById = new Map(planRows.map((p) => [p.id, p]));
  let total = 0;
  const resolvedItems = [];
  for (const item of data.items) {
    const plan = planById.get(item.planId);
    if (!plan) {
      throw new Error("Plan inválido.");
    }
    const unitPrice = await resolvePrice(item.planId, item.conditionType, item.conventionId ?? null);
    total += unitPrice;
    resolvedItems.push({
      personId: item.personId,
      conditionType: item.conditionType,
      conventionId: item.conventionId ?? null,
      planId: item.planId,
      unitPrice
    });
  }
  const [sale] = await db.insert(sales).values({
    saleNumber: generateSaleNumber(),
    createdByUserId: user.userId,
    totalAmount: total,
    paymentMethod: data.paymentMethod,
    notes: data.notes || null
  }).returning();
  const insertedItems = await db.insert(saleItems).values(resolvedItems.map((item) => ({
    ...item,
    saleId: sale.id
  }))).returning();
  await db.insert(payments).values({
    saleId: sale.id,
    amount: total,
    method: data.paymentMethod,
    createdByUserId: user.userId
  });
  const purchaseDate = todayISO();
  const permitRows = [];
  for (const item of insertedItems) {
    const plan = planById.get(item.planId);
    const {
      startDate,
      endDate
    } = computePermitDates(plan, purchaseDate);
    permitRows.push({
      code: item.conditionType === "socio" ? randomCode("SOC") : randomCode("NOC"),
      personId: item.personId,
      saleItemId: item.id,
      planId: item.planId,
      conditionType: item.conditionType,
      conventionId: item.conventionId,
      startDate,
      endDate
    });
  }
  const insertedPermits = await db.insert(permits).values(permitRows).returning();
  await db.insert(auditLogs).values({
    userId: user.userId,
    action: "crear_venta",
    entityType: "sale",
    entityId: String(sale.id),
    details: {
      total,
      itemCount: insertedItems.length,
      paymentMethod: data.paymentMethod
    }
  });
  const personIds = [...new Set(insertedItems.map((item) => item.personId))];
  const peopleRows = await db.select().from(people).where(inArray(people.id, personIds));
  const personById = new Map(peopleRows.map((person) => [person.id, person]));
  return {
    sale,
    items: insertedItems.map((item) => ({
      ...item,
      person: personById.get(item.personId),
      plan: planById.get(item.planId)
    })),
    permits: insertedPermits,
    entries: []
  };
});
const listSales_createServerFn_handler = createServerRpc({
  id: "c71f9d6f57719978cc577c5f4f0a8bff999181d9dffca3f2e1bb9162feccde02",
  name: "listSales",
  filename: "src/server/sales.functions.ts"
}, (opts) => listSales.__executeServer(opts));
const listSales = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(listSales_createServerFn_handler, async ({
  data
}) => {
  await requireUser();
  const conditions = [];
  if (data.dateFrom) {
    conditions.push(gte(sales.createdAt, /* @__PURE__ */ new Date(data.dateFrom + "T00:00:00")));
  }
  if (data.dateTo) {
    conditions.push(lte(sales.createdAt, /* @__PURE__ */ new Date(data.dateTo + "T23:59:59")));
  }
  const rows = await db.select().from(sales).where(conditions.length ? and(...conditions) : void 0).orderBy(desc(sales.createdAt)).limit(200);
  return rows;
});
const getSaleDetail_createServerFn_handler = createServerRpc({
  id: "506132b9e681bad1dc2a076d6bde42fe09bacc11bec19005f9973ff26910eb79",
  name: "getSaleDetail",
  filename: "src/server/sales.functions.ts"
}, (opts) => getSaleDetail.__executeServer(opts));
const getSaleDetail = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getSaleDetail_createServerFn_handler, async ({
  data
}) => {
  await requireUser();
  const [sale] = await db.select().from(sales).where(eq(sales.id, data.saleId));
  if (!sale) {
    return null;
  }
  const items = await db.select({
    item: saleItems,
    person: people,
    plan: plans,
    permit: permits
  }).from(saleItems).innerJoin(people, eq(saleItems.personId, people.id)).innerJoin(plans, eq(saleItems.planId, plans.id)).leftJoin(permits, eq(permits.saleItemId, saleItems.id)).where(eq(saleItems.saleId, sale.id));
  return {
    sale,
    items
  };
});
const voidSale_createServerFn_handler = createServerRpc({
  id: "3e56867d75cc0dd73d01ecf83ad653b8c8ee45faf5bea818207b38b5fd6cd42b",
  name: "voidSale",
  filename: "src/server/sales.functions.ts"
}, (opts) => voidSale.__executeServer(opts));
const voidSale = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(voidSale_createServerFn_handler, async ({
  data
}) => {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new Error("Solo un administrador puede anular ventas.");
  }
  const [sale] = await db.select().from(sales).where(eq(sales.id, data.saleId));
  if (!sale) {
    throw new Error("La venta no existe.");
  }
  if (sale.status === "anulada") {
    return {
      ok: true
    };
  }
  await db.update(sales).set({
    status: "anulada"
  }).where(eq(sales.id, data.saleId));
  const itemRows = await db.select({
    id: saleItems.id
  }).from(saleItems).where(eq(saleItems.saleId, data.saleId));
  const itemIds = itemRows.map((row) => row.id);
  if (itemIds.length) {
    await db.update(permits).set({
      status: "anulado"
    }).where(inArray(permits.saleItemId, itemIds));
  }
  await db.insert(auditLogs).values({
    userId: user.userId,
    action: "anular_venta",
    entityType: "sale",
    entityId: String(data.saleId)
  });
  return {
    ok: true
  };
});
export {
  createSale_createServerFn_handler,
  getSaleDetail_createServerFn_handler,
  listSales_createServerFn_handler,
  voidSale_createServerFn_handler
};
