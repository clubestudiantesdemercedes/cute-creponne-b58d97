import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { eq } from "drizzle-orm";
import { d as db, m as members, p as people } from "./db.server-CxddXRZa.js";
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
function normalizeDni(dni) {
  return dni.replace(/\D/g, "");
}
const HEADER_ALIASES = {
  socio: "memberNumber",
  numerosocio: "memberNumber",
  "nsocio": "memberNumber",
  dni: "dni",
  nombre: "firstName",
  apellido: "lastName",
  fechanacimiento: "birthDate",
  nacimiento: "birthDate",
  telefono: "phone",
  email: "email",
  correo: "email",
  domicilio: "address",
  direccion: "address",
  estado: "status"
};
function slug(s) {
  return s.normalize("NFD").replace(new RegExp("\\p{Diacritic}", "gu"), "").toLowerCase().replace(/[^a-z0-9]/g, "");
}
function parseCsv(text) {
  const rows = [];
  let cur = [];
  let field = "";
  let inQuotes = false;
  const delimiter = text.includes(";") && !text.includes(",") ? ";" : ",";
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delimiter) {
      cur.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      cur.push(field);
      rows.push(cur);
      cur = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length || cur.length) {
    cur.push(field);
    rows.push(cur);
  }
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}
const previewMembersImport_createServerFn_handler = createServerRpc({
  id: "4a9f2bb8569d489f0236174e68006147ea0f29541122ff9184e2c3acae7d4b26",
  name: "previewMembersImport",
  filename: "src/server/members.functions.ts"
}, (opts) => previewMembersImport.__executeServer(opts));
const previewMembersImport = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(previewMembersImport_createServerFn_handler, async ({
  data
}) => {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("Solo un administrador puede importar socios.");
  const rows = parseCsv(data.csv);
  if (rows.length < 2) {
    return {
      rows: [],
      newCount: 0,
      updateCount: 0,
      errors: ["El archivo no tiene datos."]
    };
  }
  const header = rows[0].map((h) => slug(h));
  const dataRows = rows.slice(1);
  const existingMembers = await db.select().from(members);
  const existingByNumber = new Map(existingMembers.map((m) => [m.memberNumber, m]));
  const existingPeople = await db.select().from(people);
  new Map(existingPeople.map((p) => [p.dni, p]));
  const parsed = [];
  for (const raw of dataRows) {
    const obj = {};
    header.forEach((h, idx) => {
      const key = HEADER_ALIASES[h];
      if (key) obj[key] = raw[idx]?.trim();
    });
    const errors = [];
    if (!obj.memberNumber) errors.push("Falta número de socio");
    if (!obj.dni) errors.push("Falta DNI");
    else obj.dni = normalizeDni(obj.dni);
    if (!obj.firstName) errors.push("Falta nombre");
    if (!obj.lastName) errors.push("Falta apellido");
    if (obj.status) {
      const s = slug(obj.status);
      obj.status = s.startsWith("inact") ? "inactivo" : "activo";
    } else {
      obj.status = "activo";
    }
    const action = obj.memberNumber && existingByNumber.has(obj.memberNumber) ? "actualizar" : "nuevo";
    parsed.push({
      row: obj,
      errors,
      action
    });
  }
  return {
    rows: parsed,
    newCount: parsed.filter((p) => p.action === "nuevo" && p.errors.length === 0).length,
    updateCount: parsed.filter((p) => p.action === "actualizar" && p.errors.length === 0).length,
    errorCount: parsed.filter((p) => p.errors.length > 0).length
  };
});
const confirmMembersImport_createServerFn_handler = createServerRpc({
  id: "b93097f7c7576318fd3e7f489ffbaa3810fc1d00ce818c691ea7713679d718af",
  name: "confirmMembersImport",
  filename: "src/server/members.functions.ts"
}, (opts) => confirmMembersImport.__executeServer(opts));
const confirmMembersImport = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(confirmMembersImport_createServerFn_handler, async ({
  data
}) => {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("Solo un administrador puede importar socios.");
  let created = 0;
  let updated = 0;
  for (const row of data.rows) {
    const dni = normalizeDni(row.dni);
    let [person] = await db.select().from(people).where(eq(people.dni, dni));
    if (!person) {
      [person] = await db.insert(people).values({
        dni,
        firstName: row.firstName,
        lastName: row.lastName,
        birthDate: row.birthDate || null,
        phone: row.phone || null,
        email: row.email || null,
        address: row.address || null
      }).returning();
    } else {
      [person] = await db.update(people).set({
        firstName: row.firstName,
        lastName: row.lastName,
        birthDate: row.birthDate || person.birthDate,
        phone: row.phone || person.phone,
        email: row.email || person.email,
        address: row.address || person.address,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(people.id, person.id)).returning();
    }
    const [existingMember] = await db.select().from(members).where(eq(members.memberNumber, row.memberNumber));
    if (existingMember) {
      await db.update(members).set({
        personId: person.id,
        memberStatus: row.status,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(members.id, existingMember.id));
      updated++;
    } else {
      await db.insert(members).values({
        personId: person.id,
        memberNumber: row.memberNumber,
        memberStatus: row.status
      });
      created++;
    }
  }
  return {
    created,
    updated
  };
});
const listMembers_createServerFn_handler = createServerRpc({
  id: "641c52b82173c9ed5b748b20f71fcb3bac6c7b63b549bdd947e6cc16a4bdf9ee",
  name: "listMembers",
  filename: "src/server/members.functions.ts"
}, (opts) => listMembers.__executeServer(opts));
const listMembers = createServerFn({
  method: "GET"
}).handler(listMembers_createServerFn_handler, async () => {
  await requireUser();
  const rows = await db.select({
    member: members,
    person: people
  }).from(members).innerJoin(people, eq(members.personId, people.id)).orderBy(members.memberNumber).limit(500);
  return rows;
});
export {
  confirmMembersImport_createServerFn_handler,
  listMembers_createServerFn_handler,
  previewMembersImport_createServerFn_handler
};
