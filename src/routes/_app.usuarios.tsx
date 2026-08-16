import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Plus, UserCog } from 'lucide-react'
import { listUsers, createUser, updateUser } from '@/server/users.functions'
import { ROLE_LABELS } from '@/lib/roles'

export const Route = createFileRoute('/_app/usuarios')({
  loader: () => listUsers(),
  component: UsuariosPage,
})

const ROLES: { value: 'admin' | 'encargado' | 'control_ingreso' | 'consulta'; label: string }[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'encargado', label: 'Encargado de pileta' },
  { value: 'control_ingreso', label: 'Control de ingreso' },
  { value: 'consulta', label: 'Consulta' },
]

function UsuariosPage() {
  const users = Route.useLoaderData()
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', fullName: '', role: 'encargado' as (typeof ROLES)[number]['value'] })

  async function create(e: React.FormEvent) {
    e.preventDefault()
    await createUser({ data: { ...form, active: true } })
    window.location.reload()
  }

  async function toggleActive(id: number, user: (typeof users)[number]) {
    await updateUser({ data: { id, username: user.username, fullName: user.fullName, role: user.role, active: !user.active } })
    window.location.reload()
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <UserCog className="w-6 h-6" /> Usuarios
        </h1>
        <button onClick={() => setCreating(!creating)} className="flex items-center gap-1.5 bg-blue-900 text-white px-3 py-2 rounded-lg text-sm font-semibold">
          <Plus className="w-4 h-4" /> Nuevo usuario
        </button>
      </div>

      {creating && (
        <form onSubmit={create} className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="text-slate-600">Usuario *</span>
              <input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="text-sm">
              <span className="text-slate-600">Contraseña *</span>
              <input required type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="text-sm">
              <span className="text-slate-600">Nombre completo *</span>
              <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="text-sm">
              <span className="text-slate-600">Rol</span>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as any })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg text-sm">Crear usuario</button>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm divide-y divide-slate-100">
        {users.map((u) => (
          <div key={u.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{u.fullName}</p>
              <p className="text-xs text-slate-500">
                @{u.username} — {ROLE_LABELS[u.role]}
              </p>
            </div>
            <button
              onClick={() => toggleActive(u.id, u)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full ${u.active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
            >
              {u.active ? 'Activo' : 'Inactivo'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
