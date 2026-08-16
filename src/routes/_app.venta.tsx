import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { UserCheck, UserPlus, Handshake, Trash2, ArrowLeft, Search, Loader2, CheckCircle2 } from 'lucide-react'
import { searchMembers, findPersonByDni, createOrUpdatePerson, listActiveConventions, findConventionBeneficiary, createConventionBeneficiary } from '@/server/people.functions'
import { listPlans, listAllPrices } from '@/server/plans.functions'
import { createSale } from '@/server/sales.functions'
import { formatARS, formatDateAR } from '@/lib/format'
import { QrCode } from '@/components/QrCode'

export const Route = createFileRoute('/_app/venta')({
  loader: async () => {
    const [plans, prices, conventions] = await Promise.all([listPlans(), listAllPrices(), listActiveConventions()])
    return { plans, prices, conventions }
  },
  component: VentaRapida,
})

type ConditionType = 'socio' | 'no_socio' | 'convenio'

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
  | { name: 'elegir_convenio' }
  | { name: 'buscar_beneficiario'; conventionId: number; conventionName: string }
  | {
      name: 'elegir_plan'
      personId: number
      fullName: string
      dni: string
      conditionType: ConditionType
      conventionId: number | null
      conventionName?: string
    }
  | { name: 'carrito' }
  | { name: 'confirmada'; sale: any; items: any[]; permits: any[] }

