import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  UserCheck,
  UserPlus,
  Handshake,
  Trash2,
  ArrowLeft,
  Search,
  Loader2,
  CheckCircle2,
  MessageCircle,
} from 'lucide-react'

import {
  searchMembers,
  searchNonMembers,
  createOrUpdatePerson,
  listActiveConventions,
  createConventionBeneficiary,
} from '@/server/people.functions'

import { listPlans, listAllPrices } from '@/server/plans.functions'
import { createSale } from '@/server/sales.functions'
import { formatARS, formatDateAR } from '@/lib/format'
import { QrCode } from '@/components/QrCode'

export const Route = createFileRoute('/_app/venta')({
  loader: async () => {
    const [plans, prices, conventions] = await Promise.all([
      listPlans(),
      listAllPrices(),
      listActiveConventions(),
    ])

    return { plans, prices, conventions }
  },

  component: VentaRapida,
})

type ConditionType = 'socio' | 'no_socio' | 'convenio'

type PersonData = {
  personId: number
  fullName: string
  dni: string
  firstName: string
  lastName: string
  birthDate: string
  phone: string
  email: string
  address: string
  conditionType: ConditionType
  conventionId: number | null
  conventionName?: string
}

type CartItem = {
  tempId: string
  personId: number
  fullName: string
  dni: string
  conditionType: ConditionType
  conventionId: number | null
  conventionName?: string
  planId: number
  planName: string
  price: number
}

type Step =
  | { name: 'elegir_tipo' }
  | { name: 'buscar_socio' }
  | { name: 'buscar_no_socio' }
  | {
      name: 'verificar_persona'
      person: PersonData
      source: 'no_socio'
    }
  | {
      name: 'elegir_convenio'
      person: PersonData
    }
  | {
      name: 'elegir_plan'
      person: PersonData
    }
  | { name: 'carrito' }
  | {
      name: 'confirmada'
      sale: any
      items: any[]
      permits: any[]
    }

