import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Settings, Database, CheckCircle2, AlertTriangle, RotateCcw } from "lucide-react";
import { c as createSsrRpc } from "./permits.functions-DTMs4qjC.js";
import { c as createServerFn } from "../server.js";
import "./format-COLuSK5l.js";
import "node:async_hooks";
import "node:stream";
import "@tanstack/react-router";
import "@tanstack/react-router/ssr/server";
const seedDemoData = createServerFn({
  method: "POST"
}).handler(createSsrRpc("7be83e0dd83d86326c7572ae403cc4606af3ae502098ee0bb0ba19b508975acf"));
const resetTestEnvironment = createServerFn({
  method: "POST"
}).handler(createSsrRpc("4246ef411e1eb73ad750342e42342bd11c2ef3cbf3c98f1b9cfe102f536ba467"));
function ConfigPage() {
  const [status, setStatus] = useState("idle");
  const [resetStatus, setResetStatus] = useState("idle");
  const [resetMessage, setResetMessage] = useState("");
  async function runSeed() {
    setStatus("loading");
    try {
      const result = await seedDemoData();
      setStatus(result.alreadySeeded ? "already" : "done");
    } catch (error) {
      console.error(error);
      setStatus("already");
    }
  }
  async function runReset() {
    const confirmed = window.confirm("ATENCIÓN: esta acción eliminará todos los datos de prueba.\n\nSe borrarán personas, socios, familias, convenios, planes, tarifas, ventas, pagos, permisos, ingresos, cierres de caja y registros de auditoría.\n\nEl usuario administrador se conservará.\n\n¿Querés continuar?");
    if (!confirmed) return;
    setResetStatus("loading");
    setResetMessage("");
    try {
      const result = await resetTestEnvironment();
      setResetStatus("done");
      setResetMessage(result.message);
    } catch (error) {
      console.error(error);
      setResetStatus("error");
      setResetMessage(error instanceof Error ? error.message : "No se pudo reiniciar el entorno de prueba.");
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6", children: [
    /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-slate-900 flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(Settings, { className: "w-6 h-6" }),
      " Configuración"
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm p-5 space-y-2", children: [
      /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: "Club" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: "Club Atlético Estudiantes — Mercedes, Buenos Aires." }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: "Los planes, tarifas, convenios, usuarios y roles se administran desde sus respectivas secciones del menú (Planes y tarifas, Convenios, Usuarios)." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm p-5 space-y-3", children: [
      /* @__PURE__ */ jsxs("h2", { className: "font-semibold flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Database, { className: "w-4 h-4" }),
        " Datos de demostración"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: "Carga usuarios, planes, tarifas, convenios, socios, no socios, beneficiarios, ventas e ingresos de ejemplo (con nombres y DNI ficticios) para poder probar el sistema. Esta acción solo tiene efecto si la base de datos está vacía." }),
      /* @__PURE__ */ jsx("button", { onClick: runSeed, disabled: status === "loading", className: "bg-blue-900 disabled:opacity-60 text-white font-semibold px-4 py-2.5 rounded-lg text-sm", children: status === "loading" ? "Cargando..." : "Cargar datos de demostración" }),
      status === "done" && /* @__PURE__ */ jsxs("p", { className: "flex items-center gap-1.5 text-emerald-700 text-sm font-medium", children: [
        /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4" }),
        "Datos de demostración cargados. Usuarios: admin / encargado / ingreso / consulta — contraseña: estudiantes2026"
      ] }),
      status === "already" && /* @__PURE__ */ jsx("p", { className: "text-amber-700 text-sm", children: "Ya existen datos cargados; no se modificó nada." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm p-5 space-y-3 border border-red-200", children: [
      /* @__PURE__ */ jsxs("h2", { className: "font-semibold flex items-center gap-2 text-red-700", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "w-5 h-5" }),
        " Entorno de prueba"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-600", children: "Permite borrar todos los datos cargados durante las pruebas y comenzar nuevamente desde cero." }),
      /* @__PURE__ */ jsxs("div", { className: "bg-red-50 border border-red-100 rounded-lg p-3", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-red-800 font-medium", children: "Esta acción eliminará todos los datos operativos y de prueba." }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-red-700 mt-1", children: "Se conservará únicamente el usuario administrador para que puedas volver a ingresar al sistema." })
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: runReset, disabled: resetStatus === "loading", className: "flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold px-4 py-2.5 rounded-lg text-sm", children: [
        /* @__PURE__ */ jsx(RotateCcw, { className: "w-4 h-4" }),
        resetStatus === "loading" ? "Reiniciando..." : "Reiniciar entorno de prueba"
      ] }),
      resetStatus === "done" && /* @__PURE__ */ jsxs("p", { className: "flex items-center gap-1.5 text-emerald-700 text-sm font-medium", children: [
        /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4" }),
        resetMessage
      ] }),
      resetStatus === "error" && /* @__PURE__ */ jsx("p", { className: "text-red-700 text-sm font-medium", children: resetMessage })
    ] })
  ] });
}
export {
  ConfigPage as component
};
