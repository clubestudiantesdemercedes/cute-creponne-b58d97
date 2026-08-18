import { jsx, jsxs } from "react/jsx-runtime";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Waves } from "lucide-react";
import { l as login } from "./router-D33gD1Az.js";
import "./permits.functions-DTMs4qjC.js";
import "../server.js";
import "node:async_hooks";
import "node:stream";
import "@tanstack/react-router/ssr/server";
import "./format-COLuSK5l.js";
import "zod";
function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await login({
        data: {
          username,
          password
        }
      });
      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }
      await router.navigate({
        to: "/"
      });
    } catch {
      setError("No se pudo iniciar sesión. Intentá nuevamente.");
      setLoading(false);
    }
  }
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-red-800 px-4", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-blue-900 px-6 py-6 text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "mx-auto w-14 h-14 rounded-full bg-white flex items-center justify-center mb-3", children: /* @__PURE__ */ jsx(Waves, { className: "w-7 h-7 text-red-700" }) }),
      /* @__PURE__ */ jsx("h1", { className: "text-white font-bold text-lg leading-tight", children: "Club Atlético Estudiantes" }),
      /* @__PURE__ */ jsx("p", { className: "text-blue-200 text-sm", children: "Natatorio — Temporada de verano" })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Usuario" }),
        /* @__PURE__ */ jsx("input", { className: "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-700", value: username, onChange: (e) => setUsername(e.target.value), autoComplete: "username", autoFocus: true, required: true })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Contraseña" }),
        /* @__PURE__ */ jsx("input", { type: "password", className: "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-700", value: password, onChange: (e) => setPassword(e.target.value), autoComplete: "current-password", required: true })
      ] }),
      error && /* @__PURE__ */ jsx("p", { className: "text-red-700 text-sm font-medium", children: error }),
      /* @__PURE__ */ jsx("button", { type: "submit", disabled: loading, className: "w-full rounded-lg bg-red-700 hover:bg-red-800 disabled:opacity-60 text-white font-semibold py-3 text-base transition-colors", children: loading ? "Ingresando..." : "Ingresar" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 text-center pt-2", children: "Usuarios demo: admin / encargado / ingreso / consulta — contraseña: estudiantes2026" })
    ] })
  ] }) });
}
export {
  LoginPage as component
};