function VentaRapida() {
  const { plans, prices, conventions } = Route.useLoaderData()

  const [cart, setCart] = useState<CartItem[]>([])

  const [step, setStep] = useState<Step>({
    name: 'elegir_tipo',
  })

  function priceFor(
    planId: number,
    conditionType: ConditionType,
    conventionId: number | null,
  ) {
    if (conditionType === 'convenio' && conventionId) {
      const specific = prices.find(
        (p) =>
          p.planId === planId &&
          p.conditionType === 'convenio' &&
          p.conventionId === conventionId,
      )

      if (specific) return specific.amount
    }

    const generic = prices.find(
      (p) =>
        p.planId === planId &&
        p.conditionType === conditionType &&
        !p.conventionId,
    )

    return generic?.amount ?? 0
  }

  function addToCart(
    person: PersonData,
    planId: number,
  ) {
    const plan = plans.find((p) => p.id === planId)

    if (!plan) return

    const price = priceFor(
      planId,
      person.conditionType,
      person.conventionId,
    )

    setCart((current) => [
      ...current,
      {
        tempId: crypto.randomUUID(),
        personId: person.personId,
        fullName: person.fullName,
        dni: person.dni,
        conditionType: person.conditionType,
        conventionId: person.conventionId,
        conventionName: person.conventionName,
        planId,
        planName: plan.name,
        price,
      },
    ])

    setStep({ name: 'elegir_tipo' })
  }

  const total = cart.reduce(
    (acc, item) => acc + item.price,
    0,
  )

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">
          Venta rápida
        </h1>

        {cart.length > 0 &&
          step.name !== 'carrito' &&
          step.name !== 'confirmada' && (
            <button
              onClick={() =>
                setStep({ name: 'carrito' })
              }
              className="text-sm font-semibold bg-blue-900 text-white px-4 py-2 rounded-lg"
            >
              Ver carrito ({cart.length}) —{' '}
              {formatARS(total)}
            </button>
          )}
      </div>

      {step.name === 'elegir_tipo' && (
        <ElegirTipo
          onSocio={() =>
            setStep({ name: 'buscar_socio' })
          }
          onNoSocio={() =>
            setStep({ name: 'buscar_no_socio' })
          }
          hasCart={cart.length > 0}
          onVerCarrito={() =>
            setStep({ name: 'carrito' })
          }
        />
      )}

      {step.name === 'buscar_socio' && (
        <BuscarSocio
          onBack={() =>
            setStep({ name: 'elegir_tipo' })
          }
          onFound={(person) =>
            setStep({
              name: 'elegir_plan',
              person,
            })
          }
        />
      )}

      {step.name === 'buscar_no_socio' && (
        <BuscarNoSocio
          onBack={() =>
            setStep({ name: 'elegir_tipo' })
          }
          onFound={(person) =>
            setStep({
              name: 'verificar_persona',
              person,
              source: 'no_socio',
            })
          }
        />
      )}

      {step.name === 'verificar_persona' && (
        <VerificarPersona
          person={step.person}
          onBack={() =>
            setStep({ name: 'buscar_no_socio' })
          }
          onContinue={(person) => {
            setStep({
              name: 'elegir_convenio',
              person,
            })
          }}
          onNoConvenio={(person) => {
            setStep({
              name: 'elegir_plan',
              person: {
                ...person,
                conditionType: 'no_socio',
                conventionId: null,
                conventionName: undefined,
              },
            })
          }}
        />
      )}

      {step.name === 'elegir_convenio' && (
        <ElegirConvenio
          conventions={conventions}
          person={step.person}
          onBack={() =>
            setStep({
              name: 'verificar_persona',
              person: step.person,
              source: 'no_socio',
            })
          }
          onSelect={async (convention) => {
            try {
              const result =
                await createConventionBeneficiary({
                  data: {
                    dni: step.person.dni,
                    firstName:
                      step.person.firstName,
                    lastName:
                      step.person.lastName,
                    birthDate:
                      step.person.birthDate || null,
                    phone:
                      step.person.phone || null,
                    email:
                      step.person.email || null,
                    address:
                      step.person.address || null,
                    notes: null,
                    conventionId:
                      convention.id,
                    employeeCode: null,
                  },
                })

              const updatedPerson: PersonData = {
                ...step.person,
                personId: result.person.id,
                fullName: `${result.person.firstName} ${result.person.lastName}`,
                dni: result.person.dni,
                firstName: result.person.firstName,
                lastName: result.person.lastName,
                conditionType: 'convenio',
                conventionId: convention.id,
                conventionName: convention.name,
              }

              setStep({
                name: 'elegir_plan',
                person: updatedPerson,
              })
            } catch (error) {
              alert(
                error instanceof Error
                  ? error.message
                  : 'No se pudo registrar el convenio.',
              )
            }
          }}
        />
      )}

      {step.name === 'elegir_plan' && (
        <ElegirPlan
          plans={plans}
          persona={step.person}
          priceFor={priceFor}
          onBack={() =>
            setStep({
              name:
                step.person.conditionType ===
                'convenio'
                  ? 'elegir_convenio'
                  : step.person.conditionType ===
                      'no_socio'
                    ? 'verificar_persona'
                    : 'buscar_socio',
              ...(step.person.conditionType ===
              'no_socio'
                ? {
                    person: step.person,
                    source: 'no_socio' as const,
                  }
                : step.person.conditionType ===
                    'convenio'
                  ? {
                      person: step.person,
                    }
                  : {}),
            } as Step)
          }
          onSelect={(planId) =>
            addToCart(step.person, planId)
          }
        />
      )}

      {step.name === 'carrito' && (
        <Carrito
          cart={cart}
          total={total}
          onRemove={(id) =>
            setCart((current) =>
              current.filter(
                (item) => item.tempId !== id,
              ),
            )
          }
          onAddMore={() =>
            setStep({ name: 'elegir_tipo' })
          }
          onConfirmed={(
            sale,
            items,
            permitsResult,
          ) =>
            setStep({
              name: 'confirmada',
              sale,
              items,
              permits: permitsResult,
            })
          }
        />
      )}

      {step.name === 'confirmada' && (
        <VentaConfirmada
          sale={step.sale}
          items={step.items}
          permits={step.permits}
          onNueva={() => {
            setCart([])
            setStep({ name: 'elegir_tipo' })
          }}
        />
      )}
    </div>
  )
}

function BigButton({
  icon: Icon,
  label,
  color,
  onClick,
}: {
  icon: any
  label: string
  color: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`${color} text-white rounded-2xl p-6 flex flex-col items-center gap-3 shadow-md active:scale-95 transition-transform`}
    >
      <Icon className="w-10 h-10" />
      <span className="font-bold text-lg">
        {label}
      </span>
    </button>
  )
}

