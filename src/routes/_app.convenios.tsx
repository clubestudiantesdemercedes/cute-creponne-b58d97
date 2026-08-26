import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Plus, Handshake, Pencil, X, Save } from 'lucide-react'
import { listConventionsAdmin, upsertConvention } from '@/server/plans.functions'
import { formatDateAR } from '@/lib/format'

export const Route = createFileRoute('/_app/convenios')({
  loader: () => listConventionsAdmin(),
  component: ConveniosPage,
})

const TYPES = [
  { value: 'empresa', label: 'Empresa' },
  { value: 'sindicato', label: 'Sindicato' },
  { value: 'institucion', label: 'Institución' },
  { value: 'otro', label: 'Otro' },
] as const

type ConventionType = (typeof TYPES)[number]['value']

type FormState = {
  id?: number
  name: string
  type: ConventionType
  description: string
  startDate: string
  endDate: string
  benefit: string
  notes: string
  maxBeneficiaries: string
  status: 'activo' | 'inactivo'
}

const emptyForm = (): FormState => ({
  name: '',
  type: 'empresa',
  description: '',
  startDate: '',
  endDate: '',
  benefit: '',
  notes: '',
  maxBeneficiaries: '',
  status: 'activo',
})

function ConveniosPage() {
  const conventions = Route.useLoaderData()
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function startCreate() {
    setForm(emptyForm())
    setError(null)
    setFormOpen(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function startEdit(c: (typeof conventions)[number]) {
    setForm({
      id: c.id,
      name: c.name,
      type: (c.type as ConventionType) || 'empresa',
      description: c.description ?? '',
      startDate: c.startDate ?? '',
      endDate: c.endDate ?? '',
      benefit: c.benefit ?? '',
      notes: c.notes ?? '',
      maxBeneficiaries:
        c.maxBeneficiaries != null ? String(c.maxBeneficiaries) : '',
      status: c.status === 'inactivo' ? 'inactivo' : 'activo',
    })
    setError(null)
    setFormOpen(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function closeForm() {
    setFormOpen(false)
    setForm(emptyForm())
    setError(null)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      if (!form.name.trim()) {
        throw new Error('El nombre es obligatorio.')
      }
      if (form.startDate && form.endDate && form.startDate > form.endDate) {
        throw new Error('La vigencia desde no puede ser posterior a hasta.')
      }

      await upsertConvention({
        data: {
          id: form.id,
          name: form.name.trim(),
          type: form.type,
          description: form.description.trim() || null,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          status: form.status,
          benefit: form.benefit.trim() || null,
          notes: form.notes.trim() || null,
          maxBeneficiaries: form.maxBeneficiaries
            ? Number(form.maxBeneficiaries)
            : null,
        },
      })

      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el convenio.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus(c: (typeof conventions)[number]) {
    const next = c.status === 'activo' ? 'inactivo' : 'activo'
    const ok = window.confirm(
      next === 'inactivo'
        ? `¿Inactivar el convenio "${c.name}"?`
        : `¿Activar el convenio "${c.name}"?`,
    )
    if (!ok) return

    await upsertConvention({
      data: {
        id: c.id,
        name: c.name,
        type: c.type as ConventionType,
        description: c.description,
        startDate: c.startDate,
        endDate: c.endDate,
        status: next,
        benefit: c.benefit,
        notes: c.notes,
        maxBeneficiaries: c.maxBeneficiaries,
      },
    })
    window.location.reload()
  }

  const isEdit = form.id != null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Convenios</h1>
          <p className="text-sm text-slate-500 mt-1">
            Alta y edición de convenios. Las tarifas se cargan en Planes y tarifas.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="flex items-center gap-1.5 bg-blue-900 text-white px-3 py-2 rounded-lg text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> Nuevo convenio
        </button>
      </div>

      {formOpen && (
        <form onSubmit={save} className="bg-white rounded-xl shadow-sm p-5 space-y-3 border border-blue-100">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">
              {isEdit ? 'Editar convenio' : 'Nuevo convenio'}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              className="text-slate-500 hover:text-slate-800 p-1"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-sm sm:col-span-2">
              <span className="text-slate-600">Nombre *</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="text-sm">
              <span className="text-slate-600">Tipo</span>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as ConventionType })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="text-slate-600">Estado</span>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as 'activo' | 'inactivo',
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </label>

            <label className="text-sm">
              <span className="text-slate-600">Vigencia desde</span>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="text-sm">
              <span className="text-slate-600">Vigencia hasta</span>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="text-sm sm:col-span-2">
              <span className="text-slate-600">Beneficio</span>
              <input
                placeholder="Ej: tarifa equivalente a socio"
                value={form.benefit}
                onChange={(e) => setForm({ ...form, benefit: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="text-sm">
              <span className="text-slate-600">Máx. beneficiarios</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Opcional"
                value={form.maxBeneficiaries}
                onChange={(e) =>
                  setForm({
                    ...form,
                    maxBeneficiaries: e.target.value.replace(/[^\d]/g, ''),
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="text-sm sm:col-span-2">
              <span className="text-slate-600">Descripción</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="text-sm sm:col-span-2">
              <span className="text-slate-600">Notas internas</span>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear convenio'}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="border border-slate-300 text-slate-700 font-semibold px-4 py-2 rounded-lg text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4">
        {conventions.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-xl shadow-sm p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
          >
            <div className="min-w-0">
              <p className="font-bold text-lg flex items-center gap-2">
                <Handshake className="w-4 h-4 text-violet-700 shrink-0" />
                <span className="truncate">{c.name}</span>
              </p>
              <p className="text-sm text-slate-500">
                {TYPES.find((t) => t.value === c.type)?.label ?? c.type}
              </p>
              {c.benefit && (
                <p className="text-sm text-slate-600 mt-1">Beneficio: {c.benefit}</p>
              )}
              {c.description && (
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{c.description}</p>
              )}
              {(c.startDate || c.endDate) && (
                <p className="text-xs text-slate-400 mt-1">
                  Vigencia:{' '}
                  {c.startDate ? formatDateAR(c.startDate) : '—'} a{' '}
                  {c.endDate ? formatDateAR(c.endDate) : '—'}
                </p>
              )}
              {c.maxBeneficiaries != null && (
                <p className="text-xs text-slate-400">
                  Máx. beneficiarios: {c.maxBeneficiaries}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => startEdit(c)}
                className="inline-flex items-center gap-1.5 border border-blue-300 text-blue-800 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-50"
              >
                <Pencil className="w-3.5 h-3.5" />
                Editar
              </button>
              <button
                type="button"
                onClick={() => toggleStatus(c)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                  c.status === 'activo'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {c.status === 'activo' ? 'Activo' : 'Inactivo'}
              </button>
            </div>
          </div>
        ))}

        {conventions.length === 0 && (
          <p className="text-center text-slate-400 py-8">No hay convenios cargados.</p>
        )}
      </div>
    </div>
  )
}