import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Settings, Database, CheckCircle2 } from 'lucide-react'
import { seedDemoData } from '@/server/seed.functions'

export const Route = createFileRoute('/_app/config')({
  component: ConfigPage,
})

function ConfigPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'already'>('idle')

  async function runSeed() {
    setStatus('loading')
    const result = await seedDemoData()
    setStatus(result.alreadySeeded ? 'already' : 'done')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
        <Settings className="w-6 h-6" /> Configuración
      </h1>

      <div className="bg-white rounded-xl shadow-sm p-5 space-y-2">
        <h2 className="font-semibold">Club</h2>
        <p className="text-sm text-slate-500">Club Atlético Estudiantes — Mercedes, Buenos Aires.</p>
        <p className="text-sm text-slate-500">
          Los planes, tarifas, convenios, usuarios y roles se administran desde sus respectivas secciones del menú
          (Planes y tarifas, Convenios, Usuarios).
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Database className="w-4 h-4" /> Datos de demostración
        </h2>
        <p className="text-sm text-slate-500">
          Carga usuarios, planes, tarifas, convenios, socios, no socios, beneficiarios, ventas e ingresos de ejemplo
          (con nombres y DNI ficticios) para poder probar el sistema. Esta acción solo tiene efecto si la base de
          datos está vacía.
        </p>
        <button
          onClick={runSeed}
          disabled={status === 'loading'}
          className="bg-blue-900 disabled:opacity-60 text-white font-semibold px-4 py-2.5 rounded-lg text-sm"
        >
          {status === 'loading' ? 'Cargando...' : 'Cargar datos de demostración'}
        </button>
        {status === 'done' && (
          <p className="flex items-center gap-1.5 text-emerald-700 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" /> Datos de demostración cargados. Usuarios: admin / encargado / ingreso
            / consulta — contraseña: estudiantes2026
          </p>
        )}
        {status === 'already' && <p className="text-amber-700 text-sm">Ya existen datos cargados; no se modificó nada.</p>}
      </div>
    </div>
  )
}
