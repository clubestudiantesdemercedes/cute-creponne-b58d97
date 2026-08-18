import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { eq, gte, lte, and, desc } from "drizzle-orm";
import { z } from "zod";
import { d as db, p as people, i as entries, g as auditLogs, b as plans, h as permits } from "./db.server-CxddXRZa.js";
import { r as requireUser } from "./auth.server-D_Q0GJcF.js";
import { a as computeLiveStatus } from "./permits.functions-DTMs4qjC.js";
import { c as createServerFn } from "../server.js";
import "drizzle-orm/netlify-db";
import "drizzle-orm/pg-core";
import "@tanstack/react-router";
import "./format-COLuSK5l.js";
import "node:async_hooks";
import "node:stream";
import "react";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
async function lastEntryFor(personId, entryType) {
  const [row] = await db.select().from(entries).where(and(eq(entries.personId, personId), eq(entries.entryType, entryType))).orderBy(desc(entries.occurredAt)).limit(1);
  return row ?? null;
}
async function findPermitByCode(code) {
  const [row] = await db.select({
    permit: permits,
    person: people,
    plan: plans
  }).from(permits).innerJoin(people, eq(permits.personId, people.id)).innerJoin(plans, eq(permits.planId, plans.id)).where(eq(permits.code, code.trim()));
  return row ?? null;
}
async function findActivePermitForPerson(personId) {
  const rows = await db.select({
    permit: permits,
    person: people,
    plan: plans
  }).from(permits).innerJoin(people, eq(permits.personId, people.id)).innerJoin(plans, eq(permits.planId, plans.id)).where(eq(permits.personId, personId)).orderBy(desc(permits.createdAt));
  for (const row of rows) {
    const liveStatus = computeLiveStatus(row.permit);
    if (liveStatus === "activo") {
      return row;
    }
  }
  return null;
}
const RegisterEntryInput = z.object({
  // QR de un permiso
  code: z.string().optional(),
  // Búsqueda manual por persona
  personId: z.number().optional(),
  method: z.enum(["qr", "manual"]),
  // Campo de deportes o pileta
  entryType: z.enum(["campo_deportes", "pileta"]),
  // Permite registrar aunque exista un ingreso reciente
  force: z.boolean().optional().default(false)
});
const registerEntry_createServerFn_handler = createServerRpc({
  id: "97e85f5b193c4f4dd242050f6ff29ed9f0c45fac4be0a9146ff6c100f52967d8",
  name: "registerEntry",
  filename: "src/server/entries.functions.ts"
}, (opts) => registerEntry.__executeServer(opts));
const registerEntry = createServerFn({
  method: "POST"
}).inputValidator(RegisterEntryInput).handler(registerEntry_createServerFn_handler, async ({
  data
}) => {
  const user = await requireUser();
  if (!["admin", "encargado", "control_ingreso"].includes(user.role)) {
    throw new Error("No tenés permisos para registrar ingresos.");
  }
  if (!data.code && !data.personId) {
    throw new Error("Tenés que indicar un código QR o una persona.");
  }
  if (data.entryType === "campo_deportes") {
    let person;
    if (data.personId) {
      const [row] = await db.select().from(people).where(eq(people.id, data.personId));
      person = row;
    } else if (data.code) {
      const permitRow2 = await findPermitByCode(data.code);
      if (!permitRow2) {
        return {
          authorized: false,
          reason: "no_person"
        };
      }
      person = permitRow2.person;
    }
    if (!person) {
      return {
        authorized: false,
        reason: "no_person"
      };
    }
    if (person.status !== "activo") {
      return {
        authorized: false,
        reason: "person_inactive",
        person
      };
    }
    const last2 = await lastEntryFor(person.id, "campo_deportes");
    if (last2 && !data.force) {
      const minutesAgo = (Date.now() - new Date(last2.occurredAt).getTime()) / 6e4;
      if (minutesAgo < 30) {
        return {
          authorized: false,
          reason: "duplicate",
          minutesAgo: Math.round(minutesAgo),
          person,
          entryType: "campo_deportes"
        };
      }
    }
    const [entry2] = await db.insert(entries).values({
      personId: person.id,
      permitId: null,
      checkedInByUserId: user.userId,
      method: data.method,
      entryType: "campo_deportes"
    }).returning();
    await db.insert(auditLogs).values({
      userId: user.userId,
      action: "registrar_ingreso",
      entityType: "entry",
      entityId: String(entry2.id),
      details: {
        personId: person.id,
        method: data.method,
        entryType: "campo_deportes"
      }
    });
    return {
      authorized: true,
      person,
      permit: null,
      plan: null,
      entry: entry2
    };
  }
  let permitRow;
  if (data.code) {
    permitRow = await findPermitByCode(data.code);
  }
  if (!permitRow && data.personId) {
    permitRow = await findActivePermitForPerson(data.personId);
  }
  if (!permitRow) {
    return {
      authorized: false,
      reason: "no_permit"
    };
  }
  if (permitRow.person.status !== "activo") {
    return {
      authorized: false,
      reason: "person_inactive",
      person: permitRow.person,
      permit: permitRow.permit,
      plan: permitRow.plan
    };
  }
  const liveStatus = computeLiveStatus(permitRow.permit);
  if (liveStatus !== "activo") {
    return {
      authorized: false,
      reason: liveStatus === "vencido" ? "expired" : liveStatus === "pendiente" ? "not_valid_yet" : "cancelled",
      person: permitRow.person,
      permit: permitRow.permit,
      plan: permitRow.plan
    };
  }
  const last = await lastEntryFor(permitRow.person.id, "pileta");
  if (last && !data.force) {
    const minutesAgo = (Date.now() - new Date(last.occurredAt).getTime()) / 6e4;
    if (minutesAgo < 30) {
      return {
        authorized: false,
        reason: "duplicate",
        minutesAgo: Math.round(minutesAgo),
        person: permitRow.person,
        permit: permitRow.permit,
        plan: permitRow.plan
      };
    }
  }
  const [entry] = await db.insert(entries).values({
    personId: permitRow.person.id,
    permitId: permitRow.permit.id,
    checkedInByUserId: user.userId,
    method: data.method,
    entryType: "pileta"
  }).returning();
  await db.insert(auditLogs).values({
    userId: user.userId,
    action: "registrar_ingreso",
    entityType: "entry",
    entityId: String(entry.id),
    details: {
      personId: permitRow.person.id,
      permitId: permitRow.permit.id,
      method: data.method,
      entryType: "pileta"
    }
  });
  return {
    authorized: true,
    person: permitRow.person,
    permit: permitRow.permit,
    plan: permitRow.plan,
    entry
  };
});
const listEntries_createServerFn_handler = createServerRpc({
  id: "4fd08a187010a008aaeba37d87c63cadfaa3a44fd95b10e80655765119cf067b",
  name: "listEntries",
  filename: "src/server/entries.functions.ts"
}, (opts) => listEntries.__executeServer(opts));
const listEntries = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(listEntries_createServerFn_handler, async ({
  data
}) => {
  await requireUser();
  const conditions = [];
  if (data.dateFrom) {
    conditions.push(gte(entries.occurredAt, /* @__PURE__ */ new Date(data.dateFrom + "T00:00:00")));
  }
  if (data.dateTo) {
    conditions.push(lte(entries.occurredAt, /* @__PURE__ */ new Date(data.dateTo + "T23:59:59")));
  }
  const rows = await db.select({
    entry: entries,
    person: people,
    permit: permits,
    plan: plans
  }).from(entries).innerJoin(people, eq(entries.personId, people.id)).leftJoin(permits, eq(entries.permitId, permits.id)).leftJoin(plans, eq(permits.planId, plans.id)).where(conditions.length ? and(...conditions) : void 0).orderBy(desc(entries.occurredAt)).limit(300);
  return rows;
});
export {
  listEntries_createServerFn_handler,
  registerEntry_createServerFn_handler
};
