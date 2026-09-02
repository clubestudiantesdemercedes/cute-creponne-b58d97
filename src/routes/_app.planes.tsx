import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { Save, CalendarRange } from 'lucide-react'
import {
  listPlans,
  listAllPrices,
  upsertPlan,
  upsertPrice,
  listConventionsAdmin,
} from '@/server/plans.functions'
import { formatARS } from '@/lib/format'

export const Route = createFileRoute('/_app/planes')({
  loader: async () => {
    const [plans, prices, conventions] = await Promise.all([
      listPlans(),
      listAllPrices(),
      listConventionsAdmin(),
    ])
    return { plans, prices, conventions }
  },
  component: PlanesPage,
})

/** Períodos fijos del natatorio */
const PERIODS = [
  {
    key: 'dia',
    label: 'Día',
    durationValue: 1,
    durationUnit: 'dia' as const,
    hint: '1 día',
  },
  {
    key: 'semana',
    label: 'Semana',
    durationValue: 7,
    durationUnit: 'dia' as const,
    hint: '7 días',
  },
  {
    key: 'mensual',
    label: 'Mensual',
    durationValue: 30,
    durationUnit: 'dia' as const,
    hint: '30 días',
  },
  {
    key: 'temporada',
    label: 'Temporada',
    durationValue: 1,
    durationUnit: 'temporada' as const,
    hint: 'Fechas de temporada',
  },
] as const

type PeriodKey = (typeof PERIODS)[number]['key']
type CategoryTab = 'socio' | 'deportista' | 'no_socio' | 'convenio'

