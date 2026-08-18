import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CheckCircle2,
  XCircle,
  ScanLine,
  Search,
  Camera,
  CameraOff,
  Dumbbell,
  Waves,
} from 'lucide-react'
import { registerEntry } from '@/server/entries.functions'
import { findActivePermitsByDni } from '@/server/permits.functions'
import { formatDateAR } from '@/lib/format'

export const Route = createFileRoute('/_app/ingreso')({
  component: ControlIngreso,
})

type Result = Awaited<ReturnType<typeof registerEntry>>
type EntryType = 'campo_deportes' | 'pileta'

function ControlIngreso() {
  const [entryType, setEntryType] = useState<EntryType | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [mode, setMode] = useState<'scan' | 'manual'>('scan')
  const [dni, setDni] = useState('')
  const [manualLookup, setManualLookup] =
    useState<Awaited<ReturnType<typeof findActivePermitsByDni>>>(null)
  const [busy, setBusy] = useState(false)

  async function handleCode(code: string) {
    if (busy || !entryType) return

    setBusy(true)

    try {
      const r = await registerEntry({
        data: {
          code,
          method: 'qr',
          entryType,
        },
      })

      setResult(r)
    } finally {
      setBusy(false)
    }
  }

  async function handleManualSearch(e: React.FormEvent) {
    e.preventDefault()

    if (!entryType) return

    setResult(null)

    const r = await findActivePermitsByDni({
      data: { dni },
    })

    setManualLookup(r)
  }

  async function checkInPerson(
    personId: number,
    force = false,
  ) {
    if (!entryType) return

    setBusy(true)

    try {
      const r = await registerEntry({
        data: {
          personId,
          method: 'manual',
          entryType,
          force,
        },
      })

      setResult(r)
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    setResult(null)
    setManualLookup(null)
    setDni('')
  }

  function changeEntryType(type: EntryType) {
    setEntryType(type)
    reset()
    setMode('scan')
  }

  function backToEntryTypeSelection() {
    setEntryType(null)
    reset()
    setMode('scan')
  }

  // ============================================================
  // SELECCIÓN DEL TIPO DE INGRESO
  // ============================================================

  if (!entryType) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ScanLine className="w-6 h-6" />
          Control de ingreso
        </h1>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-lg font-semibold text-slate-900 text-center mb-5">
            ¿Qué ingreso querés registrar?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => changeEntryType('campo_deportes')}
              className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-slate-200 bg-white p-6 hover:border-blue-500 hover:bg-blue-50 transition"
            >
              <Dumbbell className="w-12 h-12 text-blue-800" />

              <div>
                <p className="text-lg font-bold text-slate-900">
                  Campo de deportes
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  No requiere permiso de pileta
                </p>
              </div>
            </button>

            <button
              onClick={() => changeEntryType('pileta')}
              className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-slate-200 bg-white p-6 hover:border-cyan-500 hover:bg-cyan-50 transition"
            >
              <Waves className="w-12 h-12 text-cyan-700" />

              <div>
                <p className="text-lg font-bold text-slate-900">
                  Pileta
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  Requiere permiso vigente
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  const entryTypeLabel =
    entryType === 'campo_deportes'
      ? 'Campo de deportes'
      : 'Pileta'

  const EntryIcon =
    entryType === 'campo_deportes'
      ? Dumbbell
      : Waves

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <EntryIcon className="w-6 h-6" />
          Control de ingreso
        </h1>

        <button
          onClick={backToEntryTypeSelection}
          className="text-sm font-semibold text-blue-800 hover:underline"
        >
          Cambiar
        </button>
      </div>

      {/* ========================================================
          TIPO DE INGRESO SELECCIONADO
          ======================================================== */}

      <div
        className={`rounded-xl border-2 p-4 flex items-center gap-3 ${
          entryType === 'campo_deportes'
            ? 'border-blue-200 bg-blue-50'
            : 'border-cyan-200 bg-cyan-50'
        }`}
      >
        <EntryIcon
          className={`w-8 h-8 ${
            entryType === 'campo_deportes'
              ? 'text-blue-800'
              : 'text-cyan-700'
          }`}
        />

        <div>
          <p className="font-bold text-slate-900">
            {entryTypeLabel}
          </p>

          <p className="text-sm text-slate-600">
            {entryType === 'campo_deportes'
              ? 'El ingreso se registra sin validar permiso de pileta.'
              : 'El ingreso requiere un permiso de pileta vigente.'}
          </p>
        </div>
      </div>

      {/* ========================================================
          MODO
          ======================================================== */}

      <div className="flex gap-2">
        <button
          onClick={() => {
            setMode('scan')
            reset()
          }}
          className={`flex-1 py-2.5 rounded-lg font-semibold text-sm ${
            mode === 'scan'
              ? 'bg-blue-900 text-white'
              : 'bg-white border border-slate-300'
          }`}
        >
          Escanear QR
        </button>

        <button
          onClick={() => {
            setMode('manual')
            reset()
          }}
          className={`flex-1 py-2.5 rounded-lg font-semibold text-sm ${
            mode === 'manual'
              ? 'bg-blue-900 text-white'
              : 'bg-white border border-slate-300'
          }`}
        >
          Buscar por DNI
        </button>
      </div>

      {/* ========================================================
          ESCANEAR QR
          ======================================================== */}

      {!result && mode === 'scan' && (
        <Scanner
          onCode={handleCode}
          busy={busy}
        />
      )}

      {/* ========================================================
          BÚSQUEDA MANUAL
          ======================================================== */}

      {!result && mode === 'manual' && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <form
            onSubmit={handleManualSearch}
            className="flex gap-2"
          >
            <input
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5"
              placeholder="DNI"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              autoFocus
              required
            />

            <button
              disabled={busy}
              className="bg-blue-900 text-white px-4 rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              Buscar
            </button>
          </form>

          {manualLookup === null && dni && (
            <p className="text-sm text-slate-400 mt-3">
              Ingresá el DNI y buscá.
            </p>
          )}

          {manualLookup === null ? null : !manualLookup ? (
            <p className="text-red-700 font-medium mt-4">
              No se encontró ninguna persona con ese DNI.
            </p>
          ) : (
            <div className="mt-4">
              <p className="font-semibold text-lg">
                {manualLookup.person.firstName}{' '}
                {manualLookup.person.lastName}
              </p>

              <p className="text-sm text-slate-500 mb-3">
                DNI {manualLookup.person.dni}
              </p>

              {/* ==================================================
                  CAMPO DE DEPORTES
                  ================================================== */}

              {entryType === 'campo_deportes' ? (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                  <p className="text-sm text-blue-900 mb-3">
                    El campo de deportes no requiere un permiso
                    de pileta.
                  </p>

                  <button
                    onClick={() =>
                      checkInPerson(
                        manualLookup.person.id,
                      )
                    }
                    disabled={busy}
                    className="w-full bg-blue-900 text-white font-semibold px-3 py-3 rounded-lg disabled:opacity-50"
                  >
                    Registrar ingreso al campo de deportes
                  </button>
                </div>
              ) : (
                /* ================================================
                   PILETA
                   ================================================ */

                <ul className="divide-y divide-slate-100">
                  {manualLookup.permits.map((p) => (
                    <li
                      key={p.permit.id}
                      className="py-2 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {p.plan.name}
                        </p>

                        <p className="text-xs text-slate-500">
                          {formatDateAR(
                            p.permit.startDate,
                          )}{' '}
                          —{' '}
                          {formatDateAR(
                            p.permit.endDate,
                          )}{' '}
                          ({p.liveStatus})
                        </p>
                      </div>

                      {p.liveStatus === 'activo' && (
                        <button
                          onClick={() =>
                            checkInPerson(
                              manualLookup.person.id,
                            )
                          }
                          disabled={busy}
                          className="bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-50"
                        >
                          Registrar ingreso
                        </button>
                      )}
                    </li>
                  ))}

                  {manualLookup.permits.length === 0 && (
                    <li className="py-2 text-sm text-slate-400">
                      No tiene permisos cargados.
                    </li>
                  )}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          RESULTADO
          ======================================================== */}

      {result && (
        <ResultPanel
          result={result}
          entryType={entryType}
          onReset={reset}
          onForce={(personId) =>
            checkInPerson(personId, true)
          }
        />
      )}
    </div>
  )
}

// ============================================================
// SCANNER
// ============================================================

function Scanner({
  onCode,
  busy,
}: {
  onCode: (code: string) => void
  busy: boolean
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [active, setActive] = useState(false)
  const [manualCode, setManualCode] = useState('')

  const handleDetectedCode = useCallback(
    (code: string) => {
      if (!busy) {
        onCode(code)
      }
    },
    [busy, onCode],
  )

  useEffect(() => {
    if (!active) return

    let stream: MediaStream | null = null
    let stop = false
    let raf = 0

    async function start() {
      if (!('BarcodeDetector' in window)) {
        setError(
          'Este navegador no soporta escaneo automático de QR. Usá la carga manual del código o la búsqueda por DNI.',
        )
        return
      }

      try {
        stream =
          await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'environment',
            },
          })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        // @ts-expect-error BarcodeDetector may not be in TS lib
        const detector = new window.BarcodeDetector({
          formats: ['qr_code'],
        })

        const tick = async () => {
          if (
            stop ||
            !videoRef.current
          ) {
            return
          }

          try {
            const codes =
              await detector.detect(
                videoRef.current,
              )

            if (
              codes.length > 0 &&
              !busy
            ) {
              handleDetectedCode(
                codes[0].rawValue,
              )
              return
            }
          } catch {
            // Ignorar errores transitorios de detección.
          }

          raf = requestAnimationFrame(tick)
        }

        raf = requestAnimationFrame(tick)
      } catch {
        setError(
          'No se pudo acceder a la cámara. Verificá los permisos del navegador.',
        )
      }
    }

    start()

    return () => {
      stop = true
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach((t) =>
        t.stop(),
      )
    }
  }, [
    active,
    busy,
    handleDetectedCode,
  ])

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
      {!active ? (
        <button
          onClick={() => {
            setError(null)
            setActive(true)
          }}
          className="w-full flex flex-col items-center gap-2 py-10 border-2 border-dashed border-blue-300 rounded-xl text-blue-800"
        >
          <Camera className="w-10 h-10" />

          <span className="font-semibold">
            Activar cámara
          </span>
        </button>
      ) : (
        <div className="space-y-3">
          <video
            ref={videoRef}
            className="w-full rounded-lg bg-black aspect-square object-cover"
            muted
            playsInline
          />

          <button
            onClick={() =>
              setActive(false)
            }
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-slate-500 border border-slate-300 rounded-lg"
          >
            <CameraOff className="w-4 h-4" />
            Apagar cámara
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-amber-700 bg-amber-50 rounded-lg p-3">
          {error}
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()

          if (manualCode.trim()) {
            handleDetectedCode(
              manualCode.trim(),
            )
          }
        }}
        className="flex gap-2 pt-2 border-t border-slate-100"
      >
        <input
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="O ingresá el código del permiso manualmente"
          value={manualCode}
          onChange={(e) =>
            setManualCode(e.target.value)
          }
        />

        <button
          disabled={busy}
          className="bg-slate-800 text-white px-3 rounded-lg text-sm font-semibold disabled:opacity-50"
        >
          Validar
        </button>
      </form>
    </div>
  )
}

