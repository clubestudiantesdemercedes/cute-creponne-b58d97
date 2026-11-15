import { useEffect, useRef, useState } from 'react'

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function PwaManager() {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null)
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null)
  const [updateReady, setUpdateReady] = useState(false)
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    let refreshing = false
    const hadController = Boolean(navigator.serviceWorker.controller)

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as InstallPromptEvent)
    }

    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    const handleControllerChange = () => {
      if (hadController && !refreshing) {
        refreshing = true
        window.location.reload()
      }
    }

    setIsOffline(!navigator.onLine)
    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then((registration) => {
        registrationRef.current = registration

        if (registration.waiting && navigator.serviceWorker.controller) {
          setUpdateReady(true)
        }

        registration.addEventListener('updatefound', () => {
          const installing = registration.installing
          installing?.addEventListener('statechange', () => {
            if (
              installing.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              setUpdateReady(true)
            }
          })
        })
      })
      .catch((error) => {
        // La aplicación sigue funcionando normalmente aunque no pueda registrarse el SW.
        console.error('No se pudo registrar el service worker:', error)
      })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        handleControllerChange,
      )
    }
  }, [])

  const installApp = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
  }

  const updateApp = () => {
    registrationRef.current?.waiting?.postMessage({ type: 'SKIP_WAITING' })
  }

  if (!installPrompt && !updateReady && !isOffline) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] flex flex-col gap-2 sm:left-auto sm:max-w-sm">
      {isOffline && (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-lg"
          role="status"
          aria-live="polite"
        >
          Sin conexión a Internet. Los datos y operaciones del sistema requieren conexión.
        </div>
      )}

      {installPrompt && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">
              Instalar Natatorio CAE
            </p>
            <p className="text-xs text-slate-600">
              Accedé desde la pantalla de inicio de este dispositivo.
            </p>
          </div>
          <button
            type="button"
            onClick={installApp}
            className="shrink-0 rounded-lg bg-[#0c2b5b] px-3 py-2 text-sm font-semibold text-white hover:bg-[#163d78]"
          >
            Instalar
          </button>
        </div>
      )}

      {updateReady && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-white p-3 shadow-lg">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">
              Hay una actualización disponible
            </p>
            <p className="text-xs text-slate-600">
              Actualizá para utilizar la última versión.
            </p>
          </div>
          <button
            type="button"
            onClick={updateApp}
            className="shrink-0 rounded-lg bg-[#0c2b5b] px-3 py-2 text-sm font-semibold text-white hover:bg-[#163d78]"
          >
            Actualizar
          </button>
        </div>
      )}
    </div>
  )
}