function ElegirTipo({
  onSocio,
  onNoSocio,
  hasCart,
  onVerCarrito,
}: {
  onSocio: () => void
  onNoSocio: () => void
  hasCart: boolean
  onVerCarrito: () => void
}) {
  return (
    <div className="space-y-4">
      <p className="text-slate-600 font-medium">
        ¿Qué tipo de persona ingresa?
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BigButton
          icon={UserCheck}
          label="SOCIO"
          color="bg-emerald-600"
          onClick={onSocio}
        />

        <BigButton
          icon={UserPlus}
          label="NO SOCIO"
          color="bg-blue-800"
          onClick={onNoSocio}
        />
      </div>

      {hasCart && (
        <button
          onClick={onVerCarrito}
          className="w-full text-center text-blue-800 font-semibold underline text-sm"
        >
          Ir al carrito y confirmar venta
        </button>
      )}
    </div>
  )
}

function Card({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      {children}
    </div>
  )
}

function BackLink({
  onBack,
}: {
  onBack: () => void
}) {
  return (
    <button
      onClick={onBack}
      className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-1"
    >
      <ArrowLeft className="w-4 h-4" />
      Volver
    </button>
  )
}

/* ============================================================
   SOCIOS
   ============================================================ */

function BuscarSocio({
  onBack,
  onFound,
}: {
  onBack: () => void
  onFound: (person: PersonData) => void
}) {
  const [query, setQuery] = useState('')

  const [results, setResults] = useState<
    Awaited<ReturnType<typeof searchMembers>>
  >([])

  const [loading, setLoading] = useState(false)

  const [selected, setSelected] = useState<
    (typeof results)[number] | null
  >(null)

  const [override, setOverride] = useState(false)

  async function doSearch(e: React.FormEvent) {
    e.preventDefault()

    setLoading(true)
    setSelected(null)

    try {
      const rows = await searchMembers({
        data: { query },
      })

      setResults(rows)
    } finally {
      setLoading(false)
    }
  }

  if (selected) {
    const active =
      selected.member.memberStatus === 'activo'

    return (
      <Card>
        <BackLink
          onBack={() => setSelected(null)}
        />

        <h2 className="font-bold text-lg mb-1">
          Buscar socio
        </h2>

        <div className="rounded-lg border border-slate-200 p-4 mt-3">
          <p className="font-semibold text-lg">
            {selected.person.firstName}{' '}
            {selected.person.lastName}
          </p>

          <p className="text-sm text-slate-500">
            Socio N° {selected.member.memberNumber} — DNI{' '}
            {selected.person.dni}
          </p>

          {selected.person.phone && (
            <p className="text-sm text-slate-500">
              Tel: {selected.person.phone}
            </p>
          )}

          <p
            className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold ${
              active
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {active
              ? 'SOCIO ACTIVO'
              : 'SOCIO INACTIVO'}
          </p>
        </div>

        {!active && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            <p className="font-medium mb-2">
              Este socio figura inactivo. No se le puede
              aplicar la tarifa de socio sin autorización
              de un administrador.
            </p>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={override}
                onChange={(e) =>
                  setOverride(e.target.checked)
                }
              />
              Un administrador autorizó continuar como
              socio
            </label>
          </div>
        )}

        <button
          disabled={!active && !override}
          onClick={() =>
            onFound({
              personId: selected.person.id,
              fullName: `${selected.person.firstName} ${selected.person.lastName}`,
              dni: selected.person.dni,
              firstName: selected.person.firstName,
              lastName: selected.person.lastName,
              birthDate:
                selected.person.birthDate ?? '',
              phone: selected.person.phone ?? '',
              email: selected.person.email ?? '',
              address: selected.person.address ?? '',
              conditionType: 'socio',
              conventionId: null,
            })
          }
          className="mt-4 w-full bg-emerald-600 disabled:opacity-40 text-white font-semibold py-3 rounded-lg"
        >
          Continuar
        </button>
      </Card>
    )
  }

  return (
    <Card>
      <BackLink
        onBack={onBack}
      />

      <h2 className="font-bold text-lg mb-3">
        Buscar socio
      </h2>

      <form
        onSubmit={doSearch}
        className="flex gap-2"
      >
        <input
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5"
          placeholder="N° socio, DNI, nombre o apellido"
          value={query}
          onChange={(e) =>
            setQuery(e.target.value)
          }
          autoFocus
        />

        <button className="bg-blue-900 text-white px-4 rounded-lg flex items-center gap-1.5 font-semibold">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          Buscar
        </button>
      </form>

      <ul className="mt-4 divide-y divide-slate-100">
        {results.map((r) => (
          <li key={r.member.id}>
            <button
              onClick={() => setSelected(r)}
              className="w-full text-left py-3 hover:bg-slate-50 px-1 rounded"
            >
              <p className="font-medium">
                {r.person.firstName}{' '}
                {r.person.lastName}
              </p>

              <p className="text-xs text-slate-500">
                Socio N° {r.member.memberNumber} — DNI{' '}
                {r.person.dni} —{' '}
                {r.member.memberStatus === 'activo'
                  ? 'Activo'
                  : 'Inactivo'}
              </p>
            </button>
          </li>
        ))}

        {results.length === 0 && !loading && (
          <li className="text-slate-400 text-sm py-3">
            No hay resultados.
          </li>
        )}
      </ul>
    </Card>
  )
}

