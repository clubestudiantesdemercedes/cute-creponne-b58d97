import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Download } from 'lucide-react'
import { listSales } from '@/server/sales.functions'
import { listEntries } from '@/server/entries.functions'
import { listExpiringPermits } from '@/server/permits.functions'
import {
  exportPeopleCsv,
  exportMembersCsv,
  exportSalesCsv,
  exportPaymentsCsv,
  exportEntriesCsv,
  exportPermitsCsv,
  exportConventionsCsv,
  exportBeneficiariesCsv,
  getConventionsReport,
} from '@/server/reports.functions'
import { formatARS, formatDateAR, formatDateTimeAR, todayISO } from '@/lib/format'

export const Route = createFileRoute('/_app/reportes')({
  loader: async () => {
    const today = todayISO()
    const [sales, entries, expiring, conventionsReport] = await Promise.all([
      listSales({ data: { dateFrom: today, dateTo: today } }),
      listEntries({ data: { dateFrom: today, dateTo: today } }),
      listExpiringPermits(),
      getConventionsReport(),
    ])
    return { sales, entries, expiring, conventionsReport }
  },
  component: ReportesPage,
})

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const EXPORTS: { label: string; fn: () => Promise<string>; file: string }[] = [
  { label: 'Personas', fn: exportPeopleCsv, file: 'personas.csv' },
  { label: 'Socios', fn: exportMembersCsv, file: 'socios.csv' },
  { label: 'Ventas', fn: exportSalesCsv, file: 'ventas.csv' },
  { label: 'Pagos', fn: exportPaymentsCsv, file: 'pagos.csv' },
  { label: 'Ingresos', fn: exportEntriesCsv, file: 'ingresos.csv' },
  { label: 'Permisos', fn: exportPermitsCsv, file: 'permisos.csv' },
  { label: 'Convenios', fn: exportConventionsCsv, file: 'convenios.csv' },
  { label: 'Beneficiarios', fn: exportBeneficiariesCsv, file: 'beneficiarios.csv' },
]

function ReportesPage() {
  const { sales, entries, expiring, conventionsReport } = Route.useLoaderData()
  const [tab, setTab] = useState<'ventas' | 'ingresos' | 'convenios' | 'vencimientos'>('ventas')

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Reportes</h1>

      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-2">
        {EXPORTS.map((e) => (
          <button
            key={e.file}
            onClick={async () => downloadCsv(e.file, await e.fn())}
            className="flex items-center gap-1.5 text-xs font-semibold border border-slate-300 px-3 py-2 rounded-lg hover:bg-slate-50"
          >
            <Download className="w-3.5 h-3.5" /> {e.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {(['ventas', 'ingresos', 'convenios', 'vencimientos'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 rounded-lg text-sm font-semibold capitalize ${tab === t ? 'bg-blue-900 text-white' : 'bg-white border border-slate-300'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'ventas' && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold mb-3">Ventas de hoy</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2">N° venta</th>
                <th className="py-2">Hora</th>
                <th className="py-2">Total</th>
                <th className="py-2">Método</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.map((s) => (
                <tr key={s.id}>
                  <td className="py-2">{s.saleNumber}</td>
                  <td className="py-2">{formatDateTimeAR(s.createdAt)}</td>
                  <td className="py-2">{formatARS(s.totalAmount)}</td>
                  <td className="py-2 capitalize">{s.paymentMethod}</td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-slate-400 text-center">
                    Sin ventas hoy.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'ingresos' && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold mb-3">Ingresos de hoy</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2">Hora</th>
                <th className="py-2">Persona</th>
                <th className="py-2">Plan</th>
                <th className="py-2">Método</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((e) => (
                <tr key={e.entry.id}>
                  <td className="py-2">{formatDateTimeAR(e.entry.occurredAt)}</td>
                  <td className="py-2">
                    {e.person.firstName} {e.person.lastName}
                  </td>
                  <td className="py-2">{e.plan.name}</td>
                  <td className="py-2 capitalize">{e.entry.method}</td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-slate-400 text-center">
                    Sin ingresos hoy.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'convenios' && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold mb-3">Resumen por convenio</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2">Convenio</th>
                <th className="py-2">Beneficiarios</th>
                <th className="py-2">Permisos</th>
                <th className="py-2">Ingresos</th>
                <th className="py-2">Recaudación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {conventionsReport.map((r) => (
                <tr key={r.convention.id}>
                  <td className="py-2">{r.convention.name}</td>
                  <td className="py-2">{r.beneficiaryCount}</td>
                  <td className="py-2">{r.activePermits}</td>
                  <td className="py-2">{r.entryCount}</td>
                  <td className="py-2">{formatARS(r.recaudacion)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'vencimientos' && (
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
          {(
            [
              ['Vencidos', expiring.vencidos],
              ['Vencen hoy', expiring.hoy],
              ['Vencen en 3 días', expiring.en3dias],
              ['Vencen en 7 días', expiring.en7dias],
            ] as const
          ).map(([label, rows]) => (
            <div key={label}>
              <h3 className="font-semibold text-sm mb-2">
                {label} ({rows.length})
              </h3>
              <ul className="divide-y divide-slate-100 text-sm">
                {rows.map((r) => (
                  <li key={r.permit.id} className="py-1.5 flex justify-between">
                    <span>
                      {r.person.firstName} {r.person.lastName} — {r.plan.name}
                    </span>
                    <span className="text-slate-500">{formatDateAR(r.permit.endDate)}</span>
                  </li>
                ))}
                {rows.length === 0 && <li className="py-1.5 text-slate-400">Sin registros.</li>}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
