import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Search, History } from 'lucide-react'
import { searchMembers, findPersonByDni, setPersonStatus } from '@/server/people.functions'
import { findActivePermitsByDni } from '@/server/permits.functions'
import { formatDateAR, formatDateTimeAR } from '@/lib/format'

export const Route = createFileRoute('/_app/personas')({
  component: PersonasPage,
})

function PersonasPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Awaited<ReturnType<typeof searchMembers>>>([])
  const [directHit, setDirectHit] = useState<Awaited<ReturnType<typeof findPersonByDni>>>(null)
  const [selectedDni, setSelectedDni] = useState<string | null>(null)
  const [history, setHistory] = useState<Awaited<ReturnType<typeof findActivePermitsByDni>>>(null)
  const [loading, setLoading] = useState(false)

  async function doSearch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSelectedDni(null)
    setHistory(null)
    try {
      const [members, direct] = await Promise.all([
        searchMembers({ data: { query } }),
        findPersonByDni({ data: { dni: query } }),
      ])
      setResults(members)
      setDirectHit(direct)
    } finally {
      setLoading(false)
    }
  }

  async function openHistory(dni: string) {
    setSelectedDni(dni)
    const h = await findActivePermitsByDni({ data: { dni } })
    setHistory(h)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Personas</h1>

      <form onSubmit={doSearch} className="flex gap-2 bg-white rounded-xl shadow-sm p-4">
        <input
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5"
          placeholder="Buscar por DNI, nombre, apellido o número de socio"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="bg-blue-900 text-white px-4 rounded-lg font-semibold flex items-center gap-1.5">
          <Search className="w-4 h-4" /> Buscar
        </button>
      </form>

      {!selectedDni && (
        <div className="bg-white rounded-xl shadow-sm divide-y divide-slate-100">
          {directHit && !results.some((r) => r.person.dni === directHit.person.dni) && (
            <PersonRow
              name={`${directHit.person.firstName} ${directHit.person.lastName}`}
              dni={directHit.person.dni}
              tag={directHit.member ? `Socio N° ${directHit.member.memberNumber}` : 'No socio'}
              onOpen={() => openHistory(directHit.person.dni)}
            />
          )}
          {results.map((r) => (
            <PersonRow
              key={r.person.id}
              name={`${r.person.firstName} ${r.person.lastName}`}
              dni={r.person.dni}
              tag={`Socio N° ${r.member.memberNumber} — ${r.member.memberStatus === 'activo' ? 'Activo' : 'Inactivo'}`}
              onOpen={() => openHistory(r.person.dni)}
            />
          ))}
          {!loading && results.length === 0 && !directHit && (
            <p className="p-4 text-sm text-slate-400">Buscá una persona para ver su ficha e historial.</p>
          )}
        </div>
      )}

      {selectedDni && history && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <button onClick={() => setSelectedDni(null)} className="text-sm text-slate-500 mb-3">
            ← Volver a la búsqueda
          </button>
          <h2 className="text-xl font-bold">
            {history.person.firstName} {history.person.lastName}
          </h2>
          <p className="text-sm text-slate-500 mb-1">DNI {history.person.dni}</p>
          <p className="text-sm text-slate-500 mb-4">
            Estado: {history.person.status === 'activo' ? 'Activo' : 'Inactivo'}
            {history.person.phone && ` — Tel: ${history.person.phone}`}
          </p>

          {history.lastEntry && (
            <p className="text-sm text-slate-600 mb-4">Último ingreso: {formatDateTimeAR(history.lastEntry.occurredAt)}</p>
          )}

          <h3 className="font-semibold flex items-center gap-2 mb-2">
            <History className="w-4 h-4" /> Permisos
          </h3>
          <ul className="divide-y divide-slate-100">
            {history.permits.map((p) => (
              <li key={p.permit.id} className="py-2 flex items-center justify-between text-sm">
                <span>
                  {p.plan.name} {p.convention ? `— ${p.convention.name}` : ''}
                </span>
                <span className="text-slate-500">
                  {formatDateAR(p.permit.startDate)} – {formatDateAR(p.permit.endDate)} ({p.liveStatus})
                </span>
              </li>
            ))}
            {history.permits.length === 0 && <li className="py-2 text-slate-400 text-sm">Sin permisos registrados.</li>}
          </ul>

          <div className="mt-5 flex gap-2">
            <button
              onClick={async () => {
                await setPersonStatus({ data: { personId: history.person.id, status: 'inactivo' } })
                openHistory(history.person.dni)
              }}
              className="text-sm border border-red-300 text-red-700 px-3 py-2 rounded-lg"
            >
              Marcar inactivo
            </button>
            <button
              onClick={async () => {
                await setPersonStatus({ data: { personId: history.person.id, status: 'activo' } })
                openHistory(history.person.dni)
              }}
              className="text-sm border border-emerald-300 text-emerald-700 px-3 py-2 rounded-lg"
            >
              Marcar activo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function PersonRow({ name, dni, tag, onOpen }: { name: string; dni: string; tag: string; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="w-full text-left p-4 hover:bg-slate-50 flex items-center justify-between">
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-xs text-slate-500">DNI {dni}</p>
      </div>
      <span className="text-xs text-slate-500">{tag}</span>
    </button>
  )
}
