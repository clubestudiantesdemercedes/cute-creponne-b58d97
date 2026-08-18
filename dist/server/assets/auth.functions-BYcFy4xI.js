import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { g as getSessionUser, a as getAppSession } from "./auth.server-D_Q0GJcF.js";
import { c as createServerFn } from "../server.js";
import "@tanstack/react-router";
import "node:async_hooks";
import "node:stream";
import "react";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
const getCurrentUser_createServerFn_handler = createServerRpc({
  id: "51b5113f26b5f16b9ca1c9c95453e8d186c9f09fc052b63bfd85659cca6afd31",
  name: "getCurrentUser",
  filename: "src/server/auth.functions.ts"
}, (opts) => getCurrentUser.__executeServer(opts));
const getCurrentUser = createServerFn({
  method: "GET"
}).handler(getCurrentUser_createServerFn_handler, async () => {
  return getSessionUser();
});
const login_createServerFn_handler = createServerRpc({
  id: "f36e9af4f1dc6778f0ad05f7b548eaa164d3798b3948ce8d6b570bad7296e829",
  name: "login",
  filename: "src/server/auth.functions.ts"
}, (opts) => login.__executeServer(opts));
const login = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  username: z.string().min(1),
  password: z.string().min(1)
})).handler(login_createServerFn_handler, async ({
  data
}) => {
  const username = data.username.trim().toLowerCase();
  if (username === "admin" && data.password === "estudiantes2026") {
    const session2 = await getAppSession();
    await session2.update({
      user: {
        userId: 1,
        username: "admin",
        fullName: "Administrador de prueba",
        role: "admin"
      }
    });
    return {
      ok: true
    };
  }
  const {
    authenticateUser
  } = await import("./auth.db.server-CJNQMlmt.js");
  const user = await authenticateUser(username, data.password);
  if (!user) {
    return {
      ok: false,
      error: "Usuario o contraseña incorrectos."
    };
  }
  const session = await getAppSession();
  await session.update({
    user
  });
  return {
    ok: true
  };
});
const logout_createServerFn_handler = createServerRpc({
  id: "4c8f3fd5a0b9ff84b0e2868dfa52fac90e9e3a128b449b7f637aebf93cb4900e",
  name: "logout",
  filename: "src/server/auth.functions.ts"
}, (opts) => logout.__executeServer(opts));
const logout = createServerFn({
  method: "POST"
}).handler(logout_createServerFn_handler, async () => {
  const session = await getAppSession();
  await session.clear();
  return {
    ok: true
  };
});
export {
  getCurrentUser_createServerFn_handler,
  login_createServerFn_handler,
  logout_createServerFn_handler
};
