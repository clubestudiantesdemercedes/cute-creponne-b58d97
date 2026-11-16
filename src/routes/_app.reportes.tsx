import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Download, Search } from 'lucide-react'
import { listSales, getSaleDetail, voidSale } from '@/server/sales.functions'
import { getCurrentUser } from '@/server/auth.functions'
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
    const [sales, entries, expiring, conventionsReport, user] = await Promise.all([
      listSales({ data: { dateFrom: today, dateTo: today } }),
      listEntries({ data: { dateFrom: today, dateTo: today } }),
      listExpiringPermits(),
      getConventionsReport(),
      getCurrentUser(),
    ])
    return { sales, entries, expiring, conventionsReport, user, initialFrom: today, initialTo: today }
  },
  component: ReportesPage,
})

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;',  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

type Tab = 'ventas' | 'ingresos' | 'convenios' | 'vencimientos'

function ReportesPage() {
  const initial = Route.useLoaderData()

  const [dateFrom, setDateFrom] = useState(initial.initialFrom)
  const [dateTo, setDateTo] = useState(initial.initialTo)
  const [sales, setSales] = useState(initial.sales)
  const [entries, setEntries] = useState(initial.entries)
  const [expiring, setExpiring] = useState(initial.expiring)
  const [conventionsReport, setConventionsReport] = useState(initial.conventionsReport)
  const [tab, setTab] = useState<Tab>('ventas')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openSaleId, setOpenSaleId] = useState<number | null>(null)
  const [saleDetail, setSaleDetail] = useState<Awaited<
    ReturnType<typeof getSaleDetail>
  > | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [voidingSaleId, setVoidingSaleId] = useState<number | null>(null)
  const [voidReason, setVoidReason] = useState('error_importe')
  const [voidNotes, setVoidNotes] = useState('')
  const [voidBusy, setVoidBusy] = useState(false)

  const periodData = { dateFrom, dateTo }
  const periodLabel =
    dateFrom === dateTo
      ? formatDateAR(dateFrom)
      : `${formatDateAR(dateFrom)} – ${formatDateAR(dateTo)}`

  async function toggleSaleDetail(saleId: number) {
    if (openSaleId === saleId) {
      setOpenSaleId(null)
      setSaleDetail(null)
      return
    }
    setOpenSaleId(saleId)
    setSaleDetail(null)
    setDetailLoading(true)
    try {
      const detail = await getSaleDetail({ data: { saleId } })
      setSaleDetail(detail)
    } catch {
      setSaleDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  async function confirmVoidSale() {
    if (voidingSaleId == null) return
    if (voidReason === 'otro' && !voidNotes.trim()) {
      setError('Explicá el motivo de la anulación.')
      return
    }
    setVoidBusy(true)
    setError(null)
    try {
      await voidSale({ data: { saleId: voidingSaleId, reason: voidReason as 'error_importe' | 'error_periodo' | 'error_persona' | 'venta_duplicada' | 'error_categoria_convenio' | 'otro', notes: voidNotes } })
      const updated = await listSales({ data: { dateFrom, dateTo } })
      setSales(updated)
      const detail = await getSaleDetail({ data: { saleId: voidingSaleId } })
      setSaleDetail(detail)
      setVoidingSaleId(null)
      setVoidNotes('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo anular la venta.')
    } finally {
      setVoidBusy(false)
    }
  }

  function labelCondition(c: string) {
    if (c === 'socio') return 'Socio'
    if (c === 'deportista') return 'Deportista / reducida'
    if (c === 'no_socio') return 'No socio'
    if (c === 'convenio') return 'Convenio'
    return c
  }

  const EXPORTS: {
    label: string
    fn: () => Promise<string>
    file: string
    filtered: boolean
  }[] = [
    {
      label: 'Personas',
      fn: () => exportPeopleCsv({ data: periodData }),
      file: 'personas.csv',
      filtered: false,
    },
    {
      label: 'Socios',
      fn: () => exportMembersCsv({ data: periodData }),
      file: 'socios.csv',
      filtered: false,
    },
    {
      label: 'Ventas',
      fn: () => exportSalesCsv({ data: periodData }),
      file: 'ventas.csv',
      filtered: true,
    },
    {
      label: 'Pagos',
      fn: () => exportPaymentsCsv({ data: periodData }),
      file: 'pagos.csv',
      filtered: true,
    },
    {
      label: 'Ingresos',
      fn: () => exportEntriesCsv({ data: periodData }),
      file: 'ingresos.csv',
      filtered: true,
    },
    {
      label: 'Permisos',
      fn: () => exportPermitsCsv({ data: periodData }),
      file: 'permisos.csv',
      filtered: true,
    },
    {
      label: 'Convenios',
      fn: () => exportConventionsCsv({ data: periodData }),
      file: 'convenios.csv',
      filtered: false,
    },
    {
      label: 'Beneficiarios',
      fn: () => exportBeneficiariesCsv({ data: periodData }),
      file: 'beneficiarios.csv',
      filtered: false,
    },
  ]

  async function applyFilter() {
    if (dateFrom > dateTo) {
      setError('La fecha "desde" no puede ser posterior a la fecha "hasta".')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [s, e, exp, conv] = await Promise.all([
        listSales({ data: { dateFrom, dateTo } }),
        listEntries({ data: { dateFrom, dateTo } }),
        listExpiringPermits(),
        getConventionsReport(),
      ])

      const filterBucket = <T extends { permit: { endDate: string } }>(rows: T[]) =>
        rows.filter((r) => r.permit.endDate >= dateFrom && r.permit.endDate <= dateTo)

      setSales(s)
      setEntries(e)
      setExpiring({
        vencidos: filterBucket(exp.vencidos),
        hoy: filterBucket(exp.hoy),
        en3dias: filterBucket(exp.en3dias),
        en7dias: filterBucket(exp.en7dias),
      })
      setConventionsReport(conv)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los reportes.')
    } finally {
      setLoading(false)
    }
  }

  function setHoy() {
    const t = todayISO()
    setDateFrom(t)
    setDateTo(t)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Reportes</h1>

      <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
        <p className="text-sm font-semibold text-slate-700">Período</p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="text-slate-600 block mb-1">Desde</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="text-slate-600 block mb-1">Hasta</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <button
            type="button"
            onClick={setHoy}
            className="text-sm font-semibold border border-slate-300 px-3 py-2 rounded-lg hover:bg-slate-50"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={applyFilter}
            disabled={loading}
            className="flex items-center gap-1.5 bg-blue-900 text-white font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-60"
          >
            <Search className="w-4 h-4" />
            {loading ? 'Cargando...' : 'Aplicar'}
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Mostrando datos del período:{' '}
          <span className="font-medium text-slate-700">{periodLabel}</span>
        </p>
        {error && <p className="text-sm text-red-700">{error}</p>}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 space-y-2">
        <p className="text-xs text-slate-500">
          Exportar CSV — Ventas, Pagos, Ingresos y Permisos usan el período aplicado:{' '}
          <span className="font-medium text-slate-700">{periodLabel}</span>. Personas, Socios,
          Convenios y Beneficiarios exportan el listado completo.
        </p>
        <div className="flex flex-wrap gap-2">
          {EXPORTS.map((e) => (
            <button
              key={e.file}
              onClick={async () => {
                const content = await e.fn()
                const suffix = e.filtered ? `_${dateFrom}_${dateTo}` : ''
                downloadCsv(e.file.replace('.csv', `${suffix}.csv`), content)
              }}
              className="flex items-center gap-1.5 text-xs font-semibold border border-slate-300 px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              <Download className="w-3.5 h-3.5" /> {e.label}
              {e.filtered ? ' (período)' : ''}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['ventas', 'ingresos', 'convenios', 'vencimientos'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 rounded-lg text-sm font-semibold capitalize ${
              tab === t ? 'bg-blue-900 text-white' : 'bg-white border border-slate-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'ventas' && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold mb-1">Ventas — {periodLabel}</h2>
          <p className="text-xs text-slate-500 mb-3">
            Hacé clic en una venta para ver las personas, planes y códigos de
            permiso.
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2">N° venta</th>
                <th className="py-2">Hora</th>
                <th className="py-2">Total</th>
                <th className="py-2">Método</th>
                <th className="py-2">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.map((s) => (
                <>
                  <tr
                    key={s.id}
                    onClick={() => void toggleSaleDetail(s.id)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td className="py-2 font-medium text-blue-900">
                      {s.saleNumber}
                      <span className="ml-1 text-slate-400 font-normal">
                        {openSaleId === s.id ? '▼' : '▶'}
                      </span>
                    </td>
                    <td className="py-2">{formatDateTimeAR(s.createdAt)}</td>
                    <td className="py-2">{formatARS(s.totalAmount)}</td>
                    <td className="py-2">{s.paymentMethod === 'sin_cargo' ? 'Sin cargo' : s.paymentMethod}</td>
                    <td className="py-2 capitalize">{s.status}</td>
                  </tr>
                  {openSaleId === s.id && (
                    <tr key={`${s.id}-detail`}>
                      <td colSpan={5} className="bg-slate-50 px-3 py-3">
                        {detailLoading && (
                          <p className="text-slate-500 text-sm">Cargando detalle...</p>
                        )}
                        {!detailLoading && saleDetail && saleDetail.sale.id === s.id && (
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="text-xs text-slate-600">
                                Registró: <strong>{saleDetail.createdByName}</strong>
                              </div>
                              {saleDetail.sale.status !== 'anulada' && !s.cashClosed && (initial.user?.role === 'admin' || saleDetail.sale.createdByUserId === initial.user?.userId) && (
                                <button
                                  type="button"
                                  onClick={() => { setVoidingSaleId(s.id); setVoidReason('error_importe'); setVoidNotes('') }}
                                  className="rounded-lg bg-red-700 px-3 py-2 text-xs font-semibold text-white hover:bg-red-800"
                                >
                                  Anular venta
                                </button>
                              )}
                              {s.cashClosed && <span className="text-xs font-semibold text-slate-500">Caja cerrada: no se puede anular</span>}
                              {saleDetail.sale.status === 'anulada' && <span className="text-xs font-semibold text-red-700">Venta anulada</span>}
                            </div>
                            {saleDetail.sale.status === 'anulada' && (
                              <p className="text-xs text-slate-600">Motivo: {saleDetail.sale.voidReason ?? '—'}{saleDetail.sale.voidNotes ? ' · ' + saleDetail.sale.voidNotes : ''}</p>
                            )}
                            <p className="text-xs font-semibold text-slate-600 uppercase">
                              Personas en esta venta
                            </p>
                            <ul className="space-y-2">
                              {saleDetail.items.map((row) => (
                                <li
                                  key={row.item.id}
                                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                >
                                  <p className="font-medium">
                                    {row.person.lastName}, {row.person.firstName}
                                    <span className="text-slate-500 font-normal">
                                      {' '}
                                      — DNI {row.person.dni}
                                    </span>
                                  </p>
                                  <p className="text-xs text-slate-600 mt-0.5">
                                    {row.plan.name} · {labelCondition(row.item.conditionType)} ·{' '}
                                    {formatARS(row.item.unitPrice)}
                                  </p>
                                  {row.permit && (
                                    <p className="text-xs text-blue-800 mt-0.5 font-mono">
                                      Permiso: {row.permit.code}
                                      {row.permit.endDate
                                        ? ` (vence ${formatDateAR(row.permit.endDate)})`
                                        : ''}
                                    </p>
                                  )}
                                </li>
                              ))}
                            </ul>
                            {saleDetail.items.length === 0 && (
                              <p className="text-slate-400 text-sm">
                                Esta venta no tiene ítems.
                              </p>
                            )}
                          </div>
                        )}
                        {!detailLoading && !saleDetail && (
                          <p className="text-red-600 text-sm">
                            No se pudo cargar el detalle.
                          </p>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-slate-400 text-center">
                    Sin ventas en el período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {voidingSaleId != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Confirmar anulación</h3>
            <p className="text-sm text-slate-600">Se anulará la venta completa, sus pagos y permisos asociados. Los ingresos que ya se hayan registrado se conservarán en el historial. Esta acción no se puede deshacer.</p>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Motivo</span>
              <select value={voidReason} onChange={(e) => setVoidReason(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2">
                <option value="error_importe">Error en el importe</option>
                <option value="error_periodo">Error en el período</option>
                <option value="error_persona">Error en la persona</option>
                <option value="venta_duplicada">Venta duplicada</option>
                <option value="error_categoria_convenio">Error de categoría o convenio</option>
                <option value="otro">Otro</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Detalle {voidReason === 'otro' ? '(obligatorio)' : '(opcional)'}</span>
              <textarea value={voidNotes} onChange={(e) => setVoidNotes(e.target.value)} rows={3} maxLength={1000} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Describí brevemente el motivo..." />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" disabled={voidBusy} onClick={() => setVoidingSaleId(null)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">Cancelar</button>
              <button type="button" disabled={voidBusy || (voidReason === 'otro' && !voidNotes.trim())} onClick={confirmVoidSale} className="rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{voidBusy ? 'Anulando...' : 'Confirmar anulación'}</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'ingresos' && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold mb-3">Ingresos — {periodLabel}</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2">Hora</th>
                <th className="py-2">Persona</th>
                <th className="py-2">Tipo</th>
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
                  <td className="py-2">
                    {e.entry.entryType === 'pileta'
                      ? 'Pileta'
                      : e.entry.entryType === 'campo_deportes'
                        ? 'Campo de deportes'
                        : e.entry.entryType}
                  </td>
                  <td className="py-2">{e.plan?.name ?? '—'}</td>
                  <td className="py-2 capitalize">{e.entry.method}</td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-slate-400 text-center">
                    Sin ingresos en el período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'convenios' && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold mb-1">Resumen por convenio</h2>
          <p className="text-xs text-slate-500 mb-3">
            Totales generales del sistema (no filtrados por período). Las pestañas Ventas e Ingresos sí
            respetan el rango de fechas.
          </p>
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
              {conventionsReport.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-slate-400 text-center">
                    Sin convenios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'vencimientos' && (
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
          <p className="text-xs text-slate-500">
            Permisos cuya fecha de fin está entre {periodLabel} (según estado actual respecto de hoy).
          </p>
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
                  <li key={r.permit.id} className="py-1.5 flex justify-between gap-2">
                    <span>
                      {r.person.firstName} {r.person.lastName} — {r.plan.name}
                    </span>
                    <span className="text-slate-500 shrink-0">{formatDateAR(r.permit.endDate)}</span>
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