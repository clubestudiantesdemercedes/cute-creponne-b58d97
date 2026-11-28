import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { createInitialAdmin, getInitialAdminSetupStatus } from '@/server/initial-admin.functions'

export const Route = createFileRoute('/setup-admin')({
  loader: () => getInitialAdminSetupStatus(),
  component: InitialAdminSetupPage,
})

function InitialAdminSetupPage() {
  const status = Route.useLoaderData()
  const router = useRouter()
  const [setupKey, setSetupKey] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      const result = await createInitialAdmin({
        data: { setupKey, fullName, password },
      })

      if (!result.ok) {
        setError(result.error)
        setLoading(false)
        return
      }

      await router.navigate({ to: '/' })
    } catch {
      setError('No se pudo crear el administrador. Revisá la conexión e intentá nuevamente.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-red-800 px-4 py-8">
      <section className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <header className="bg-blue-900 px-6 py-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-xl bg-white p-1.5">
            <img src="/escudo.png" alt="Escudo del Club Atlético Estudiantes" className="h-full w-full object-contain" />
          </div>
          <h1 className="text-lg font-bold text-white">Configuración inicial</h1>
          <p className="text-sm text-blue-200">Pileta Temporada 26/27 CAE</p>
        </header>

        <div className="space-y-4 p-6">
          {!status.available ? (
            <div className="space-y-3">
              <p className="font-semibold text-slate-800">La configuración inicial ya fue realizada.</p>
              <p className="text-sm text-slate-600">La cuenta jsiri es permanente. Ingresá desde la pantalla habitual con tu usuario y contraseña.</p>
              <Link to="/login" className="inline-flex w-full justify-center rounded-lg bg-red-700 px-4 py-3 font-semibold text-white hover:bg-red-800">Ir al inicio de sesión</Link>
            </div>
          ) : !status.configured ? (
            <div className="space-y-3">
              <p className="font-semibold text-slate-800">Falta habilitar la configuración en Netlify.</p>
              <p className="text-sm text-slate-600">Agregá la variable privada INITIAL_ADMIN_SETUP_KEY en el entorno Production y volvé a cargar esta página.</p>
              <Link to="/login" className="text-sm font-medium text-blue-800 underline">Volver al inicio de sesión</Link>
            </div>
          ) : (
            <>
              <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
                Se creará la cuenta permanente <strong>jsiri</strong> con permisos de administrador general.
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Clave de configuración de Netlify</label>
                  <input value={setupKey} onChange={(event) => setSetupKey(event.target.value)} type="password" autoComplete="off" required className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-700" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Nombre completo</label>
                  <input value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" required className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-700" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Contraseña para jsiri</label>
                  <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="new-password" minLength={12} required className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-700" />
                  <p className="mt-1 text-xs text-slate-500">Usá al menos 12 caracteres.</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Repetir contraseña</label>
                  <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" autoComplete="new-password" minLength={12} required className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-700" />
                </div>
                {error && <p role="alert" className="text-sm font-medium text-red-700">{error}</p>}
                <button type="submit" disabled={loading} className="w-full rounded-lg bg-red-700 py-3 font-semibold text-white transition-colors hover:bg-red-800 disabled:opacity-60">
                  {loading ? 'Creando administrador...' : 'Crear administrador general'}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  )
}
