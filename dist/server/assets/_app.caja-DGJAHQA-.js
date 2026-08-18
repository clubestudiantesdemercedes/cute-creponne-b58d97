import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Wallet, Lock } from "lucide-react";
import { G as Route, H as getCashSummary, I as closeCashRegister } from "./router-D33gD1Az.js";
import { t as todayISO, f as formatARS } from "./format-COLuSK5l.js";
import "@tanstack/react-router";
import "./permits.functions-DTMs4qjC.js";
import "../server.js";
import "node:async_hooks";
import "node:stream";
import "@tanstack/react-router/ssr/server";
import "zod";
const METHOD_LABELS = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  mercadopago: "Mercado Pago",
  tarjeta: "Tarjeta",
  otro: "Otro"
};
function CajaPage() {
  const initial = Route.useLoaderData();
  const [date, setDate] = useState(todayISO());
  const [summary, setSummary] = useState(initial);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState(null);
  async function loadDate(d) {
    setDate(d);
    setSummary(await getCashSummary({
      data: {
        date: d
      }
    }));
  }
  async function doClose() {
    setClosing(true);
    setError(null);
    try {
      await closeCashRegister({
        data: {
          date
        }
      });
      await loadDate(date);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cerrar la caja.");
    } finally {
      setClosing(false);
    }
  }
  const closed = summary.closure?.status === "cerrada";
  return /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5", children: [
    /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-slate-900 flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(Wallet, { className: "w-6 h-6" }),
      " Cierre de caja"
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm p-5", children: [
      /* @__PURE__ */ jsxs("label", { className: "text-sm block mb-4", children: [
        /* @__PURE__ */ jsx("span", { className: "text-slate-600", children: "Fecha" }),
        /* @__PURE__ */ jsx("input", { type: "date", value: date, onChange: (e) => loadDate(e.target.value), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" })
      ] }),
      /* @__PURE__ */ jsx("ul", { className: "divide-y divide-slate-100", children: Object.entries(summary.totals).map(([method, amount]) => /* @__PURE__ */ jsxs("li", { className: "py-2 flex justify-between text-sm", children: [
        /* @__PURE__ */ jsx("span", { children: METHOD_LABELS[method] ?? method }),
        /* @__PURE__ */ jsx("span", { className: "font-medium", children: formatARS(amount) })
      ] }, method)) }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center pt-3 mt-2 border-t border-slate-200", children: [
        /* @__PURE__ */ jsxs("span", { className: "font-bold", children: [
          "Total (",
          summary.salesCount,
          " ventas)"
        ] }),
        /* @__PURE__ */ jsx("span", { className: "font-bold text-xl text-red-700", children: formatARS(summary.totalAmount) })
      ] }),
      error && /* @__PURE__ */ jsx("p", { className: "text-red-700 text-sm mt-3", children: error }),
      closed ? /* @__PURE__ */ jsxs("p", { className: "mt-4 flex items-center gap-2 text-emerald-700 font-semibold text-sm bg-emerald-50 p-3 rounded-lg", children: [
        /* @__PURE__ */ jsx(Lock, { className: "w-4 h-4" }),
        " Caja cerrada. No admite modificaciones."
      ] }) : /* @__PURE__ */ jsx("button", { onClick: doClose, disabled: closing, className: "mt-4 w-full bg-red-700 hover:bg-red-800 disabled:opacity-60 text-white font-bold py-3 rounded-lg", children: closing ? "Cerrando..." : "Cerrar caja del día" })
    ] })
  ] });
}
export {
  CajaPage as component
};
