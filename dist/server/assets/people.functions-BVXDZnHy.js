import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { eq, or, ilike, isNull, and } from "drizzle-orm";
import { d as db, p as people, m as members, c as conventions, a as conventionBeneficiaries } from "./db.server-CxddXRZa.js";
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
const PersonInput = z.object({
  dni: z.string().min(6).max(15),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  birthDate: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});
function normalizeDni(dni) {
  return dni.replace(/\D/g, "");
}
const findPersonByDni_createServerFn_handler = createServerRpc({
  id: "e3401065577f221a4d9df3058286efa360dbad9ac1c22a4364de86b80fad4672",
  name: "findPersonByDni",
  filename: "src/server/people.functions.ts"
}, (opts) => findPersonByDni.__executeServer(opts));
const findPersonByDni = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(findPersonByDni_createServerFn_handler, async ({
  data
}) => {
  await requireUser();
  const dni = normalizeDni(data.dni);
  const [person] = await db.select().from(people).where(eq(people.dni, dni));
  if (!person) return null;
  const [member] = await db.select().from(members).where(eq(members.personId, person.id));
  return {
    person,
    member: member ?? null
  };
});
const searchMembers_createServerFn_handler = createServerRpc({
  id: "469d488a1cb0d21fd23043721806c9894b0e498eec1b1059824f93bacf19a7b8",
  name: "searchMembers",
  filename: "src/server/people.functions.ts"
}, (opts) => searchMembers.__executeServer(opts));
const searchMembers = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(searchMembers_createServerFn_handler, async ({
  data
}) => {
  await requireUser();
  const q = data.query.trim();
  if (!q) return [];
  const dniLike = normalizeDni(q);
  const rows = await db.select({
    member: members,
    person: people
  }).from(members).innerJoin(people, eq(members.personId, people.id)).where(or(dniLike ? eq(people.dni, dniLike) : void 0, ilike(members.memberNumber, `%${q}%`), ilike(people.firstName, `%${q}%`), ilike(people.lastName, `%${q}%`))).limit(20);
  return rows;
});
const searchNonMembers_createServerFn_handler = createServerRpc({
  id: "3b68610470e7505b53b52748298f9503ca3a97d2801f948649e611a4314d62b0",
  name: "searchNonMembers",
  filename: "src/server/people.functions.ts"
}, (opts) => searchNonMembers.__executeServer(opts));
const searchNonMembers = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(searchNonMembers_createServerFn_handler, async ({
  data
}) => {
  await requireUser();
  const q = data.query.trim();
  if (!q) {
    return db.select({
      person: people
    }).from(people).leftJoin(members, eq(members.personId, people.id)).where(isNull(members.id)).orderBy(people.lastName, people.firstName).limit(500);
  }
  const dni = normalizeDni(q);
  return db.select({
    person: people
  }).from(people).leftJoin(members, eq(members.personId, people.id)).where(and(isNull(members.id), or(
    // DNI
    dni ? eq(people.dni, dni) : void 0,
    // Nombre
    ilike(people.firstName, `%${q}%`),
    // Apellido
    ilike(people.lastName, `%${q}%`)
  ))).orderBy(people.lastName, people.firstName).limit(100);
});
const createOrUpdatePerson_createServerFn_handler = createServerRpc({
  id: "0bf9d8c52d3decd748a886e18c142fd9da837c78e87c661f6fb1636ca2a11332",
  name: "createOrUpdatePerson",
  filename: "src/server/people.functions.ts"
}, (opts) => createOrUpdatePerson.__executeServer(opts));
const createOrUpdatePerson = createServerFn({
  method: "POST"
}).inputValidator(PersonInput.extend({
  id: z.number().optional()
})).handler(createOrUpdatePerson_createServerFn_handler, async ({
  data
}) => {
  await requireUser();
  const dni = normalizeDni(data.dni);
  const [existing] = await db.select().from(people).where(eq(people.dni, dni));
  if (existing && existing.id !== data.id) {
    return {
      person: existing,
      created: false,
      duplicate: true
    };
  }
  if (data.id) {
    const [updated] = await db.update(people).set({
      dni,
      firstName: data.firstName,
      lastName: data.lastName,
      birthDate: data.birthDate || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      notes: data.notes || null,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(people.id, data.id)).returning();
    return {
      person: updated,
      created: false,
      duplicate: false
    };
  }
  const [created] = await db.insert(people).values({
    dni,
    firstName: data.firstName,
    lastName: data.lastName,
    birthDate: data.birthDate || null,
    phone: data.phone || null,
    email: data.email || null,
    address: data.address || null,
    notes: data.notes || null
  }).returning();
  return {
    person: created,
    created: true,
    duplicate: false
  };
});
const setPersonStatus_createServerFn_handler = createServerRpc({
  id: "631d8b2be76af8c749bf6cb5aae5e5b5991029cb6df2f9a67930c190055de6e2",
  name: "setPersonStatus",
  filename: "src/server/people.functions.ts"
}, (opts) => setPersonStatus.__executeServer(opts));
const setPersonStatus = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(setPersonStatus_createServerFn_handler, async ({
  data
}) => {
  const user = await requireUser();
  if (user.role !== "admin" && user.role !== "encargado") {
    throw new Error("No tenés permisos para modificar el estado de la persona.");
  }
  await db.update(people).set({
    status: data.status,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(people.id, data.personId));
  return {
    ok: true
  };
});
const getPersonHistory_createServerFn_handler = createServerRpc({
  id: "1ac4d29c3c7704210501cbf1af5f4d00f46731586ee8520866267b53ab1525aa",
  name: "getPersonHistory",
  filename: "src/server/people.functions.ts"
}, (opts) => getPersonHistory.__executeServer(opts));
const getPersonHistory = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getPersonHistory_createServerFn_handler, async ({
  data
}) => {
  await requireUser();
  const [person] = await db.select().from(people).where(eq(people.id, data.personId));
  return person ?? null;
});
const listActiveConventions_createServerFn_handler = createServerRpc({
  id: "134bafae55e5f28610a459bdbca7af98f5f53b9df86ebd3e349a1d607a4052a7",
  name: "listActiveConventions",
  filename: "src/server/people.functions.ts"
}, (opts) => listActiveConventions.__executeServer(opts));
const listActiveConventions = createServerFn({
  method: "GET"
}).handler(listActiveConventions_createServerFn_handler, async () => {
  await requireUser();
  return db.select().from(conventions).where(eq(conventions.status, "activo")).orderBy(conventions.name);
});
const findConventionBeneficiary_createServerFn_handler = createServerRpc({
  id: "9e98a2166d3eb190cb0667089d2a418099a48ebc5c06df848573ead4615ab1e4",
  name: "findConventionBeneficiary",
  filename: "src/server/people.functions.ts"
}, (opts) => findConventionBeneficiary.__executeServer(opts));
const findConventionBeneficiary = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(findConventionBeneficiary_createServerFn_handler, async ({
  data
}) => {
  await requireUser();
  const dni = normalizeDni(data.dni);
  const [person] = await db.select().from(people).where(eq(people.dni, dni));
  if (!person) return null;
  const [beneficiary] = await db.select().from(conventionBeneficiaries).where(and(eq(conventionBeneficiaries.conventionId, data.conventionId), eq(conventionBeneficiaries.personId, person.id)));
  return {
    person,
    beneficiary: beneficiary ?? null
  };
});
const createConventionBeneficiary_createServerFn_handler = createServerRpc({
  id: "e37277eff47eaa8496cdbd06750d8cc68547d6b95181a8debab61883c56965b1",
  name: "createConventionBeneficiary",
  filename: "src/server/people.functions.ts"
}, (opts) => createConventionBeneficiary.__executeServer(opts));
const createConventionBeneficiary = createServerFn({
  method: "POST"
}).inputValidator(PersonInput.extend({
  conventionId: z.number(),
  employeeCode: z.string().optional().nullable()
})).handler(createConventionBeneficiary_createServerFn_handler, async ({
  data
}) => {
  await requireUser();
  const dni = normalizeDni(data.dni);
  let [person] = await db.select().from(people).where(eq(people.dni, dni));
  if (!person) {
    [person] = await db.insert(people).values({
      dni,
      firstName: data.firstName,
      lastName: data.lastName,
      birthDate: data.birthDate || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      notes: data.notes || null
    }).returning();
  }
  const [existingBeneficiary] = await db.select().from(conventionBeneficiaries).where(and(eq(conventionBeneficiaries.conventionId, data.conventionId), eq(conventionBeneficiaries.personId, person.id)));
  if (existingBeneficiary) {
    return {
      person,
      beneficiary: existingBeneficiary
    };
  }
  const [beneficiary] = await db.insert(conventionBeneficiaries).values({
    conventionId: data.conventionId,
    personId: person.id,
    employeeCode: data.employeeCode || null
  }).returning();
  return {
    person,
    beneficiary
  };
});
export {
  createConventionBeneficiary_createServerFn_handler,
  createOrUpdatePerson_createServerFn_handler,
  findConventionBeneficiary_createServerFn_handler,
  findPersonByDni_createServerFn_handler,
  getPersonHistory_createServerFn_handler,
  listActiveConventions_createServerFn_handler,
  searchMembers_createServerFn_handler,
  searchNonMembers_createServerFn_handler,
  setPersonStatus_createServerFn_handler
};
