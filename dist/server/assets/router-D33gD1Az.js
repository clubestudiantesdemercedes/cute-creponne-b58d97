import { createRootRoute, HeadContent, Scripts, createFileRoute, lazyRouteComponent, redirect, createRouter } from "@tanstack/react-router";
import { jsxs, jsx } from "react/jsx-runtime";
import { c as createSsrRpc, l as listExpiringPermits } from "./permits.functions-DTMs4qjC.js";
import { z } from "zod";
import { c as createServerFn } from "../server.js";
import { t as todayISO } from "./format-COLuSK5l.js";
const Route$e = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Natatorio — Club Atlético Estudiantes" },
      {
        name: "description",
        content: "Sistema de gestión de la temporada de pileta del Club Atlético Estudiantes de Mercedes."
      }
    ],
    links: [{ rel: "icon", href: "/favicon.ico" }]
  }),
  shellComponent: RootDocument
});
function RootDocument({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "es-AR", children: [
    /* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxs("body", { className: "bg-slate-50 text-slate-900", children: [
      children,
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
const getCurrentUser = createServerFn({
  method: "GET"
}).handler(createSsrRpc("51b5113f26b5f16b9ca1c9c95453e8d186c9f09fc052b63bfd85659cca6afd31"));
const login = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  username: z.string().min(1),
  password: z.string().min(1)
})).handler(createSsrRpc("f36e9af4f1dc6778f0ad05f7b548eaa164d3798b3948ce8d6b570bad7296e829"));
const logout = createServerFn({
  method: "POST"
}).handler(createSsrRpc("4c8f3fd5a0b9ff84b0e2868dfa52fac90e9e3a128b449b7f637aebf93cb4900e"));
const $$splitComponentImporter$d = () => import("./login-BIR0emuD.js");
const Route$d = createFileRoute("/login")({
  beforeLoad: async () => {
    const user = await getCurrentUser();
    if (user) throw redirect({
      to: "/"
    });
  },
  component: lazyRouteComponent($$splitComponentImporter$d, "component")
});
const $$splitComponentImporter$c = () => import("./_app-BbXbK6E8.js");
const Route$c = createFileRoute("/_app")({
  beforeLoad: async () => {
    const user = await getCurrentUser();
    if (!user) throw redirect({
      to: "/login"
    });
    return {
      user
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$c, "component")
});
const getDashboardStats = createServerFn({
  method: "GET"
}).handler(createSsrRpc("a99e984c6e003acf02fb89fc4e6d112a131286a384e2fdffc4fbd4c89ada9477"));
const $$splitComponentImporter$b = () => import("./_app.index-DX4MaTSz.js");
const Route$b = createFileRoute("/_app/")({
  loader: async () => {
    const [stats, expiring] = await Promise.all([getDashboardStats(), listExpiringPermits()]);
    return {
      stats,
      expiring
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$b, "component")
});
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
const findPersonByDni = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("e3401065577f221a4d9df3058286efa360dbad9ac1c22a4364de86b80fad4672"));
const searchMembers = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("469d488a1cb0d21fd23043721806c9894b0e498eec1b1059824f93bacf19a7b8"));
const searchNonMembers = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("3b68610470e7505b53b52748298f9503ca3a97d2801f948649e611a4314d62b0"));
const createOrUpdatePerson = createServerFn({
  method: "POST"
}).inputValidator(PersonInput.extend({
  id: z.number().optional()
})).handler(createSsrRpc("0bf9d8c52d3decd748a886e18c142fd9da837c78e87c661f6fb1636ca2a11332"));
const setPersonStatus = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("631d8b2be76af8c749bf6cb5aae5e5b5991029cb6df2f9a67930c190055de6e2"));
createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("1ac4d29c3c7704210501cbf1af5f4d00f46731586ee8520866267b53ab1525aa"));
const listActiveConventions = createServerFn({
  method: "GET"
}).handler(createSsrRpc("134bafae55e5f28610a459bdbca7af98f5f53b9df86ebd3e349a1d607a4052a7"));
createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("9e98a2166d3eb190cb0667089d2a418099a48ebc5c06df848573ead4615ab1e4"));
const createConventionBeneficiary = createServerFn({
  method: "POST"
}).inputValidator(PersonInput.extend({
  conventionId: z.number(),
  employeeCode: z.string().optional().nullable()
})).handler(createSsrRpc("e37277eff47eaa8496cdbd06750d8cc68547d6b95181a8debab61883c56965b1"));
const listPlans = createServerFn({
  method: "GET"
}).handler(createSsrRpc("3f058fd6488fb10d1f1792345e46b4979e2a08e5662ef8a1f616063141d745ec"));
createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("a7ec056dcb39843d6ebb41c2ce45d8ec7b73d4874553a9a6b9612d66ca27bb11"));
const listAllPrices = createServerFn({
  method: "GET"
}).handler(createSsrRpc("556efdb8ce868744c9856062d92cdd6e35c264c241236d524483f0c197e16db7"));
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
const upsertPlan = createServerFn({
  method: "POST"
}).inputValidator(PlanInput).handler(createSsrRpc("3ecb2068c2381e247671e80072bcad9b146968aed6f93d0f7d01e9712eeb3ad3"));
const PriceInput = z.object({
  id: z.number().optional(),
  planId: z.number(),
  conditionType: z.enum(["socio", "no_socio", "convenio"]),
  conventionId: z.number().optional().nullable(),
  amount: z.number().int().nonnegative()
});
const upsertPrice = createServerFn({
  method: "POST"
}).inputValidator(PriceInput).handler(createSsrRpc("30304651fce0a884b0c4bd10cdd39bfcf420ab952ce117322295b42bd11869a2"));
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
const listConventionsAdmin = createServerFn({
  method: "GET"
}).handler(createSsrRpc("52235c3e6c4b0b3ed077dcee92fc5ca5ad794b53a5c27b9b4ad871c89c24da29"));
const upsertConvention = createServerFn({
  method: "POST"
}).inputValidator(ConventionInput).handler(createSsrRpc("e5537b531fa6e6d34354917c734394a48b8d5886b6e1e6a8eab857e27d41d443"));
const $$splitComponentImporter$a = () => import("./_app.venta-D5jxP4bZ.js");
const Route$a = createFileRoute("/_app/venta")({
  loader: async () => {
    const [plans, prices, conventions] = await Promise.all([listPlans(), listAllPrices(), listActiveConventions()]);
    return {
      plans,
      prices,
      conventions
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
const listUsers = createServerFn({
  method: "GET"
}).handler(createSsrRpc("35ac0f5f832574d75cebf47b67ba396d5bd05c7d14699366c07bd7771b7dbaa4"));
const UserInput = z.object({
  username: z.string().min(3),
  password: z.string().min(6).optional(),
  fullName: z.string().min(1),
  role: z.enum(["admin", "encargado", "control_ingreso", "consulta"]),
  active: z.boolean().default(true)
});
const createUser = createServerFn({
  method: "POST"
}).inputValidator(UserInput).handler(createSsrRpc("08dbef7bbe43d802c40129d43cb49f6c5ed9d5367d7f51e6e23aacd763751fc8"));
const updateUser = createServerFn({
  method: "POST"
}).inputValidator(UserInput.extend({
  id: z.number()
})).handler(createSsrRpc("46fdacbffcf90e4fd11aea8a0204971ae5c8176cb91fa82347b53942a3a8fbc0"));
const $$splitComponentImporter$9 = () => import("./_app.usuarios-DVX384c4.js");
const Route$9 = createFileRoute("/_app/usuarios")({
  loader: () => listUsers(),
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const previewMembersImport = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("4a9f2bb8569d489f0236174e68006147ea0f29541122ff9184e2c3acae7d4b26"));
const confirmMembersImport = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("b93097f7c7576318fd3e7f489ffbaa3810fc1d00ce818c691ea7713679d718af"));
const listMembers = createServerFn({
  method: "GET"
}).handler(createSsrRpc("641c52b82173c9ed5b748b20f71fcb3bac6c7b63b549bdd947e6cc16a4bdf9ee"));
const $$splitComponentImporter$8 = () => import("./_app.socios-B0NpO-Mh.js");
const Route$8 = createFileRoute("/_app/socios")({
  loader: () => listMembers(),
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
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
const createSale = createServerFn({
  method: "POST"
}).inputValidator(CreateSaleInput).handler(createSsrRpc("7777757842bcc141a292af6d409436d45f36b597bf4b52c694007bf4ea70b8c9"));
const listSales = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("c71f9d6f57719978cc577c5f4f0a8bff999181d9dffca3f2e1bb9162feccde02"));
createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("506132b9e681bad1dc2a076d6bde42fe09bacc11bec19005f9973ff26910eb79"));
createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("3e56867d75cc0dd73d01ecf83ad653b8c8ee45faf5bea818207b38b5fd6cd42b"));
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
const registerEntry = createServerFn({
  method: "POST"
}).inputValidator(RegisterEntryInput).handler(createSsrRpc("97e85f5b193c4f4dd242050f6ff29ed9f0c45fac4be0a9146ff6c100f52967d8"));
const listEntries = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("4fd08a187010a008aaeba37d87c63cadfaa3a44fd95b10e80655765119cf067b"));
const exportPeopleCsv = createServerFn({
  method: "GET"
}).handler(createSsrRpc("80e46f8157b1dc4d553a171bf41a33d921e679be46adf2c6d1547bb5b50cdf2a"));
const exportMembersCsv = createServerFn({
  method: "GET"
}).handler(createSsrRpc("9714bbdad7d45bce9d9479fe9eaeb3dd8dbed3b79a11e54a29bb59fb8d205efb"));
const exportSalesCsv = createServerFn({
  method: "GET"
}).handler(createSsrRpc("c0393032ea96aedaee93263021edd4cf5b6c31061f8e1525539e80d6e96d9da0"));
const exportPaymentsCsv = createServerFn({
  method: "GET"
}).handler(createSsrRpc("93d0ee4ce70fa19ad399854751f592ff874f1b90d45529939632a80b9525e396"));
const exportEntriesCsv = createServerFn({
  method: "GET"
}).handler(createSsrRpc("86aa94fd029062e96eb745f366363a4c0fbdb7a54148a826caf86a7d776b6895"));
const exportPermitsCsv = createServerFn({
  method: "GET"
}).handler(createSsrRpc("09d266134e26762c0f104998f9376ce87de96e6a512c7c6bc4ef13cc88a36a0a"));
const exportConventionsCsv = createServerFn({
  method: "GET"
}).handler(createSsrRpc("9de22fbafe3ead1ea024a02a3f30bb317a795d2babc0109b3d700de16da8544d"));
const exportBeneficiariesCsv = createServerFn({
  method: "GET"
}).handler(createSsrRpc("3bf26307f73b029d5d5051b60b9244005c214d64085956209f4a5cabe52e9b4a"));
const getConventionsReport = createServerFn({
  method: "GET"
}).handler(createSsrRpc("2b4e8b30d5b3cb18237b6347dbb703c2e15cbe7e1bb1e05e8c1aad87701b6514"));
const $$splitComponentImporter$7 = () => import("./_app.reportes-DN6RY4Ua.js");
const Route$7 = createFileRoute("/_app/reportes")({
  loader: async () => {
    const today = todayISO();
    const [sales, entries, expiring, conventionsReport] = await Promise.all([listSales({
      data: {
        dateFrom: today,
        dateTo: today
      }
    }), listEntries({
      data: {
        dateFrom: today,
        dateTo: today
      }
    }), listExpiringPermits(), getConventionsReport()]);
    return {
      sales,
      entries,
      expiring,
      conventionsReport
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./_app.planes-DMd_qeYu.js");
const Route$6 = createFileRoute("/_app/planes")({
  loader: async () => {
    const [plans, prices, conventions] = await Promise.all([listPlans(), listAllPrices(), listConventionsAdmin()]);
    return {
      plans,
      prices,
      conventions
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./_app.personas-CYYZr2p8.js");
const Route$5 = createFileRoute("/_app/personas")({
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./_app.ingreso - backup-BqZJV1WW.js");
const Route$4 = createFileRoute("/_app/ingreso - backup")({
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./_app.ingreso-bOLEpKo0.js");
const Route$3 = createFileRoute("/_app/ingreso")({
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./_app.convenios-BhfGCtff.js");
const Route$2 = createFileRoute("/_app/convenios")({
  loader: () => listConventionsAdmin(),
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./_app.config-DkmWo4xC.js");
const Route$1 = createFileRoute("/_app/config")({
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const getCashSummary = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("d166681f657ff5dbf1fdab2c29f1531edf9c4aa96144f2bb13db086f0bdf6b9b"));
const closeCashRegister = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("1fc00d26b45020a756a0d3e19b6104f745db755d430a77df1eb01e152e6460ad"));
const $$splitComponentImporter = () => import("./_app.caja-DGJAHQA-.js");
const Route = createFileRoute("/_app/caja")({
  loader: () => getCashSummary({
    data: {
      date: todayISO()
    }
  }),
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const LoginRoute = Route$d.update({
  id: "/login",
  path: "/login",
  getParentRoute: () => Route$e
});
const AppRoute = Route$c.update({
  id: "/_app",
  getParentRoute: () => Route$e
});
const AppIndexRoute = Route$b.update({
  id: "/",
  path: "/",
  getParentRoute: () => AppRoute
});
const AppVentaRoute = Route$a.update({
  id: "/venta",
  path: "/venta",
  getParentRoute: () => AppRoute
});
const AppUsuariosRoute = Route$9.update({
  id: "/usuarios",
  path: "/usuarios",
  getParentRoute: () => AppRoute
});
const AppSociosRoute = Route$8.update({
  id: "/socios",
  path: "/socios",
  getParentRoute: () => AppRoute
});
const AppReportesRoute = Route$7.update({
  id: "/reportes",
  path: "/reportes",
  getParentRoute: () => AppRoute
});
const AppPlanesRoute = Route$6.update({
  id: "/planes",
  path: "/planes",
  getParentRoute: () => AppRoute
});
const AppPersonasRoute = Route$5.update({
  id: "/personas",
  path: "/personas",
  getParentRoute: () => AppRoute
});
const AppIngresobackupRoute = Route$4.update({
  id: "/ingreso - backup",
  path: "/ingreso - backup",
  getParentRoute: () => AppRoute
});
const AppIngresoRoute = Route$3.update({
  id: "/ingreso",
  path: "/ingreso",
  getParentRoute: () => AppRoute
});
const AppConveniosRoute = Route$2.update({
  id: "/convenios",
  path: "/convenios",
  getParentRoute: () => AppRoute
});
const AppConfigRoute = Route$1.update({
  id: "/config",
  path: "/config",
  getParentRoute: () => AppRoute
});
const AppCajaRoute = Route.update({
  id: "/caja",
  path: "/caja",
  getParentRoute: () => AppRoute
});
const AppRouteChildren = {
  AppCajaRoute,
  AppConfigRoute,
  AppConveniosRoute,
  AppIngresoRoute,
  AppIngresobackupRoute,
  AppPersonasRoute,
  AppPlanesRoute,
  AppReportesRoute,
  AppSociosRoute,
  AppUsuariosRoute,
  AppVentaRoute,
  AppIndexRoute
};
const AppRouteWithChildren = AppRoute._addFileChildren(AppRouteChildren);
const rootRouteChildren = {
  AppRoute: AppRouteWithChildren,
  LoginRoute
};
const routeTree = Route$e._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const router2 = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  upsertPrice as A,
  findPersonByDni as B,
  setPersonStatus as C,
  registerEntry as D,
  Route$2 as E,
  upsertConvention as F,
  Route as G,
  getCashSummary as H,
  closeCashRegister as I,
  router as J,
  Route$c as R,
  logout as a,
  Route$b as b,
  Route$a as c,
  createConventionBeneficiary as d,
  searchNonMembers as e,
  createOrUpdatePerson as f,
  createSale as g,
  Route$9 as h,
  createUser as i,
  Route$8 as j,
  confirmMembersImport as k,
  login as l,
  Route$7 as m,
  exportPeopleCsv as n,
  exportMembersCsv as o,
  previewMembersImport as p,
  exportSalesCsv as q,
  exportPaymentsCsv as r,
  searchMembers as s,
  exportEntriesCsv as t,
  updateUser as u,
  exportPermitsCsv as v,
  exportConventionsCsv as w,
  exportBeneficiariesCsv as x,
  Route$6 as y,
  upsertPlan as z
};
