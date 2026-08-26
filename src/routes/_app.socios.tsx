import { createFileRoute } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import {
  Upload,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Pencil,
  X,
  Save,
} from 'lucide-react'
import {
  previewMembersImport,
  confirmMembersImport,
  listMembers,
  upsertMember,
  type ImportRowT,
} from '@/server/members.functions'
import { formatDateAR } from '@/lib/format'

export const Route = createFileRoute('/_app/socios')({
  loader: () => listMembers(),
  component: SociosPage,
})

type FormState = {
  memberId?: number
  personId?: number
  memberNumber: string
  dni: string
  firstName: string
  lastName: string
  birthDate: string
  phone: string
  email: string
  address: string
  memberStatus: 'activo' | 'inactivo'
  category: 'general' | 'deportista'
}

function emptyForm(): FormState {
  return {
    memberNumber: '',
    dni: '',
    firstName: '',
    lastName: '',
    birthDate: '',
    phone: '',
    email: '',
    address: '',
    memberStatus: 'activo',
    category: 'general',
  }
}

function formatMemberAlta(value: unknown): string {
  if (value == null || value === '') return '-'

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '-'
    return formatDateAR(value.toISOString().slice(0, 10))
  }

  const s = String(value)
  // ISO: 2026-08-25 o 2026-08-25T12:00:00.000Z
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    return formatDateAR(s.slice(0, 10))
  }

  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return '-'
  return formatDateAR(d.toISOString().slice(0, 10))
}

