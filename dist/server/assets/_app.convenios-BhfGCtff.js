import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Plus, Handshake } from "lucide-react";
import { E as Route, F as upsertConvention } from "./router-D33gD1Az.js";
import "@tanstack/react-router";
import "./permits.functions-DTMs4qjC.js";
import "../server.js";
import "node:async_hooks";
import "node:stream";
import "@tanstack/react-router/ssr/server";
import "./format-COLuSK5l.js";
import "zod";
const TYPES = [{
  value: "empresa",
  label: "Empresa"
}, {
  value: "sindicato",
  label: "Sindicato"
}, {
  value: "institucion",
  label: "Institución"
}, {
  value: "otro",
  label: "Otro"
}];
function ConveniosPage() {
  const conventions = Route.useLoaderData();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "empresa",
    description: "",
    startDate: "",
    endDate: "",
    benefit: ""
  });
  async function create(e) {
    e.preventDefault();
    await upsertConvention({
      data: {
        name: form.name,
        type: form.type,
        description: form.description || null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        status: "activo",
        benefit: form.benefit || null
      }
    });
    window.location.reload();
  }
  async function toggleStatus(id, current, rest) {
    await upsertConvention({
      data: {
        id,
        name: rest.name,
        type: rest.type,
        description: rest.description,
        startDate: rest.startDate,
        endDate: rest.endDate,
        status: current === "activo" ? "inactivo" : "activo",
        benefit: rest.benefit
      }
    });
    window.location.reload();
  }
  return /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-slate-900", children: "Convenios" }),
      /* @__PURE__ */ jsxs("button", { onClick: () => setCreating(!creating), className: "flex items-center gap-1.5 bg-blue-900 text-white px-3 py-2 rounded-lg text-sm font-semibold", children: [
        /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
        " Nuevo convenio"
      ] })
    ] }),
    creating && /* @__PURE__ */ jsxs("form", { onSubmit: create, className: "bg-white rounded-xl shadow-sm p-5 space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxs("label", { className: "text-sm", children: [
          /* @__PURE__ */ jsx("span", { className: "text-slate-600", children: "Nombre *" }),
          /* @__PURE__ */ jsx("input", { required: true, value: form.name, onChange: (e) => setForm({
            ...form,
            name: e.target.value
          }), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "text-sm", children: [
          /* @__PURE__ */ jsx("span", { className: "text-slate-600", children: "Tipo" }),
          /* @__PURE__ */ jsx("select", { value: form.type, onChange: (e) => setForm({
            ...form,
            type: e.target.value
          }), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2", children: TYPES.map((t) => /* @__PURE__ */ jsx("option", { value: t.value, children: t.label }, t.value)) })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "text-sm", children: [
          /* @__PURE__ */ jsx("span", { className: "text-slate-600", children: "Vigencia desde" }),
          /* @__PURE__ */ jsx("input", { type: "date", value: form.startDate, onChange: (e) => setForm({
            ...form,
            startDate: e.target.value
          }), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "text-sm", children: [
          /* @__PURE__ */ jsx("span", { className: "text-slate-600", children: "Vigencia hasta" }),
          /* @__PURE__ */ jsx("input", { type: "date", value: form.endDate, onChange: (e) => setForm({
            ...form,
            endDate: e.target.value
          }), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "text-sm block", children: [
        /* @__PURE__ */ jsx("span", { className: "text-slate-600", children: "Beneficio" }),
        /* @__PURE__ */ jsx("input", { placeholder: "Ej: tarifa equivalente a socio", value: form.benefit, onChange: (e) => setForm({
          ...form,
          benefit: e.target.value
        }), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "text-sm block", children: [
        /* @__PURE__ */ jsx("span", { className: "text-slate-600", children: "Descripción" }),
        /* @__PURE__ */ jsx("textarea", { value: form.description, onChange: (e) => setForm({
          ...form,
          description: e.target.value
        }), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" })
      ] }),
      /* @__PURE__ */ jsx("button", { className: "bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg text-sm", children: "Crear convenio" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-4", children: conventions.map((c) => /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm p-5 flex items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("p", { className: "font-bold text-lg flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Handshake, { className: "w-4 h-4 text-violet-700" }),
          " ",
          c.name
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: TYPES.find((t) => t.value === c.type)?.label }),
        c.benefit && /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-600 mt-1", children: [
          "Beneficio: ",
          c.benefit
        ] }),
        c.startDate && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400 mt-1", children: [
          "Vigencia: ",
          c.startDate,
          " a ",
          c.endDate
        ] })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: () => toggleStatus(c.id, c.status, c), className: `text-xs font-bold px-3 py-1.5 rounded-full ${c.status === "activo" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`, children: c.status === "activo" ? "Activo" : "Inactivo" })
    ] }, c.id)) })
  ] });
}
export {
  ConveniosPage as component
};