/* ============================================================
   PERSONA
   ============================================================ */

type PersonFormData = {
  dni: string
  firstName: string
  lastName: string
  birthDate: string
  phone: string
  email: string
  address: string
}

function PersonForm({
  initial,
  onSubmit,
  submitLabel,
}: {
  initial: Partial<PersonFormData>
  onSubmit: (
    data: PersonFormData,
  ) => void | Promise<void>
  submitLabel: string
}) {
  const [form, setForm] =
    useState<PersonFormData>({
      dni: initial.dni ?? '',
      firstName: initial.firstName ?? '',
      lastName: initial.lastName ?? '',
      birthDate: initial.birthDate ?? '',
      phone: initial.phone ?? '',
      email: initial.email ?? '',
      address: initial.address ?? '',
    })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void onSubmit(form)
      }}
      className="space-y-3"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field
          label="DNI *"
          value={form.dni}
          onChange={(v) =>
            setForm({ ...form, dni: v })
          }
          required
        />

        <Field
          label="Fecha de nacimiento"
          type="date"
          value={form.birthDate}
          onChange={(v) =>
            setForm({
              ...form,
              birthDate: v,
            })
          }
        />

        <Field
          label="Nombre *"
          value={form.firstName}
          onChange={(v) =>
            setForm({
              ...form,
              firstName: v,
            })
          }
          required
        />

        <Field
          label="Apellido *"
          value={form.lastName}
          onChange={(v) =>
            setForm({
              ...form,
              lastName: v,
            })
          }
          required
        />

        <Field
          label="Teléfono"
          value={form.phone}
          onChange={(v) =>
            setForm({
              ...form,
              phone: v,
            })
          }
        />

        <Field
          label="Email"
          type="email"
          value={form.email}
          onChange={(v) =>
            setForm({
              ...form,
              email: v,
            })
          }
        />
      </div>

      <Field
        label="Domicilio"
        value={form.address}
        onChange={(v) =>
          setForm({
            ...form,
            address: v,
          })
        }
      />

      <button
        type="submit"
        className="w-full bg-blue-900 text-white font-semibold py-3 rounded-lg"
      >
        {submitLabel}
      </button>
    </form>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <label className="block text-sm">
      <span className="text-slate-600">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        required={required}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
      />
    </label>
  )
}

/* ============================================================
   BUSCAR NO SOCIO
   ============================================================ */

