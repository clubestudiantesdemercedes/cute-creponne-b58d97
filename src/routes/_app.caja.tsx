import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Lock, Wallet } from 'lucide-react'
import { getCashSummary, closeCashRegister } from '@/server/cash.functions'
import { formatARS, todayISO } from '@/lib/format'

export const Route = createFileRoute('/_app/caja')({
  loader: () => getCashSummary({ data: { date: todayISO() } }),
  component: CajaPage,
})

const METHOD_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  mercadopago: 'Mercado Pago',
  tarjeta: 'Tarjeta',
  otro: 'Otro',
}

function CajaPage() {
  const initial = Route.useLoaderData()
  const [date, setDate] = useState(todayISO())
  const [summary, setSummary] = useState(initial)
  const [closing, setClosing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadDate(d: string) {
    setDate(d)
    setSummary(await getCashSummary({ data: { date: d } }))
  }

  async function doClose() {
    setClosing(true)
    setError(null)
    try {
      await closeCashRegister({ data: { date } })
      await loadDate(date)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cerrar la caja.')
    } finally {
      setClosing(false)
    }
  }

  const closed = summary.closure?.status === 'cerrada'

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
        <Wallet className="w-6 h-6" /> Cierre de caja
      </h1>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <label className="text-sm block mb-4">
          <span className="text-slate-600">Fecha</span>
          <input type="date" value={date} onChange={(e) => loadDate(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>

        <ul className="divide-y divide-slate-100">
          {Object.entries(summary.totals).map(([method, amount]) => (
            <li key={method} className="py-2 flex justify-between text-sm">
              <span>{METHOD_LABELS[method] ?? method}</span>
              <span className="font-medium">{formatARS(amount)}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between items-center pt-3 mt-2 border-t border-slate-200">
          <span className="font-bold">Total ({summary.salesCount} ventas)</span>
          <span className="font-bold text-xl text-red-700">{formatARS(summary.totalAmount)}</span>
        </div>

        {error && <p className="text-red-700 text-sm mt-3">{error}</p>}

        {closed ? (
          <p className="mt-4 flex items-center gap-2 text-emerald-700 font-semibold text-sm bg-emerald-50 p-3 rounded-lg">
            <Lock className="w-4 h-4" /> Caja cerrada. No admite modificaciones.
          </p>
        ) : (
          <button
            onClick={doClose}
            disabled={closing}
            className="mt-4 w-full bg-red-700 hover:bg-red-800 disabled:opacity-60 text-white font-bold py-3 rounded-lg"
          >
            {closing ? 'Cerrando...' : 'Cerrar caja del día'}
          </button>
        )}
      </div>
    </div>
  )
}
