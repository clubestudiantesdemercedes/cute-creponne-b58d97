import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { UserCheck, UserPlus, Loader2, Search, Trash2, CheckCircle2, MessageCircle, ArrowLeft } from "lucide-react";
import { c as Route, d as createConventionBeneficiary, s as searchMembers, e as searchNonMembers, f as createOrUpdatePerson, g as createSale } from "./router-D33gD1Az.js";
import { f as formatARS, b as formatDateAR } from "./format-COLuSK5l.js";
import QRCode from "qrcode";
import "@tanstack/react-router";
import "./permits.functions-DTMs4qjC.js";
import "../server.js";
import "node:async_hooks";
import "node:stream";
import "@tanstack/react-router/ssr/server";
import "zod";
function QrCode({ value, size = 200 }) {
  const [dataUrl, setDataUrl] = useState(null);
  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, { width: size, margin: 1, color: { dark: "#0c1e4d", light: "#ffffff" } }).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [value, size]);
  if (!dataUrl) {
    return /* @__PURE__ */ jsx("div", { className: "bg-slate-100 animate-pulse rounded-lg", style: { width: size, height: size } });
  }
  return /* @__PURE__ */ jsx("img", { src: dataUrl, alt: "Código QR del permiso", width: size, height: size, className: "rounded-lg border border-slate-200" });
}
function VentaRapida() {
  const {
    plans,
    prices,
    conventions
  } = Route.useLoaderData();
  const [cart, setCart] = useState([]);
  const [step, setStep] = useState({
    name: "elegir_tipo"
  });
  function priceFor(planId, conditionType, conventionId) {
    if (conditionType === "convenio" && conventionId) {
      const specific = prices.find((p) => p.planId === planId && p.conditionType === "convenio" && p.conventionId === conventionId);
      if (specific) return specific.amount;
    }
    const generic = prices.find((p) => p.planId === planId && p.conditionType === conditionType && !p.conventionId);
    return generic?.amount ?? 0;
  }
  function addToCart(person, planId) {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    const price = priceFor(planId, person.conditionType, person.conventionId);
    setCart((current) => [...current, {
      tempId: crypto.randomUUID(),
      personId: person.personId,
      fullName: person.fullName,
      dni: person.dni,
      conditionType: person.conditionType,
      conventionId: person.conventionId,
      conventionName: person.conventionName,
      planId,
      planName: plan.name,
      price
    }]);
    setStep({
      name: "elegir_tipo"
    });
  }
  const total = cart.reduce((acc, item) => acc + item.price, 0);
  return /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-slate-900", children: "Venta rápida" }),
      cart.length > 0 && step.name !== "carrito" && step.name !== "confirmada" && /* @__PURE__ */ jsxs("button", { onClick: () => setStep({
        name: "carrito"
      }), className: "text-sm font-semibold bg-blue-900 text-white px-4 py-2 rounded-lg", children: [
        "Ver carrito (",
        cart.length,
        ") —",
        " ",
        formatARS(total)
      ] })
    ] }),
    step.name === "elegir_tipo" && /* @__PURE__ */ jsx(ElegirTipo, { onSocio: () => setStep({
      name: "buscar_socio"
    }), onNoSocio: () => setStep({
      name: "buscar_no_socio"
    }), hasCart: cart.length > 0, onVerCarrito: () => setStep({
      name: "carrito"
    }) }),
    step.name === "buscar_socio" && /* @__PURE__ */ jsx(BuscarSocio, { onBack: () => setStep({
      name: "elegir_tipo"
    }), onFound: (person) => setStep({
      name: "elegir_plan",
      person
    }) }),
    step.name === "buscar_no_socio" && /* @__PURE__ */ jsx(BuscarNoSocio, { onBack: () => setStep({
      name: "elegir_tipo"
    }), onFound: (person) => setStep({
      name: "verificar_persona",
      person,
      source: "no_socio"
    }) }),
    step.name === "verificar_persona" && /* @__PURE__ */ jsx(VerificarPersona, { person: step.person, onBack: () => setStep({
      name: "buscar_no_socio"
    }), onContinue: (person) => {
      setStep({
        name: "elegir_convenio",
        person
      });
    }, onNoConvenio: (person) => {
      setStep({
        name: "elegir_plan",
        person: {
          ...person,
          conditionType: "no_socio",
          conventionId: null,
          conventionName: void 0
        }
      });
    } }),
    step.name === "elegir_convenio" && /* @__PURE__ */ jsx(ElegirConvenio, { conventions, person: step.person, onBack: () => setStep({
      name: "verificar_persona",
      person: step.person,
      source: "no_socio"
    }), onSelect: async (convention) => {
      try {
        const result = await createConventionBeneficiary({
          data: {
            dni: step.person.dni,
            firstName: step.person.firstName,
            lastName: step.person.lastName,
            birthDate: step.person.birthDate || null,
            phone: step.person.phone || null,
            email: step.person.email || null,
            address: step.person.address || null,
            notes: null,
            conventionId: convention.id,
            employeeCode: null
          }
        });
        const updatedPerson = {
          ...step.person,
          personId: result.person.id,
          fullName: `${result.person.firstName} ${result.person.lastName}`,
          dni: result.person.dni,
          firstName: result.person.firstName,
          lastName: result.person.lastName,
          conditionType: "convenio",
          conventionId: convention.id,
          conventionName: convention.name
        };
        setStep({
          name: "elegir_plan",
          person: updatedPerson
        });
      } catch (error) {
        alert(error instanceof Error ? error.message : "No se pudo registrar el convenio.");
      }
    } }),
    step.name === "elegir_plan" && /* @__PURE__ */ jsx(ElegirPlan, { plans, persona: step.person, priceFor, onBack: () => setStep({
      name: step.person.conditionType === "convenio" ? "elegir_convenio" : step.person.conditionType === "no_socio" ? "verificar_persona" : "buscar_socio",
      ...step.person.conditionType === "no_socio" ? {
        person: step.person,
        source: "no_socio"
      } : step.person.conditionType === "convenio" ? {
        person: step.person
      } : {}
    }), onSelect: (planId) => addToCart(step.person, planId) }),
    step.name === "carrito" && /* @__PURE__ */ jsx(Carrito, { cart, total, onRemove: (id) => setCart((current) => current.filter((item) => item.tempId !== id)), onAddMore: () => setStep({
      name: "elegir_tipo"
    }), onConfirmed: (sale, items, permitsResult) => setStep({
      name: "confirmada",
      sale,
      items,
      permits: permitsResult
    }) }),
    step.name === "confirmada" && /* @__PURE__ */ jsx(VentaConfirmada, { sale: step.sale, items: step.items, permits: step.permits, onNueva: () => {
      setCart([]);
      setStep({
        name: "elegir_tipo"
      });
    } })
  ] });
}
function BigButton({
  icon: Icon,
  label,
  color,
  onClick
}) {
  return /* @__PURE__ */ jsxs("button", { onClick, className: `${color} text-white rounded-2xl p-6 flex flex-col items-center gap-3 shadow-md active:scale-95 transition-transform`, children: [
    /* @__PURE__ */ jsx(Icon, { className: "w-10 h-10" }),
    /* @__PURE__ */ jsx("span", { className: "font-bold text-lg", children: label })
  ] });
}
function ElegirTipo({
  onSocio,
  onNoSocio,
  hasCart,
  onVerCarrito
}) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx("p", { className: "text-slate-600 font-medium", children: "¿Qué tipo de persona ingresa?" }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsx(BigButton, { icon: UserCheck, label: "SOCIO", color: "bg-emerald-600", onClick: onSocio }),
      /* @__PURE__ */ jsx(BigButton, { icon: UserPlus, label: "NO SOCIO", color: "bg-blue-800", onClick: onNoSocio })
    ] }),
    hasCart && /* @__PURE__ */ jsx("button", { onClick: onVerCarrito, className: "w-full text-center text-blue-800 font-semibold underline text-sm", children: "Ir al carrito y confirmar venta" })
  ] });
}
function Card({
  children
}) {
  return /* @__PURE__ */ jsx("div", { className: "bg-white rounded-xl shadow-sm p-5", children });
}
function BackLink({
  onBack
}) {
  return /* @__PURE__ */ jsxs("button", { onClick: onBack, className: "flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-1", children: [
    /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
    "Volver"
  ] });
}
function BuscarSocio({
  onBack,
  onFound
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [override, setOverride] = useState(false);
  async function doSearch(e) {
    e.preventDefault();
    setLoading(true);
    setSelected(null);
    try {
      const rows = await searchMembers({
        data: {
          query
        }
      });
      setResults(rows);
    } finally {
      setLoading(false);
    }
  }
  if (selected) {
    const active = selected.member.memberStatus === "activo";
    return /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(BackLink, { onBack: () => setSelected(null) }),
      /* @__PURE__ */ jsx("h2", { className: "font-bold text-lg mb-1", children: "Buscar socio" }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-slate-200 p-4 mt-3", children: [
        /* @__PURE__ */ jsxs("p", { className: "font-semibold text-lg", children: [
          selected.person.firstName,
          " ",
          selected.person.lastName
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-500", children: [
          "Socio N° ",
          selected.member.memberNumber,
          " — DNI",
          " ",
          selected.person.dni
        ] }),
        selected.person.phone && /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-500", children: [
          "Tel: ",
          selected.person.phone
        ] }),
        /* @__PURE__ */ jsx("p", { className: `mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold ${active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`, children: active ? "SOCIO ACTIVO" : "SOCIO INACTIVO" })
      ] }),
      !active && /* @__PURE__ */ jsxs("div", { className: "mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800", children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium mb-2", children: "Este socio figura inactivo. No se le puede aplicar la tarifa de socio sin autorización de un administrador." }),
        /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", checked: override, onChange: (e) => setOverride(e.target.checked) }),
          "Un administrador autorizó continuar como socio"
        ] })
      ] }),
      /* @__PURE__ */ jsx("button", { disabled: !active && !override, onClick: () => onFound({
        personId: selected.person.id,
        fullName: `${selected.person.firstName} ${selected.person.lastName}`,
        dni: selected.person.dni,
        firstName: selected.person.firstName,
        lastName: selected.person.lastName,
        birthDate: selected.person.birthDate ?? "",
        phone: selected.person.phone ?? "",
        email: selected.person.email ?? "",
        address: selected.person.address ?? "",
        conditionType: "socio",
        conventionId: null
      }), className: "mt-4 w-full bg-emerald-600 disabled:opacity-40 text-white font-semibold py-3 rounded-lg", children: "Continuar" })
    ] });
  }
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(BackLink, { onBack }),
    /* @__PURE__ */ jsx("h2", { className: "font-bold text-lg mb-3", children: "Buscar socio" }),
    /* @__PURE__ */ jsxs("form", { onSubmit: doSearch, className: "flex gap-2", children: [
      /* @__PURE__ */ jsx("input", { className: "flex-1 rounded-lg border border-slate-300 px-3 py-2.5", placeholder: "N° socio, DNI, nombre o apellido", value: query, onChange: (e) => setQuery(e.target.value), autoFocus: true }),
      /* @__PURE__ */ jsxs("button", { className: "bg-blue-900 text-white px-4 rounded-lg flex items-center gap-1.5 font-semibold", children: [
        loading ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Search, { className: "w-4 h-4" }),
        "Buscar"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("ul", { className: "mt-4 divide-y divide-slate-100", children: [
      results.map((r) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("button", { onClick: () => setSelected(r), className: "w-full text-left py-3 hover:bg-slate-50 px-1 rounded", children: [
        /* @__PURE__ */ jsxs("p", { className: "font-medium", children: [
          r.person.firstName,
          " ",
          r.person.lastName
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500", children: [
          "Socio N° ",
          r.member.memberNumber,
          " — DNI",
          " ",
          r.person.dni,
          " —",
          " ",
          r.member.memberStatus === "activo" ? "Activo" : "Inactivo"
        ] })
      ] }) }, r.member.id)),
      results.length === 0 && !loading && /* @__PURE__ */ jsx("li", { className: "text-slate-400 text-sm py-3", children: "No hay resultados." })
    ] })
  ] });
}
function PersonForm({
  initial,
  onSubmit,
  submitLabel
}) {
  const [form, setForm] = useState({
    dni: initial.dni ?? "",
    firstName: initial.firstName ?? "",
    lastName: initial.lastName ?? "",
    birthDate: initial.birthDate ?? "",
    phone: initial.phone ?? "",
    email: initial.email ?? "",
    address: initial.address ?? ""
  });
  return /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
    e.preventDefault();
    void onSubmit(form);
  }, className: "space-y-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsx(Field, { label: "DNI *", value: form.dni, onChange: (v) => setForm({
        ...form,
        dni: v
      }), required: true }),
      /* @__PURE__ */ jsx(Field, { label: "Fecha de nacimiento", type: "date", value: form.birthDate, onChange: (v) => setForm({
        ...form,
        birthDate: v
      }) }),
      /* @__PURE__ */ jsx(Field, { label: "Nombre *", value: form.firstName, onChange: (v) => setForm({
        ...form,
        firstName: v
      }), required: true }),
      /* @__PURE__ */ jsx(Field, { label: "Apellido *", value: form.lastName, onChange: (v) => setForm({
        ...form,
        lastName: v
      }), required: true }),
      /* @__PURE__ */ jsx(Field, { label: "Teléfono", value: form.phone, onChange: (v) => setForm({
        ...form,
        phone: v
      }) }),
      /* @__PURE__ */ jsx(Field, { label: "Email", type: "email", value: form.email, onChange: (v) => setForm({
        ...form,
        email: v
      }) })
    ] }),
    /* @__PURE__ */ jsx(Field, { label: "Domicilio", value: form.address, onChange: (v) => setForm({
      ...form,
      address: v
    }) }),
    /* @__PURE__ */ jsx("button", { type: "submit", className: "w-full bg-blue-900 text-white font-semibold py-3 rounded-lg", children: submitLabel })
  ] });
}
function Field({
  label,
  value,
  onChange,
  type = "text",
  required
}) {
  return /* @__PURE__ */ jsxs("label", { className: "block text-sm", children: [
    /* @__PURE__ */ jsx("span", { className: "text-slate-600", children: label }),
    /* @__PURE__ */ jsx("input", { type, value, onChange: (e) => onChange(e.target.value), required, className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" })
  ] });
}
function BuscarNoSocio({
  onBack,
  onFound
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  async function doSearch(e) {
    e?.preventDefault();
    setLoading(true);
    setSelected(null);
    try {
      const rows = await searchNonMembers({
        data: {
          query: query.trim()
        }
      });
      setResults(rows);
    } finally {
      setLoading(false);
    }
  }
  function selectPerson(row) {
    const person = row.person;
    setSelected(row);
    onFound({
      personId: person.id,
      fullName: `${person.firstName} ${person.lastName}`,
      dni: person.dni,
      firstName: person.firstName,
      lastName: person.lastName,
      birthDate: person.birthDate ?? "",
      phone: person.phone ?? "",
      email: person.email ?? "",
      address: person.address ?? "",
      conditionType: "no_socio",
      conventionId: null
    });
  }
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(BackLink, { onBack }),
    /* @__PURE__ */ jsx("h2", { className: "font-bold text-lg mb-1", children: "Buscar no socio" }),
    /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mb-3", children: "Podés buscar por DNI, nombre o apellido. También podés dejar vacío para ver todas las personas no socias." }),
    /* @__PURE__ */ jsxs("form", { onSubmit: doSearch, className: "flex gap-2", children: [
      /* @__PURE__ */ jsx("input", { className: "flex-1 rounded-lg border border-slate-300 px-3 py-2.5", placeholder: "DNI, nombre o apellido", value: query, onChange: (e) => setQuery(e.target.value), autoFocus: true }),
      /* @__PURE__ */ jsxs("button", { type: "submit", className: "bg-blue-900 text-white px-4 rounded-lg flex items-center gap-1.5 font-semibold", children: [
        loading ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Search, { className: "w-4 h-4" }),
        "Buscar"
      ] })
    ] }),
    /* @__PURE__ */ jsx("button", { type: "button", onClick: () => {
      setQuery("");
      void doSearch();
    }, className: "mt-2 text-sm text-blue-800 font-semibold underline", children: "Ver todas las personas no socias" }),
    /* @__PURE__ */ jsxs("ul", { className: "mt-4 divide-y divide-slate-100", children: [
      results.map((r) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("button", { onClick: () => selectPerson(r), className: "w-full text-left py-3 hover:bg-slate-50 px-1 rounded", children: [
        /* @__PURE__ */ jsxs("p", { className: "font-medium", children: [
          r.person.lastName,
          ",",
          " ",
          r.person.firstName
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500", children: [
          "DNI ",
          r.person.dni
        ] }),
        r.person.phone && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500", children: [
          "Tel: ",
          r.person.phone
        ] })
      ] }) }, r.person.id)),
      results.length === 0 && !loading && /* @__PURE__ */ jsx("li", { className: "text-slate-400 text-sm py-3", children: "No hay resultados." })
    ] })
  ] });
}
function VerificarPersona({
  person,
  onBack,
  onContinue,
  onNoConvenio
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  async function saveAndContinue(data) {
    setSaving(true);
    setError(null);
    try {
      const result = await createOrUpdatePerson({
        data: {
          ...data,
          id: person.personId
        }
      });
      const updated = {
        personId: result.person.id,
        fullName: `${result.person.firstName} ${result.person.lastName}`,
        dni: result.person.dni,
        firstName: result.person.firstName,
        lastName: result.person.lastName,
        birthDate: result.person.birthDate ?? "",
        phone: result.person.phone ?? "",
        email: result.person.email ?? "",
        address: result.person.address ?? "",
        conditionType: "no_socio",
        conventionId: null
      };
      setShowForm(false);
      onContinue(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron guardar los datos.");
    } finally {
      setSaving(false);
    }
  }
  const hasMissingData = !person.phone || !person.email || !person.address;
  if (showForm) {
    return /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(BackLink, { onBack: () => setShowForm(false) }),
      /* @__PURE__ */ jsx("h2", { className: "font-bold text-lg mb-1", children: "Completar datos de la persona" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mb-4", children: "Verificá y completá los datos antes de continuar con la venta." }),
      error && /* @__PURE__ */ jsx("div", { className: "mb-3 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm", children: error }),
      /* @__PURE__ */ jsx(PersonForm, { initial: {
        dni: person.dni,
        firstName: person.firstName,
        lastName: person.lastName,
        birthDate: person.birthDate,
        phone: person.phone,
        email: person.email,
        address: person.address
      }, submitLabel: saving ? "Guardando..." : "Guardar y continuar", onSubmit: saveAndContinue })
    ] });
  }
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(BackLink, { onBack }),
    /* @__PURE__ */ jsx("h2", { className: "font-bold text-lg mb-1", children: "Verificar datos" }),
    /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mb-4", children: "Verificá los datos de la persona antes de continuar con la venta." }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2", children: [
      /* @__PURE__ */ jsxs("p", { className: "font-bold text-lg", children: [
        person.lastName,
        ",",
        " ",
        person.firstName
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm", children: [
        /* @__PURE__ */ jsx("strong", { children: "DNI:" }),
        " ",
        person.dni
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm", children: [
        /* @__PURE__ */ jsx("strong", { children: "Teléfono:" }),
        " ",
        person.phone || /* @__PURE__ */ jsx("span", { className: "text-amber-600", children: "No registrado" })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm", children: [
        /* @__PURE__ */ jsx("strong", { children: "Email:" }),
        " ",
        person.email || /* @__PURE__ */ jsx("span", { className: "text-amber-600", children: "No registrado" })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm", children: [
        /* @__PURE__ */ jsx("strong", { children: "Domicilio:" }),
        " ",
        person.address || /* @__PURE__ */ jsx("span", { className: "text-amber-600", children: "No registrado" })
      ] })
    ] }),
    hasMissingData && /* @__PURE__ */ jsx("div", { className: "mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800", children: "Algunos datos están incompletos. Es recomendable completarlos para que la persona pueda recibir el permiso por WhatsApp." }),
    /* @__PURE__ */ jsx("button", { onClick: () => setShowForm(true), className: "mt-4 w-full border border-blue-800 text-blue-800 font-semibold py-3 rounded-lg", children: "Verificar / completar datos" }),
    /* @__PURE__ */ jsxs("div", { className: "mt-5", children: [
      /* @__PURE__ */ jsx("p", { className: "font-bold text-base mb-3", children: "¿Esta persona pertenece a un convenio?" }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsx("button", { onClick: () => onNoConvenio(person), className: "bg-blue-800 hover:bg-blue-900 text-white font-semibold py-3 rounded-lg", children: "No, venta común" }),
        /* @__PURE__ */ jsx("button", { onClick: () => onContinue(person), className: "bg-violet-700 hover:bg-violet-800 text-white font-semibold py-3 rounded-lg", children: "Sí, pertenece a un convenio" })
      ] })
    ] })
  ] });
}
function ElegirConvenio({
  conventions,
  person,
  onBack,
  onSelect
}) {
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(BackLink, { onBack }),
    /* @__PURE__ */ jsx("h2", { className: "font-bold text-lg mb-1", children: "Seleccioná el convenio" }),
    /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-500 mb-4", children: [
      "Persona: ",
      person.firstName,
      " ",
      person.lastName,
      " — DNI ",
      person.dni
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-violet-50 border border-violet-200 rounded-lg p-3 text-sm text-violet-800 mb-4", children: "Si la persona presenta una credencial o comprobante del convenio, podés asociarla ahora aunque todavía no estuviera registrada como beneficiaria." }),
    /* @__PURE__ */ jsxs("ul", { className: "divide-y divide-slate-100", children: [
      conventions.map((c) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("button", { onClick: () => onSelect(c), className: "w-full text-left py-4 hover:bg-slate-50 px-2 rounded font-medium", children: [
        /* @__PURE__ */ jsx("p", { children: c.name }),
        c.type && /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 mt-1", children: c.type })
      ] }) }, c.id)),
      conventions.length === 0 && /* @__PURE__ */ jsx("li", { className: "text-slate-400 text-sm py-3", children: "No hay convenios activos cargados." })
    ] })
  ] });
}
function ElegirPlan({
  plans,
  persona,
  priceFor,
  onBack,
  onSelect
}) {
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(BackLink, { onBack }),
    /* @__PURE__ */ jsx("h2", { className: "font-bold text-lg mb-1", children: "Seleccioná el plan" }),
    /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-500 mb-1", children: [
      persona.firstName,
      " ",
      persona.lastName,
      " — DNI",
      " ",
      persona.dni
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "text-sm font-semibold text-blue-800 mb-4", children: [
      conditionLabel(persona.conditionType),
      persona.conventionName ? ` — ${persona.conventionName}` : ""
    ] }),
    /* @__PURE__ */ jsx("ul", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: plans.filter((p) => p.active).map((p) => {
      const price = priceFor(p.id, persona.conditionType, persona.conventionId);
      return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("button", { onClick: () => onSelect(p.id), className: "w-full text-left border border-slate-200 rounded-lg p-4 hover:border-blue-600 hover:bg-blue-50 transition-colors", children: [
        /* @__PURE__ */ jsx("p", { className: "font-semibold", children: p.name }),
        p.description && /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 mb-2", children: p.description }),
        /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-blue-900", children: formatARS(price) })
      ] }) }, p.id);
    }) })
  ] });
}
function conditionLabel(c) {
  if (c === "socio") return "Socio";
  if (c === "no_socio") return "No socio";
  return "Convenio";
}
const PAYMENT_METHODS = [{
  value: "efectivo",
  label: "Efectivo"
}, {
  value: "transferencia",
  label: "Transferencia bancaria"
}, {
  value: "mercadopago",
  label: "Mercado Pago"
}, {
  value: "tarjeta",
  label: "Tarjeta"
}, {
  value: "otro",
  label: "Otro"
}];
function Carrito({
  cart,
  total,
  onRemove,
  onAddMore,
  onConfirmed
}) {
  const [method, setMethod] = useState("efectivo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  async function confirm() {
    setLoading(true);
    setError(null);
    try {
      const result = await createSale({
        data: {
          items: cart.map((i) => ({
            personId: i.personId,
            conditionType: i.conditionType,
            conventionId: i.conventionId,
            planId: i.planId
          })),
          paymentMethod: method
        }
      });
      onConfirmed(result.sale, result.items, result.permits);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo registrar la venta.");
    } finally {
      setLoading(false);
    }
  }
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx("h2", { className: "font-bold text-lg mb-3", children: "Resumen de la venta" }),
    /* @__PURE__ */ jsxs("ul", { className: "divide-y divide-slate-100", children: [
      cart.map((item) => /* @__PURE__ */ jsxs("li", { className: "py-3 flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "font-medium", children: item.fullName }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500", children: [
            conditionLabel(item.conditionType),
            item.conventionName ? ` — ${item.conventionName}` : "",
            " ",
            "— ",
            item.planName
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("span", { className: "font-bold text-blue-900", children: formatARS(item.price) }),
          /* @__PURE__ */ jsx("button", { onClick: () => onRemove(item.tempId), className: "text-red-500", children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }) })
        ] })
      ] }, item.tempId)),
      cart.length === 0 && /* @__PURE__ */ jsx("li", { className: "py-4 text-slate-400 text-sm", children: "El carrito está vacío." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center py-3 border-t border-slate-200 mt-2", children: [
      /* @__PURE__ */ jsx("span", { className: "font-bold", children: "TOTAL" }),
      /* @__PURE__ */ jsx("span", { className: "font-bold text-xl text-red-700", children: formatARS(total) })
    ] }),
    /* @__PURE__ */ jsx("button", { onClick: onAddMore, className: "w-full border border-blue-800 text-blue-800 font-semibold py-2.5 rounded-lg mb-4", children: "+ Agregar otra persona" }),
    cart.length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Método de pago" }),
      /* @__PURE__ */ jsx("select", { value: method, onChange: (e) => setMethod(e.target.value), className: "w-full rounded-lg border border-slate-300 px-3 py-2.5 mb-4", children: PAYMENT_METHODS.map((m) => /* @__PURE__ */ jsx("option", { value: m.value, children: m.label }, m.value)) }),
      error && /* @__PURE__ */ jsx("p", { className: "text-red-700 text-sm mb-3", children: error }),
      /* @__PURE__ */ jsx("button", { onClick: confirm, disabled: loading, className: "w-full bg-red-700 hover:bg-red-800 disabled:opacity-60 text-white font-bold py-3.5 rounded-lg text-base", children: loading ? "Confirmando..." : "CONFIRMAR VENTA" })
    ] })
  ] });
}
function normalizeWhatsAppPhone(phone) {
  let value = phone.replace(/\D/g, "");
  if (!value) return "";
  if (value.startsWith("54")) {
    value = value.slice(2);
    if (value.startsWith("9")) {
      value = value.slice(1);
    }
  }
  if (value.startsWith("0")) {
    value = value.slice(1);
  }
  return `54${value}`;
}
function buildWhatsAppUrl({
  phone,
  fullName,
  dni,
  planName,
  startDate,
  endDate,
  saleNumber,
  permitCode
}) {
  const normalizedPhone = normalizeWhatsAppPhone(phone);
  if (!normalizedPhone) return null;
  const message = ["🏊 CLUB ATLÉTICO ESTUDIANTES", "", "Tu permiso para la pileta fue registrado correctamente.", "", `👤 ${fullName}`, `🪪 DNI: ${dni}`, `📋 Plan: ${planName}`, `📅 Válido desde: ${formatDateAR(startDate)}`, `📅 Válido hasta: ${formatDateAR(endDate)}`, `🧾 Venta N°: ${saleNumber}`, "", "🔐 Código del permiso:", permitCode, "", "Al ingresar, presentá el código QR correspondiente a este permiso.", "", "¡Gracias por elegir el Club Atlético Estudiantes!"].join("\n");
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}
function VentaConfirmada({
  sale,
  items,
  permits,
  onNueva
}) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-emerald-700 font-bold text-lg mb-1", children: [
        /* @__PURE__ */ jsx(CheckCircle2, { className: "w-6 h-6" }),
        "Venta confirmada"
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-500", children: [
        "N° de venta: ",
        sale.saleNumber,
        " — Total:",
        " ",
        formatARS(sale.totalAmount)
      ] })
    ] }),
    items.map((item) => {
      const permit = permits.find((p) => p.saleItemId === item.id);
      const phone = item.person?.phone ?? "";
      const whatsappUrl = permit && phone ? buildWhatsAppUrl({
        phone,
        fullName: `${item.person.firstName} ${item.person.lastName}`,
        dni: item.person.dni,
        planName: item.plan?.name ?? "Pase de pileta",
        startDate: permit.startDate,
        endDate: permit.endDate,
        saleNumber: sale.saleNumber,
        permitCode: permit.code
      }) : null;
      return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-4 items-center sm:items-start", children: [
        permit && /* @__PURE__ */ jsx(QrCode, { value: permit.code, size: 160 }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 text-center sm:text-left", children: [
          /* @__PURE__ */ jsxs("p", { className: "font-bold text-lg", children: [
            item.person.firstName,
            " ",
            item.person.lastName
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-500 mb-2", children: [
            "DNI ",
            item.person.dni,
            " —",
            " ",
            item.plan.name
          ] }),
          /* @__PURE__ */ jsx("p", { className: "font-semibold text-emerald-700", children: "PERMISO VÁLIDO" }),
          permit && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-600", children: [
              "Desde",
              " ",
              formatDateAR(permit.startDate),
              " ",
              "hasta",
              " ",
              formatDateAR(permit.endDate)
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-3 bg-slate-50 border border-slate-200 rounded-lg p-3", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 font-medium", children: "Código de validación" }),
              /* @__PURE__ */ jsx("p", { className: "text-lg font-bold tracking-wider text-blue-900", children: permit.code })
            ] })
          ] }),
          phone ? /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500 mt-2", children: [
            "WhatsApp: ",
            phone
          ] }) : /* @__PURE__ */ jsx("p", { className: "text-xs text-amber-600 mt-2", children: "Esta persona no tiene teléfono registrado." }),
          whatsappUrl && /* @__PURE__ */ jsxs("a", { href: whatsappUrl, target: "_blank", rel: "noopener noreferrer", className: "mt-4 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-5 rounded-lg transition-colors", children: [
            /* @__PURE__ */ jsx(MessageCircle, { className: "w-5 h-5" }),
            "Enviar por WhatsApp"
          ] })
        ] })
      ] }) }, item.id);
    }),
    /* @__PURE__ */ jsx("button", { onClick: onNueva, className: "w-full bg-blue-900 text-white font-semibold py-3 rounded-lg", children: "Registrar otra venta" })
  ] });
}
export {
  VentaRapida as component
};
