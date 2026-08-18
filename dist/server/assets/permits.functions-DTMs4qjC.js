import { T as TSS_SERVER_FUNCTION, g as getServerFnById, c as createServerFn } from "../server.js";
import { t as todayISO } from "./format-COLuSK5l.js";
var createSsrRpc = (functionId) => {
  const url = "/_serverFn/" + functionId;
  const serverFnMeta = { id: functionId };
  const fn = async (...args) => {
    return (await getServerFnById(functionId))(...args);
  };
  return Object.assign(fn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
function computeLiveStatus(permit) {
  if (permit.status === "anulado") {
    return "anulado";
  }
  const today = todayISO();
  if (permit.endDate < today) {
    return "vencido";
  }
  if (permit.startDate > today) {
    return "pendiente";
  }
  return "activo";
}
createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("e6d8706d7a3c4f36dddf4d073c45696539c512a3db7ce985072f47db383356d0"));
const findActivePermitsByDni = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("c3cb10608ec63f28940153f463d6947c5c3a4d9605e68db01700f59c02398719"));
const listExpiringPermits = createServerFn({
  method: "GET"
}).handler(createSsrRpc("89e5512f7aeb35257b46f6597a73aa1035ea8521326edbc8fe0337b670a852b4"));
export {
  computeLiveStatus as a,
  createSsrRpc as c,
  findActivePermitsByDni as f,
  listExpiringPermits as l
};
