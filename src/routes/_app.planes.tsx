import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Plus, Save } from 'lucide-react'
import { listPlans, listAllPrices, upsertPlan, upsertPrice, listConventionsAdmin } from '@/server/plans.functions'
import { formatARS } from '@/lib/format'

export const Route = createFileRoute('/_app/planes')({
  loader: async () => {
    const [plans, prices, conventions] = await Promise.all([listPlans(), listAllPrices(), listConventionsAdmin()])
    return { plans, prices, conventions }
  },
  component: PlanesPage,
})

const CONDITIONS: { value: 'socio' | 'no_socio' | 'convenio'; label: string }[] = [
  { value: 'socio', label: 'Socio' },
  { value: 'no_socio', label: 'No socio' },
  { value: 'convenio', label: 'Convenio (general)' },
]

function PlanesPage() {
  const { plans, prices, conventions } = Route.useLoaderData()
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    durationValue: 30,
    durationUnit: 'dia' as 'dia' | 'temporada',
    seasonStart: '',
    seasonEnd: '',
  })

  async function reload() {
    window.location.reload()
  }

  async function createPlan(e: React.FormEvent) {
    e.preventDefault()
    await upsertPlan({
      data: {
        name: form.name,
        description: form.description || null,
        durationValue: form.durationUnit === 'temporada' ? 1 : form.durationValue,
        durationUnit: form.durationUnit,
        seasonStart: form.durationUnit === 'temporada' ? form.seasonStart : null,
        seasonEnd: form.durationUnit === 'temporada' ? form.seasonEnd : null,
        active: true,
        sortOrder: plans.length + 1,
      },
    })
    setCreating(false)
    reload()
  }

  function priceOf(planId: number, condition: string, conventionId: number | null) {
    return prices.find((p) => p.planId === planId && p.conditionType === condition && p.conventionId === conventionId)?.amount ?? 0
  }

  async function savePrice(planId: number, conditionType: 'socio' | 'no_socio' | 'convenio', conventionId: number | null, amount: number) {
    await upsertPrice({ data: { planId, conditionType, conventionId, amount } })
    reload()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Planes y tarifas</h1>
        <button onClick={() => setCreating(!creating)} className="flex items-center gap-1.5 bg-blue-900 text-white px-3 py-2 rounded-lg text-sm font-semibold">
          <Plus className="w-4 h-4" /> Nuevo plan
        </button>
      </div>

      {creating && (
        <form onSubmit={createPlan} className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="text-slate-600">Nombre *</span>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="text-sm">
              <span className="text-slate-600">Tipo de duración</span>
              <select value={form.durationUnit} onChange={(e) => setForm({ ...form, durationUnit: e.target.value as any })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
                <option value="dia">Días</option>
                <option value="temporada">Temporada (fechas fijas)</option>
              </select>
            </label>
            {form.durationUnit === 'dia' ? (
              <label className="text-sm">
                <span className="text-slate-600">Duración (días)</span>
                <input type="number" min={1} value={form.durationValue} onChange={(e) => setForm({ ...form, durationValue: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
              </label>
            ) : (
              <>
                <label className="text-sm">
                  <span className="text-slate-600">Inicio de temporada</span>
                  <input type="date" value={form.seasonStart} onChange={(e) => setForm({ ...form, seasonStart: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
                </label>
                <label className="text-sm">
                  <span className="text-slate-600">Fin de temporada</span>
                  <input type="date" value={form.seasonEnd} onChange={(e) => setForm({ ...form, seasonEnd: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
                </label>
              </>
            )}
          </div>
          <label className="text-sm block">
            <span className="text-slate-600">Descripción</span>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          <button className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg text-sm">Crear plan</button>
        </form>
      )}

      {plans.map((plan) => (
        <div key={plan.id} className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-bold text-lg">{plan.name}</h2>
          <p className="text-sm text-slate-500 mb-4">
            {plan.durationUnit === 'temporada' ? `Temporada: ${plan.seasonStart} a ${plan.seasonEnd}` : `${plan.durationValue} días`}
            {!plan.active && ' — INACTIVO'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {CONDITIONS.map((c) => (
              <PriceEditor key={c.value} label={c.label} value={priceOf(plan.id, c.value, null)} onSave={(amount) => savePrice(plan.id, c.value, null, amount)} />
            ))}
          </div>
          {conventions.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-sm font-medium text-slate-600 mb-2">Tarifas específicas por convenio</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {conventions.map((c) => (
                  <PriceEditor key={c.id} label={c.name} value={priceOf(plan.id, 'convenio', c.id)} onSave={(amount) => savePrice(plan.id, 'convenio', c.id, amount)} />
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function PriceEditor({ label, value, onSave }: { label: string; value: number; onSave: (amount: number) => void }) {
  const [amount, setAmount] = useState(value)
  const [dirty, setDirty] = useState(false)
  return (
    <div className="border border-slate-200 rounded-lg p-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-xs text-slate-400 mb-1">Actual: {formatARS(value)}</p>
      <div className="flex gap-1">
        <input
          type="number"
          value={amount}
          onChange={(e) => {
            setAmount(Number(e.target.value))
            setDirty(true)
          }}
          className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        />
        <button
          disabled={!dirty}
          onClick={() => {
            onSave(amount)
            setDirty(false)
          }}
          className="bg-blue-900 disabled:opacity-30 text-white p-1.5 rounded-lg"
        >
          <Save className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
