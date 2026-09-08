import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  Search,
  History,
  UserPlus,
  Pencil,
  Users,
  X,
} from 'lucide-react'
import {
  searchNonMembers,
  findPersonByDni,
  setPersonStatus,
  createOrUpdatePerson,
  listActiveConventions,
  setPersonConvention,
  getPersonConvention,
} from '@/server/people.functions'
import { findActivePermitsByDni } from '@/server/permits.functions'
import { formatDateAR, formatDateTimeAR } from '@/lib/format'

export const Route = createFileRoute('/_app/personas')({
  component: PersonasPage,
})

type PersonForm = {
  id?: number
  dni: string
  firstName: string
  lastName: string
  birthDate: string
  phone: string
  email: string
  address: string
  notes: string
  conventionId: number | null
}

const emptyForm: PersonForm = {
  dni: '',
  firstName: '',
  lastName: '',
  birthDate: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  conventionId: null,
}

function PersonasPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<
    Awaited<ReturnType<typeof searchNonMembers>>
  >([])
  const [directHit, setDirectHit] = useState<
    Awaited<ReturnType<typeof findPersonByDni>>
  >(null)

  const [selectedDni, setSelectedDni] = useState<string | null>(null)
  const [history, setHistory] = useState<
    Awaited<ReturnType<typeof findActivePermitsByDni>>
  >(null)

  const [loading, setLoading] = useState(false)
  const [loadingAll, setLoadingAll] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<PersonForm>(emptyForm)

  const [conventions, setConventions] = useState<
    Awaited<ReturnType<typeof listActiveConventions>>
  >([])
  useEffect(() => {
    void loadAll()
  }, [])


  useEffect(() => {
    void listActiveConventions().then(setConventions)
  }, [])

  function resetForm() {
    setForm(emptyForm)
    setEditing(false)
    setShowForm(false)
  }

  function openNewPerson() {
    setForm(emptyForm)
    setEditing(false)
    setShowForm(true)
  }

  async function openEditPerson(
    person: NonNullable<typeof directHit>['person'],
  ) {
    const conv = await getPersonConvention({
      data: { personId: person.id },
    })

    setForm({
      id: person.id,
      dni: person.dni,
      firstName: person.firstName,
      lastName: person.lastName,
      birthDate: person.birthDate
        ? String(person.birthDate).slice(0, 10)
        : '',
      phone: person.phone ?? '',
      email: person.email ?? '',
      address: person.address ?? '',
      notes: person.notes ?? '',
      conventionId: conv?.conventionId ?? null,
    })

    setEditing(true)
    setShowForm(true)
  }

  async function doSearch(e: React.FormEvent) {
    e.preventDefault()

    setLoading(true)
    setSelectedDni(null)
    setHistory(null)

    try {
      const q = query.trim()

      if (!q) {
        setResults([])
        setDirectHit(null)
        return
      }

      const [peopleResults, direct] = await Promise.all([
        searchNonMembers({ data: { query: q } }),
        findPersonByDni({ data: { dni: q } }),
      ])

      setResults(peopleResults)

      // Solo mostramos el resultado directo si NO es socio.
      setDirectHit(direct?.member ? null : direct)
    } catch (error) {
      console.error(error)
      alert(
        error instanceof Error
          ? error.message
          : 'No se pudo realizar la búsqueda.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function loadAll() {
    setLoadingAll(true)
    setSelectedDni(null)
    setHistory(null)
    setQuery('')
    setDirectHit(null)

    try {
      const peopleResults = await searchNonMembers({
        data: { query: '' },
      })

      setResults(peopleResults)
    } catch (error) {
      console.error(error)
      alert(
        error instanceof Error
          ? error.message
          : 'No se pudieron cargar las personas.',
      )
    } finally {
      setLoadingAll(false)
    }
  }

  const filtered = results.filter((r) => {
    const s = query.trim().toLowerCase()
    if (!s) return true
    const p = r.person
    const conv = r.convention?.conventionName ?? ''
    return (
      p.dni.toLowerCase().includes(s) ||
      p.firstName.toLowerCase().includes(s) ||
      p.lastName.toLowerCase().includes(s) ||
      (p.phone ?? '').toLowerCase().includes(s) ||
      (p.email ?? '').toLowerCase().includes(s) ||
      conv.toLowerCase().includes(s)
    )
  })

  async function openHistory(dni: string) {
    setSelectedDni(dni)

    try {
      const h = await findActivePermitsByDni({ data: { dni } })
      setHistory(h)
    } catch (error) {
      console.error(error)
      alert(
        error instanceof Error
          ? error.message
          : 'No se pudo cargar la ficha de la persona.',
      )
    }
  }

  async function savePerson(e: React.FormEvent) {
    e.preventDefault()

    setSaving(true)

    try {
      const result = await createOrUpdatePerson({
        data: form,
      })

      if (result.person?.id != null) {
        await setPersonConvention({
          data: {
            personId: result.person.id,
            conventionId: form.conventionId,
          },
        })
      }

      if (result.created) {
        alert('Persona creada correctamente.')
      } else {
        alert('Persona modificada correctamente.')
      }

      resetForm()

      // Actualizamos automáticamente el listado.
      if (query.trim()) {
        const updatedResults = await searchNonMembers({
          data: { query: query.trim() },
        })

        setResults(updatedResults)

        const updatedDirect = await findPersonByDni({
          data: { dni: query.trim() },
        })

        setDirectHit(updatedDirect?.member ? null : updatedDirect)
      } else {
        const updatedResults = await searchNonMembers({
          data: { query: '' },
        })

        setResults(updatedResults)
      }
    } catch (error) {
      console.error(error)

      alert(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar la persona.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function changeStatus(
    personId: number,
    dni: string,
    status: 'activo' | 'inactivo',
  ) {
    try {
      await setPersonStatus({
        data: {
          personId,
          status,
        },
      })

      await openHistory(dni)

      // Actualizamos los resultados del listado.
      if (query.trim()) {
        const updatedResults = await searchNonMembers({
          data: { query: query.trim() },
        })

        setResults(updatedResults)
      } else {
        const updatedResults = await searchNonMembers({
          data: { query: '' },
        })

        setResults(updatedResults)
      }

      // Actualizamos también el resultado directo.
      const updatedDirect = await findPersonByDni({
        data: { dni },
      })

      setDirectHit(updatedDirect?.member ? null : updatedDirect)
    } catch (error) {
      console.error(error)

      alert(
        error instanceof Error
          ? error.message
          : 'No se pudo modificar el estado.',
      )
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Personas
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Personas que no son socios del club.
          </p>
        </div>

        <button
          onClick={openNewPerson}
          className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2.5 rounded-lg font-semibold flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Nueva persona
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={savePerson}
          className="bg-white rounded-xl shadow-sm p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              {editing ? 'Editar persona' : 'Nueva persona'}
            </h2>

            <button
              type="button"
              onClick={resetForm}
              className="text-slate-500 hover:text-slate-700"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                DNI *
              </label>

              <input
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                value={form.dni}
                onChange={(e) =>
                  setForm({ ...form, dni: e.target.value })
                }
                placeholder="Ej. 30123456"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Nombre *
              </label>

              <input
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                value={form.firstName}
                onChange={(e) =>
                  setForm({
                    ...form,
                    firstName: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Apellido *
              </label>

              <input
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                value={form.lastName}
                onChange={(e) =>
                  setForm({
                    ...form,
                    lastName: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Fecha de nacimiento
              </label>

              <input
                type="date"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                value={form.birthDate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    birthDate: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Teléfono
              </label>

              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                value={form.phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone: e.target.value,
                  })
                }
                placeholder="Ej. 02324 123456"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Email
              </label>

              <input
                type="email"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Dirección
              </label>

              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                value={form.address}
                onChange={(e) =>
                  setForm({
                    ...form,
                    address: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Convenio
              </label>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                value={form.conventionId ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    conventionId: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
              >
                <option value="">Sin convenio</option>
                {conventions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Observaciones
              </label>

              <textarea
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                rows={3}
                value={form.notes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    notes: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2.5 rounded-lg border border-slate-300"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="bg-blue-900 text-white px-4 py-2.5 rounded-lg font-semibold disabled:opacity-50"
            >
              {saving
                ? 'Guardando...'
                : editing
                  ? 'Guardar cambios'
                  : 'Guardar persona'}
            </button>
          </div>
        </form>
      )}

      <form
        onSubmit={doSearch}
        className="bg-white rounded-xl shadow-sm p-4"
      >
          <input
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5"
            placeholder="Buscar por DNI, nombre o apellido"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-900 hover:bg-blue-800 disabled:opacity-60 text-white px-4 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-1.5"
          >
            <Search className="w-4 h-4" />
            {loading ? 'Buscando...' : 'Buscar'}
          </button>

          <button
            type="button"
            onClick={loadAll}
            disabled={loadingAll}
            className="border border-slate-300 hover:bg-slate-50 px-4 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-1.5"
          >
            <Users className="w-4 h-4" />
            {loadingAll ? 'Cargando...' : 'Ver todas'}
          </button>
        </div>
      </form>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <p className="text-sm text-slate-600">
            {loadingAll || loading
              ? 'Cargando...'
              : `${filtered.length} persona(s)`}
          </p>
          <button
            type="button"
            onClick={openNewPerson}
            className="inline-flex items-center gap-1.5 bg-blue-900 text-white font-semibold px-4 py-2 rounded-lg text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Nueva persona
          </button>
        </div>

        <div className="overflow-auto max-h-[65vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-2">Apellido y nombre</th>
                <th className="py-2 pr-2">DNI</th>
                <th className="py-2 pr-2">Teléfono</th>
                <th className="py-2 pr-2">Email</th>
                <th className="py-2 pr-2">Convenio</th>
                <th className="py-2 pr-2">Estado</th>
                <th className="py-2 pr-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.person.id}>
                  <td className="py-2 pr-2 font-medium">
                    {r.person.lastName}, {r.person.firstName}
                  </td>
                  <td className="py-2 pr-2">{r.person.dni}</td>
                  <td className="py-2 pr-2">{r.person.phone ?? '—'}</td>
                  <td className="py-2 pr-2 text-xs">
                    {r.person.email ?? '—'}
                  </td>
                  <td className="py-2 pr-2 text-xs text-slate-600">
                    {r.convention?.conventionName ?? '—'}
                  </td>
                  <td className="py-2 pr-2">
                    {r.person.status === 'activo' ? (
                      <span className="text-emerald-700 font-medium">Activo</span>
                    ) : (
                      <span className="text-red-700 font-medium">Inactivo</span>
                    )}
                  </td>
                  <td className="py-2 pr-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openEditPerson(r.person)}
                      className="text-blue-800 text-xs font-semibold underline mr-2"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => void openHistory(r.person.dni)}
                      className="text-slate-600 text-xs font-semibold underline"
                    >
                      Historial
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && !loadingAll && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No hay personas para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedDni && history && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <button
              onClick={() => {
                setSelectedDni(null)
                setHistory(null)
              }}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              ← Volver a la búsqueda
            </button>

            <button
              onClick={() => openEditPerson(history.person)}
              className="flex items-center gap-1.5 text-sm border border-blue-300 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-50"
            >
              <Pencil className="w-4 h-4" />
              Editar
            </button>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">
                {history.person.firstName}{' '}
                {history.person.lastName}
              </h2>

              <p className="text-sm text-slate-500">
                DNI {history.person.dni}
              </p>
            </div>

            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                history.person.status === 'activo'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {history.person.status === 'activo'
                ? 'Activo'
                : 'Inactivo'}
            </span>
          </div>

          <div className="mt-4 space-y-1 text-sm text-slate-500">
            {history.person.birthDate && (
              <p>
                Fecha de nacimiento:{' '}
                {formatDateAR(history.person.birthDate)}
              </p>
            )}

            {history.person.phone && (
              <p>Teléfono: {history.person.phone}</p>
            )}

            {history.person.email && (
              <p>Email: {history.person.email}</p>
            )}

            {history.person.address && (
              <p>Dirección: {history.person.address}</p>
            )}

            {history.person.notes && (
              <p>Observaciones: {history.person.notes}</p>
            )}
          </div>

          {history.lastEntry && (
            <p className="text-sm text-slate-600 mt-4">
              Último ingreso:{' '}
              {formatDateTimeAR(history.lastEntry.occurredAt)}
            </p>
          )}

          <h3 className="font-semibold flex items-center gap-2 mt-5 mb-2">
            <History className="w-4 h-4" />
            Permisos
          </h3>

          <ul className="divide-y divide-slate-100">
            {history.permits.map((p) => (
              <li
                key={p.permit.id}
                className="py-2 flex items-center justify-between text-sm gap-4"
              >
                <span>
                  {p.plan.name}{' '}
                  {p.convention
                    ? `— ${p.convention.name}`
                    : ''}
                </span>

                <span className="text-slate-500 text-right">
                  {formatDateAR(p.permit.startDate)} –{' '}
                  {formatDateAR(p.permit.endDate)} (
                  {p.liveStatus})
                </span>
              </li>
            ))}

            {history.permits.length === 0 && (
              <li className="py-2 text-slate-400 text-sm">
                Sin permisos registrados.
              </li>
            )}
          </ul>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() =>
                changeStatus(
                  history.person.id,
                  history.person.dni,
                  'inactivo',
                )
              }
              disabled={history.person.status === 'inactivo'}
              className="text-sm border border-red-300 text-red-700 px-3 py-2 rounded-lg disabled:opacity-40"
            >
              Marcar inactivo
            </button>

            <button
              onClick={() =>
                changeStatus(
                  history.person.id,
                  history.person.dni,
                  'activo',
                )
              }
              disabled={history.person.status === 'activo'}
              className="text-sm border border-emerald-300 text-emerald-700 px-3 py-2 rounded-lg disabled:opacity-40"
            >
              Marcar activo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function PersonRow({
  name,
  dni,
  status,
  onOpen,
  onEdit,
}: {
  name: string
  dni: string
  status: string
  onOpen: () => void
  onEdit: () => void
}) {
  return (
    <div className="p-4 hover:bg-slate-50 flex items-center justify-between gap-4">
      <button
        type="button"
        onClick={onOpen}
        className="flex-1 text-left min-w-0"
      >
        <p className="font-medium text-slate-900">
          {name}
        </p>

        <p className="text-xs text-slate-500 mt-0.5">
          DNI {dni}
        </p>
      </button>

      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            status === 'activo'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {status === 'activo' ? 'Activo' : 'Inactivo'}
        </span>

        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 text-xs border border-slate-300 text-slate-700 px-2.5 py-1.5 rounded-lg hover:bg-white"
        >
          <Pencil className="w-3.5 h-3.5" />
          Editar
        </button>
      </div>
    </div>
  )
}