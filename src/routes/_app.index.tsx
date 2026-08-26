import { createFileRoute, Link } from '@tanstack/react-router'
import { Users, ShoppingCart, DoorOpen, DollarSign, IdCard, Handshake, AlertTriangle } from 'lucide-react'
import { getDashboardStats } from '@/server/dashboard.functions'
import { listExpiringPermits } from '@/server/permits.functions'
import { formatARS, formatDateAR } from '@/lib/format'

const EMPTY_STATS = {
  personasHabilitadas: 0,
  socios: 0,
  noSocios: 0,
  convenios: 0,
  ventasHoy: 0,
  ingresosHoy: 0,
  recaudacionHoy: 0,
}

const EMPTY_EXPIRING = {
  vencidos: [] as Array<{
    permit: { id: number; endDate: string }
    person: { firstName: string; lastName: string }
    plan: { name: string }
  }>,
  hoy: [] as Array<{
    permit: { id: number; endDate: string }
    person: { firstName: string; lastName: string }
    plan: { name: string }
  }>,
  en3dias: [] as Array<{
    permit: { id: number; endDate: string }
    person: { firstName: string; lastName: string }
    plan: { name: string }
  }>,
  en7dias: [] as Array<{
    permit: { id: number; endDate: string }
    person: { firstName: string; lastName: string }
    plan: { name: string }
  }>,
}

export const Route = createFileRoute('/_app/')({
  loader: async () => {
    try {
      const [stats, expiring] = await Promise.all([getDashboardStats(), listExpiringPermits()])
      return {
        stats: stats ?? EMPTY_STATS,
        expiring: expiring ?? EMPTY_EXPIRING,
        loadError: null as string | null,
      }
    } catch (err) {
      console.error('Dashboard loader error:', err)
      return {
        stats: EMPTY_STATS,
        expiring: EMPTY_EXPIRING,
        loadError: err instanceof Error ? err.message : 'No se pudieron cargar los datos del panel.',
      }
    }
  },
  component: Dashboard,
})

function Card({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  accent: string
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
      <div className={`${accent} p-3 rounded-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  )
}

function Dashboard() {
  const data = Route.useLoaderData()
  const stats = data?.stats ?? EMPTY_STATS
  const expiring = data?.expiring ?? EMPTY_EXPIRING
  const loadError = data?.loadError ?? null

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Temporada de pileta</h1>
        <p className="text-slate-500 text-sm">Resumen del natatorio del Club Atlético Estudiantes</p>
      </div>

      {loadError && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">No se pudieron cargar todos los datos del panel.</p>
          <p className="mt-1 text-amber-800">{loadError}</p>
          <p className="mt-1 text-amber-700">
            Revisá la consola del servidor (terminal) y la pestaña Network → respuesta de las peticiones{' '}
            <code className="text-xs">_serverFn</code>.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link
          to="/venta"
          className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white font-semibold px-5 py-3 rounded-lg text-sm"
        >
          <ShoppingCart className="w-4 h-4" /> Nueva venta
        </Link>
        <Link
          to="/ingreso"
          className="flex items-center gap-2 bg-blue-900 hover:bg-blue-950 text-white font-semibold px-5 py-3 rounded-lg text-sm"
        >
          <DoorOpen className="w-4 h-4" /> Control de ingreso
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card
          icon={Users}
          label="Personas habilitadas"
          value={String(stats.personasHabilitadas)}
          accent="bg-blue-800"
        />
        <Card icon={DoorOpen} label="Ingresos hoy" value={String(stats.ingresosHoy)} accent="bg-emerald-600" />
        <Card icon={ShoppingCart} label="Ventas hoy" value={String(stats.ventasHoy)} accent="bg-amber-600" />
        <Card
          icon={DollarSign}
          label="Recaudación hoy"
          value={formatARS(stats.recaudacionHoy)}
          accent="bg-red-700"
        />
        <Card icon={IdCard} label="Socios habilitados" value={String(stats.socios)} accent="bg-blue-700" />
        <Card
          icon={Handshake}
          label="Convenios habilitados"
          value={String(stats.convenios)}
          accent="bg-violet-600"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" /> Permisos próximos a vencer
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 text-center">
          <div className="rounded-lg bg-red-50 p-3">
            <p className="text-2xl font-bold text-red-700">{expiring.vencidos.length}</p>
            <p className="text-xs text-red-700">Vencidos</p>
          </div>
          <div className="rounded-lg bg-amber-50 p-3">
            <p className="text-2xl font-bold text-amber-700">{expiring.hoy.length}</p>
            <p className="text-xs text-amber-700">Vencen hoy</p>
          </div>
          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-2xl font-bold text-blue-700">{expiring.en3dias.length}</p>
            <p className="text-xs text-blue-700">En 3 días</p>
          </div>
          <div className="rounded-lg bg-slate-100 p-3">
            <p className="text-2xl font-bold text-slate-700">{expiring.en7dias.length}</p>
            <p className="text-xs text-slate-700">En 7 días</p>
          </div>
        </div>
        <ul className="divide-y divide-slate-100 text-sm">
          {[...expiring.hoy, ...expiring.en3dias].slice(0, 8).map((r) => (
            <li key={r.permit.id} className="py-2 flex justify-between">
              <span>
                {r.person.firstName} {r.person.lastName} — {r.plan.name}
              </span>
              <span className="text-slate-500">Vence {formatDateAR(r.permit.endDate)}</span>
            </li>
          ))}
          {expiring.hoy.length + expiring.en3dias.length === 0 && (
            <li className="py-2 text-slate-400">No hay permisos próximos a vencer.</li>
          )}
        </ul>
      </div>
    </div>
  )
}