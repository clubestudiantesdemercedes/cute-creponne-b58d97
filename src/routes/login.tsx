import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { login, getCurrentUser } from '@/server/auth.functions'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const user = await getCurrentUser()
    if (user) throw redirect({ to: '/' })
  },
  component: LoginPage,
})

function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await login({ data: { username, password } })
      if (!result.ok) {
        setError(result.error)
        setLoading(false)
        return
      }
      await router.navigate({ to: '/' })
    } catch {
      setError('No se pudo iniciar sesión. Intentá nuevamente.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-red-800 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-900 px-6 py-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-xl bg-white flex items-center justify-center mb-3 p-1.5">
            <img src="/escudo.png" alt="Escudo del Club Atlético Estudiantes" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-white font-bold text-lg leading-tight">Club Atlético Estudiantes</h1>
          <p className="text-blue-200 text-sm">Natatorio — Temporada de verano</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Usuario</label>
            <input className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-700" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-11 text-base focus:outline-none focus:ring-2 focus:ring-blue-700" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showPassword} className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-500 hover:text-slate-800">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          {error && <p className="text-red-700 text-sm font-medium">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-red-700 hover:bg-red-800 disabled:opacity-60 text-white font-semibold py-3 text-base transition-colors">{loading ? 'Ingresando...' : 'Ingresar'}</button>
        </form>
      </div>
    </div>
  )
}
