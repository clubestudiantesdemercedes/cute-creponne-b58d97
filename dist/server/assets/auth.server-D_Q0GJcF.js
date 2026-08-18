import { redirect } from "@tanstack/react-router";
import { u as useSession$1 } from "../server.js";
const SESSION_PASSWORD = process.env.SESSION_SECRET ?? "natatorio-estudiantes-dev-secret-please-set-SESSION_SECRET-env-var-32chars";
function getAppSession() {
  return useSession$1({
    password: SESSION_PASSWORD,
    name: "natatorio_session",
    cookie: { sameSite: "lax" }
  });
}
async function getSessionUser() {
  const session = await getAppSession();
  return session.data.user ?? null;
}
async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    throw redirect({ to: "/login" });
  }
  return user;
}
export {
  getAppSession as a,
  getSessionUser as g,
  requireUser as r
};