function SociosPage() {
  const members = Route.useLoaderData()

  const [q, setQ] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [preview, setPreview] = useState<Awaited<
    ReturnType<typeof previewMembersImport>
  > | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    created: number
    updated: number
  } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function startCreate() {
    setForm(emptyForm())
    setFormError(null)
    setFormOpen(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function startEdit(m: (typeof members)[number]) {
    setForm({
      memberId: m.member.id,
      personId: m.person.id,
      memberNumber: m.member.memberNumber,
      dni: m.person.dni,
      firstName: m.person.firstName,
      lastName: m.person.lastName,
      birthDate: m.person.birthDate ?? '',
      phone: m.person.phone ?? '',
      email: m.person.email ?? '',
      address: m.person.address ?? '',
      memberStatus:
        m.member.memberStatus === 'inactivo' ? 'inactivo' : 'activo',
      category:
        (m.member as { category?: string }).category === 'deportista'
          ? 'deportista'
          : 'general',
    })
    setFormError(null)
    setFormOpen(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function closeForm() {
    setFormOpen(false)
    setForm(emptyForm())
    setFormError(null)
  }

  async function saveMember(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      await upsertMember({
        data: {
          memberId: form.memberId,
          personId: form.personId,
          memberNumber: form.memberNumber.trim(),
          dni: form.dni.trim(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          birthDate: form.birthDate || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          address: form.address.trim() || null,
          memberStatus: form.memberStatus,
          category: form.category,
        },
      })
      window.location.reload()
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'No se pudo guardar el socio.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const result = await previewMembersImport({ data: { csv: text } })
    setPreview(result)
    setImportResult(null)
  }

  async function confirm() {
    if (!preview) return
    setImporting(true)
    try {
      const validRows = preview.rows
        .filter((r) => r.errors.length === 0)
        .map((r) => r.row as ImportRowT)
      const result = await confirmMembersImport({ data: { rows: validRows } })
      setImportResult(result)
      setPreview(null)
      if (fileRef.current) fileRef.current.value = ''
      window.location.reload()
    } finally {
      setImporting(false)
    }
  }

  const filtered = members.filter((m) => {
    const s = q.toLowerCase()
    return (
      !s ||
      m.member.memberNumber.toLowerCase().includes(s) ||
      m.person.dni.includes(s) ||
      m.person.firstName.toLowerCase().includes(s) ||
      m.person.lastName.toLowerCase().includes(s)
    )
  })

  const isEdit = form.memberId != null

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Socios</h1>
          <p className="text-sm text-slate-500 mt-1">
            Alta manual durante la temporada e importacion CSV al inicio.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="flex items-center gap-1.5 bg-blue-900 text-white px-3 py-2 rounded-lg text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> Nuevo socio
        </button>
      </div>

      {formOpen && (
        <form
          onSubmit={saveMember}
          className="bg-white rounded-xl shadow-sm p-5 space-y-3 border border-blue-100"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">
              {isEdit ? 'Editar socio' : 'Nuevo socio'}
            </h2>
            <button type="button" onClick={closeForm} className="text-slate-500 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="text-slate-600">N de socio *</span>
              <input
                required
                value={form.memberNumber}
                onChange={(e) => setForm({ ...form, memberNumber: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="text-slate-600">DNI *</span>
              <input
                required
                value={form.dni}
                onChange={(e) =>
                  setForm({ ...form, dni: e.target.value.replace(/[^\d]/g, '') })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="text-slate-600">Apellido *</span>
              <input
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="text-slate-600">Nombre *</span>
              <input
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="text-slate-600">Fecha de nacimiento</span>
              <input
                type="date"
                value={form.birthDate}
                onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="text-slate-600">Estado</span>
              <select
                value={form.memberStatus}
                onChange={(e) =>
                  setForm({
                    ...form,
                    memberStatus: e.target.value as 'activo' | 'inactivo',
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="text-slate-600">Categoria</span>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value as 'general' | 'deportista',
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="general">Socio general</option>
                <option value="deportista">Deportista</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="text-slate-600">Telefono</span>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="text-slate-600">Correo electronico</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="text-slate-600">Domicilio</span>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          </div>

          {formError && <p className="text-sm text-red-700">{formError}</p>}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Registrar socio'}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="border border-slate-300 font-semibold px-4 py-2 rounded-lg text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-semibold mb-2 flex items-center gap-2">
          <Upload className="w-4 h-4" /> Importar base de socios (CSV)
        </h2>
        <p className="text-sm text-slate-500 mb-3">
          Util al inicio de la temporada. Columnas: socio, dni, nombre, apellido, categoria (general o deportista), y opcionales: nacimiento, telefono, email, domicilio, estado.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={onFile}
          className="text-sm"
        />

        {preview && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-slate-600">
              Vista previa: {preview.newCount} nuevos, {preview.updateCount} a actualizar,{' '}
              {preview.errorCount} con error.
            </p>
            <button
              type="button"
              disabled={importing || preview.newCount + preview.updateCount === 0}
              onClick={confirm}
              className="bg-blue-900 disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-lg text-sm"
            >
              {importing
                ? 'Importando...'
                : `Confirmar importacion (${preview.newCount + preview.updateCount})`}
            </button>
          </div>
        )}

        {importResult && (
          <p className="mt-3 text-emerald-700 text-sm font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Importacion completa: {importResult.created}{' '}
            creados, {importResult.updated} actualizados.
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <input
          className="w-full rounded-lg border border-slate-300 px-3 py-2 mb-3 text-sm"
          placeholder="Filtrar por numero, DNI o nombre..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="overflow-auto max-h-[60vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-2">Socio N</th>
                <th className="py-2 pr-2">Nombre</th>
                <th className="py-2 pr-2">DNI</th>
                <th className="py-2 pr-2">Telefono</th>
                <th className="py-2 pr-2">Alta</th>
                <th className="py-2 pr-2">Estado</th>
                <th className="py-2 pr-2">Categoria</th>
                <th className="py-2 pr-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((m) => (
                <tr key={m.member.id}>
                  <td className="py-2 pr-2 font-medium">{m.member.memberNumber}</td>
                  <td className="py-2 pr-2">
                    {m.person.lastName}, {m.person.firstName}
                  </td>
                  <td className="py-2 pr-2">{m.person.dni}</td>
                  <td className="py-2 pr-2">{m.person.phone ?? '-'}</td>
                  <td className="py-2 pr-2 text-xs text-slate-500">
                    {formatMemberAlta(m.member.createdAt)}
                  </td>
                  <td className="py-2 pr-2">
                    {m.member.memberStatus === 'activo' ? (
                      <span className="text-emerald-700 font-medium">Activo</span>
                    ) : (
                      <span className="text-red-700 font-medium">Inactivo</span>
                    )}
                  </td>
                  <td className="py-2 pr-2">
                    {(m.member as { category?: string }).category === 'deportista'
                      ? 'Deportista'
                      : 'General'}
                  </td>
                  <td className="py-2 pr-2">
                    <button
                      type="button"
                      onClick={() => startEdit(m)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-800 border border-blue-300 px-2 py-1 rounded-lg hover:bg-blue-50"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-sm text-slate-400 py-6 text-center flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4" /> No hay socios que coincidan.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}