import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { UserPlus, X, Search, Users, Pencil, History } from "lucide-react";
import { f as createOrUpdatePerson, e as searchNonMembers, B as findPersonByDni, C as setPersonStatus } from "./router-D33gD1Az.js";
import { f as findActivePermitsByDni } from "./permits.functions-DTMs4qjC.js";
import { b as formatDateAR, c as formatDateTimeAR } from "./format-COLuSK5l.js";
import "@tanstack/react-router";
import "zod";
import "../server.js";
import "node:async_hooks";
import "node:stream";
import "@tanstack/react-router/ssr/server";
const emptyForm = {
  dni: "",
  firstName: "",
  lastName: "",
  birthDate: "",
  phone: "",
  email: "",
  address: "",
  notes: ""
};
function PersonasPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [directHit, setDirectHit] = useState(null);
  const [selectedDni, setSelectedDni] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  function resetForm() {
    setForm(emptyForm);
    setEditing(false);
    setShowForm(false);
  }
  function openNewPerson() {
    setForm(emptyForm);
    setEditing(false);
    setShowForm(true);
  }
  function openEditPerson(person) {
    setForm({
      id: person.id,
      dni: person.dni,
      firstName: person.firstName,
      lastName: person.lastName,
      birthDate: person.birthDate ? String(person.birthDate).slice(0, 10) : "",
      phone: person.phone ?? "",
      email: person.email ?? "",
      address: person.address ?? "",
      notes: person.notes ?? ""
    });
    setEditing(true);
    setShowForm(true);
  }
  async function doSearch(e) {
    e.preventDefault();
    setLoading(true);
    setSelectedDni(null);
    setHistory(null);
    try {
      const q = query.trim();
      if (!q) {
        setResults([]);
        setDirectHit(null);
        return;
      }
      const [peopleResults, direct] = await Promise.all([searchNonMembers({
        data: {
          query: q
        }
      }), findPersonByDni({
        data: {
          dni: q
        }
      })]);
      setResults(peopleResults);
      setDirectHit(direct?.member ? null : direct);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "No se pudo realizar la búsqueda.");
    } finally {
      setLoading(false);
    }
  }
  async function loadAll() {
    setLoadingAll(true);
    setSelectedDni(null);
    setHistory(null);
    setQuery("");
    setDirectHit(null);
    try {
      const peopleResults = await searchNonMembers({
        data: {
          query: ""
        }
      });
      setResults(peopleResults);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "No se pudieron cargar las personas.");
    } finally {
      setLoadingAll(false);
    }
  }
  async function openHistory(dni) {
    setSelectedDni(dni);
    try {
      const h = await findActivePermitsByDni({
        data: {
          dni
        }
      });
      setHistory(h);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "No se pudo cargar la ficha de la persona.");
    }
  }
  async function savePerson(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await createOrUpdatePerson({
        data: form
      });
      if (result.created) {
        alert("Persona creada correctamente.");
      } else {
        alert("Persona modificada correctamente.");
      }
      resetForm();
      if (query.trim()) {
        const updatedResults = await searchNonMembers({
          data: {
            query: query.trim()
          }
        });
        setResults(updatedResults);
        const updatedDirect = await findPersonByDni({
          data: {
            dni: query.trim()
          }
        });
        setDirectHit(updatedDirect?.member ? null : updatedDirect);
      } else {
        const updatedResults = await searchNonMembers({
          data: {
            query: ""
          }
        });
        setResults(updatedResults);
      }
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "No se pudo guardar la persona.");
    } finally {
      setSaving(false);
    }
  }
  async function changeStatus(personId, dni, status) {
    try {
      await setPersonStatus({
        data: {
          personId,
          status
        }
      });
      await openHistory(dni);
      if (query.trim()) {
        const updatedResults = await searchNonMembers({
          data: {
            query: query.trim()
          }
        });
        setResults(updatedResults);
      } else {
        const updatedResults = await searchNonMembers({
          data: {
            query: ""
          }
        });
        setResults(updatedResults);
      }
      const updatedDirect = await findPersonByDni({
        data: {
          dni
        }
      });
      setDirectHit(updatedDirect?.member ? null : updatedDirect);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "No se pudo modificar el estado.");
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-slate-900", children: "Personas" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mt-1", children: "Personas que no son socios del club." })
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: openNewPerson, className: "bg-blue-900 hover:bg-blue-800 text-white px-4 py-2.5 rounded-lg font-semibold flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(UserPlus, { className: "w-4 h-4" }),
        "Nueva persona"
      ] })
    ] }),
    showForm && /* @__PURE__ */ jsxs("form", { onSubmit: savePerson, className: "bg-white rounded-xl shadow-sm p-5 space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-slate-900", children: editing ? "Editar persona" : "Nueva persona" }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: resetForm, className: "text-slate-500 hover:text-slate-700", title: "Cerrar", children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "DNI *" }),
          /* @__PURE__ */ jsx("input", { required: true, className: "w-full rounded-lg border border-slate-300 px-3 py-2.5", value: form.dni, onChange: (e) => setForm({
            ...form,
            dni: e.target.value
          }), placeholder: "Ej. 30123456" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "Nombre *" }),
          /* @__PURE__ */ jsx("input", { required: true, className: "w-full rounded-lg border border-slate-300 px-3 py-2.5", value: form.firstName, onChange: (e) => setForm({
            ...form,
            firstName: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "Apellido *" }),
          /* @__PURE__ */ jsx("input", { required: true, className: "w-full rounded-lg border border-slate-300 px-3 py-2.5", value: form.lastName, onChange: (e) => setForm({
            ...form,
            lastName: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "Fecha de nacimiento" }),
          /* @__PURE__ */ jsx("input", { type: "date", className: "w-full rounded-lg border border-slate-300 px-3 py-2.5", value: form.birthDate, onChange: (e) => setForm({
            ...form,
            birthDate: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "Teléfono" }),
          /* @__PURE__ */ jsx("input", { className: "w-full rounded-lg border border-slate-300 px-3 py-2.5", value: form.phone, onChange: (e) => setForm({
            ...form,
            phone: e.target.value
          }), placeholder: "Ej. 02324 123456" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "Email" }),
          /* @__PURE__ */ jsx("input", { type: "email", className: "w-full rounded-lg border border-slate-300 px-3 py-2.5", value: form.email, onChange: (e) => setForm({
            ...form,
            email: e.target.value
          }), placeholder: "correo@ejemplo.com" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "Dirección" }),
          /* @__PURE__ */ jsx("input", { className: "w-full rounded-lg border border-slate-300 px-3 py-2.5", value: form.address, onChange: (e) => setForm({
            ...form,
            address: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "Observaciones" }),
          /* @__PURE__ */ jsx("textarea", { className: "w-full rounded-lg border border-slate-300 px-3 py-2.5", rows: 3, value: form.notes, onChange: (e) => setForm({
            ...form,
            notes: e.target.value
          }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [
        /* @__PURE__ */ jsx("button", { type: "button", onClick: resetForm, className: "px-4 py-2.5 rounded-lg border border-slate-300", children: "Cancelar" }),
        /* @__PURE__ */ jsx("button", { type: "submit", disabled: saving, className: "bg-blue-900 text-white px-4 py-2.5 rounded-lg font-semibold disabled:opacity-50", children: saving ? "Guardando..." : editing ? "Guardar cambios" : "Guardar persona" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("form", { onSubmit: doSearch, className: "bg-white rounded-xl shadow-sm p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-2", children: [
      /* @__PURE__ */ jsx("input", { className: "flex-1 rounded-lg border border-slate-300 px-3 py-2.5", placeholder: "Buscar por DNI, nombre o apellido", value: query, onChange: (e) => setQuery(e.target.value) }),
      /* @__PURE__ */ jsxs("button", { type: "submit", disabled: loading, className: "bg-blue-900 hover:bg-blue-800 disabled:opacity-60 text-white px-4 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-1.5", children: [
        /* @__PURE__ */ jsx(Search, { className: "w-4 h-4" }),
        loading ? "Buscando..." : "Buscar"
      ] }),
      /* @__PURE__ */ jsxs("button", { type: "button", onClick: loadAll, disabled: loadingAll, className: "border border-slate-300 hover:bg-slate-50 px-4 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-1.5", children: [
        /* @__PURE__ */ jsx(Users, { className: "w-4 h-4" }),
        loadingAll ? "Cargando..." : "Ver todas"
      ] })
    ] }) }),
    !selectedDni && /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm divide-y divide-slate-100", children: [
      directHit && /* @__PURE__ */ jsx(PersonRow, { name: `${directHit.person.firstName} ${directHit.person.lastName}`, dni: directHit.person.dni, status: directHit.person.status, onOpen: () => openHistory(directHit.person.dni), onEdit: () => openEditPerson(directHit.person) }),
      results.map((r) => /* @__PURE__ */ jsx(PersonRow, { name: `${r.person.firstName} ${r.person.lastName}`, dni: r.person.dni, status: r.person.status, onOpen: () => openHistory(r.person.dni), onEdit: () => openEditPerson(r.person) }, r.person.id)),
      !loading && !loadingAll && results.length === 0 && !directHit && /* @__PURE__ */ jsx("div", { className: "p-6 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: 'Buscá una persona o utilizá "Ver todas".' }) })
    ] }),
    selectedDni && history && /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm p-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3 mb-4", children: [
        /* @__PURE__ */ jsx("button", { onClick: () => {
          setSelectedDni(null);
          setHistory(null);
        }, className: "text-sm text-slate-500 hover:text-slate-700", children: "← Volver a la búsqueda" }),
        /* @__PURE__ */ jsxs("button", { onClick: () => openEditPerson(history.person), className: "flex items-center gap-1.5 text-sm border border-blue-300 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-50", children: [
          /* @__PURE__ */ jsx(Pencil, { className: "w-4 h-4" }),
          "Editar"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-xl font-bold", children: [
            history.person.firstName,
            " ",
            history.person.lastName
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-500", children: [
            "DNI ",
            history.person.dni
          ] })
        ] }),
        /* @__PURE__ */ jsx("span", { className: `text-xs font-semibold px-2.5 py-1 rounded-full ${history.person.status === "activo" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`, children: history.person.status === "activo" ? "Activo" : "Inactivo" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-1 text-sm text-slate-500", children: [
        history.person.birthDate && /* @__PURE__ */ jsxs("p", { children: [
          "Fecha de nacimiento:",
          " ",
          formatDateAR(history.person.birthDate)
        ] }),
        history.person.phone && /* @__PURE__ */ jsxs("p", { children: [
          "Teléfono: ",
          history.person.phone
        ] }),
        history.person.email && /* @__PURE__ */ jsxs("p", { children: [
          "Email: ",
          history.person.email
        ] }),
        history.person.address && /* @__PURE__ */ jsxs("p", { children: [
          "Dirección: ",
          history.person.address
        ] }),
        history.person.notes && /* @__PURE__ */ jsxs("p", { children: [
          "Observaciones: ",
          history.person.notes
        ] })
      ] }),
      history.lastEntry && /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-600 mt-4", children: [
        "Último ingreso:",
        " ",
        formatDateTimeAR(history.lastEntry.occurredAt)
      ] }),
      /* @__PURE__ */ jsxs("h3", { className: "font-semibold flex items-center gap-2 mt-5 mb-2", children: [
        /* @__PURE__ */ jsx(History, { className: "w-4 h-4" }),
        "Permisos"
      ] }),
      /* @__PURE__ */ jsxs("ul", { className: "divide-y divide-slate-100", children: [
        history.permits.map((p) => /* @__PURE__ */ jsxs("li", { className: "py-2 flex items-center justify-between text-sm gap-4", children: [
          /* @__PURE__ */ jsxs("span", { children: [
            p.plan.name,
            " ",
            p.convention ? `— ${p.convention.name}` : ""
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "text-slate-500 text-right", children: [
            formatDateAR(p.permit.startDate),
            " –",
            " ",
            formatDateAR(p.permit.endDate),
            " (",
            p.liveStatus,
            ")"
          ] })
        ] }, p.permit.id)),
        history.permits.length === 0 && /* @__PURE__ */ jsx("li", { className: "py-2 text-slate-400 text-sm", children: "Sin permisos registrados." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-5 flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsx("button", { onClick: () => changeStatus(history.person.id, history.person.dni, "inactivo"), disabled: history.person.status === "inactivo", className: "text-sm border border-red-300 text-red-700 px-3 py-2 rounded-lg disabled:opacity-40", children: "Marcar inactivo" }),
        /* @__PURE__ */ jsx("button", { onClick: () => changeStatus(history.person.id, history.person.dni, "activo"), disabled: history.person.status === "activo", className: "text-sm border border-emerald-300 text-emerald-700 px-3 py-2 rounded-lg disabled:opacity-40", children: "Marcar activo" })
      ] })
    ] })
  ] });
}
function PersonRow({
  name,
  dni,
  status,
  onOpen,
  onEdit
}) {
  return /* @__PURE__ */ jsxs("div", { className: "p-4 hover:bg-slate-50 flex items-center justify-between gap-4", children: [
    /* @__PURE__ */ jsxs("button", { type: "button", onClick: onOpen, className: "flex-1 text-left min-w-0", children: [
      /* @__PURE__ */ jsx("p", { className: "font-medium text-slate-900", children: name }),
      /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500 mt-0.5", children: [
        "DNI ",
        dni
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [
      /* @__PURE__ */ jsx("span", { className: `text-xs font-semibold px-2.5 py-1 rounded-full ${status === "activo" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`, children: status === "activo" ? "Activo" : "Inactivo" }),
      /* @__PURE__ */ jsxs("button", { type: "button", onClick: onEdit, className: "flex items-center gap-1.5 text-xs border border-slate-300 text-slate-700 px-2.5 py-1.5 rounded-lg hover:bg-white", children: [
        /* @__PURE__ */ jsx(Pencil, { className: "w-3.5 h-3.5" }),
        "Editar"
      ] })
    ] })
  ] });
}
export {
  PersonasPage as component
};