function VentaRapida() {
  const { plans, prices, conventions } = Route.useLoaderData()
  const [cart, setCart] = useState<CartItem[]>([])
  const [step, setStep] = useState<Step>({ name: 'elegir_tipo' })

  function priceFor(planId: number, conditionType: ConditionType, conventionId: number | null) {
    if (conditionType === 'convenio' && conventionId) {
      const specific = prices.find((p) => p.planId === planId && p.conditionType === 'convenio' && p.conventionId === conventionId)
      if (specific) return specific.amount
    }
    const generic = prices.find((p) => p.planId === planId && p.conditionType === conditionType && !p.conventionId)
    return generic?.amount ?? 0
  }

  function addToCart(person: { personId: number; fullName: string; dni: string; conditionType: ConditionType; conventionId: number | null; conventionName?: string }, planId: number) {
    const plan = plans.find((p) => p.id === planId)!
    const price = priceFor(planId, person.conditionType, person.conventionId)
    setCart((c) => [
      ...c,
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

  const total = cart.reduce((acc, i) => acc + i.price, 0)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Venta rápida</h1>
        {cart.length > 0 && step.name !== 'carrito' && step.name !== 'confirmada' && (
          <button
            onClick={() => setStep({ name: 'carrito' })}
            className="text-sm font-semibold bg-blue-900 text-white px-4 py-2 rounded-lg"
          >
            Ver carrito ({cart.length}) — {formatARS(total)}
          </button>
        )}
      </div>

      {step.name === 'elegir_tipo' && (
        <ElegirTipo
          onSocio={() => setStep({ name: 'buscar_socio' })}
          onNoSocio={() => setStep({ name: 'buscar_no_socio' })}
          onConvenio={() => setStep({ name: 'elegir_convenio' })}
          hasCart={cart.length > 0}
          onVerCarrito={() => setStep({ name: 'carrito' })}
        />
      )}

      {step.name === 'buscar_socio' && (
        <BuscarSocio onBack={() => setStep({ name: 'elegir_tipo' })} onFound={(p) => setStep({ name: 'elegir_plan', ...p })} />
      )}

      {step.name === 'buscar_no_socio' && (
        <BuscarNoSocio onBack={() => setStep({ name: 'elegir_tipo' })} onFound={(p) => setStep({ name: 'elegir_plan', ...p })} />
      )}

      {step.name === 'elegir_convenio' && (
        <ElegirConvenio
          conventions={conventions}
          onBack={() => setStep({ name: 'elegir_tipo' })}
          onSelect={(c) => setStep({ name: 'buscar_beneficiario', conventionId: c.id, conventionName: c.name })}
        />
      )}

      {step.name === 'buscar_beneficiario' && (
        <BuscarBeneficiario
          conventionId={step.conventionId}
          conventionName={step.conventionName}
          onBack={() => setStep({ name: 'elegir_convenio' })}
          onFound={(p) => setStep({ name: 'elegir_plan', ...p })}
        />
      )}

      {step.name === 'elegir_plan' && (
        <ElegirPlan
          plans={plans}
          persona={step}
          priceFor={priceFor}
          onBack={() => setStep({ name: 'elegir_tipo' })}
          onSelect={(planId) => addToCart(step, planId)}
        />
      )}

      {step.name === 'carrito' && (
        <Carrito
          cart={cart}
          total={total}
          onRemove={(id) => setCart((c) => c.filter((i) => i.tempId !== id))}
          onAddMore={() => setStep({ name: 'elegir_tipo' })}
          onConfirmed={(sale, items, permitsResult) => setStep({ name: 'confirmada', sale, items, permits: permitsResult })}
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

function BigButton({ icon: Icon, label, color, onClick }: { icon: any; label: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`${color} text-white rounded-2xl p-6 flex flex-col items-center gap-3 shadow-md active:scale-95 transition-transform`}
    >
      <Icon className="w-10 h-10" />
      <span className="font-bold text-lg">{label}</span>
    </button>
  )
}

function ElegirTipo({
  onSocio,
  onNoSocio,
  onConvenio,
  hasCart,
  onVerCarrito,
}: {
  onSocio: () => void
  onNoSocio: () => void
  onConvenio: () => void
  hasCart: boolean
  onVerCarrito: () => void
}) {
  return (
    <div className="space-y-4">
      <p className="text-slate-600 font-medium">¿Qué tipo de persona ingresa?</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <BigButton icon={UserCheck} label="SOCIO" color="bg-emerald-600" onClick={onSocio} />
        <BigButton icon={UserPlus} label="NO SOCIO" color="bg-blue-800" onClick={onNoSocio} />
        <BigButton icon={Handshake} label="CONVENIO" color="bg-violet-700" onClick={onConvenio} />
      </div>
      {hasCart && (
        <button onClick={onVerCarrito} className="w-full text-center text-blue-800 font-semibold underline text-sm">
          Ir al carrito y confirmar venta
        </button>
      )}
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-xl shadow-sm p-5">{children}</div>
}

function BackLink({ onBack }: { onBack: () => void }) {
  return (
    <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-1">
      <ArrowLeft className="w-4 h-4" /> Volver
    </button>
  )
}

function BuscarSocio({
  onBack,
  onFound,
}: {
  onBack: () => void
  onFound: (p: { personId: number; fullName: string; dni: string; conditionType: ConditionType; conventionId: null }) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Awaited<ReturnType<typeof searchMembers>>>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<(typeof results)[number] | null>(null)
  const [override, setOverride] = useState(false)

  async function doSearch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSelected(null)
    try {
      const rows = await searchMembers({ data: { query } })
      setResults(rows)
    } finally {
      setLoading(false)
    }
  }

  if (selected) {
    const active = selected.member.memberStatus === 'activo'
    return (
      <Card>
        <BackLink onBack={() => setSelected(null)} />
        <h2 className="font-bold text-lg mb-1">Buscar socio</h2>
        <div className="rounded-lg border border-slate-200 p-4 mt-3">
          <p className="font-semibold text-lg">
            {selected.person.firstName} {selected.person.lastName}
          </p>
          <p className="text-sm text-slate-500">Socio N° {selected.member.memberNumber} — DNI {selected.person.dni}</p>
          {selected.person.phone && <p className="text-sm text-slate-500">Tel: {selected.person.phone}</p>}
          <p className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            {active ? '🟢 SOCIO ACTIVO' : '🔴 SOCIO INACTIVO'}
          </p>
        </div>

        {!active && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            <p className="font-medium mb-2">
              Este socio figura inactivo. No se le puede aplicar la tarifa de socio sin autorización de un administrador.
            </p>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} />
              Un administrador autorizó continuar como socio
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
      <BackLink onBack={onBack} />
      <h2 className="font-bold text-lg mb-3">Buscar socio</h2>
      <form onSubmit={doSearch} className="flex gap-2">
        <input
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5"
          placeholder="Número de socio, DNI, nombre o apellido"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <button className="bg-blue-900 text-white px-4 rounded-lg flex items-center gap-1.5 font-semibold">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Buscar
        </button>
      </form>
      <ul className="mt-4 divide-y divide-slate-100">
        {results.map((r) => (
          <li key={r.member.id}>
            <button onClick={() => setSelected(r)} className="w-full text-left py-3 hover:bg-slate-50 px-1 rounded">
              <p className="font-medium">
                {r.person.firstName} {r.person.lastName}
              </p>
              <p className="text-xs text-slate-500">
                Socio N° {r.member.memberNumber} — DNI {r.person.dni} —{' '}
                {r.member.memberStatus === 'activo' ? 'Activo' : 'Inactivo'}
              </p>
            </button>
          </li>
        ))}
        {results.length === 0 && !loading && <li className="text-slate-400 text-sm py-3">Buscá por número de socio, DNI o nombre.</li>}
      </ul>
    </Card>
  )
}

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
  extraField,
}: {
  initial: Partial<PersonFormData>
  onSubmit: (data: PersonFormData & { employeeCode?: string }) => void
  submitLabel: string
  extraField?: { label: string; value: string; onChange: (v: string) => void }
}) {
  const [form, setForm] = useState<PersonFormData>({
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
        onSubmit({ ...form, employeeCode: extraField?.value })
      }}
      className="space-y-3"
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="DNI *" value={form.dni} onChange={(v) => setForm({ ...form, dni: v })} required />
        <Field label="Fecha de nacimiento" type="date" value={form.birthDate} onChange={(v) => setForm({ ...form, birthDate: v })} />
        <Field label="Nombre *" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} required />
        <Field label="Apellido *" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} required />
        <Field label="Teléfono" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
      </div>
      <Field label="Domicilio" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
      {extraField && <Field label={extraField.label} value={extraField.value} onChange={extraField.onChange} />}
      <button className="w-full bg-blue-900 text-white font-semibold py-3 rounded-lg">{submitLabel}</button>
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
      <span className="text-slate-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
      />
    </label>
  )
}

function BuscarNoSocio({
  onBack,
  onFound,
}: {
  onBack: () => void
  onFound: (p: { personId: number; fullName: string; dni: string; conditionType: ConditionType; conventionId: null }) => void
}) {
  const [dni, setDni] = useState('')
  const [searched, setSearched] = useState(false)
  const [found, setFound] = useState<Awaited<ReturnType<typeof findPersonByDni>>>(null)
  const [loading, setLoading] = useState(false)

  async function doSearch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await findPersonByDni({ data: { dni } })
      setFound(result)
      setSearched(true)
    } finally {
      setLoading(false)
    }
  }

  if (found) {
    return (
      <Card>
        <BackLink onBack={() => setSearched(false)} />
        <h2 className="font-bold text-lg mb-1">Persona encontrada</h2>
        <div className="rounded-lg border border-slate-200 p-4 mt-3">
          <p className="font-semibold text-lg">
            {found.person.firstName} {found.person.lastName}
          </p>
          <p className="text-sm text-slate-500">DNI {found.person.dni}</p>
          {found.member && <p className="text-xs text-amber-600 mt-1">Nota: esta persona también es socia.</p>}
        </div>
        <button
          onClick={() =>
            onFound({
              personId: found.person.id,
              fullName: `${found.person.firstName} ${found.person.lastName}`,
              dni: found.person.dni,
              conditionType: 'no_socio',
              conventionId: null,
            })
          }
          className="mt-4 w-full bg-blue-800 text-white font-semibold py-3 rounded-lg"
        >
          Continuar
        </button>
      </Card>
    )
  }

  if (searched && !found) {
    return (
      <Card>
        <BackLink onBack={() => setSearched(false)} />
        <h2 className="font-bold text-lg mb-3">Nueva persona (no socio)</h2>
        <p className="text-sm text-slate-500 mb-3">No se encontró a nadie con ese DNI. Completá los datos para registrarla.</p>
        <PersonForm
          initial={{ dni }}
          submitLabel="Guardar y continuar"
          onSubmit={async (data) => {
            const result = await createOrUpdatePerson({ data })
            onFound({
              personId: result.person.id,
              fullName: `${result.person.firstName} ${result.person.lastName}`,
              dni: result.person.dni,
              conditionType: 'no_socio',
              conventionId: null,
            })
          }}
        />
      </Card>
    )
  }

  return (
    <Card>
      <BackLink onBack={onBack} />
      <h2 className="font-bold text-lg mb-3">Buscar por DNI (no socio)</h2>
      <form onSubmit={doSearch} className="flex gap-2">
        <input
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5"
          placeholder="DNI"
          value={dni}
          onChange={(e) => setDni(e.target.value)}
          autoFocus
          required
        />
        <button className="bg-blue-900 text-white px-4 rounded-lg flex items-center gap-1.5 font-semibold">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Buscar
        </button>
      </form>
    </Card>
  )
}

