import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { X, Plus, Pencil, PowerOff, Power, Save } from "lucide-react";
import { y as Route, z as upsertPlan, A as upsertPrice } from "./router-D33gD1Az.js";
import { f as formatARS } from "./format-COLuSK5l.js";
import "@tanstack/react-router";
import "./permits.functions-DTMs4qjC.js";
import "../server.js";
import "node:async_hooks";
import "node:stream";
import "@tanstack/react-router/ssr/server";
import "zod";
const CONDITIONS = [{
  value: "socio",
  label: "Socio"
}, {
  value: "no_socio",
  label: "No socio"
}, {
  value: "convenio",
  label: "Convenio (general)"
}];
function PlanesPage() {
  const {
    plans,
    prices,
    conventions
  } = Route.useLoaderData();
  const [editingId, setEditingId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    durationValue: 30,
    durationUnit: "dia",
    seasonStart: "",
    seasonEnd: "",
    active: true
  });
  async function reload() {
    window.location.reload();
  }
  function resetForm() {
    setForm({
      name: "",
      description: "",
      durationValue: 30,
      durationUnit: "dia",
      seasonStart: "",
      seasonEnd: "",
      active: true
    });
    setCreating(false);
    setEditingId(null);
  }
  function startCreate() {
    setEditingId(null);
    setForm({
      name: "",
      description: "",
      durationValue: 30,
      durationUnit: "dia",
      seasonStart: "",
      seasonEnd: "",
      active: true
    });
    setCreating(true);
  }
  function startEdit(plan) {
    setCreating(false);
    setEditingId(plan.id);
    setForm({
      id: plan.id,
      name: plan.name,
      description: plan.description ?? "",
      durationValue: plan.durationValue,
      durationUnit: plan.durationUnit,
      seasonStart: plan.seasonStart ?? "",
      seasonEnd: plan.seasonEnd ?? "",
      active: plan.active
    });
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }
  async function savePlan(e) {
    e.preventDefault();
    await upsertPlan({
      data: {
        id: form.id,
        name: form.name,
        description: form.description || null,
        durationValue: form.durationUnit === "temporada" ? 1 : form.durationValue,
        durationUnit: form.durationUnit,
        seasonStart: form.durationUnit === "temporada" ? form.seasonStart : null,
        seasonEnd: form.durationUnit === "temporada" ? form.seasonEnd : null,
        active: form.active,
        sortOrder: form.id != null ? plans.find((p) => p.id === form.id)?.sortOrder ?? 0 : plans.length + 1
      }
    });
    resetForm();
    reload();
  }
  async function togglePlan(plan) {
    const action = plan.active ? "desactivar" : "activar";
    const confirmed = window.confirm(`¿Seguro que querés ${action} el plan "${plan.name}"?`);
    if (!confirmed) return;
    await upsertPlan({
      data: {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        durationValue: plan.durationValue,
        durationUnit: plan.durationUnit,
        seasonStart: plan.seasonStart,
        seasonEnd: plan.seasonEnd,
        active: !plan.active,
        sortOrder: plan.sortOrder
      }
    });
    reload();
  }
  function priceOf(planId, condition, conventionId) {
    return prices.find((p) => p.planId === planId && p.conditionType === condition && p.conventionId === conventionId)?.amount ?? 0;
  }
  async function savePrice(planId, conditionType, conventionId, amount) {
    await upsertPrice({
      data: {
        planId,
        conditionType,
        conventionId,
        amount
      }
    });
    reload();
  }
  return /* @__PURE__ */ jsxs("div", { className: "max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-slate-900", children: "Planes y tarifas" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mt-1", children: "Administrá los planes, sus tarifas y su estado." })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: creating ? resetForm : startCreate, className: "flex items-center gap-1.5 bg-blue-900 text-white px-3 py-2 rounded-lg text-sm font-semibold", children: creating ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(X, { className: "w-4 h-4" }),
        "Cancelar"
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
        "Nuevo plan"
      ] }) })
    ] }),
    (creating || editingId !== null) && /* @__PURE__ */ jsxs("form", { onSubmit: savePlan, className: "bg-white rounded-xl shadow-sm p-5 space-y-4 border border-blue-100", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-bold text-lg", children: editingId !== null ? "Modificar plan" : "Nuevo plan" }),
        editingId !== null && /* @__PURE__ */ jsx("span", { className: `text-xs font-semibold px-2 py-1 rounded-full ${form.active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`, children: form.active ? "ACTIVO" : "INACTIVO" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxs("label", { className: "text-sm", children: [
          /* @__PURE__ */ jsx("span", { className: "text-slate-600", children: "Nombre *" }),
          /* @__PURE__ */ jsx("input", { required: true, value: form.name, onChange: (e) => setForm({
            ...form,
            name: e.target.value
          }), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "text-sm", children: [
          /* @__PURE__ */ jsx("span", { className: "text-slate-600", children: "Tipo de duración" }),
          /* @__PURE__ */ jsxs("select", { value: form.durationUnit, onChange: (e) => setForm({
            ...form,
            durationUnit: e.target.value
          }), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2", children: [
            /* @__PURE__ */ jsx("option", { value: "dia", children: "Días" }),
            /* @__PURE__ */ jsx("option", { value: "temporada", children: "Temporada (fechas fijas)" })
          ] })
        ] }),
        form.durationUnit === "dia" ? /* @__PURE__ */ jsxs("label", { className: "text-sm", children: [
          /* @__PURE__ */ jsx("span", { className: "text-slate-600", children: "Duración (días)" }),
          /* @__PURE__ */ jsx("input", { type: "number", min: 1, value: form.durationValue, onChange: (e) => setForm({
            ...form,
            durationValue: Number(e.target.value)
          }), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" })
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("label", { className: "text-sm", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-600", children: "Inicio de temporada" }),
            /* @__PURE__ */ jsx("input", { type: "date", value: form.seasonStart, onChange: (e) => setForm({
              ...form,
              seasonStart: e.target.value
            }), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" })
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "text-sm", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-600", children: "Fin de temporada" }),
            /* @__PURE__ */ jsx("input", { type: "date", value: form.seasonEnd, onChange: (e) => setForm({
              ...form,
              seasonEnd: e.target.value
            }), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "text-sm block", children: [
        /* @__PURE__ */ jsx("span", { className: "text-slate-600", children: "Descripción" }),
        /* @__PURE__ */ jsx("input", { value: form.description, onChange: (e) => setForm({
          ...form,
          description: e.target.value
        }), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" })
      ] }),
      editingId !== null && /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
        /* @__PURE__ */ jsx("input", { type: "checkbox", checked: form.active, onChange: (e) => setForm({
          ...form,
          active: e.target.checked
        }) }),
        /* @__PURE__ */ jsx("span", { children: "Plan activo" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx("button", { type: "submit", className: "bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg text-sm", children: editingId !== null ? "Guardar cambios" : "Crear plan" }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: resetForm, className: "border border-slate-300 text-slate-600 font-semibold px-4 py-2 rounded-lg text-sm", children: "Cancelar" })
      ] })
    ] }),
    plans.map((plan) => /* @__PURE__ */ jsxs("div", { className: `bg-white rounded-xl shadow-sm p-5 ${!plan.active ? "opacity-75 border border-red-200" : ""}`, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4 mb-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("h2", { className: "font-bold text-lg", children: plan.name }),
            /* @__PURE__ */ jsx("span", { className: `text-xs font-semibold px-2 py-1 rounded-full ${plan.active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`, children: plan.active ? "ACTIVO" : "INACTIVO" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mt-1", children: plan.durationUnit === "temporada" ? `Temporada: ${plan.seasonStart} a ${plan.seasonEnd}` : `${plan.durationValue} días` }),
          plan.description && /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mt-1", children: plan.description })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2 shrink-0", children: [
          /* @__PURE__ */ jsxs("button", { onClick: () => startEdit(plan), className: "flex items-center gap-1.5 border border-blue-300 text-blue-700 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50", children: [
            /* @__PURE__ */ jsx(Pencil, { className: "w-4 h-4" }),
            "Modificar"
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: () => togglePlan(plan), className: `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold ${plan.active ? "border border-red-300 text-red-700 hover:bg-red-50" : "border border-emerald-300 text-emerald-700 hover:bg-emerald-50"}`, children: plan.active ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(PowerOff, { className: "w-4 h-4" }),
            "Inactivar"
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Power, { className: "w-4 h-4" }),
            "Activar"
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: CONDITIONS.map((c) => /* @__PURE__ */ jsx(PriceEditor, { label: c.label, value: priceOf(plan.id, c.value, null), onSave: (amount) => savePrice(plan.id, c.value, null, amount) }, c.value)) }),
      conventions.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-4 border-t border-slate-100 pt-4", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-slate-600 mb-2", children: "Tarifas específicas por convenio" }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: conventions.map((c) => /* @__PURE__ */ jsx(PriceEditor, { label: c.name, value: priceOf(plan.id, "convenio", c.id), onSave: (amount) => savePrice(plan.id, "convenio", c.id, amount) }, c.id)) })
      ] })
    ] }, plan.id))
  ] });
}
function PriceEditor({
  label,
  value,
  onSave
}) {
  const [amount, setAmount] = useState(value);
  const [dirty, setDirty] = useState(false);
  return /* @__PURE__ */ jsxs("div", { className: "border border-slate-200 rounded-lg p-3", children: [
    /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 mb-1", children: label }),
    /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400 mb-1", children: [
      "Actual: ",
      formatARS(value)
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
      /* @__PURE__ */ jsx("input", { type: "number", value: amount, onChange: (e) => {
        setAmount(Number(e.target.value));
        setDirty(true);
      }, className: "w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm" }),
      /* @__PURE__ */ jsx("button", { disabled: !dirty, onClick: () => {
        onSave(amount);
        setDirty(false);
      }, className: "bg-blue-900 disabled:opacity-30 text-white p-1.5 rounded-lg", children: /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" }) })
    ] })
  ] });
}
export {
  PlanesPage as component
};