function PlanesPage() {
  const { plans, prices, conventions } = Route.useLoaderData()

  const [tab, setTab] = useState<CategoryTab>('socio')
  const [conventionId, setConventionId] = useState<number | null>(
    conventions[0]?.id ?? null,
  )
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Montos en edición: clave = `${periodKey}|${category}|${conventionId ?? 'x'}`
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  // Fechas de temporada (del plan temporada)
  const seasonPlan = useMemo(
    () =>
      plans.find(
        (p) => p.durationUnit === 'temporada' && p.active !== false,
      ) ?? plans.find((p) => p.durationUnit === 'temporada'),
    [plans],
  )

  const [seasonStart, setSeasonStart] = useState(seasonPlan?.seasonStart ?? '')
  const [seasonEnd, setSeasonEnd] = useState(seasonPlan?.seasonEnd ?? '')

  function findPlan(period: (typeof PERIODS)[number]) {
    return plans.find(
      (p) =>
        p.durationUnit === period.durationUnit &&
        p.durationValue === period.durationValue,
    )
  }

  function priceOf(
    planId: number,
    condition: CategoryTab,
    convId: number | null,
  ) {
    return (
      prices.find(
        (p) =>
          p.planId === planId &&
          p.conditionType === condition &&
          (condition === 'convenio'
            ? p.conventionId === convId
            : p.conventionId == null),
      )?.amount ?? 0
    )
  }

  function draftKey(periodKey: PeriodKey, category: CategoryTab, convId: number | null) {
    return `${periodKey}|${category}|${convId ?? 'x'}`
  }

  function getDraftAmount(
    period: (typeof PERIODS)[number],
    category: CategoryTab,
    convId: number | null,
  ) {
    const key = draftKey(period.key, category, convId)
    if (drafts[key] !== undefined) return drafts[key]

    const plan = findPlan(period)
    if (!plan) return ''
    const amount = priceOf(plan.id, category, category === 'convenio' ? convId : null)
    return amount ? String(amount) : ''
  }

  function setDraftAmount(
    periodKey: PeriodKey,
    category: CategoryTab,
    convId: number | null,
    value: string,
  ) {
    const key = draftKey(periodKey, category, convId)
    setDrafts((prev) => ({ ...prev, [key]: value.replace(/[^\d]/g, '') }))
  }

  async function ensurePlan(period: (typeof PERIODS)[number]) {
    const existing = findPlan(period)
    if (existing) return existing

    return upsertPlan({
      data: {
        name: period.label,
        description: period.hint,
        durationValue: period.durationValue,
        durationUnit: period.durationUnit,
        seasonStart: period.durationUnit === 'temporada' ? seasonStart || null : null,
        seasonEnd: period.durationUnit === 'temporada' ? seasonEnd || null : null,
        active: true,
        sortOrder: PERIODS.findIndex((p) => p.key === period.key) + 1,
      },
    })
  }

  async function saveSeasonDates() {
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      if (!seasonStart || !seasonEnd) {
        throw new Error('Completá inicio y fin de temporada.')
      }
      if (seasonStart > seasonEnd) {
        throw new Error('La fecha de inicio no puede ser posterior a la de fin.')
      }

      const plan = await ensurePlan(PERIODS.find((p) => p.key === 'temporada')!)
      await upsertPlan({
        data: {
          id: plan.id,
          name: plan.name || 'Temporada',
          description: plan.description,
          durationValue: 1,
          durationUnit: 'temporada',
          seasonStart,
          seasonEnd,
          active: true,
          sortOrder: plan.sortOrder ?? 5,
        },
      })
      setMessage('Fechas de temporada guardadas.')
      window.location.reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron guardar las fechas.')
    } finally {
      setSaving(false)
    }
  }

  async function saveCategoryPrices() {
    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      if (tab === 'convenio' && conventionId == null) {
        throw new Error('Elegí un convenio para cargar sus tarifas.')
      }

      const convId = tab === 'convenio' ? conventionId : null

      for (const period of PERIODS) {
        const raw = getDraftAmount(period, tab, convId)
        if (raw === '') continue

        const amount = Number(raw)
        if (Number.isNaN(amount) || amount < 0) {
          throw new Error(`Monto inválido en ${period.label}.`)
        }

        const plan = await ensurePlan(period)
        await upsertPrice({
          data: {
            planId: plan.id,
            conditionType: tab,
            conventionId: convId,
            amount,
          },
        })
      }

      setMessage('Tarifas guardadas correctamente.')
      window.location.reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron guardar las tarifas.')
    } finally {
      setSaving(false)
    }
  }

  const activeConventions = conventions.filter((c) => c.status === 'activo')

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Planes y tarifas</h1>
        <p className="text-sm text-slate-500 mt-1">
          Organizado por categoría. Períodos fijos: día (1), semana (7), mensual (30) y
          temporada.
        </p>
      </div>

      {/* Temporada: fechas */}
      <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <div className="flex items-center gap-2 font-semibold text-slate-800">
          <CalendarRange className="w-5 h-5 text-blue-800" />
          Temporada (fechas)
        </div>
        <p className="text-xs text-slate-500">
          Se definen una vez antes del inicio. Valen para socio, no socio y convenios.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="block text-slate-600 mb-1">Inicio</span>
            <input
              type="date"
              value={seasonStart}
              onChange={(e) => setSeasonStart(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="block text-slate-600 mb-1">Fin</span>
            <input
              type="date"
              value={seasonEnd}
              onChange={(e) => setSeasonEnd(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <button
            type="button"
            onClick={saveSeasonDates}
            disabled={saving}
            className="bg-slate-800 text-white font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-60"
          >
            Guardar fechas
          </button>
        </div>
      </div>

      {/* Tabs categoría */}
      <div className="flex flex-wrap gap-2">
                {(
          [
            { value: 'socio' as const, label: 'Socios' },
            { value: 'deportista' as const, label: 'Deportistas' },
            { value: 'no_socio' as const, label: 'No socios' },
            { value: 'convenio' as const, label: 'Convenios' },
          ] as const
        ).map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              tab === t.value
                ? 'bg-blue-900 text-white'
                : 'bg-white border border-slate-300 text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'convenio' && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <label className="text-sm font-medium text-slate-700 block mb-2">
            Convenio
          </label>
          {activeConventions.length === 0 ? (
            <p className="text-sm text-amber-700">
              No hay convenios activos. Creá uno en el menú Convenios.
            </p>
          ) : (
            <select
              className="w-full sm:w-80 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={conventionId ?? ''}
              onChange={(e) =>
                setConventionId(e.target.value ? Number(e.target.value) : null)
              }
            >
              {activeConventions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          <p className="text-xs text-slate-500 mt-2">
            Cada convenio tiene su propia grilla de precios por período.
          </p>
        </div>
      )}

      {/* Grilla de precios por período */}
      <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-slate-800">
          Tarifas —{' '}
          {tab === 'socio'
            ? 'Socios'
            : tab === 'deportista'
              ? 'Deportistas'
              : tab === 'no_socio'
                ? 'No socios'
                : 'Convenio'}
        </h2>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="py-2 pr-3">Período</th>
              <th className="py-2 pr-3">Duración</th>
              <th className="py-2">Precio ($)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {PERIODS.map((period) => {
              const convId = tab === 'convenio' ? conventionId : null
              const disabled = tab === 'convenio' && conventionId == null
              return (
                <tr key={period.key}>
                  <td className="py-3 pr-3 font-medium text-slate-800">{period.label}</td>
                  <td className="py-3 pr-3 text-slate-500">{period.hint}</td>
                  <td className="py-3">
                    <input
                      type="text"
                      inputMode="numeric"
                      disabled={disabled || saving}
                      placeholder="0"
                      value={getDraftAmount(period, tab, convId)}
                      onChange={(e) =>
                        setDraftAmount(period.key, tab, convId, e.target.value)
                      }
                      className="w-36 rounded-lg border border-slate-300 px-3 py-2 font-mono disabled:bg-slate-50"
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={saveCategoryPrices}
            disabled={saving || (tab === 'convenio' && conventionId == null)}
            className="inline-flex items-center gap-2 bg-blue-900 text-white font-semibold px-4 py-2.5 rounded-lg text-sm disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar tarifas de esta categoría'}
          </button>
          {message && <p className="text-sm text-emerald-700">{message}</p>}
          {error && <p className="text-sm text-red-700">{error}</p>}
        </div>
      </div>

      <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
        <p className="font-medium text-slate-600 mb-1">Cómo se usa</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Elegí la categoría (Socios, No socios o Convenios).</li>
          <li>Completá el precio de cada período (podés dejar vacío los que no uses).</li>
          <li>
            Si el plan aún no existe (día, semana, etc.), se crea solo al guardar.
          </li>
          <li>La temporada usa las fechas del bloque de arriba.</li>
        </ul>
      </div>
    </div>
  )
}