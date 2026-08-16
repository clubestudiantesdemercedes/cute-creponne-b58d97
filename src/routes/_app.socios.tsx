import { createFileRoute } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { Upload, CheckCircle2, AlertTriangle } from 'lucide-react'
import { previewMembersImport, confirmMembersImport, listMembers, type ImportRowT } from '@/server/members.functions'

export const Route = createFileRoute('/_app/socios')({
  loader: () => listMembers(),
  component: SociosPage,
})

function SociosPage() {
  const members = Route.useLoaderData()
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof previewMembersImport>> | null>(null)
  const [csvText, setCsvText] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ created: number; updated: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [q, setQ] = useState('')

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    setCsvText(text)
    const result = await previewMembersImport({ data: { csv: text } })
    setPreview(result)
    setImportResult(null)
  }

  async function confirm() {
    if (!preview) return
    setImporting(true)
    try {
      const validRows = preview.rows.filter((r) => r.errors.length === 0).map((r) => r.row as ImportRowT)
      const result = await confirmMembersImport({ data: { rows: validRows } })
      setImportResult(result)
      setPreview(null)
      if (fileRef.current) fileRef.current.value = ''
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Socios</h1>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-semibold mb-2 flex items-center gap-2">
          <Upload className="w-4 h-4" /> Importar base de socios (CSV)
        </h2>
        <p className="text-sm text-slate-500 mb-3">
          El archivo debe incluir columnas como: socio, dni, nombre, apellido (también se aceptan encabezados con acentos o
          variantes comunes).
        </p>
        <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={onFile} className="text-sm" />

        {preview && (
          <div className="mt-4 border border-slate-200 rounded-lg p-4">
            <div className="flex gap-4 text-sm mb-3">
              <span className="text-emerald-700 font-semibold">{preview.newCount} nuevos</span>
              <span className="text-blue-700 font-semibold">{preview.updateCount} para actualizar</span>
              <span className="text-red-700 font-semibold">{preview.errorCount ?? 0} con errores</span>
            </div>
            <div className="max-h-64 overflow-auto text-xs">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="pr-2">Socio</th>
                    <th className="pr-2">DNI</th>
                    <th className="pr-2">Nombre</th>
                    <th className="pr-2">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.slice(0, 100).map((r, i) => (
                    <tr key={i} className={r.errors.length ? 'text-red-600' : ''}>
                      <td className="pr-2 py-0.5">{r.row.memberNumber}</td>
                      <td className="pr-2 py-0.5">{r.row.dni}</td>
                      <td className="pr-2 py-0.5">
                        {r.row.firstName} {r.row.lastName}
                      </td>
                      <td className="pr-2 py-0.5">{r.errors.length ? r.errors.join(', ') : r.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={confirm}
              disabled={importing || preview.newCount + preview.updateCount === 0}
              className="mt-4 bg-blue-900 disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-lg text-sm"
            >
              {importing ? 'Importando...' : `Confirmar importación (${preview.newCount + preview.updateCount})`}
            </button>
          </div>
        )}

        {importResult && (
          <p className="mt-3 text-emerald-700 text-sm font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Importación completa: {importResult.created} creados, {importResult.updated}{' '}
            actualizados.
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <input
          className="w-full rounded-lg border border-slate-300 px-3 py-2 mb-3 text-sm"
          placeholder="Filtrar por número, DNI o nombre..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="overflow-auto max-h-[60vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-2">Socio N°</th>
                <th className="py-2 pr-2">Nombre</th>
                <th className="py-2 pr-2">DNI</th>
                <th className="py-2 pr-2">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((m) => (
                <tr key={m.member.id}>
                  <td className="py-2 pr-2">{m.member.memberNumber}</td>
                  <td className="py-2 pr-2">
                    {m.person.firstName} {m.person.lastName}
                  </td>
                  <td className="py-2 pr-2">{m.person.dni}</td>
                  <td className="py-2 pr-2">
                    {m.member.memberStatus === 'activo' ? (
                      <span className="text-emerald-700 font-medium">Activo</span>
                    ) : (
                      <span className="text-red-700 font-medium">Inactivo</span>
                    )}
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