function ElegirConvenio({
  conventions,
  onBack,
  onSelect,
}: {
  conventions: Array<{ id: number; name: string; type: string }>
  onBack: () => void
  onSelect: (c: { id: number; name: string }) => void
}) {
  return (
    <Card>
      <BackLink onBack={onBack} />
      <h2 className="font-bold text-lg mb-3">Seleccioná el convenio</h2>
      <ul className="divide-y divide-slate-100">
        {conventions.map((c) => (
          <li key={c.id}>
            <button onClick={() => onSelect(c)} className="w-full text-left py-3 hover:bg-slate-50 px-1 rounded font-medium">
              {c.name}
            </button>
          </li>
        ))}
        {conventions.length === 0 && <li className="text-slate-400 text-sm py-3">No hay convenios activos cargados.</li>}
      </ul>
    </Card>
  )
}

function BuscarBeneficiario({
  conventionId,
  conventionName,
  onBack,
  onFound,
}: {
  conventionId: number
  conventionName: string
  onBack: () => void
  onFound: (p: { personId: number; fullName: string; dni: string; conditionType: ConditionType; conventionId: number; conventionName: string }) => void
}) {
  const [dni, setDni] = useState('')
  const [searched, setSearched] = useState(false)
  const [found, setFound] = useState<Awaited<ReturnType<typeof findConventionBeneficiary>>>(null)
  const [loading, setLoading] = useState(false)

  async function doSearch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await findConventionBeneficiary({ data: { conventionId, dni } })
      setFound(result)
      setSearched(true)
    } finally {
      setLoading(false)
    }
  }

  if (found?.beneficiary) {
    return (
      <Card>
        <BackLink onBack={() => setSearched(false)} />
        <h2 className="font-bold text-lg mb-1">Beneficiario encontrado</h2>
        <div className="rounded-lg border border-slate-200 p-4 mt-3">
          <p className="font-semibold text-lg">
            {found.person.firstName} {found.person.lastName}
          </p>
          <p className="text-sm text-slate-500">Convenio: {conventionName}</p>
          <p className="mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold bg-violet-100 text-violet-700">
            BENEFICIARIO {found.beneficiary.status === 'activo' ? 'ACTIVO' : 'INACTIVO'}
          </p>
        </div>
        <button
          onClick={() =>
            onFound({
              personId: found.person.id,
              fullName: `${found.person.firstName} ${found.person.lastName}`,
              dni: found.person.dni,
              conditionType: 'convenio',
              conventionId,
              conventionName,
            })
          }
          className="mt-4 w-full bg-violet-700 text-white font-semibold py-3 rounded-lg"
        >
          Continuar
        </button>
      </Card>
    )
  }

  if (searched) {
    return (
      <Card>
        <BackLink onBack={() => setSearched(false)} />
        <h2 className="font-bold text-lg mb-3">Nuevo beneficiario — {conventionName}</h2>
        <p className="text-sm text-slate-500 mb-3">No está registrado como beneficiario. Completá sus datos.</p>
        <PersonForm
          initial={{ dni, firstName: found?.person.firstName, lastName: found?.person.lastName }}
          submitLabel="Guardar y continuar"
          extraField={{ label: 'N° de empleado / afiliado', value: '', onChange: () => {} }}
          onSubmit={async (data) => {
            const result = await createConventionBeneficiary({ data: { ...data, conventionId, employeeCode: data.employeeCode } })
            onFound({
              personId: result.person.id,
              fullName: `${result.person.firstName} ${result.person.lastName}`,
              dni: result.person.dni,
              conditionType: 'convenio',
              conventionId,
              conventionName,
            })
          }}
        />
      </Card>
    )
  }

  return (
    <Card>
      <BackLink onBack={onBack} />
      <h2 className="font-bold text-lg mb-3">Convenio: {conventionName}</h2>
      <form onSubmit={doSearch} className="flex gap-2">
        <input
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5"
          placeholder="DNI del beneficiario"
          value={dni}
          onChange={(e) => setDni(e.target.value)}
          autoFocus
          required
        />
        <button className="bg-violet-700 text-white px-4 rounded-lg flex items-center gap-1.5 font-semibold">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Buscar
        </button>
      </form>
    </Card>
  )
}