function BuscarNoSocio({
  onBack,
  onFound,
}: {
  onBack: () => void
  onFound: (person: PersonData) => void
}) {
  const [query, setQuery] = useState('')

  const [results, setResults] = useState<
    Awaited<ReturnType<typeof searchNonMembers>>
  >([])

  const [loading, setLoading] = useState(false)

  const [selected, setSelected] = useState<
    (typeof results)[number] | null
  >(null)

  async function doSearch(e?: React.FormEvent) {
    e?.preventDefault()

    setLoading(true)
    setSelected(null)

    try {
      const rows = await searchNonMembers({
        data: {
          query: query.trim(),
        },
      })

      setResults(rows)
    } finally {
      setLoading(false)
    }
  }

  function selectPerson(
    row: (typeof results)[number],
  ) {
    const person = row.person

    setSelected(row)

    onFound({
      personId: person.id,
      fullName: `${person.firstName} ${person.lastName}`,
      dni: person.dni,
      firstName: person.firstName,
      lastName: person.lastName,
      birthDate: person.birthDate ?? '',
      phone: person.phone ?? '',
      email: person.email ?? '',
      address: person.address ?? '',
      conditionType: 'no_socio',
      conventionId: null,
    })
  }

  return (
    <Card>
      <BackLink onBack={onBack} />

      <h2 className="font-bold text-lg mb-1">
        Buscar no socio
      </h2>

      <p className="text-sm text-slate-500 mb-3">
        Podés buscar por DNI, nombre o apellido.
        También podés dejar vacío para ver todas las
        personas no socias.
      </p>

      <form
        onSubmit={doSearch}
        className="flex gap-2"
      >
        <input
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5"
          placeholder="DNI, nombre o apellido"
          value={query}
          onChange={(e) =>
            setQuery(e.target.value)
          }
          autoFocus
        />

        <button
          type="submit"
          className="bg-blue-900 text-white px-4 rounded-lg flex items-center gap-1.5 font-semibold"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          Buscar
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setQuery('')
          void doSearch()
        }}
        className="mt-2 text-sm text-blue-800 font-semibold underline"
      >
        Ver todas las personas no socias
      </button>

      <ul className="mt-4 divide-y divide-slate-100">
        {results.map((r) => (
          <li key={r.person.id}>
            <button
              onClick={() => selectPerson(r)}
              className="w-full text-left py-3 hover:bg-slate-50 px-1 rounded"
            >
              <p className="font-medium">
                {r.person.lastName},{' '}
                {r.person.firstName}
              </p>

              <p className="text-xs text-slate-500">
                DNI {r.person.dni}
              </p>

              {r.person.phone && (
                <p className="text-xs text-slate-500">
                  Tel: {r.person.phone}
                </p>
              )}
            </button>
          </li>
        ))}

        {results.length === 0 && !loading && (
          <li className="text-slate-400 text-sm py-3">
            No hay resultados.
          </li>
        )}
      </ul>
    </Card>
  )
}

/* ============================================================
   VERIFICAR DATOS Y CONVENIO
   ============================================================ */

function VerificarPersona({
  person,
  onBack,
  onContinue,
  onNoConvenio,
}: {
  person: PersonData
  onBack: () => void
  onContinue: (person: PersonData) => void
  onNoConvenio: (person: PersonData) => void
}) {
  const [saving, setSaving] = useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)

  async function saveAndContinue(
    data: PersonFormData,
  ) {
    setSaving(true)
    setError(null)

    try {
      const result =
        await createOrUpdatePerson({
          data: {
            ...data,
            id: person.personId,
          },
        })

      const updated: PersonData = {
        personId: result.person.id,
        fullName: `${result.person.firstName} ${result.person.lastName}`,
        dni: result.person.dni,
        firstName: result.person.firstName,
        lastName: result.person.lastName,
        birthDate:
          result.person.birthDate ?? '',
        phone: result.person.phone ?? '',
        email: result.person.email ?? '',
        address:
          result.person.address ?? '',
        conditionType: 'no_socio',
        conventionId: null,
      }

      setShowForm(false)

      onContinue(updated)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'No se pudieron guardar los datos.',
      )
    } finally {
      setSaving(false)
    }
  }

  const hasMissingData =
    !person.phone ||
    !person.email ||
    !person.address

  if (showForm) {
    return (
      <Card>
        <BackLink
          onBack={() => setShowForm(false)}
        />

        <h2 className="font-bold text-lg mb-1">
          Completar datos de la persona
        </h2>

        <p className="text-sm text-slate-500 mb-4">
          Verificá y completá los datos antes de
          continuar con la venta.
        </p>

        {error && (
          <div className="mb-3 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        <PersonForm
          initial={{
            dni: person.dni,
            firstName: person.firstName,
            lastName: person.lastName,
            birthDate: person.birthDate,
            phone: person.phone,
            email: person.email,
            address: person.address,
          }}
          submitLabel={
            saving
              ? 'Guardando...'
              : 'Guardar y continuar'
          }
          onSubmit={saveAndContinue}
        />
      </Card>
    )
  }

  return (
    <Card>
      <BackLink onBack={onBack} />

      <h2 className="font-bold text-lg mb-1">
        Verificar datos
      </h2>

      <p className="text-sm text-slate-500 mb-4">
        Verificá los datos de la persona antes de
        continuar con la venta.
      </p>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
        <p className="font-bold text-lg">
          {person.lastName},{' '}
          {person.firstName}
        </p>

        <p className="text-sm">
          <strong>DNI:</strong> {person.dni}
        </p>

        <p className="text-sm">
          <strong>Teléfono:</strong>{' '}
          {person.phone || (
            <span className="text-amber-600">
              No registrado
            </span>
          )}
        </p>

        <p className="text-sm">
          <strong>Email:</strong>{' '}
          {person.email || (
            <span className="text-amber-600">
              No registrado
            </span>
          )}
        </p>

        <p className="text-sm">
          <strong>Domicilio:</strong>{' '}
          {person.address || (
            <span className="text-amber-600">
              No registrado
            </span>
          )}
        </p>
      </div>

      {hasMissingData && (
        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          Algunos datos están incompletos. Es
          recomendable completarlos para que la persona
          pueda recibir el permiso por WhatsApp.
        </div>
      )}

      <button
        onClick={() => setShowForm(true)}
        className="mt-4 w-full border border-blue-800 text-blue-800 font-semibold py-3 rounded-lg"
      >
        Verificar / completar datos
      </button>

      <div className="mt-5">
        <p className="font-bold text-base mb-3">
          ¿Esta persona pertenece a un convenio?
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() =>
              onNoConvenio(person)
            }
            className="bg-blue-800 hover:bg-blue-900 text-white font-semibold py-3 rounded-lg"
          >
            No, venta común
          </button>

          <button
            onClick={() =>
              onContinue(person)
            }
            className="bg-violet-700 hover:bg-violet-800 text-white font-semibold py-3 rounded-lg"
          >
            Sí, pertenece a un convenio
          </button>
        </div>
      </div>
    </Card>
  )
}

