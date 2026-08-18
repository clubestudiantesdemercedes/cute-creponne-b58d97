import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { ShoppingCart, DoorOpen, Users, DollarSign, IdCard, Handshake, AlertTriangle } from "lucide-react";
import { f as formatARS, b as formatDateAR } from "./format-COLuSK5l.js";
import { b as Route } from "./router-D33gD1Az.js";
import "./permits.functions-DTMs4qjC.js";
import "../server.js";
import "node:async_hooks";
import "node:stream";
import "react";
import "@tanstack/react-router/ssr/server";
import "zod";
function Card({
  icon: Icon,
  label,
  value,
  accent
}) {
  return /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm p-5 flex items-center gap-4", children: [
    /* @__PURE__ */ jsx("div", { className: `${accent} p-3 rounded-lg`, children: /* @__PURE__ */ jsx(Icon, { className: "w-6 h-6 text-white" }) }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: label }),
      /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-slate-900", children: value })
    ] })
  ] });
}
function Dashboard() {
  const {
    stats,
    expiring
  } = Route.useLoaderData();
  return /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-slate-900", children: "Temporada de pileta" }),
      /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-sm", children: "Resumen del natatorio del Club Atlético Estudiantes" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-3", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/venta", className: "flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white font-semibold px-5 py-3 rounded-lg text-sm", children: [
        /* @__PURE__ */ jsx(ShoppingCart, { className: "w-4 h-4" }),
        " Nueva venta"
      ] }),
      /* @__PURE__ */ jsxs(Link, { to: "/ingreso", className: "flex items-center gap-2 bg-blue-900 hover:bg-blue-950 text-white font-semibold px-5 py-3 rounded-lg text-sm", children: [
        /* @__PURE__ */ jsx(DoorOpen, { className: "w-4 h-4" }),
        " Control de ingreso"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", children: [
      /* @__PURE__ */ jsx(Card, { icon: Users, label: "Personas habilitadas", value: String(stats.personasHabilitadas), accent: "bg-blue-800" }),
      /* @__PURE__ */ jsx(Card, { icon: DoorOpen, label: "Ingresos hoy", value: String(stats.ingresosHoy), accent: "bg-emerald-600" }),
      /* @__PURE__ */ jsx(Card, { icon: ShoppingCart, label: "Ventas hoy", value: String(stats.ventasHoy), accent: "bg-amber-600" }),
      /* @__PURE__ */ jsx(Card, { icon: DollarSign, label: "Recaudación hoy", value: formatARS(stats.recaudacionHoy), accent: "bg-red-700" }),
      /* @__PURE__ */ jsx(Card, { icon: IdCard, label: "Socios habilitados", value: String(stats.socios), accent: "bg-blue-700" }),
      /* @__PURE__ */ jsx(Card, { icon: Handshake, label: "Convenios habilitados", value: String(stats.convenios), accent: "bg-violet-600" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm p-5", children: [
      /* @__PURE__ */ jsxs("h2", { className: "font-semibold text-slate-900 mb-3 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "w-4 h-4 text-amber-600" }),
        " Permisos próximos a vencer"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 text-center", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-red-50 p-3", children: [
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-red-700", children: expiring.vencidos.length }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-red-700", children: "Vencidos" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-amber-50 p-3", children: [
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-amber-700", children: expiring.hoy.length }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-amber-700", children: "Vencen hoy" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-blue-50 p-3", children: [
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-blue-700", children: expiring.en3dias.length }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-blue-700", children: "En 3 días" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-slate-100 p-3", children: [
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-slate-700", children: expiring.en7dias.length }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-700", children: "En 7 días" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("ul", { className: "divide-y divide-slate-100 text-sm", children: [
        [...expiring.hoy, ...expiring.en3dias].slice(0, 8).map((r) => /* @__PURE__ */ jsxs("li", { className: "py-2 flex justify-between", children: [
          /* @__PURE__ */ jsxs("span", { children: [
            r.person.firstName,
            " ",
            r.person.lastName,
            " — ",
            r.plan.name
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "text-slate-500", children: [
            "Vence ",
            formatDateAR(r.permit.endDate)
          ] })
        ] }, r.permit.id)),
        expiring.hoy.length + expiring.en3dias.length === 0 && /* @__PURE__ */ jsx("li", { className: "py-2 text-slate-400", children: "No hay permisos próximos a vencer." })
      ] })
    ] })
  ] });
}
export {
  Dashboard as component
};