function ElegirPlan({
  plans,
  persona,
  priceFor,
  onBack,
  onSelect,
}: {
  plans: Array<{ id: number; name: string; description: string | null; active: boolean }>
  persona: { fullName: string; dni: string; conditionType: ConditionType; conventionId: number | null }
  priceFor: (planId: number, conditionType: ConditionType, conventionId: number | null) => number
  onBack: () => void
  onSelect: (planId: number) => void
}) {
  return (
    <Card>
      <BackLink onBack={onBack} />
      <h2 className="font-bold text-lg mb-1">Seleccioná el plan</h2>
      <p className="text-sm text-slate-500 mb-3">
        {persona.fullName} — DNI {persona.dni} — {conditionLabel(persona.conditionType)}
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {plans
          .filter((p) => p.active)
          .map((p) => (
            <li key={p.id}>
              <button
                onClick={() => onSelect(p.id)}
                className="w-full text-left border border-slate-200 rounded-lg p-4 hover:border-blue-600 hover:bg-blue-50 transition-colors"
              >
                <p className="font-semibold">{p.name}</p>
                <p className="text-xs text-slate-500 mb-2">{p.description}</p>
                <p className="text-lg font-bold text-blue-900">{formatARS(priceFor(p.id, persona.conditionType, persona.conventionId))}</p>
              </button>
            </li>
          ))}
      </ul>
    </Card>
  )
}

