import { useSession } from '@tanstack/react-start/server'

export type SessionUser = {
  userId: number
  username: string
  fullName: string
  role: 'admin' | 'encargado' | 'control_ingreso' | 'consulta'
}

type SessionData = {
  user?: SessionUser
}

const SESSION_PASSWORD =
  process.env.SESSION_SECRET ??
  'natatorio-estudiantes-dev-secret-please-set-SESSION_SECRET-env-var-32chars'

export function getAppSession() {
  return useSession<SessionData>({
    password: SESSION_PASSWORD,
    name: 'natatorio_session',
    cookie: { sameSite: 'lax' },
  })
}
