import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef } from "react";
import { Upload, CheckCircle2, AlertTriangle } from "lucide-react";
import { j as Route, p as previewMembersImport, k as confirmMembersImport } from "./router-D33gD1Az.js";
import "@tanstack/react-router";
import "./permits.functions-DTMs4qjC.js";
import "../server.js";
import "node:async_hooks";
import "node:stream";
import "@tanstack/react-router/ssr/server";
import "./format-COLuSK5l.js";
import "zod";
function SociosPage() {
  const members = Route.useLoaderData();
  const [preview, setPreview] = useState(null);
  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileRef = useRef(null);
  const [q, setQ] = useState("");
  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCsvText(text);
    const result = await previewMembersImport({
      data: {
        csv: text
      }
    });
    setPreview(result);
    setImportResult(null);
  }
  async function confirm() {
    if (!preview) return;
    setImporting(true);
    try {
      const validRows = preview.rows.filter((r) => r.errors.length === 0).map((r) => r.row);
      const result = await confirmMembersImport({
        data: {
          rows: validRows
        }
      });
      setImportResult(result);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
    } finally {
      setImporting(false);
    }
  }
  const filtered = members.filter((m) => {
    const s = q.toLowerCase();
    return !s || m.member.memberNumber.toLowerCase().includes(s) || m.person.dni.includes(s) || m.person.firstName.toLowerCase().includes(s) || m.person.lastName.toLowerCase().includes(s);
  });
  return /* @__PURE__ */ jsxs("div", { className: "max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-slate-900", children: "Socios" }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm p-5", children: [
      /* @__PURE__ */ jsxs("h2", { className: "font-semibold mb-2 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4" }),
        " Importar base de socios (CSV)"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mb-3", children: "El archivo debe incluir columnas como: socio, dni, nombre, apellido (también se aceptan encabezados con acentos o variantes comunes)." }),
      /* @__PURE__ */ jsx("input", { ref: fileRef, type: "file", accept: ".csv,text/csv", onChange: onFile, className: "text-sm" }),
      preview && /* @__PURE__ */ jsxs("div", { className: "mt-4 border border-slate-200 rounded-lg p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex gap-4 text-sm mb-3", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-emerald-700 font-semibold", children: [
            preview.newCount,
            " nuevos"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "text-blue-700 font-semibold", children: [
            preview.updateCount,
            " para actualizar"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "text-red-700 font-semibold", children: [
            preview.errorCount ?? 0,
            " con errores"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "max-h-64 overflow-auto text-xs", children: /* @__PURE__ */ jsxs("table", { className: "w-full", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-left text-slate-500", children: [
            /* @__PURE__ */ jsx("th", { className: "pr-2", children: "Socio" }),
            /* @__PURE__ */ jsx("th", { className: "pr-2", children: "DNI" }),
            /* @__PURE__ */ jsx("th", { className: "pr-2", children: "Nombre" }),
            /* @__PURE__ */ jsx("th", { className: "pr-2", children: "Acción" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: preview.rows.slice(0, 100).map((r, i) => /* @__PURE__ */ jsxs("tr", { className: r.errors.length ? "text-red-600" : "", children: [
            /* @__PURE__ */ jsx("td", { className: "pr-2 py-0.5", children: r.row.memberNumber }),
            /* @__PURE__ */ jsx("td", { className: "pr-2 py-0.5", children: r.row.dni }),
            /* @__PURE__ */ jsxs("td", { className: "pr-2 py-0.5", children: [
              r.row.firstName,
              " ",
              r.row.lastName
            ] }),
            /* @__PURE__ */ jsx("td", { className: "pr-2 py-0.5", children: r.errors.length ? r.errors.join(", ") : r.action })
          ] }, i)) })
        ] }) }),
        /* @__PURE__ */ jsx("button", { onClick: confirm, disabled: importing || preview.newCount + preview.updateCount === 0, className: "mt-4 bg-blue-900 disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-lg text-sm", children: importing ? "Importando..." : `Confirmar importación (${preview.newCount + preview.updateCount})` })
      ] }),
      importResult && /* @__PURE__ */ jsxs("p", { className: "mt-3 text-emerald-700 text-sm font-medium flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4" }),
        " Importación completa: ",
        importResult.created,
        " creados, ",
        importResult.updated,
        " ",
        "actualizados."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm p-5", children: [
      /* @__PURE__ */ jsx("input", { className: "w-full rounded-lg border border-slate-300 px-3 py-2 mb-3 text-sm", placeholder: "Filtrar por número, DNI o nombre...", value: q, onChange: (e) => setQ(e.target.value) }),
      /* @__PURE__ */ jsxs("div", { className: "overflow-auto max-h-[60vh]", children: [
        /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsx("thead", { className: "sticky top-0 bg-white", children: /* @__PURE__ */ jsxs("tr", { className: "text-left text-slate-500 border-b border-slate-200", children: [
            /* @__PURE__ */ jsx("th", { className: "py-2 pr-2", children: "Socio N°" }),
            /* @__PURE__ */ jsx("th", { className: "py-2 pr-2", children: "Nombre" }),
            /* @__PURE__ */ jsx("th", { className: "py-2 pr-2", children: "DNI" }),
            /* @__PURE__ */ jsx("th", { className: "py-2 pr-2", children: "Estado" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100", children: filtered.map((m) => /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { className: "py-2 pr-2", children: m.member.memberNumber }),
            /* @__PURE__ */ jsxs("td", { className: "py-2 pr-2", children: [
              m.person.firstName,
              " ",
              m.person.lastName
            ] }),
            /* @__PURE__ */ jsx("td", { className: "py-2 pr-2", children: m.person.dni }),
            /* @__PURE__ */ jsx("td", { className: "py-2 pr-2", children: m.member.memberStatus === "activo" ? /* @__PURE__ */ jsx("span", { className: "text-emerald-700 font-medium", children: "Activo" }) : /* @__PURE__ */ jsx("span", { className: "text-red-700 font-medium", children: "Inactivo" }) })
          ] }, m.member.id)) })
        ] }),
        filtered.length === 0 && /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-400 py-6 text-center flex items-center justify-center gap-2", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { className: "w-4 h-4" }),
          " No hay socios que coincidan."
        ] })
      ] })
    ] })
  ] });
}
export {
  SociosPage as component
};
