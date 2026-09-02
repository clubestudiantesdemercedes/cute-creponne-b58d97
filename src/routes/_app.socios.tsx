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
  const [sortBy, setSortBy] = useState<
    'memberNumber' | 'dni' | 'lastName' | 'firstName' | 'status' | 'category'
  >('memberNumber')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [onlyActive, setOnlyActive] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [csvFileName, setCsvFileName] = useState<string | null>(null)

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
    setCsvFileName(file.name)
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
      setCsvFileName(null)
      window.location.reload()
    } finally {
      setImporting(false)
    }
  }

  const filtered = members
    .filter((m) => {
      if (onlyActive && m.member.memberStatus !== 'activo') return false
      if (!q.trim()) return true
      const s = q.toLowerCase()
      return (
        m.member.memberNumber.toLowerCase().includes(s) ||
        m.person.dni.toLowerCase().includes(s) ||
        m.person.firstName.toLowerCase().includes(s) ||
        m.person.lastName.toLowerCase().includes(s) ||
        (m.person.phone ?? '').toLowerCase().includes(s)
      )
    })
    .slice()
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const cat = (m: (typeof members)[number]) =>
        ((m.member as { category?: string }).category ?? 'general').toLowerCase()

      let cmp = 0
      switch (sortBy) {
        case 'dni':
          cmp = a.person.dni.localeCompare(b.person.dni, 'es', { numeric: true })
          break
        case 'lastName':
          cmp = a.person.lastName.localeCompare(b.person.lastName, 'es', {
            sensitivity: 'base',
          })
          if (cmp === 0) {
            cmp = a.person.firstName.localeCompare(b.person.firstName, 'es', {
              sensitivity: 'base',
            })
          }
          break
        case 'firstName':
          cmp = a.person.firstName.localeCompare(b.person.firstName, 'es', {
            sensitivity: 'base',
          })
          break
        case 'status':
          cmp = a.member.memberStatus.localeCompare(b.member.memberStatus, 'es')
          break
        case 'category':
          cmp = cat(a).localeCompare(cat(b), 'es')
          break
        case 'memberNumber':
        default:
          cmp = a.member.memberNumber.localeCompare(b.member.memberNumber, 'es', {
            numeric: true,
          })
          break
      }
      return cmp * dir
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
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={onFile}
            className="sr-only"
            id="socios-csv-input"
          />
          <label
            htmlFor="socios-csv-input"
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
          >
            <Upload className="w-4 h-4" />
            Seleccionar archivo CSV
          </label>
          <span className="text-xs text-slate-500">
            {csvFileName ?? 'Ningún archivo seleccionado'}
          </span>
        </div>

        {preview && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-slate-600">
              Vista previa: {preview.newCount} nuevos, {preview.updateCount} a
              actualizar, {preview.errorCount} con error.
            </p>

            {preview.errorCount > 0 && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
                <p className="font-semibold text-amber-900 flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  Filas con error (no se importan hasta corregirlas)
                </p>
                <ul className="space-y-2 max-h-48 overflow-auto">
                  {preview.rows
                    .map((r, index) => ({ r, index }))
                    .filter(({ r }) => r.errors.length > 0)
                    .map(({ r, index }) => (
                      <li
                        key={index}
                        className="border-b border-amber-200/80 pb-2 last:border-0 last:pb-0"
                      >
                        <p className="font-medium text-slate-800">
                          Fila {index + 2}
                          {r.row.memberNumber
                            ? ` · Socio N° ${r.row.memberNumber}`
                            : ''}
                          {r.row.dni ? ` · DNI ${r.row.dni}` : ''}
                          {r.row.lastName || r.row.firstName
                            ? ` · ${[r.row.lastName, r.row.firstName]
                                .filter(Boolean)
                                .join(', ')}`
                            : ''}
                        </p>
                        <p className="text-amber-900 text-xs mt-0.5">
                          {r.errors.join(' · ')}
                        </p>
                      </li>
                    ))}
                </ul>
              </div>
            )}

            <button
              type="button"
              disabled={
                importing || preview.newCount + preview.updateCount === 0
              }
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
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 mb-3">
          <input
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Filtrar por número, DNI o nombre..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(
                e.target.value as
                  | 'memberNumber'
                  | 'dni'
                  | 'lastName'
                  | 'firstName'
                  | 'status'
                  | 'category',
              )
            }
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="memberNumber">Orden: N° socio</option>
            <option value="dni">Orden: DNI</option>
            <option value="lastName">Orden: Apellido</option>
            <option value="firstName">Orden: Nombre</option>
            <option value="status">Orden: Estado</option>
            <option value="category">Orden: Categoría</option>
          </select>
          <button
            type="button"
            onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
            title="Cambiar dirección"
          >
            {sortDir === 'asc' ? '↑ Ascendente' : '↓ Descendente'}
          </button>
          <label className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50">
            <input
              type="checkbox"
              checked={onlyActive}
              onChange={(e) => setOnlyActive(e.target.checked)}
            />
            Solo activos
          </label>
        </div>

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