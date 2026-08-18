import { jsxs, jsx } from "react/jsx-runtime";
import { useRouter, Link, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { LayoutDashboard, ShoppingCart, ScanLine, Users, IdCard, Handshake, Ticket, BarChart3, Wallet, UserCog, Settings, Waves, X, Menu, LogOut } from "lucide-react";
import { a as logout, R as Route } from "./router-D33gD1Az.js";
import { R as ROLE_LABELS } from "./roles-BMlBrLsE.js";
import "./permits.functions-DTMs4qjC.js";
import "../server.js";
import "node:async_hooks";
import "node:stream";
import "@tanstack/react-router/ssr/server";
import "./format-COLuSK5l.js";
import "zod";
const NAV_ITEMS = [
  { to: "/", label: "Panel", icon: LayoutDashboard, roles: ["admin", "encargado", "control_ingreso", "consulta"] },
  { to: "/venta", label: "Venta rápida", icon: ShoppingCart, roles: ["admin", "encargado"] },
  { to: "/ingreso", label: "Control de ingreso", icon: ScanLine, roles: ["admin", "encargado", "control_ingreso"] },
  { to: "/personas", label: "Personas", icon: Users, roles: ["admin", "encargado", "consulta"] },
  { to: "/socios", label: "Socios", icon: IdCard, roles: ["admin", "encargado", "consulta"] },
  { to: "/convenios", label: "Convenios", icon: Handshake, roles: ["admin", "consulta"] },
  { to: "/planes", label: "Planes y tarifas", icon: Ticket, roles: ["admin"] },
  { to: "/reportes", label: "Reportes", icon: BarChart3, roles: ["admin", "consulta"] },
  { to: "/caja", label: "Cierre de caja", icon: Wallet, roles: ["admin"] },
  { to: "/usuarios", label: "Usuarios", icon: UserCog, roles: ["admin"] },
  { to: "/config", label: "Configuración", icon: Settings, roles: ["admin"] }
];
function AppShell({ user, children }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const items = NAV_ITEMS.filter((i) => i.roles.includes(user.role));
  async function handleLogout() {
    await logout();
    await router.navigate({ to: "/login" });
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex flex-col md:flex-row", children: [
    /* @__PURE__ */ jsxs("header", { className: "md:hidden sticky top-0 z-30 bg-blue-900 text-white flex items-center justify-between px-4 py-3 shadow", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Waves, { className: "w-5 h-5 text-red-400" }),
        /* @__PURE__ */ jsx("span", { className: "font-semibold text-sm", children: "Natatorio Estudiantes" })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: () => setOpen(!open), "aria-label": "Menú", className: "p-1", children: open ? /* @__PURE__ */ jsx(X, { className: "w-6 h-6" }) : /* @__PURE__ */ jsx(Menu, { className: "w-6 h-6" }) })
    ] }),
    /* @__PURE__ */ jsxs(
      "nav",
      {
        className: `${open ? "block" : "hidden"} md:block md:w-60 shrink-0 bg-blue-900 text-white md:min-h-screen`,
        children: [
          /* @__PURE__ */ jsxs("div", { className: "hidden md:flex items-center gap-2 px-5 py-5 border-b border-blue-800", children: [
            /* @__PURE__ */ jsx(Waves, { className: "w-6 h-6 text-red-400" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "font-bold leading-tight text-sm", children: "Club Atlético Estudiantes" }),
              /* @__PURE__ */ jsx("p", { className: "text-blue-300 text-xs", children: "Natatorio" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("ul", { className: "py-2", children: items.map((item) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
            Link,
            {
              to: item.to,
              onClick: () => setOpen(false),
              activeOptions: { exact: item.to === "/" },
              className: "flex items-center gap-3 px-5 py-3 text-sm text-blue-100 hover:bg-blue-800 transition-colors [&.active]:bg-red-700 [&.active]:text-white",
              children: [
                /* @__PURE__ */ jsx(item.icon, { className: "w-5 h-5 shrink-0" }),
                item.label
              ]
            }
          ) }, item.to)) }),
          /* @__PURE__ */ jsxs("div", { className: "mt-auto px-5 py-4 border-t border-blue-800 text-xs text-blue-200", children: [
            /* @__PURE__ */ jsx("p", { className: "font-medium text-white", children: user.fullName }),
            /* @__PURE__ */ jsx("p", { children: ROLE_LABELS[user.role] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: handleLogout,
                className: "mt-3 flex items-center gap-1.5 text-red-300 hover:text-red-200",
                children: [
                  /* @__PURE__ */ jsx(LogOut, { className: "w-4 h-4" }),
                  " Cerrar sesión"
                ]
              }
            )
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsx("main", { className: "flex-1 min-w-0 bg-slate-50", children })
  ] });
}
function AppLayout() {
  const {
    user
  } = Route.useRouteContext();
  return /* @__PURE__ */ jsx(AppShell, { user, children: /* @__PURE__ */ jsx(Outlet, {}) });
}
export {
  AppLayout as component
};
