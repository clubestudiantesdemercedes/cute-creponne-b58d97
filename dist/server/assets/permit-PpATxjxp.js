import { a as addDaysISO } from "./format-COLuSK5l.js";
function computePermitDates(plan, purchaseDateISO) {
  if (plan.durationUnit === "temporada") {
    return {
      startDate: plan.seasonStart ?? purchaseDateISO,
      endDate: plan.seasonEnd ?? purchaseDateISO
    };
  }
  const startDate = purchaseDateISO;
  const endDate = addDaysISO(
    startDate,
    Math.max(plan.durationValue, 1) - 1
  );
  return { startDate, endDate };
}
function randomCode(prefix) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  if (!prefix) {
    const length2 = 24;
    const bytes2 = crypto.getRandomValues(
      new Uint8Array(length2)
    );
    let out2 = "";
    for (let i = 0; i < length2; i++) {
      out2 += alphabet[bytes2[i] % alphabet.length];
    }
    return out2;
  }
  const length = 4;
  const bytes = crypto.getRandomValues(
    new Uint8Array(length)
  );
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return `${prefix}-${out}`;
}
function generateSaleNumber() {
  const now = /* @__PURE__ */ new Date();
  const stamp = now.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  const rand = Math.floor(
    Math.random() * 900 + 100
  );
  return `V-${stamp}-${rand}`;
}
export {
  computePermitDates as c,
  generateSaleNumber as g,
  randomCode as r
};
