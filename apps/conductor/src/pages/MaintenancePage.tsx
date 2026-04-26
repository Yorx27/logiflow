export function MaintenancePage() {
  return (
    <div className="min-h-screen bg-carbon-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-500/30">
        <span className="font-display font-black text-carbon-900 text-4xl">L</span>
      </div>
      <h1 className="font-display font-bold text-3xl text-white mb-2">LogiFlow</h1>
      <p className="text-amber-400 font-semibold mb-6">Portal del Conductor</p>

      <div className="bg-carbon-800 border border-carbon-700 rounded-2xl p-8 max-w-sm w-full">
        <div className="text-5xl mb-4">🔧</div>
        <h2 className="font-display font-bold text-xl text-white mb-2">
          En mantenimiento
        </h2>
        <p className="text-carbon-400 text-sm leading-relaxed">
          El portal está temporalmente fuera de servicio por mantenimiento programado.
          Regresaremos en breve.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          <span className="text-xs text-carbon-500">Trabajando en ello...</span>
        </div>
      </div>

      <p className="text-carbon-600 text-xs mt-8">
        ¿Urgente? Contacta a tu coordinador de operaciones.
      </p>
    </div>
  )
}
