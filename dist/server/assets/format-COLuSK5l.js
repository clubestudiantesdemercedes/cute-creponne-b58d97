function formatARS(amount) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(amount);
}
function formatDateAR(value) {
  if (!value) return "-";
  const d = typeof value === "string" ? /* @__PURE__ */ new Date(value + "T00:00:00") : value;
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires"
  }).format(d);
}
function formatDateTimeAR(value) {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Argentina/Buenos_Aires"
  }).format(d);
}
function todayISO() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(/* @__PURE__ */ new Date());
  const y = parts.find((p) => p.type === "year").value;
  const m = parts.find((p) => p.type === "month").value;
  const d = parts.find((p) => p.type === "day").value;
  return `${y}-${m}-${d}`;
}
function addDaysISO(startISO, days) {
  const d = /* @__PURE__ */ new Date(startISO + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function daysUntil(dateISO) {
  const today = /* @__PURE__ */ new Date(todayISO() + "T00:00:00Z");
  const target = /* @__PURE__ */ new Date(dateISO + "T00:00:00Z");
  return Math.round((target.getTime() - today.getTime()) / (1e3 * 60 * 60 * 24));
}
export {
  addDaysISO as a,
  formatDateAR as b,
  formatDateTimeAR as c,
  daysUntil as d,
  formatARS as f,
  todayISO as t
};
