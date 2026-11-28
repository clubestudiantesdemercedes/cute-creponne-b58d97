import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Plus, UserCog, Pencil, X, Trash2 } from 'lucide-react'
import { listUsers, createUser, updateUser, deleteUser, deactivateOtherUsers } from '@/server/users.functions'
import { ROLE_LABELS } from '@/lib/roles'

export const Route = createFileRoute('/_app/usuarios')({
  loader: () => listUsers(),
  component: UsuariosPage,
})

const ROLES: { value: 'admin' | 'operador'; label: string }[] = [
  { value: 'admin', label: 'Administrador general' },
  { value: 'operador', label: 'Operador' },
]

type UserRow = Awaited<ReturnType<typeof listUsers>>[number]

function UsuariosPage() {
  const users = Route.useLoaderData()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<UserRow | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', fullName: '', role: 'operador' as (typeof ROLES)[number]['value'] })
  const [editForm, setEditForm] = useState({ username: '', password: '', fullName: '', role: 'operador' as (typeof ROLES)[number]['value'], active: true })

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await createUser({ data: { ...form, active: true } })
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el usuario.')
      setSaving(false)
    }
  }

  function startEdit(user: UserRow) {
    setError('')
    setCreating(false)
    setEditing(user)
    setEditForm({ username: user.username, password: '', fullName: user.fullName, role: user.role, active: user.active })
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    setError('')
    setSaving(true)
    try {
      await updateUser({ data: { id: editing.id, ...editForm, password: editForm.password || undefined } })
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron guardar los cambios.')
      setSaving(false)
    }
  }

  async function disableOtherAccounts() {
    const confirmed = window.confirm('Se deshabilitarán todas las cuentas excepto jsiri. Las ventas y registros históricos se conservarán. ¿Querés continuar?')
    if (!confirmed) return
    setError('')
    setSaving(true)
    try {
      const result = await deactivateOtherUsers()
      alert('Se deshabilitaron ' + result.disabledCount + ' cuentas. jsiri continúa activo como administrador general.')
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron deshabilitar las otras cuentas.')
      setSaving(false)
    }
  }

  async function toggleActive(user: UserRow) {
    setError('')
    try {
      await updateUser({ data: { id: user.id, username: user.username, fullName: user.fullName, role: user.role, active: !user.active } })
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el estado del usuario.')
    }
  }

  async function removeUser(user: UserRow) {
    const confirmed = window.confirm(
      'Vas a eliminar definitivamente el usuario @' + user.username + '. Solo se podrá completar si no tiene operaciones ni auditorías asociadas. Esta acción no se puede deshacer. ¿Querés continuar?',
    )
    if (!confirmed) return

    setError('')
    setSaving(true)
    try {
      await deleteUser({ data: { id: user.id } })
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el usuario.')
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <UserCog className="w-6 h-6" /> Usuarios
        </h1>
        <div className="flex flex-wrap gap-2">
          <button onClick={disableOtherAccounts} disabled={saving} className="px-3 py-2 rounded-lg text-xs font-semibold border border-amber-300 text-amber-800 bg-amber-50 disabled:opacity-50">
            Dejar solo jsiri activo
          </button>
          <button onClick={() => { setCreating(!creating); setEditing(null); setError('') }} className="flex items-center gap-1.5 bg-blue-900 text-white px-3 py-2 rounded-lg text-sm font-semibold">
            <Plus className="w-4 h-4" /> Nuevo usuario
          </button>
        </div>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 border border-red-200 text-red-700 p-3 text-sm">{error}</p>}

      {creating && (
        <form onSubmit={create} className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-slate-800">Crear usuario</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-sm"><span className="text-slate-600">Usuario *</span><input required minLength={3} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
            <label className="text-sm"><span className="text-slate-600">Contraseña *</span><input required type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
            <label className="text-sm"><span className="text-slate-600">Nombre completo *</span><input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
            <label className="text-sm"><span className="text-slate-600">Rol</span><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as any })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">{ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select></label>
          </div>
          <div className="flex gap-2"><button disabled={saving} className="bg-emerald-600 disabled:opacity-60 text-white font-semibold px-4 py-2 rounded-lg text-sm">{saving ? 'Guardando...' : 'Crear usuario'}</button><button type="button" onClick={() => setCreating(false)} className="px-4 py-2 rounded-lg text-sm border">Cancelar</button></div>
        </form>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6">
        <form onSubmit={saveEdit} className="bg-white rounded-xl shadow-2xl p-5 space-y-3 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between"><h2 className="font-semibold text-slate-800">Editar usuario: {editing.fullName}</h2><button type="button" onClick={() => setEditing(null)} aria-label="Cerrar edición" className="p-1 text-slate-500"><X className="w-5 h-5" /></button></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-sm"><span className="text-slate-600">Usuario *</span><input required minLength={3} value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
            <label className="text-sm"><span className="text-slate-600">Nueva contraseña</span><input type="password" minLength={6} value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} placeholder="Dejar vacío para conservar la actual" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /><span className="text-xs text-slate-500">Mínimo 6 caracteres. No hace falta conocer la contraseña anterior.</span></label>
            <label className="text-sm"><span className="text-slate-600">Nombre completo *</span><input required value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
            <label className="text-sm"><span className="text-slate-600">Rol</span><select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">{ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select></label>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={editForm.active} onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })} /> Cuenta activa</label>
          <div className="flex gap-2"><button disabled={saving} className="bg-blue-900 disabled:opacity-60 text-white font-semibold px-4 py-2 rounded-lg text-sm">{saving ? 'Guardando...' : 'Guardar cambios'}</button><button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg text-sm border">Cancelar</button></div>
        </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm divide-y divide-slate-100">
        {users.map((u) => (
          <div key={u.id} className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0"><p className="font-medium">{u.fullName}</p><p className="text-xs text-slate-500">@{u.username} — {ROLE_LABELS[u.role] ?? u.role}</p></div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => startEdit(u)} className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700"><Pencil className="w-3.5 h-3.5" /> Editar</button>
              <button onClick={() => toggleActive(u)} className={`text-xs font-bold px-3 py-1.5 rounded-full ${u.active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{u.active ? 'Activo' : 'Inactivo'}</button>
              {u.username !== 'jsiri' && (
                <button onClick={() => removeUser(u)} disabled={saving} aria-label={`Eliminar usuario ${u.username}`} title="Eliminar usuario" className="inline-flex items-center justify-center p-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500">La eliminación definitiva solo está permitida para cuentas sin operaciones ni auditorías asociadas. Las cuentas con historial deben conservarse inactivas para no perder la trazabilidad.</p>
    </div>
  )
}
