import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Settings, Database, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react'
import { seedDemoData } from '@/server/seed.functions'
import { resetTestEnvironment } from '@/server/reset.functions'

export const Route = createFileRoute('/_app/config')({
  component: ConfigPage,
})

function ConfigPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'already'>('idle')
  const [resetStatus, setResetStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [resetMessage, setResetMessage] = useState('')

  async function runSeed() {
    setStatus('loading')

    try {
      const result = await seedDemoData()
      setStatus(result.alreadySeeded ? 'already' : 'done')
    } catch (error) {
      console.error(error)
      setStatus('already')
    }
  }

  async function runReset() {
    const confirmed = window.confirm(
      'ATENCIÓN: esta acción eliminará todos los datos de prueba.\n\n' +
        'Se borrarán personas, socios, familias, convenios, planes, tarifas, ventas, pagos, permisos, ingresos, cierres de caja y registros de auditoría.\n\n' +
        'El usuario administrador se conservará.\n\n' +
        '¿Querés continuar?',
    )

    if (!confirmed) return

    setResetStatus('loading')
    setResetMessage('')

    try {
      const result = await resetTestEnvironment()
      setResetStatus('done')
      setResetMessage(result.message)
    } catch (error) {
      console.error(error)
      setResetStatus('error')
      setResetMessage(
        error instanceof Error
          ? error.message
          : 'No se pudo reiniciar el entorno de prueba.',
      )
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
        <Settings className="w-6 h-6" /> Configuración
      </h1>

      <div className="bg-white rounded-xl shadow-sm p-5 space-y-2">
        <h2 className="font-semibold">Club</h2>

        <p className="text-sm text-slate-500">
          Club Atlético Estudiantes — Mercedes, Buenos Aires.
        </p>

        <p className="text-sm text-slate-500">
          Los planes, tarifas, convenios, usuarios y roles se administran desde sus
          respectivas secciones del menú (Planes y tarifas, Convenios, Usuarios).
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Database className="w-4 h-4" /> Datos de demostración
        </h2>

        <p className="text-sm text-slate-500">
          Carga usuarios, planes, tarifas, convenios, socios, no socios,
          beneficiarios, ventas e ingresos de ejemplo (con nombres y DNI ficticios)
          para poder probar el sistema. Esta acción solo tiene efecto si la base de
          datos está vacía.
        </p>

        <button
          onClick={runSeed}
          disabled={status === 'loading'}
          className="bg-blue-900 disabled:opacity-60 text-white font-semibold px-4 py-2.5 rounded-lg text-sm"
        >
          {status === 'loading'
            ? 'Cargando...'
            : 'Cargar datos de demostración'}
        </button>

        {status === 'done' && (
          <p className="flex items-center gap-1.5 text-emerald-700 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Datos de demostración cargados. Usuarios: admin / encargado / ingreso /
            consulta — contraseña: estudiantes2026
          </p>
        )}

        {status === 'already' && (
          <p className="text-amber-700 text-sm">
            Ya existen datos cargados; no se modificó nada.
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5 space-y-3 border border-red-200">
        <h2 className="font-semibold flex items-center gap-2 text-red-700">
          <AlertTriangle className="w-5 h-5" /> Entorno de prueba
        </h2>

        <p className="text-sm text-slate-600">
          Permite borrar todos los datos cargados durante las pruebas y comenzar
          nuevamente desde cero.
        </p>

        <div className="bg-red-50 border border-red-100 rounded-lg p-3">
          <p className="text-sm text-red-800 font-medium">
            Esta acción eliminará todos los datos operativos y de prueba.
          </p>

          <p className="text-xs text-red-700 mt-1">
            Se conservará únicamente el usuario administrador para que puedas
            volver a ingresar al sistema.
          </p>
        </div>

        <button
          onClick={runReset}
          disabled={resetStatus === 'loading'}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold px-4 py-2.5 rounded-lg text-sm"
        >
          <RotateCcw className="w-4 h-4" />

          {resetStatus === 'loading'
            ? 'Reiniciando...'
            : 'Reiniciar entorno de prueba'}
        </button>

        {resetStatus === 'done' && (
          <p className="flex items-center gap-1.5 text-emerald-700 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            {resetMessage}
          </p>
        )}

        {resetStatus === 'error' && (
          <p className="text-red-700 text-sm font-medium">
            {resetMessage}
          </p>
        )}
      </div>
    </div>
  )
}