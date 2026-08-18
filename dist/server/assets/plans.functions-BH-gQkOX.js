import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { eq, and, isNull } from "drizzle-orm";
import { d as db, b as plans, e as prices, c as conventions } from "./db.server-CxddXRZa.js";
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
const listPlans_createServerFn_handler = createServerRpc({
  id: "3f058fd6488fb10d1f1792345e46b4979e2a08e5662ef8a1f616063141d745ec",
  name: "listPlans",
  filename: "src/server/plans.functions.ts"
}, (opts) => listPlans.__executeServer(opts));
const listPlans = createServerFn({
  method: "GET"
}).handler(listPlans_createServerFn_handler, async () => {
  await requireUser();
  return db.select().from(plans).orderBy(plans.sortOrder);
});
const listPricesForPlan_createServerFn_handler = createServerRpc({
  id: "a7ec056dcb39843d6ebb41c2ce45d8ec7b73d4874553a9a6b9612d66ca27bb11",
  name: "listPricesForPlan",
  filename: "src/server/plans.functions.ts"
}, (opts) => listPricesForPlan.__executeServer(opts));
const listPricesForPlan = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(listPricesForPlan_createServerFn_handler, async ({
  data
}) => {
  await requireUser();
  return db.select().from(prices).where(eq(prices.planId, data.planId));
});
const listAllPrices_createServerFn_handler = createServerRpc({
  id: "556efdb8ce868744c9856062d92cdd6e35c264c241236d524483f0c197e16db7",
  name: "listAllPrices",
  filename: "src/server/plans.functions.ts"
}, (opts) => listAllPrices.__executeServer(opts));
const listAllPrices = createServerFn({
  method: "GET"
}).handler(listAllPrices_createServerFn_handler, async () => {
  await requireUser();
  return db.select().from(prices);
});
const PlanInput = z.object({
  id: z.number().optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  durationValue: z.number().int().positive(),
  durationUnit: z.enum(["dia", "temporada"]),
  seasonStart: z.string().optional().nullable(),
  seasonEnd: z.string().optional().nullable(),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0)
});
const upsertPlan_createServerFn_handler = createServerRpc({
  id: "3ecb2068c2381e247671e80072bcad9b146968aed6f93d0f7d01e9712eeb3ad3",
  name: "upsertPlan",
  filename: "src/server/plans.functions.ts"
}, (opts) => upsertPlan.__executeServer(opts));
const upsertPlan = createServerFn({
  method: "POST"
}).inputValidator(PlanInput).handler(upsertPlan_createServerFn_handler, async ({
  data
}) => {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("Solo un administrador puede modificar planes.");
  if (data.id) {
    const [updated] = await db.update(plans).set({
      name: data.name,
      description: data.description || null,
      durationValue: data.durationValue,
      durationUnit: data.durationUnit,
      seasonStart: data.seasonStart || null,
      seasonEnd: data.seasonEnd || null,
      active: data.active,
      sortOrder: data.sortOrder
    }).where(eq(plans.id, data.id)).returning();
    return updated;
  }
  const [created] = await db.insert(plans).values({
    name: data.name,
    description: data.description || null,
    durationValue: data.durationValue,
    durationUnit: data.durationUnit,
    seasonStart: data.seasonStart || null,
    seasonEnd: data.seasonEnd || null,
    active: data.active,
    sortOrder: data.sortOrder
  }).returning();
  return created;
});
const PriceInput = z.object({
  id: z.number().optional(),
  planId: z.number(),
  conditionType: z.enum(["socio", "no_socio", "convenio"]),
  conventionId: z.number().optional().nullable(),
  amount: z.number().int().nonnegative()
});
const upsertPrice_createServerFn_handler = createServerRpc({
  id: "30304651fce0a884b0c4bd10cdd39bfcf420ab952ce117322295b42bd11869a2",
  name: "upsertPrice",
  filename: "src/server/plans.functions.ts"
}, (opts) => upsertPrice.__executeServer(opts));
const upsertPrice = createServerFn({
  method: "POST"
}).inputValidator(PriceInput).handler(upsertPrice_createServerFn_handler, async ({
  data
}) => {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("Solo un administrador puede modificar tarifas.");
  const conventionId = data.conditionType === "convenio" ? data.conventionId ?? null : null;
  const whereClause = and(eq(prices.planId, data.planId), eq(prices.conditionType, data.conditionType), conventionId === null ? isNull(prices.conventionId) : eq(prices.conventionId, conventionId));
  const [existing] = await db.select().from(prices).where(whereClause);
  if (existing) {
    const [updated] = await db.update(prices).set({
      amount: data.amount,
      active: true
    }).where(eq(prices.id, existing.id)).returning();
    return updated;
  }
  const [created] = await db.insert(prices).values({
    planId: data.planId,
    conditionType: data.conditionType,
    conventionId,
    amount: data.amount
  }).returning();
  return created;
});
const ConventionInput = z.object({
  id: z.number().optional(),
  name: z.string().min(1),
  type: z.enum(["empresa", "sindicato", "institucion", "otro"]),
  description: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  status: z.enum(["activo", "inactivo"]).default("activo"),
  maxBeneficiaries: z.number().int().positive().optional().nullable(),
  benefit: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});
const listConventionsAdmin_createServerFn_handler = createServerRpc({
  id: "52235c3e6c4b0b3ed077dcee92fc5ca5ad794b53a5c27b9b4ad871c89c24da29",
  name: "listConventionsAdmin",
  filename: "src/server/plans.functions.ts"
}, (opts) => listConventionsAdmin.__executeServer(opts));
const listConventionsAdmin = createServerFn({
  method: "GET"
}).handler(listConventionsAdmin_createServerFn_handler, async () => {
  await requireUser();
  return db.select().from(conventions).orderBy(conventions.name);
});
const upsertConvention_createServerFn_handler = createServerRpc({
  id: "e5537b531fa6e6d34354917c734394a48b8d5886b6e1e6a8eab857e27d41d443",
  name: "upsertConvention",
  filename: "src/server/plans.functions.ts"
}, (opts) => upsertConvention.__executeServer(opts));
const upsertConvention = createServerFn({
  method: "POST"
}).inputValidator(ConventionInput).handler(upsertConvention_createServerFn_handler, async ({
  data
}) => {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("Solo un administrador puede modificar convenios.");
  if (data.id) {
    const [updated] = await db.update(conventions).set({
      name: data.name,
      type: data.type,
      description: data.description || null,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      status: data.status,
      maxBeneficiaries: data.maxBeneficiaries || null,
      benefit: data.benefit || null,
      notes: data.notes || null
    }).where(eq(conventions.id, data.id)).returning();
    return updated;
  }
  const [created] = await db.insert(conventions).values({
    name: data.name,
    type: data.type,
    description: data.description || null,
    startDate: data.startDate || null,
    endDate: data.endDate || null,
    status: data.status,
    maxBeneficiaries: data.maxBeneficiaries || null,
    benefit: data.benefit || null,
    notes: data.notes || null
  }).returning();
  return created;
});
export {
  listAllPrices_createServerFn_handler,
  listConventionsAdmin_createServerFn_handler,
  listPlans_createServerFn_handler,
  listPricesForPlan_createServerFn_handler,
  upsertConvention_createServerFn_handler,
  upsertPlan_createServerFn_handler,
  upsertPrice_createServerFn_handler
};
