import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Download } from "lucide-react";
import { m as Route, n as exportPeopleCsv, o as exportMembersCsv, q as exportSalesCsv, r as exportPaymentsCsv, t as exportEntriesCsv, v as exportPermitsCsv, w as exportConventionsCsv, x as exportBeneficiariesCsv } from "./router-D33gD1Az.js";
import { c as formatDateTimeAR, f as formatARS, b as formatDateAR } from "./format-COLuSK5l.js";
import "@tanstack/react-router";
import "./permits.functions-DTMs4qjC.js";
import "../server.js";
import "node:async_hooks";
import "node:stream";
import "@tanstack/react-router/ssr/server";
import "zod";
function downloadCsv(filename, content) {
  const blob = new Blob([content], {
    type: "text/csv;charset=utf-8;"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
const EXPORTS = [{
  label: "Personas",
  fn: exportPeopleCsv,
  file: "personas.csv"
}, {
  label: "Socios",
  fn: exportMembersCsv,
  file: "socios.csv"
}, {
  label: "Ventas",
  fn: exportSalesCsv,
  file: "ventas.csv"
}, {
  label: "Pagos",
  fn: exportPaymentsCsv,
  file: "pagos.csv"
}, {
  label: "Ingresos",
  fn: exportEntriesCsv,
  file: "ingresos.csv"
}, {
  label: "Permisos",
  fn: exportPermitsCsv,
  file: "permisos.csv"
}, {
  label: "Convenios",
  fn: exportConventionsCsv,
  file: "convenios.csv"
}, {
  label: "Beneficiarios",
  fn: exportBeneficiariesCsv,
  file: "beneficiarios.csv"
}];
function ReportesPage() {
  const {
    sales,
    entries,
    expiring,
    conventionsReport
  } = Route.useLoaderData();
  const [tab, setTab] = useState("ventas");
  return /* @__PURE__ */ jsxs("div", { className: "max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-slate-900", children: "Reportes" }),
    /* @__PURE__ */ jsx("div", { className: "bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-2", children: EXPORTS.map((e) => /* @__PURE__ */ jsxs("button", { onClick: async () => downloadCsv(e.file, await e.fn()), className: "flex items-center gap-1.5 text-xs font-semibold border border-slate-300 px-3 py-2 rounded-lg hover:bg-slate-50", children: [
      /* @__PURE__ */ jsx(Download, { className: "w-3.5 h-3.5" }),
      " ",
      e.label
    ] }, e.file)) }),
    /* @__PURE__ */ jsx("div", { className: "flex gap-2", children: ["ventas", "ingresos", "convenios", "vencimientos"].map((t) => /* @__PURE__ */ jsx("button", { onClick: () => setTab(t), className: `px-3 py-2 rounded-lg text-sm font-semibold capitalize ${tab === t ? "bg-blue-900 text-white" : "bg-white border border-slate-300"}`, children: t }, t)) }),
    tab === "ventas" && /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm p-5", children: [
      /* @__PURE__ */ jsx("h2", { className: "font-semibold mb-3", children: "Ventas de hoy" }),
      /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-left text-slate-500 border-b border-slate-200", children: [
          /* @__PURE__ */ jsx("th", { className: "py-2", children: "N° venta" }),
          /* @__PURE__ */ jsx("th", { className: "py-2", children: "Hora" }),
          /* @__PURE__ */ jsx("th", { className: "py-2", children: "Total" }),
          /* @__PURE__ */ jsx("th", { className: "py-2", children: "Método" })
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-slate-100", children: [
          sales.map((s) => /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { className: "py-2", children: s.saleNumber }),
            /* @__PURE__ */ jsx("td", { className: "py-2", children: formatDateTimeAR(s.createdAt) }),
            /* @__PURE__ */ jsx("td", { className: "py-2", children: formatARS(s.totalAmount) }),
            /* @__PURE__ */ jsx("td", { className: "py-2 capitalize", children: s.paymentMethod })
          ] }, s.id)),
          sales.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "py-4 text-slate-400 text-center", children: "Sin ventas hoy." }) })
        ] })
      ] })
    ] }),
    tab === "ingresos" && /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm p-5", children: [
      /* @__PURE__ */ jsx("h2", { className: "font-semibold mb-3", children: "Ingresos de hoy" }),
      /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-left text-slate-500 border-b border-slate-200", children: [
          /* @__PURE__ */ jsx("th", { className: "py-2", children: "Hora" }),
          /* @__PURE__ */ jsx("th", { className: "py-2", children: "Persona" }),
          /* @__PURE__ */ jsx("th", { className: "py-2", children: "Plan" }),
          /* @__PURE__ */ jsx("th", { className: "py-2", children: "Método" })
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-slate-100", children: [
          entries.map((e) => /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { className: "py-2", children: formatDateTimeAR(e.entry.occurredAt) }),
            /* @__PURE__ */ jsxs("td", { className: "py-2", children: [
              e.person.firstName,
              " ",
              e.person.lastName
            ] }),
            /* @__PURE__ */ jsx("td", { className: "py-2", children: e.plan.name }),
            /* @__PURE__ */ jsx("td", { className: "py-2 capitalize", children: e.entry.method })
          ] }, e.entry.id)),
          entries.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "py-4 text-slate-400 text-center", children: "Sin ingresos hoy." }) })
        ] })
      ] })
    ] }),
    tab === "convenios" && /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm p-5", children: [
      /* @__PURE__ */ jsx("h2", { className: "font-semibold mb-3", children: "Resumen por convenio" }),
      /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-left text-slate-500 border-b border-slate-200", children: [
          /* @__PURE__ */ jsx("th", { className: "py-2", children: "Convenio" }),
          /* @__PURE__ */ jsx("th", { className: "py-2", children: "Beneficiarios" }),
          /* @__PURE__ */ jsx("th", { className: "py-2", children: "Permisos" }),
          /* @__PURE__ */ jsx("th", { className: "py-2", children: "Ingresos" }),
          /* @__PURE__ */ jsx("th", { className: "py-2", children: "Recaudación" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100", children: conventionsReport.map((r) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { className: "py-2", children: r.convention.name }),
          /* @__PURE__ */ jsx("td", { className: "py-2", children: r.beneficiaryCount }),
          /* @__PURE__ */ jsx("td", { className: "py-2", children: r.activePermits }),
          /* @__PURE__ */ jsx("td", { className: "py-2", children: r.entryCount }),
          /* @__PURE__ */ jsx("td", { className: "py-2", children: formatARS(r.recaudacion) })
        ] }, r.convention.id)) })
      ] })
    ] }),
    tab === "vencimientos" && /* @__PURE__ */ jsx("div", { className: "bg-white rounded-xl shadow-sm p-5 space-y-4", children: [["Vencidos", expiring.vencidos], ["Vencen hoy", expiring.hoy], ["Vencen en 3 días", expiring.en3dias], ["Vencen en 7 días", expiring.en7dias]].map(([label, rows]) => /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("h3", { className: "font-semibold text-sm mb-2", children: [
        label,
        " (",
        rows.length,
        ")"
      ] }),
      /* @__PURE__ */ jsxs("ul", { className: "divide-y divide-slate-100 text-sm", children: [
        rows.map((r) => /* @__PURE__ */ jsxs("li", { className: "py-1.5 flex justify-between", children: [
          /* @__PURE__ */ jsxs("span", { children: [
            r.person.firstName,
            " ",
            r.person.lastName,
            " — ",
            r.plan.name
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-slate-500", children: formatDateAR(r.permit.endDate) })
        ] }, r.permit.id)),
        rows.length === 0 && /* @__PURE__ */ jsx("li", { className: "py-1.5 text-slate-400", children: "Sin registros." })
      ] })
    ] }, label)) })
  ] });
}
export {
  ReportesPage as component
};
