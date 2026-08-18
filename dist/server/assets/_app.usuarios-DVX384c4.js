import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { UserCog, Plus } from "lucide-react";
import { h as Route, i as createUser, u as updateUser } from "./router-D33gD1Az.js";
import { R as ROLE_LABELS } from "./roles-BMlBrLsE.js";
import "@tanstack/react-router";
import "./permits.functions-DTMs4qjC.js";
import "../server.js";
import "node:async_hooks";
import "node:stream";
import "@tanstack/react-router/ssr/server";
import "./format-COLuSK5l.js";
import "zod";
const ROLES = [{
  value: "admin",
  label: "Administrador"
}, {
  value: "encargado",
  label: "Encargado de pileta"
}, {
  value: "control_ingreso",
  label: "Control de ingreso"
}, {
  value: "consulta",
  label: "Consulta"
}];
function UsuariosPage() {
  const users = Route.useLoaderData();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    fullName: "",
    role: "encargado"
  });
  async function create(e) {
    e.preventDefault();
    await createUser({
      data: {
        ...form,
        active: true
      }
    });
    window.location.reload();
  }
  async function toggleActive(id, user) {
    await updateUser({
      data: {
        id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        active: !user.active
      }
    });
    window.location.reload();
  }
  return /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-slate-900 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(UserCog, { className: "w-6 h-6" }),
        " Usuarios"
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: () => setCreating(!creating), className: "flex items-center gap-1.5 bg-blue-900 text-white px-3 py-2 rounded-lg text-sm font-semibold", children: [
        /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
        " Nuevo usuario"
      ] })
    ] }),
    creating && /* @__PURE__ */ jsxs("form", { onSubmit: create, className: "bg-white rounded-xl shadow-sm p-5 space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxs("label", { className: "text-sm", children: [
          /* @__PURE__ */ jsx("span", { className: "text-slate-600", children: "Usuario *" }),
          /* @__PURE__ */ jsx("input", { required: true, value: form.username, onChange: (e) => setForm({
            ...form,
            username: e.target.value
          }), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "text-sm", children: [
          /* @__PURE__ */ jsx("span", { className: "text-slate-600", children: "Contraseña *" }),
          /* @__PURE__ */ jsx("input", { required: true, type: "password", minLength: 6, value: form.password, onChange: (e) => setForm({
            ...form,
            password: e.target.value
          }), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "text-sm", children: [
          /* @__PURE__ */ jsx("span", { className: "text-slate-600", children: "Nombre completo *" }),
          /* @__PURE__ */ jsx("input", { required: true, value: form.fullName, onChange: (e) => setForm({
            ...form,
            fullName: e.target.value
          }), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "text-sm", children: [
          /* @__PURE__ */ jsx("span", { className: "text-slate-600", children: "Rol" }),
          /* @__PURE__ */ jsx("select", { value: form.role, onChange: (e) => setForm({
            ...form,
            role: e.target.value
          }), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2", children: ROLES.map((r) => /* @__PURE__ */ jsx("option", { value: r.value, children: r.label }, r.value)) })
        ] })
      ] }),
      /* @__PURE__ */ jsx("button", { className: "bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg text-sm", children: "Crear usuario" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-white rounded-xl shadow-sm divide-y divide-slate-100", children: users.map((u) => /* @__PURE__ */ jsxs("div", { className: "p-4 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium", children: u.fullName }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500", children: [
          "@",
          u.username,
          " — ",
          ROLE_LABELS[u.role]
        ] })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: () => toggleActive(u.id, u), className: `text-xs font-bold px-3 py-1.5 rounded-full ${u.active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`, children: u.active ? "Activo" : "Inactivo" })
    ] }, u.id)) })
  ] });
}
export {
  UsuariosPage as component
};
