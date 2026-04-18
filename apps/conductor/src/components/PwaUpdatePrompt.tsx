import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * Muestra un banner en la parte inferior cuando hay una nueva versión
 * disponible del service worker. Con registerType: 'prompt' el SW no
 * recarga la página solo — este componente le pregunta al usuario.
 */
export function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Comprueba actualizaciones cada 60 minutos
      if (r) {
        setInterval(() => r.update(), 60 * 60 * 1000)
      }
    },
  })

  function close() {
    setNeedRefresh(false)
    setOfflineReady(false)
  }

  if (!needRefresh && !offlineReady) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-fade-in">
      <div className="bg-carbon-800 border border-carbon-600 rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-3">
        <span className="text-2xl flex-shrink-0">{needRefresh ? '🔄' : '✅'}</span>
        <div className="flex-1 min-w-0">
          {needRefresh ? (
            <>
              <p className="text-white text-sm font-semibold">Nueva versión disponible</p>
              <p className="text-carbon-400 text-xs">Actualiza para obtener las últimas mejoras</p>
            </>
          ) : (
            <>
              <p className="text-white text-sm font-semibold">App lista sin conexión</p>
              <p className="text-carbon-400 text-xs">LogiFlow funciona sin internet</p>
            </>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {needRefresh && (
            <button
              onClick={() => updateServiceWorker(true)}
              className="bg-amber-500 hover:bg-amber-400 text-carbon-900 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
            >
              Actualizar
            </button>
          )}
          <button
            onClick={close}
            className="text-carbon-400 hover:text-white text-xs px-2 py-1.5 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