// ============================================================
// RESULTADO
// ============================================================

function ResultPanel({
  result,
  entryType,
  onReset,
  onForce,
}: {
  result: Result
  entryType: EntryType
  onReset: () => void
  onForce: (personId: number) => void
}) {
  if (result.authorized) {
    const isCampo =
      entryType === 'campo_deportes'

    return (
      <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-6 text-center space-y-2">
        <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto" />

        <p className="text-2xl font-bold text-emerald-700">
          INGRESO REGISTRADO
        </p>

        <p className="text-lg font-semibold">
          {result.person.firstName}{' '}
          {result.person.lastName}
        </p>

        <p className="text-sm text-slate-600">
          DNI {result.person.dni}
        </p>

        <div className="pt-2">
          <p className="font-bold text-slate-800">
            {isCampo
              ? '🏀 Campo de deportes'
              : '🏊 Pileta'}
          </p>

          {!isCampo &&
            result.plan &&
            result.permit && (
              <>
                <p className="text-sm text-slate-600">
                  {result.plan.name}
                </p>

                <p className="text-sm text-slate-600">
                  Válido hasta{' '}
                  {formatDateAR(
                    result.permit.endDate,
                  )}
                </p>
              </>
            )}
        </div>

        <button
          onClick={onReset}
          className="mt-4 w-full bg-emerald-600 text-white font-semibold py-3 rounded-lg"
        >
          Siguiente
        </button>
      </div>
    )
  }

  const reasonText: Record<
    string,
    string
  > = {
    no_person:
      'No se encontró una persona asociada a este código.',
    no_permit:
      'Esta persona no tiene ningún permiso registrado.',
    person_inactive:
      'La persona se encuentra inactiva.',
    expired:
      'El permiso está vencido.',
    not_valid_yet:
      'El permiso todavía no comenzó su vigencia.',
    cancelled:
      'El permiso está cancelado.',
    duplicate:
      'Ya se registró un ingreso reciente para esta persona.',
  }

  return (
    <div className="bg-red-50 border-2 border-red-500 rounded-xl p-6 text-center space-y-2">
      <XCircle className="w-16 h-16 text-red-600 mx-auto" />

      <p className="text-2xl font-bold text-red-700">
        INGRESO DENEGADO
      </p>

      {'person' in result &&
        result.person && (
          <p className="text-lg font-semibold">
            {result.person.firstName}{' '}
            {result.person.lastName}
          </p>
        )}

      <p className="text-sm text-slate-600">
        {reasonText[result.reason] ??
          'No se pudo autorizar el ingreso.'}
      </p>

      {result.reason === 'duplicate' &&
        'minutesAgo' in result && (
          <p className="text-xs text-slate-500">
            Último ingreso hace{' '}
            {result.minutesAgo} minuto(s).
          </p>
        )}

      <div className="flex gap-2 mt-4">
        {result.reason === 'duplicate' &&
          'person' in result &&
          result.person && (
            <button
              onClick={() =>
                onForce(result.person!.id)
              }
              className="flex-1 bg-amber-600 text-white font-semibold py-3 rounded-lg"
            >
              Autorizar de todos modos
            </button>
          )}

        <button
          onClick={onReset}
          className="flex-1 bg-slate-700 text-white font-semibold py-3 rounded-lg"
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}