function conditionLabel(c: ConditionType) {
  if (c === 'socio') return 'Socio'
  if (c === 'no_socio') return 'No socio'
  return 'Convenio'
}

const PAYMENT_METHODS: { value: string; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia bancaria' },
  { value: 'mercadopago', label: 'Mercado Pago' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'otro', label: 'Otro' },
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
  onConfirmed: (sale: any, items: any[], permits: any[]) => void
}) {
  const [method, setMethod] = useState('efectivo')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      onConfirmed(result.sale, result.items, result.permits)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo registrar la venta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <h2 className="font-bold text-lg mb-3">Resumen de la venta</h2>
      <ul className="divide-y divide-slate-100">
        {cart.map((item) => (
          <li key={item.tempId} className="py-3 flex items-center justify-between gap-2">
            <div>
              <p className="font-medium">{item.fullName}</p>
              <p className="text-xs text-slate-500">
                {conditionLabel(item.conditionType)}
                {item.conventionName ? ` — ${item.conventionName}` : ''} — {item.planName}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-blue-900">{formatARS(item.price)}</span>
              <button onClick={() => onRemove(item.tempId)} className="text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </li>
        ))}
        {cart.length === 0 && <li className="py-4 text-slate-400 text-sm">El carrito está vacío.</li>}
      </ul>

      <div className="flex justify-between items-center py-3 border-t border-slate-200 mt-2">
        <span className="font-bold">TOTAL</span>
        <span className="font-bold text-xl text-red-700">{formatARS(total)}</span>
      </div>

      <button onClick={onAddMore} className="w-full border border-blue-800 text-blue-800 font-semibold py-2.5 rounded-lg mb-4">
        + Agregar otra persona
      </button>

      {cart.length > 0 && (
        <>
          <label className="block text-sm font-medium text-slate-700 mb-1">Método de pago</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 mb-4">
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          {error && <p className="text-red-700 text-sm mb-3">{error}</p>}
          <button
            onClick={confirm}
            disabled={loading}
            className="w-full bg-red-700 hover:bg-red-800 disabled:opacity-60 text-white font-bold py-3.5 rounded-lg text-base"
          >
            {loading ? 'Confirmando...' : 'CONFIRMAR VENTA'}
          </button>
        </>
      )}
    </Card>
  )
}

function VentaConfirmada({ sale, items, permits, onNueva }: { sale: any; items: any[]; permits: any[]; onNueva: () => void }) {
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-2 text-emerald-700 font-bold text-lg mb-1">
          <CheckCircle2 className="w-6 h-6" /> Venta confirmada
        </div>
        <p className="text-sm text-slate-500">
          N° de venta: {sale.saleNumber} — Total: {formatARS(sale.totalAmount)}
        </p>
      </Card>

      {items.map((item) => {
        const permit = permits.find((p: any) => p.saleItemId === item.id)
        return (
          <Card key={item.id}>
            <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
              {permit && <QrCode value={permit.code} size={160} />}
              <div className="flex-1 text-center sm:text-left">
                <p className="font-bold text-lg">
                  {item.person.firstName} {item.person.lastName}
                </p>
                <p className="text-sm text-slate-500 mb-2">DNI {item.person.dni} — {item.plan.name}</p>
                <p className="font-semibold text-emerald-700">PERMISO VÁLIDO</p>
                {permit && (
                  <p className="text-sm text-slate-600">
                    Desde {formatDateAR(permit.startDate)} hasta {formatDateAR(permit.endDate)}
                  </p>
                )}
              </div>
            </div>
          </Card>
        )
      })}

      <button onClick={onNueva} className="w-full bg-blue-900 text-white font-semibold py-3 rounded-lg">
        Registrar otra venta
      </button>
    </div>
  )
}
