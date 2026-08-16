import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Plus, Handshake } from 'lucide-react'
import { listConventionsAdmin, upsertConvention } from '@/server/plans.functions'

export const Route = createFileRoute('/_app/convenios')({
  loader: () => listConventionsAdmin(),
  component: ConveniosPage,
})

const TYPES = [
  { value: 'empresa', label: 'Empresa' },
  { value: 'sindicato', label: 'Sindicato' },
  { value: 'institucion', label: 'Institución' },
  { value: 'otro', label: 'Otro' },
]

function ConveniosPage() {
  const conventions = Route.useLoaderData()
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    name: '',
    type: 'empresa' as 'empresa' | 'sindicato' | 'institucion' | 'otro',
    description: '',
    startDate: '',
    endDate: '',
    benefit: '',
  })

  async function create(e: React.FormEvent) {
    e.preventDefault()
    await upsertConvention({
      data: {
        name: form.name,
        type: form.type,
        description: form.description || null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        status: 'activo',
        benefit: form.benefit || null,
      },
    })
    window.location.reload()
  }

  async function toggleStatus(id: number, current: string, rest: any) {
    await upsertConvention({
      data: {
        id,
        name: rest.name,
        type: rest.type,
        description: rest.description,
        startDate: rest.startDate,
        endDate: rest.endDate,
        status: current === 'activo' ? 'inactivo' : 'activo',
        benefit: rest.benefit,
      },
    })
    window.location.reload()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Convenios</h1>
        <button onClick={() => setCreating(!creating)} className="flex items-center gap-1.5 bg-blue-900 text-white px-3 py-2 rounded-lg text-sm font-semibold">
          <Plus className="w-4 h-4" /> Nuevo convenio
        </button>
      </div>

      {creating && (
        <form onSubmit={create} className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="text-slate-600">Nombre *</span>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="text-sm">
              <span className="text-slate-600">Tipo</span>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="text-slate-600">Vigencia desde</span>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="text-sm">
              <span className="text-slate-600">Vigencia hasta</span>
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
          </div>
          <label className="text-sm block">
            <span className="text-slate-600">Beneficio</span>
            <input placeholder="Ej: tarifa equivalente a socio" value={form.benefit} onChange={(e) => setForm({ ...form, benefit: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm block">
            <span className="text-slate-600">Descripción</span>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          <button className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg text-sm">Crear convenio</button>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4">
        {conventions.map((c) => (
          <div key={c.id} className="bg-white rounded-xl shadow-sm p-5 flex items-start justify-between gap-4">
            <div>
              <p className="font-bold text-lg flex items-center gap-2">
                <Handshake className="w-4 h-4 text-violet-700" /> {c.name}
              </p>
              <p className="text-sm text-slate-500">{TYPES.find((t) => t.value === c.type)?.label}</p>
              {c.benefit && <p className="text-sm text-slate-600 mt-1">Beneficio: {c.benefit}</p>}
              {c.startDate && (
                <p className="text-xs text-slate-400 mt-1">
                  Vigencia: {c.startDate} a {c.endDate}
                </p>
              )}
            </div>
            <button
              onClick={() => toggleStatus(c.id, c.status, c)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full ${c.status === 'activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
            >
              {c.status === 'activo' ? 'Activo' : 'Inactivo'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
