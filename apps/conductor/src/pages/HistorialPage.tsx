import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useConductorStore } from '../stores/conductorStore'
import { formatDate, formatDateTime } from '@logiflow/utils'
import type { Entrega } from '@logiflow/types'

export function HistorialPage() {
  const { conductor } = useConductorStore()

  const { data: entregas = [] } = useQuery<Entrega[]>({
    queryKey: ['mis-entregas', conductor?.id],
    queryFn: async () => { const r = await api.get(`/conductores/${conductor!.id}/entregas`); return r.data.data },
    enabled: !!conductor,
  })

  const completadas = entregas.filter((e) => e.estado === 'COMPLETADA').length
  const incidencias = entregas.filter((e) => e.estado === 'INCIDENCIA').length
  const total = entregas.length
  const tasa = total ? Math.round((completadas / total) * 100) : 0

  return (
    <div className="p-4 space-y-4">
      <h1 className="font-display font-bold text-xl text-white">Historial</h1>

      {/* Stats */}
      <div className="card space-y-3">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="font-display font-bold text-2xl text-green-400">{completadas}</p>
            <p className="text-xs text-carbon-400">Completadas</p>
          </div>
          <div>
            <p className="font-display font-bold text-2xl text-orange-400">{incidencias}</p>
            <p className="text-xs text-carbon-400">Incidencias</p>
          </div>
          <div>
            <p className="font-display font-bold text-2xl text-amber-400">{tasa}%</p>
            <p className="text-xs text-carbon-400">Tasa éxito</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-2 bg-carbon-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-500 to-green-500 rounded-full transition-all" style={{ width: `${tasa}%` }} />
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {entregas.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-4xl mb-2">📭</p>
            <p className="text-carbon-400">Sin historial</p>
          </div>
        ) : [...entregas].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map((e) => (
          <div key={e.id} className="card space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-amber-400 text-xs">{e.solicitud?.ot}</p>
                <p className="font-semibold text-white">{e.solicitud?.cliente}</p>
              </div>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0
                ${e.estado === 'COMPLETADA' ? 'bg-green-500/20 text-green-300' : 'bg-orange-500/20 text-orange-300'}`}>
                {e.estado.replace('_', ' ')}
              </span>
            </div>
            {e.evidencia?.horaFinalizacion && (
              <p className="text-xs text-carbon-400">
                ✅ Finalizada: {formatDateTime(e.evidencia.horaFinalizacion)}
              </p>
            )}
            {e.solicitud?.fechaEntrega && !e.evidencia?.horaFinalizacion && (
              <p className="text-xs text-carbon-400">🗓 {formatDate(e.solicitud.fechaEntrega)}</p>
            )}
            {e.evidencia && (
              <div className="flex gap-3 text-xs text-carbon-500">
                <span>📸 {e.evidencia.fotos?.length || 0} fotos</span>
                {e.evidencia.tieneFirma && <span>✍️ Firma</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