/* ============================================================
   CONVENIOS
   ============================================================ */

function ElegirConvenio({
  conventions,
  person,
  onBack,
  onSelect,
}: {
  conventions: Array<{
    id: number
    name: string
    type: string
  }>
  person: PersonData
  onBack: () => void
  onSelect: (c: {
    id: number
    name: string
  }) => void
}) {
  return (
    <Card>
      <BackLink onBack={onBack} />

      <h2 className="font-bold text-lg mb-1">
        Seleccioná el convenio
      </h2>

      <p className="text-sm text-slate-500 mb-4">
        Persona: {person.firstName}{' '}
        {person.lastName} — DNI {person.dni}
      </p>

      <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 text-sm text-violet-800 mb-4">
        Si la persona presenta una credencial o
        comprobante del convenio, podés asociarla ahora
        aunque todavía no estuviera registrada como
        beneficiaria.
      </div>

      <ul className="divide-y divide-slate-100">
        {conventions.map((c) => (
          <li key={c.id}>
            <button
              onClick={() => onSelect(c)}
              className="w-full text-left py-4 hover:bg-slate-50 px-2 rounded font-medium"
            >
              <p>{c.name}</p>

              {c.type && (
                <p className="text-xs text-slate-500 mt-1">
                  {c.type}
                </p>
              )}
            </button>
          </li>
        ))}

        {conventions.length === 0 && (
          <li className="text-slate-400 text-sm py-3">
            No hay convenios activos cargados.
          </li>
        )}
      </ul>
    </Card>
  )
}

/* ============================================================
   PLANES
   ============================================================ */

function ElegirPlan({
  plans,
  persona,
  priceFor,
  onBack,
  onSelect,
}: {
  plans: Array<{
    id: number
    name: string
    description: string | null
    active: boolean
  }>
  persona: PersonData
  priceFor: (
    planId: number,
    conditionType: ConditionType,
    conventionId: number | null,
  ) => number
  onBack: () => void
  onSelect: (planId: number) => void
}) {
  return (
    <Card>
      <BackLink onBack={onBack} />

      <h2 className="font-bold text-lg mb-1">
        Seleccioná el plan
      </h2>

      <p className="text-sm text-slate-500 mb-1">
        {persona.firstName} {persona.lastName} — DNI{' '}
        {persona.dni}
      </p>

      <p className="text-sm font-semibold text-blue-800 mb-4">
        {conditionLabel(persona.conditionType)}

        {persona.conventionName
          ? ` — ${persona.conventionName}`
          : ''}
      </p>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {plans
          .filter((p) => p.active)
          .map((p) => {
            const price = priceFor(
              p.id,
              persona.conditionType,
              persona.conventionId,
            )

            return (
              <li key={p.id}>
                <button
                  onClick={() => onSelect(p.id)}
                  className="w-full text-left border border-slate-200 rounded-lg p-4 hover:border-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <p className="font-semibold">
                    {p.name}
                  </p>

                  {p.description && (
                    <p className="text-xs text-slate-500 mb-2">
                      {p.description}
                    </p>
                  )}

                  <p className="text-lg font-bold text-blue-900">
                    {formatARS(price)}
                  </p>
                </button>
              </li>
            )
          })}
      </ul>
    </Card>
  )
}

