import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Plus, Save, Pencil, Power, PowerOff, X } from 'lucide-react'
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

const CONDITIONS: {
  value: 'socio' | 'no_socio' | 'convenio'
  label: string
}[] = [
  { value: 'socio', label: 'Socio' },
  { value: 'no_socio', label: 'No socio' },
  { value: 'convenio', label: 'Convenio (general)' },
]

type PlanForm = {
  id?: number
  name: string
  description: string
  durationValue: number
  durationUnit: 'dia' | 'temporada'
  seasonStart: string
  seasonEnd: string
  active: boolean
}

function PlanesPage() {
  const { plans, prices, conventions } = Route.useLoaderData()

  const [editingId, setEditingId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)

  const [form, setForm] = useState<PlanForm>({
    name: '',
    description: '',
    durationValue: 30,
    durationUnit: 'dia',
    seasonStart: '',
    seasonEnd: '',
    active: true,
  })

  async function reload() {
    window.location.reload()
  }

  function resetForm() {
    setForm({
      name: '',
      description: '',
      durationValue: 30,
      durationUnit: 'dia',
      seasonStart: '',
      seasonEnd: '',
      active: true,
    })

    setCreating(false)
    setEditingId(null)
  }

  function startCreate() {
    setEditingId(null)

    setForm({
      name: '',
      description: '',
      durationValue: 30,
      durationUnit: 'dia',
      seasonStart: '',
      seasonEnd: '',
      active: true,
    })

    setCreating(true)
  }

  function startEdit(plan: (typeof plans)[number]) {
    setCreating(false)
    setEditingId(plan.id)

    setForm({
      id: plan.id,
      name: plan.name,
      description: plan.description ?? '',
      durationValue: plan.durationValue,
      durationUnit: plan.durationUnit as 'dia' | 'temporada',
      seasonStart: plan.seasonStart ?? '',
      seasonEnd: plan.seasonEnd ?? '',
      active: plan.active,
    })

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function savePlan(e: React.FormEvent) {
    e.preventDefault()

    await upsertPlan({
      data: {
        id: form.id,
        name: form.name,
        description: form.description || null,
        durationValue:
          form.durationUnit === 'temporada'
            ? 1
            : form.durationValue,
        durationUnit: form.durationUnit,
        seasonStart:
          form.durationUnit === 'temporada'
            ? form.seasonStart
            : null,
        seasonEnd:
          form.durationUnit === 'temporada'
            ? form.seasonEnd
            : null,
        active: form.active,
        sortOrder:
          form.id != null
            ? plans.find((p) => p.id === form.id)?.sortOrder ?? 0
            : plans.length + 1,
      },
    })

    resetForm()
    reload()
  }

  async function togglePlan(plan: (typeof plans)[number]) {
    const action = plan.active ? 'desactivar' : 'activar'

    const confirmed = window.confirm(
      `¿Seguro que querés ${action} el plan "${plan.name}"?`,
    )

    if (!confirmed) return

    await upsertPlan({
      data: {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        durationValue: plan.durationValue,
        durationUnit: plan.durationUnit as 'dia' | 'temporada',
        seasonStart: plan.seasonStart,
        seasonEnd: plan.seasonEnd,
        active: !plan.active,
        sortOrder: plan.sortOrder,
      },
    })

    reload()
  }

  function priceOf(
    planId: number,
    condition: string,
    conventionId: number | null,
  ) {
    return (
      prices.find(
        (p) =>
          p.planId === planId &&
          p.conditionType === condition &&
          p.conventionId === conventionId,
      )?.amount ?? 0
    )
  }

  async function savePrice(
    planId: number,
    conditionType: 'socio' | 'no_socio' | 'convenio',
    conventionId: number | null,
    amount: number,
  ) {
    await upsertPrice({
      data: {
        planId,
        conditionType,
        conventionId,
        amount,
      },
    })

    reload()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Planes y tarifas
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Administrá los planes, sus tarifas y su estado.
          </p>
        </div>

        <button
          onClick={creating ? resetForm : startCreate}
          className="flex items-center gap-1.5 bg-blue-900 text-white px-3 py-2 rounded-lg text-sm font-semibold"
        >
          {creating ? (
            <>
              <X className="w-4 h-4" />
              Cancelar
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Nuevo plan
            </>
          )}
        </button>
      </div>

      {(creating || editingId !== null) && (
        <form
          onSubmit={savePlan}
          className="bg-white rounded-xl shadow-sm p-5 space-y-4 border border-blue-100"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">
              {editingId !== null
                ? 'Modificar plan'
                : 'Nuevo plan'}
            </h2>

            {editingId !== null && (
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  form.active
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {form.active ? 'ACTIVO' : 'INACTIVO'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="text-slate-600">
                Nombre *
              </span>

              <input
                required
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="text-sm">
              <span className="text-slate-600">
                Tipo de duración
              </span>

              <select
                value={form.durationUnit}
                onChange={(e) =>
                  setForm({
                    ...form,
                    durationUnit:
                      e.target.value as
                        | 'dia'
                        | 'temporada',
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="dia">Días</option>
                <option value="temporada">
                  Temporada (fechas fijas)
                </option>
              </select>
            </label>

            {form.durationUnit === 'dia' ? (
              <label className="text-sm">
                <span className="text-slate-600">
                  Duración (días)
                </span>

                <input
                  type="number"
                  min={1}
                  value={form.durationValue}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      durationValue: Number(
                        e.target.value,
                      ),
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
            ) : (
              <>
                <label className="text-sm">
                  <span className="text-slate-600">
                    Inicio de temporada
                  </span>

                  <input
                    type="date"
                    value={form.seasonStart}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        seasonStart: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>

                <label className="text-sm">
                  <span className="text-slate-600">
                    Fin de temporada
                  </span>

                  <input
                    type="date"
                    value={form.seasonEnd}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        seasonEnd: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
              </>
            )}
          </div>

          <label className="text-sm block">
            <span className="text-slate-600">
              Descripción
            </span>

            <input
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          {editingId !== null && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) =>
                  setForm({
                    ...form,
                    active: e.target.checked,
                  })
                }
              />

              <span>
                Plan activo
              </span>
            </label>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg text-sm"
            >
              {editingId !== null
                ? 'Guardar cambios'
                : 'Crear plan'}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="border border-slate-300 text-slate-600 font-semibold px-4 py-2 rounded-lg text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {plans.map((plan) => (
        <div
          key={plan.id}
          className={`bg-white rounded-xl shadow-sm p-5 ${
            !plan.active
              ? 'opacity-75 border border-red-200'
              : ''
          }`}
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg">
                  {plan.name}
                </h2>

                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    plan.active
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {plan.active
                    ? 'ACTIVO'
                    : 'INACTIVO'}
                </span>
              </div>

              <p className="text-sm text-slate-500 mt-1">
                {plan.durationUnit === 'temporada'
                  ? `Temporada: ${plan.seasonStart} a ${plan.seasonEnd}`
                  : `${plan.durationValue} días`}
              </p>

              {plan.description && (
                <p className="text-sm text-slate-500 mt-1">
                  {plan.description}
                </p>
              )}
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => startEdit(plan)}
                className="flex items-center gap-1.5 border border-blue-300 text-blue-700 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50"
              >
                <Pencil className="w-4 h-4" />
                Modificar
              </button>

              <button
                onClick={() => togglePlan(plan)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold ${
                  plan.active
                    ? 'border border-red-300 text-red-700 hover:bg-red-50'
                    : 'border border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                {plan.active ? (
                  <>
                    <PowerOff className="w-4 h-4" />
                    Inactivar
                  </>
                ) : (
                  <>
                    <Power className="w-4 h-4" />
                    Activar
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {CONDITIONS.map((c) => (
              <PriceEditor
                key={c.value}
                label={c.label}
                value={priceOf(
                  plan.id,
                  c.value,
                  null,
                )}
                onSave={(amount) =>
                  savePrice(
                    plan.id,
                    c.value,
                    null,
                    amount,
                  )
                }
              />
            ))}
          </div>

          {conventions.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-sm font-medium text-slate-600 mb-2">
                Tarifas específicas por convenio
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {conventions.map((c) => (
                  <PriceEditor
                    key={c.id}
                    label={c.name}
                    value={priceOf(
                      plan.id,
                      'convenio',
                      c.id,
                    )}
                    onSave={(amount) =>
                      savePrice(
                        plan.id,
                        'convenio',
                        c.id,
                        amount,
                      )
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function PriceEditor({
  label,
  value,
  onSave,
}: {
  label: string
  value: number
  onSave: (amount: number) => void
}) {
  const [amount, setAmount] = useState(value)
  const [dirty, setDirty] = useState(false)

  return (
    <div className="border border-slate-200 rounded-lg p-3">
      <p className="text-xs text-slate-500 mb-1">
        {label}
      </p>

      <p className="text-xs text-slate-400 mb-1">
        Actual: {formatARS(value)}
      </p>

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