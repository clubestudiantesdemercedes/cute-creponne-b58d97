import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useRef, useCallback, useEffect } from "react";
import { ScanLine, Dumbbell, Waves, Search, Camera, CameraOff, CheckCircle2, XCircle } from "lucide-react";
import { D as registerEntry } from "./router-D33gD1Az.js";
import { f as findActivePermitsByDni } from "./permits.functions-DTMs4qjC.js";
import { b as formatDateAR } from "./format-COLuSK5l.js";
import "@tanstack/react-router";
import "zod";
import "../server.js";
import "node:async_hooks";
import "node:stream";
import "@tanstack/react-router/ssr/server";
function ControlIngreso() {
  const [entryType, setEntryType] = useState(null);
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState("scan");
  const [dni, setDni] = useState("");
  const [manualLookup, setManualLookup] = useState(null);
  const [busy, setBusy] = useState(false);
  async function handleCode(code) {
    if (busy || !entryType) return;
    setBusy(true);
    try {
      const r = await registerEntry({
        data: {
          code,
          method: "qr",
          entryType
        }
      });
      setResult(r);
    } finally {
      setBusy(false);
    }
  }
  async function handleManualSearch(e) {
    e.preventDefault();
    if (!entryType) return;
    setResult(null);
    const r = await findActivePermitsByDni({
      data: {
        dni
      }
    });
    setManualLookup(r);
  }
  async function checkInPerson(personId, force = false) {
    if (!entryType) return;
    setBusy(true);
    try {
      const r = await registerEntry({
        data: {
          personId,
          method: "manual",
          entryType,
          force
        }
      });
      setResult(r);
    } finally {
      setBusy(false);
    }
  }
  function reset() {
    setResult(null);
    setManualLookup(null);
    setDni("");
  }
  function changeEntryType(type) {
    setEntryType(type);
    reset();
    setMode("scan");
  }
  function backToEntryTypeSelection() {
    setEntryType(null);
    reset();
    setMode("scan");
  }
  if (!entryType) {
    return /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6", children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-slate-900 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(ScanLine, { className: "w-6 h-6" }),
        "Control de ingreso"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm p-5", children: [
        /* @__PURE__ */ jsx("p", { className: "text-lg font-semibold text-slate-900 text-center mb-5", children: "¿Qué ingreso querés registrar?" }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("button", { onClick: () => changeEntryType("campo_deportes"), className: "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-slate-200 bg-white p-6 hover:border-blue-500 hover:bg-blue-50 transition", children: [
            /* @__PURE__ */ jsx(Dumbbell, { className: "w-12 h-12 text-blue-800" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-slate-900", children: "Campo de deportes" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mt-1", children: "No requiere permiso de pileta" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("button", { onClick: () => changeEntryType("pileta"), className: "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-slate-200 bg-white p-6 hover:border-cyan-500 hover:bg-cyan-50 transition", children: [
            /* @__PURE__ */ jsx(Waves, { className: "w-12 h-12 text-cyan-700" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-slate-900", children: "Pileta" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mt-1", children: "Requiere permiso vigente" })
            ] })
          ] })
        ] })
      ] })
    ] });
  }
  const entryTypeLabel = entryType === "campo_deportes" ? "Campo de deportes" : "Pileta";
  const EntryIcon = entryType === "campo_deportes" ? Dumbbell : Waves;
  return /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-slate-900 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(EntryIcon, { className: "w-6 h-6" }),
        "Control de ingreso"
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: backToEntryTypeSelection, className: "text-sm font-semibold text-blue-800 hover:underline", children: "Cambiar" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: `rounded-xl border-2 p-4 flex items-center gap-3 ${entryType === "campo_deportes" ? "border-blue-200 bg-blue-50" : "border-cyan-200 bg-cyan-50"}`, children: [
      /* @__PURE__ */ jsx(EntryIcon, { className: `w-8 h-8 ${entryType === "campo_deportes" ? "text-blue-800" : "text-cyan-700"}` }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-900", children: entryTypeLabel }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-600", children: entryType === "campo_deportes" ? "El ingreso se registra sin validar permiso de pileta." : "El ingreso requiere un permiso de pileta vigente." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsx("button", { onClick: () => {
        setMode("scan");
        reset();
      }, className: `flex-1 py-2.5 rounded-lg font-semibold text-sm ${mode === "scan" ? "bg-blue-900 text-white" : "bg-white border border-slate-300"}`, children: "Escanear QR" }),
      /* @__PURE__ */ jsx("button", { onClick: () => {
        setMode("manual");
        reset();
      }, className: `flex-1 py-2.5 rounded-lg font-semibold text-sm ${mode === "manual" ? "bg-blue-900 text-white" : "bg-white border border-slate-300"}`, children: "Buscar por DNI" })
    ] }),
    !result && mode === "scan" && /* @__PURE__ */ jsx(Scanner, { onCode: handleCode, busy }),
    !result && mode === "manual" && /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm p-5", children: [
      /* @__PURE__ */ jsxs("form", { onSubmit: handleManualSearch, className: "flex gap-2", children: [
        /* @__PURE__ */ jsx("input", { className: "flex-1 rounded-lg border border-slate-300 px-3 py-2.5", placeholder: "DNI", value: dni, onChange: (e) => setDni(e.target.value), autoFocus: true, required: true }),
        /* @__PURE__ */ jsxs("button", { disabled: busy, className: "bg-blue-900 text-white px-4 rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-50", children: [
          /* @__PURE__ */ jsx(Search, { className: "w-4 h-4" }),
          "Buscar"
        ] })
      ] }),
      manualLookup === null && dni && /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400 mt-3", children: "Ingresá el DNI y buscá." }),
      manualLookup === null ? null : !manualLookup ? /* @__PURE__ */ jsx("p", { className: "text-red-700 font-medium mt-4", children: "No se encontró ninguna persona con ese DNI." }) : /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
        /* @__PURE__ */ jsxs("p", { className: "font-semibold text-lg", children: [
          manualLookup.person.firstName,
          " ",
          manualLookup.person.lastName
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-500 mb-3", children: [
          "DNI ",
          manualLookup.person.dni
        ] }),
        entryType === "campo_deportes" ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-blue-50 border border-blue-200 p-4", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-blue-900 mb-3", children: "El campo de deportes no requiere un permiso de pileta." }),
          /* @__PURE__ */ jsx("button", { onClick: () => checkInPerson(manualLookup.person.id), disabled: busy, className: "w-full bg-blue-900 text-white font-semibold px-3 py-3 rounded-lg disabled:opacity-50", children: "Registrar ingreso al campo de deportes" })
        ] }) : (
          /* ================================================
             PILETA
             ================================================ */
          /* @__PURE__ */ jsxs("ul", { className: "divide-y divide-slate-100", children: [
            manualLookup.permits.map((p) => /* @__PURE__ */ jsxs("li", { className: "py-2 flex items-center justify-between gap-3", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: p.plan.name }),
                /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500", children: [
                  formatDateAR(p.permit.startDate),
                  " ",
                  "—",
                  " ",
                  formatDateAR(p.permit.endDate),
                  " ",
                  "(",
                  p.liveStatus,
                  ")"
                ] })
              ] }),
              p.liveStatus === "activo" && /* @__PURE__ */ jsx("button", { onClick: () => checkInPerson(manualLookup.person.id), disabled: busy, className: "bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-50", children: "Registrar ingreso" })
            ] }, p.permit.id)),
            manualLookup.permits.length === 0 && /* @__PURE__ */ jsx("li", { className: "py-2 text-sm text-slate-400", children: "No tiene permisos cargados." })
          ] })
        )
      ] })
    ] }),
    result && /* @__PURE__ */ jsx(ResultPanel, { result, entryType, onReset: reset, onForce: (personId) => checkInPerson(personId, true) })
  ] });
}
function Scanner({
  onCode,
  busy
}) {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const [active, setActive] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const handleDetectedCode = useCallback((code) => {
    if (!busy) {
      onCode(code);
    }
  }, [busy, onCode]);
  useEffect(() => {
    if (!active) return;
    let stream = null;
    let stop = false;
    let raf = 0;
    async function start() {
      if (!("BarcodeDetector" in window)) {
        setError("Este navegador no soporta escaneo automático de QR. Usá la carga manual del código o la búsqueda por DNI.");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment"
          }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const detector = new window.BarcodeDetector({
          formats: ["qr_code"]
        });
        const tick = async () => {
          if (stop || !videoRef.current) {
            return;
          }
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0 && !busy) {
              handleDetectedCode(codes[0].rawValue);
              return;
            }
          } catch {
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch {
        setError("No se pudo acceder a la cámara. Verificá los permisos del navegador.");
      }
    }
    start();
    return () => {
      stop = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [active, busy, handleDetectedCode]);
  return /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm p-5 space-y-4", children: [
    !active ? /* @__PURE__ */ jsxs("button", { onClick: () => {
      setError(null);
      setActive(true);
    }, className: "w-full flex flex-col items-center gap-2 py-10 border-2 border-dashed border-blue-300 rounded-xl text-blue-800", children: [
      /* @__PURE__ */ jsx(Camera, { className: "w-10 h-10" }),
      /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "Activar cámara" })
    ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsx("video", { ref: videoRef, className: "w-full rounded-lg bg-black aspect-square object-cover", muted: true, playsInline: true }),
      /* @__PURE__ */ jsxs("button", { onClick: () => setActive(false), className: "w-full flex items-center justify-center gap-2 py-2 text-sm text-slate-500 border border-slate-300 rounded-lg", children: [
        /* @__PURE__ */ jsx(CameraOff, { className: "w-4 h-4" }),
        "Apagar cámara"
      ] })
    ] }),
    error && /* @__PURE__ */ jsx("p", { className: "text-sm text-amber-700 bg-amber-50 rounded-lg p-3", children: error }),
    /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
      e.preventDefault();
      if (manualCode.trim()) {
        handleDetectedCode(manualCode.trim());
      }
    }, className: "flex gap-2 pt-2 border-t border-slate-100", children: [
      /* @__PURE__ */ jsx("input", { className: "flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm", placeholder: "O ingresá el código del permiso manualmente", value: manualCode, onChange: (e) => setManualCode(e.target.value) }),
      /* @__PURE__ */ jsx("button", { disabled: busy, className: "bg-slate-800 text-white px-3 rounded-lg text-sm font-semibold disabled:opacity-50", children: "Validar" })
    ] })
  ] });
}
function ResultPanel({
  result,
  entryType,
  onReset,
  onForce
}) {
  if (result.authorized) {
    const isCampo = entryType === "campo_deportes";
    return /* @__PURE__ */ jsxs("div", { className: "bg-emerald-50 border-2 border-emerald-500 rounded-xl p-6 text-center space-y-2", children: [
      /* @__PURE__ */ jsx(CheckCircle2, { className: "w-16 h-16 text-emerald-600 mx-auto" }),
      /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-emerald-700", children: "INGRESO REGISTRADO" }),
      /* @__PURE__ */ jsxs("p", { className: "text-lg font-semibold", children: [
        result.person.firstName,
        " ",
        result.person.lastName
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-600", children: [
        "DNI ",
        result.person.dni
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "pt-2", children: [
        /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800", children: isCampo ? "🏀 Campo de deportes" : "🏊 Pileta" }),
        !isCampo && result.plan && result.permit && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-600", children: result.plan.name }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-600", children: [
            "Válido hasta",
            " ",
            formatDateAR(result.permit.endDate)
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: onReset, className: "mt-4 w-full bg-emerald-600 text-white font-semibold py-3 rounded-lg", children: "Siguiente" })
    ] });
  }
  const reasonText = {
    no_person: "No se encontró una persona asociada a este código.",
    no_permit: "Esta persona no tiene ningún permiso registrado.",
    person_inactive: "La persona se encuentra inactiva.",
    expired: "El permiso está vencido.",
    not_valid_yet: "El permiso todavía no comenzó su vigencia.",
    cancelled: "El permiso está cancelado.",
    duplicate: "Ya se registró un ingreso reciente para esta persona."
  };
  return /* @__PURE__ */ jsxs("div", { className: "bg-red-50 border-2 border-red-500 rounded-xl p-6 text-center space-y-2", children: [
    /* @__PURE__ */ jsx(XCircle, { className: "w-16 h-16 text-red-600 mx-auto" }),
    /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-red-700", children: "INGRESO DENEGADO" }),
    "person" in result && result.person && /* @__PURE__ */ jsxs("p", { className: "text-lg font-semibold", children: [
      result.person.firstName,
      " ",
      result.person.lastName
    ] }),
    /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-600", children: reasonText[result.reason] ?? "No se pudo autorizar el ingreso." }),
    result.reason === "duplicate" && "minutesAgo" in result && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500", children: [
      "Último ingreso hace",
      " ",
      result.minutesAgo,
      " minuto(s)."
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mt-4", children: [
      result.reason === "duplicate" && "person" in result && result.person && /* @__PURE__ */ jsx("button", { onClick: () => onForce(result.person.id), className: "flex-1 bg-amber-600 text-white font-semibold py-3 rounded-lg", children: "Autorizar de todos modos" }),
      /* @__PURE__ */ jsx("button", { onClick: onReset, className: "flex-1 bg-slate-700 text-white font-semibold py-3 rounded-lg", children: "Siguiente" })
    ] })
  ] });
}
export {
  ControlIngreso as component
};