function conditionLabel(c: ConditionType) {
  if (c === 'socio') return 'Socio'
  if (c === 'no_socio') return 'No socio'
  return 'Convenio'
}

/* ============================================================
   CARRITO
   ============================================================ */

const PAYMENT_METHODS: {
  value: string
  label: string
}[] = [
  {
    value: 'efectivo',
    label: 'Efectivo',
  },
  {
    value: 'transferencia',
    label: 'Transferencia bancaria',
  },
  {
    value: 'mercadopago',
    label: 'Mercado Pago',
  },
  {
    value: 'tarjeta',
    label: 'Tarjeta',
  },
  {
    value: 'otro',
    label: 'Otro',
  },
]

function Carrito({
  cart,
  total,
  onRemove,
  onAddMore,
  onConfirmed,
}: {
  cart: CartItem[]
  total: number
  onRemove: (id: string) => void
  onAddMore: () => void
  onConfirmed: (
    sale: any,
    items: any[],
    permits: any[],
  ) => void
}) {
  const [method, setMethod] =
    useState('efectivo')

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  async function confirm() {
    setLoading(true)
    setError(null)

    try {
      const result = await createSale({
        data: {
          items: cart.map((i) => ({
            personId: i.personId,
            conditionType: i.conditionType,
            conventionId: i.conventionId,
            planId: i.planId,
          })),
          paymentMethod: method as any,
        },
      })

      onConfirmed(
        result.sale,
        result.items,
        result.permits,
      )
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'No se pudo registrar la venta.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <h2 className="font-bold text-lg mb-3">
        Resumen de la venta
      </h2>

      <ul className="divide-y divide-slate-100">
        {cart.map((item) => (
          <li
            key={item.tempId}
            className="py-3 flex items-center justify-between gap-2"
          >
            <div>
              <p className="font-medium">
                {item.fullName}
              </p>

              <p className="text-xs text-slate-500">
                {conditionLabel(
                  item.conditionType,
                )}

                {item.conventionName
                  ? ` — ${item.conventionName}`
                  : ''}{' '}
                — {item.planName}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-bold text-blue-900">
                {formatARS(item.price)}
              </span>

              <button
                onClick={() =>
                  onRemove(item.tempId)
                }
                className="text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </li>
        ))}

        {cart.length === 0 && (
          <li className="py-4 text-slate-400 text-sm">
            El carrito está vacío.
          </li>
        )}
      </ul>

      <div className="flex justify-between items-center py-3 border-t border-slate-200 mt-2">
        <span className="font-bold">
          TOTAL
        </span>

        <span className="font-bold text-xl text-red-700">
          {formatARS(total)}
        </span>
      </div>

      <button
        onClick={onAddMore}
        className="w-full border border-blue-800 text-blue-800 font-semibold py-2.5 rounded-lg mb-4"
      >
        + Agregar otra persona
      </button>

      {cart.length > 0 && (
        <>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Método de pago
          </label>

          <select
            value={method}
            onChange={(e) =>
              setMethod(e.target.value)
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 mb-4"
          >
            {PAYMENT_METHODS.map((m) => (
              <option
                key={m.value}
                value={m.value}
              >
                {m.label}
              </option>
            ))}
          </select>

          {error && (
            <p className="text-red-700 text-sm mb-3">
              {error}
            </p>
          )}

          <button
            onClick={confirm}
            disabled={loading}
            className="w-full bg-red-700 hover:bg-red-800 disabled:opacity-60 text-white font-bold py-3.5 rounded-lg text-base"
          >
            {loading
              ? 'Confirmando...'
              : 'CONFIRMAR VENTA'}
          </button>
        </>
      )}
    </Card>
  )
}

/* ============================================================
   WHATSAPP
   ============================================================ */

function normalizeWhatsAppPhone(
  phone: string,
) {
  let value = phone.replace(/\D/g, '')

  if (!value) return ''

  if (value.startsWith('54')) {
    value = value.slice(2)

    if (value.startsWith('9')) {
      value = value.slice(1)
    }
  }

  if (value.startsWith('0')) {
    value = value.slice(1)
  }

  return `54${value}`
}

function buildWhatsAppUrl({
  phone,
  fullName,
  dni,
  planName,
  startDate,
  endDate,
  saleNumber,
  permitCode,
}: {
  phone: string
  fullName: string
  dni: string
  planName: string
  startDate: string
  endDate: string
  saleNumber: string
  permitCode: string
}) {
  const normalizedPhone =
    normalizeWhatsAppPhone(phone)

  if (!normalizedPhone) return null

  const message = [
    '🏊 CLUB ATLÉTICO ESTUDIANTES',
    '',
    'Tu permiso para la pileta fue registrado correctamente.',
    '',
    `👤 ${fullName}`,
    `🪪 DNI: ${dni}`,
    `📋 Plan: ${planName}`,
    `📅 Válido desde: ${formatDateAR(startDate)}`,
    `📅 Válido hasta: ${formatDateAR(endDate)}`,
    `🧾 Venta N°: ${saleNumber}`,
    '',
    '🔐 Código del permiso:',
    permitCode,
    '',
    'Al ingresar, presentá el código QR correspondiente a este permiso.',
    '',
    '¡Gracias por elegir el Club Atlético Estudiantes!',
  ].join('\n')

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(
    message,
  )}`
}

/* ============================================================
   VENTA CONFIRMADA
   ============================================================ */

function VentaConfirmada({
  sale,
  items,
  permits,
  onNueva,
}: {
  sale: any
  items: any[]
  permits: any[]
  onNueva: () => void
}) {
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-2 text-emerald-700 font-bold text-lg mb-1">
          <CheckCircle2 className="w-6 h-6" />
          Venta confirmada
        </div>

        <p className="text-sm text-slate-500">
          N° de venta: {sale.saleNumber} — Total:{' '}
          {formatARS(sale.totalAmount)}
        </p>
      </Card>

      {items.map((item) => {
        const permit = permits.find(
          (p: any) =>
            p.saleItemId === item.id,
        )

        const phone =
          item.person?.phone ?? ''

        const whatsappUrl =
          permit && phone
            ? buildWhatsAppUrl({
                phone,
                fullName: `${item.person.firstName} ${item.person.lastName}`,
                dni: item.person.dni,
                planName:
                  item.plan?.name ??
                  'Pase de pileta',
                startDate:
                  permit.startDate,
                endDate:
                  permit.endDate,
                saleNumber:
                  sale.saleNumber,
                permitCode:
                  permit.code,
              })
            : null

        return (
          <Card key={item.id}>
            <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
              {permit && (
                <QrCode
                  value={permit.code}
                  size={160}
                />
              )}

              <div className="flex-1 text-center sm:text-left">
                <p className="font-bold text-lg">
                  {item.person.firstName}{' '}
                  {item.person.lastName}
                </p>

                <p className="text-sm text-slate-500 mb-2">
                  DNI {item.person.dni} —{' '}
                  {item.plan.name}
                </p>

                <p className="font-semibold text-emerald-700">
                  PERMISO VÁLIDO
                </p>

                {permit && (
                  <>
                    <p className="text-sm text-slate-600">
                      Desde{' '}
                      {formatDateAR(
                        permit.startDate,
                      )}{' '}
                      hasta{' '}
                      {formatDateAR(
                        permit.endDate,
                      )}
                    </p>

                    <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <p className="text-xs text-slate-500 font-medium">
                        Código de validación
                      </p>

                      <p className="text-lg font-bold tracking-wider text-blue-900">
                        {permit.code}
                      </p>
                    </div>
                  </>
                )}

                {phone ? (
                  <p className="text-xs text-slate-500 mt-2">
                    WhatsApp: {phone}
                  </p>
                ) : (
                  <p className="text-xs text-amber-600 mt-2">
                    Esta persona no tiene teléfono
                    registrado.
                  </p>
                )}

                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-5 rounded-lg transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Enviar por WhatsApp
                  </a>
                )}
              </div>
            </div>
          </Card>
        )
      })}

      <button
        onClick={onNueva}
        className="w-full bg-blue-900 text-white font-semibold py-3 rounded-lg"
      >
        Registrar otra venta
      </button>
    </div>
  )
}