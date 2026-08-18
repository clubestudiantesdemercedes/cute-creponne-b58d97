import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import bcrypt from "bcryptjs";
import { d as db, p as people, b as plans, u as users, c as conventions, e as prices, m as members, a as conventionBeneficiaries, s as sales, j as saleItems, k as payments, h as permits, i as entries } from "./db.server-CxddXRZa.js";
import { g as generateSaleNumber, c as computePermitDates, r as randomCode } from "./permit-PpATxjxp.js";
import { t as todayISO, a as addDaysISO } from "./format-COLuSK5l.js";
import { eq } from "drizzle-orm";
import { c as createServerFn } from "../server.js";
import "drizzle-orm/netlify-db";
import "drizzle-orm/pg-core";
import "node:async_hooks";
import "node:stream";
import "react";
import "@tanstack/react-router";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
const seedDemoData_createServerFn_handler = createServerRpc({
  id: "7be83e0dd83d86326c7572ae403cc4606af3ae502098ee0bb0ba19b508975acf",
  name: "seedDemoData",
  filename: "src/server/seed.functions.ts"
}, (opts) => seedDemoData.__executeServer(opts));
const seedDemoData = createServerFn({
  method: "POST"
}).handler(seedDemoData_createServerFn_handler, async () => {
  const [existingPerson] = await db.select().from(people).limit(1);
  const [existingPlan] = await db.select().from(plans).limit(1);
  if (existingPerson || existingPlan) {
    return {
      alreadySeeded: true
    };
  }
  const passwordHash = await bcrypt.hash("estudiantes2026", 10);
  let [admin] = await db.select().from(users).where(eq(users.username, "admin"));
  if (!admin) {
    [admin] = await db.insert(users).values({
      username: "admin",
      passwordHash,
      fullName: "Administrador General",
      role: "admin"
    }).returning();
  }
  const demoUsers = [{
    username: "encargado",
    fullName: "Encargado de Pileta (Demo)",
    role: "encargado"
  }, {
    username: "ingreso",
    fullName: "Control de Ingreso (Demo)",
    role: "control_ingreso"
  }, {
    username: "consulta",
    fullName: "Usuario de Consulta (Demo)",
    role: "consulta"
  }];
  for (const demoUser of demoUsers) {
    const [existing] = await db.select().from(users).where(eq(users.username, demoUser.username));
    if (!existing) {
      await db.insert(users).values({
        username: demoUser.username,
        passwordHash,
        fullName: demoUser.fullName,
        role: demoUser.role
      });
    }
  }
  const seasonStart = `${(/* @__PURE__ */ new Date()).getFullYear()}-12-01`;
  const seasonEnd = `${(/* @__PURE__ */ new Date()).getFullYear() + 1}-02-28`;
  const [diario, semanal, quincenal, mensual, temporada] = await db.insert(plans).values([{
    name: "Pase diario",
    description: "Acceso por un día",
    durationValue: 1,
    durationUnit: "dia",
    sortOrder: 1
  }, {
    name: "Pase semanal",
    description: "Acceso por 7 días",
    durationValue: 7,
    durationUnit: "dia",
    sortOrder: 2
  }, {
    name: "Pase quincenal",
    description: "Acceso por 15 días",
    durationValue: 15,
    durationUnit: "dia",
    sortOrder: 3
  }, {
    name: "Pase mensual",
    description: "Acceso por 30 días",
    durationValue: 30,
    durationUnit: "dia",
    sortOrder: 4
  }, {
    name: "Pase de temporada",
    description: "Acceso durante toda la temporada de verano",
    durationValue: 1,
    durationUnit: "temporada",
    seasonStart,
    seasonEnd,
    sortOrder: 5
  }]).returning();
  const [convenioXYZ, convenioComercio, convenioMunicipal] = await db.insert(conventions).values([{
    name: "Empresa XYZ S.A.",
    type: "empresa",
    description: "Convenio con Empresa XYZ para empleados y grupo familiar.",
    startDate: seasonStart,
    endDate: seasonEnd,
    benefit: "Tarifa equivalente a socio"
  }, {
    name: "Sindicato de Comercio",
    type: "sindicato",
    description: "Convenio con el Sindicato de Comercio de Mercedes.",
    startDate: seasonStart,
    endDate: seasonEnd,
    benefit: "Tarifa preferencial"
  }, {
    name: "Municipalidad de Mercedes",
    type: "institucion",
    description: "Convenio con la Municipalidad de Mercedes.",
    startDate: seasonStart,
    endDate: seasonEnd,
    benefit: "Tarifa equivalente a socio"
  }]).returning();
  await db.insert(prices).values([{
    planId: diario.id,
    conditionType: "socio",
    amount: 8e3
  }, {
    planId: diario.id,
    conditionType: "no_socio",
    amount: 12e3
  }, {
    planId: diario.id,
    conditionType: "convenio",
    amount: 8e3
  }, {
    planId: semanal.id,
    conditionType: "socio",
    amount: 35e3
  }, {
    planId: semanal.id,
    conditionType: "no_socio",
    amount: 55e3
  }, {
    planId: semanal.id,
    conditionType: "convenio",
    amount: 35e3
  }, {
    planId: quincenal.id,
    conditionType: "socio",
    amount: 6e4
  }, {
    planId: quincenal.id,
    conditionType: "no_socio",
    amount: 9e4
  }, {
    planId: quincenal.id,
    conditionType: "convenio",
    amount: 6e4
  }, {
    planId: mensual.id,
    conditionType: "socio",
    amount: 3e4
  }, {
    planId: mensual.id,
    conditionType: "no_socio",
    amount: 5e4
  }, {
    planId: mensual.id,
    conditionType: "convenio",
    amount: 3e4
  }, {
    planId: temporada.id,
    conditionType: "socio",
    amount: 12e4
  }, {
    planId: temporada.id,
    conditionType: "no_socio",
    amount: 19e4
  }, {
    planId: temporada.id,
    conditionType: "convenio",
    amount: 12e4
  }]);
  const demoMembers = [{
    num: "00101",
    dni: "30100001",
    first: "Juan",
    last: "Pérez"
  }, {
    num: "00102",
    dni: "30100002",
    first: "María",
    last: "González"
  }, {
    num: "00103",
    dni: "30100003",
    first: "Carlos",
    last: "Fernández"
  }, {
    num: "00104",
    dni: "30100004",
    first: "Lucía",
    last: "Martínez"
  }, {
    num: "00105",
    dni: "30100005",
    first: "Pedro",
    last: "López"
  }, {
    num: "00106",
    dni: "30100006",
    first: "Ana",
    last: "Rodríguez"
  }, {
    num: "00107",
    dni: "30100007",
    first: "Diego",
    last: "Sánchez"
  }, {
    num: "00108",
    dni: "30100008",
    first: "Sofía",
    last: "Romero"
  }, {
    num: "00109",
    dni: "30100009",
    first: "Martín",
    last: "Torres"
  }, {
    num: "00110",
    dni: "30100010",
    first: "Valentina",
    last: "Díaz",
    status: "inactivo"
  }];
  const memberPeople = [];
  for (const m of demoMembers) {
    const [person] = await db.insert(people).values({
      dni: m.dni,
      firstName: m.first,
      lastName: m.last,
      phone: "2352400000"
    }).returning();
    await db.insert(members).values({
      personId: person.id,
      memberNumber: m.num,
      memberStatus: m.status ?? "activo"
    });
    memberPeople.push(person);
  }
  const demoNonMembers = [{
    dni: "35200001",
    first: "Rodrigo",
    last: "Ibáñez"
  }, {
    dni: "35200002",
    first: "Camila",
    last: "Acosta"
  }, {
    dni: "35200003",
    first: "Federico",
    last: "Molina"
  }, {
    dni: "35200004",
    first: "Julieta",
    last: "Herrera"
  }, {
    dni: "35200005",
    first: "Nicolás",
    last: "Vega"
  }];
  const nonMemberPeople = [];
  for (const p of demoNonMembers) {
    const [person] = await db.insert(people).values({
      dni: p.dni,
      firstName: p.first,
      lastName: p.last
    }).returning();
    nonMemberPeople.push(person);
  }
  const demoBeneficiaries = [{
    convention: convenioXYZ,
    dni: "36300001",
    first: "Emilia",
    last: "Castro",
    code: "XYZ-001"
  }, {
    convention: convenioXYZ,
    dni: "36300002",
    first: "Tomás",
    last: "Silva",
    code: "XYZ-002"
  }, {
    convention: convenioComercio,
    dni: "36300003",
    first: "Agustina",
    last: "Ríos",
    code: "SC-101"
  }, {
    convention: convenioComercio,
    dni: "36300004",
    first: "Bruno",
    last: "Suárez",
    code: "SC-102"
  }, {
    convention: convenioMunicipal,
    dni: "36300005",
    first: "Florencia",
    last: "Ortiz",
    code: "MUN-500"
  }];
  const beneficiaryPeople = [];
  for (const b of demoBeneficiaries) {
    const [person] = await db.insert(people).values({
      dni: b.dni,
      firstName: b.first,
      lastName: b.last
    }).returning();
    await db.insert(conventionBeneficiaries).values({
      conventionId: b.convention.id,
      personId: person.id,
      employeeCode: b.code
    });
    beneficiaryPeople.push({
      person,
      conventionId: b.convention.id
    });
  }
  const today = todayISO();
  const demoSalesSpec = [{
    person: memberPeople[0],
    conditionType: "socio",
    conventionId: null,
    plan: mensual,
    daysAgo: 3
  }, {
    person: memberPeople[1],
    conditionType: "socio",
    conventionId: null,
    plan: diario,
    daysAgo: 0
  }, {
    person: nonMemberPeople[0],
    conditionType: "no_socio",
    conventionId: null,
    plan: semanal,
    daysAgo: 1
  }, {
    person: nonMemberPeople[1],
    conditionType: "no_socio",
    conventionId: null,
    plan: mensual,
    daysAgo: 40
  }, {
    person: beneficiaryPeople[0].person,
    conditionType: "convenio",
    conventionId: beneficiaryPeople[0].conventionId,
    plan: mensual,
    daysAgo: 2
  }];
  for (const spec of demoSalesSpec) {
    const purchaseDate = addDaysISO(today, -spec.daysAgo);
    const price = spec.conditionType === "socio" ? 3e4 : spec.conditionType === "convenio" ? 3e4 : 5e4;
    const unitPrice = spec.plan.id === diario.id ? spec.conditionType === "socio" ? 8e3 : 12e3 : spec.plan.id === semanal.id ? 55e3 : price;
    const [sale] = await db.insert(sales).values({
      saleNumber: generateSaleNumber(),
      createdByUserId: admin.id,
      totalAmount: unitPrice,
      paymentMethod: "efectivo",
      createdAt: /* @__PURE__ */ new Date(purchaseDate + "T11:00:00")
    }).returning();
    const [item] = await db.insert(saleItems).values({
      saleId: sale.id,
      personId: spec.person.id,
      conditionType: spec.conditionType,
      conventionId: spec.conventionId,
      planId: spec.plan.id,
      unitPrice
    }).returning();
    await db.insert(payments).values({
      saleId: sale.id,
      amount: unitPrice,
      method: "efectivo",
      createdByUserId: admin.id,
      createdAt: /* @__PURE__ */ new Date(purchaseDate + "T11:00:00")
    });
    const {
      startDate,
      endDate
    } = computePermitDates(spec.plan, purchaseDate);
    const [permit] = await db.insert(permits).values({
      code: randomCode(),
      personId: spec.person.id,
      saleItemId: item.id,
      planId: spec.plan.id,
      conditionType: spec.conditionType,
      conventionId: spec.conventionId,
      startDate,
      endDate
    }).returning();
    if (spec.daysAgo <= 5) {
      await db.insert(entries).values({
        personId: spec.person.id,
        permitId: permit.id,
        checkedInByUserId: admin.id,
        method: "manual",
        occurredAt: /* @__PURE__ */ new Date(purchaseDate + "T16:30:00")
      });
    }
  }
  return {
    alreadySeeded: false
  };
});
export {
  seedDemoData_createServerFn_handler
};
