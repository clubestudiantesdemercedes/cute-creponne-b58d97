import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { ScanLine, Search, Camera, CameraOff, CheckCircle2, XCircle } from "lucide-react";
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
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState("scan");
  const [dni, setDni] = useState("");
  const [manualLookup, setManualLookup] = useState(null);
  const [busy, setBusy] = useState(false);
  async function handleCode(code) {
    if (busy) return;
    setBusy(true);
    try {
      const r = await registerEntry({
        data: {
          code,
          method: "qr"
        }
      });
      setResult(r);
    } finally {
      setBusy(false);
    }
  }
  async function handleManualSearch(e) {
    e.preventDefault();
    setResult(null);
    const r = await findActivePermitsByDni({
      data: {
        dni
      }
    });
    setManualLookup(r);
  }
  async function checkInPerson(personId, force = false) {
    setBusy(true);
    try {
      const r = await registerEntry({
        data: {
          personId,
          method: "manual",
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
  return /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5", children: [
    /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-slate-900 flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(ScanLine, { className: "w-6 h-6" }),
      " Control de ingreso"
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
        /* @__PURE__ */ jsxs("button", { className: "bg-blue-900 text-white px-4 rounded-lg font-semibold flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(Search, { className: "w-4 h-4" }),
          " Buscar"
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
        /* @__PURE__ */ jsxs("ul", { className: "divide-y divide-slate-100", children: [
          manualLookup.permits.map((p) => /* @__PURE__ */ jsxs("li", { className: "py-2 flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: p.plan.name }),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500", children: [
                formatDateAR(p.permit.startDate),
                " — ",
                formatDateAR(p.permit.endDate),
                " (",
                p.liveStatus,
                ")"
              ] })
            ] }),
            p.liveStatus === "activo" && /* @__PURE__ */ jsx("button", { onClick: () => checkInPerson(manualLookup.person.id), disabled: busy, className: "bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded-lg", children: "Registrar ingreso" })
          ] }, p.permit.id)),
          manualLookup.permits.length === 0 && /* @__PURE__ */ jsx("li", { className: "py-2 text-sm text-slate-400", children: "No tiene permisos cargados." })
        ] })
      ] })
    ] }),
    result && /* @__PURE__ */ jsx(ResultPanel, { result, onReset: reset, onForce: (personId) => checkInPerson(personId, true) })
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
          if (stop || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0 && !busy) {
              onCode(codes[0].rawValue);
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
  }, [active, busy, onCode]);
  return /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm p-5 space-y-4", children: [
    !active ? /* @__PURE__ */ jsxs("button", { onClick: () => setActive(true), className: "w-full flex flex-col items-center gap-2 py-10 border-2 border-dashed border-blue-300 rounded-xl text-blue-800", children: [
      /* @__PURE__ */ jsx(Camera, { className: "w-10 h-10" }),
      /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "Activar cámara" })
    ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsx("video", { ref: videoRef, className: "w-full rounded-lg bg-black aspect-square object-cover", muted: true, playsInline: true }),
      /* @__PURE__ */ jsxs("button", { onClick: () => setActive(false), className: "w-full flex items-center justify-center gap-2 py-2 text-sm text-slate-500 border border-slate-300 rounded-lg", children: [
        /* @__PURE__ */ jsx(CameraOff, { className: "w-4 h-4" }),
        " Apagar cámara"
      ] })
    ] }),
    error && /* @__PURE__ */ jsx("p", { className: "text-sm text-amber-700 bg-amber-50 rounded-lg p-3", children: error }),
    /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
      e.preventDefault();
      if (manualCode.trim()) onCode(manualCode.trim());
    }, className: "flex gap-2 pt-2 border-t border-slate-100", children: [
      /* @__PURE__ */ jsx("input", { className: "flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm", placeholder: "O ingresá el código del permiso manualmente", value: manualCode, onChange: (e) => setManualCode(e.target.value) }),
      /* @__PURE__ */ jsx("button", { className: "bg-slate-800 text-white px-3 rounded-lg text-sm font-semibold", children: "Validar" })
    ] })
  ] });
}
function ResultPanel({
  result,
  onReset,
  onForce
}) {
  if (result.authorized) {
    return /* @__PURE__ */ jsxs("div", { className: "bg-emerald-50 border-2 border-emerald-500 rounded-xl p-6 text-center space-y-2", children: [
      /* @__PURE__ */ jsx(CheckCircle2, { className: "w-16 h-16 text-emerald-600 mx-auto" }),
      /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-emerald-700", children: "INGRESO AUTORIZADO" }),
      /* @__PURE__ */ jsxs("p", { className: "text-lg font-semibold", children: [
        result.person.firstName,
        " ",
        result.person.lastName
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-600", children: [
        "DNI ",
        result.person.dni,
        " — ",
        result.plan.name
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-600", children: [
        "Válido hasta ",
        formatDateAR(result.permit.endDate)
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: onReset, className: "mt-4 w-full bg-emerald-600 text-white font-semibold py-3 rounded-lg", children: "Siguiente" })
    ] });
  }
  const reasonText = {
    no_permit: "Esta persona no tiene ningún permiso registrado.",
    expired: "El permiso está vencido.",
    not_valid_yet: "El permiso todavía no comenzó su vigencia.",
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
      "Último ingreso hace ",
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
