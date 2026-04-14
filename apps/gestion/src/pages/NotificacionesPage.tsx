import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { toast } from '../stores/uiStore'
import { formatRelativeTime } from '@logiflow/utils'
import type { Notificacion } from '@logiflow/types'

const TIPO_STYLE: Record<string, string> = {
  SUCCESS: 'border-l-green-500 bg-green-500/5',
  ERROR: 'border-l-red-500 bg-red-500/5',
  WARNING: 'border-l-amber-500 bg-amber-500/5',
  INFO: 'border-l-blue-500 bg-blue-500/5',
}
const TIPO_ICON: Record<string, string> = { SUCCESS: '✅', ERROR: '❌', WARNING: '⚠️', INFO: 'ℹ️' }

export function NotificacionesPage() {
  const qc = useQueryClient()
  const { data: notifs = [], isLoading } = useQuery<Notificacion[]>({
    queryKey: ['notificaciones'],
    queryFn: async () => { const r = await api.get('/notificaciones'); return r.data.data },
  })

  const leerMut = useMutation({
    mutationFn: (id: string) => api.put(`/notificaciones/${id}/leer`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notificaciones'] }),
  })

  const limpiarMut = useMutation({
    mutationFn: () => api.delete('/notificaciones/limpiar'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notificaciones'] }); toast.success('Notificaciones limpiadas') },
  })

  const unread = notifs.filter((n) => !n.leida).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Notificaciones</h1>
          <p className="text-carbon-400 text-sm">{unread} sin leer · {notifs.length} total</p>
        </div>
        {notifs.length > 0 && (
          <button onClick={() => { if (confirm('¿Limpiar todas las notificaciones?')) limpiarMut.mutate() }} className="btn-ghost text-sm">🗑 Limpiar todo</button>
        )}
      </div>

      {isLoading ? (
        <p className="text-carbon-500 text-center py-10">Cargando...</p>
      ) : notifs.length === 0 ? (
        <div className="card text-center py-16 text-carbon-500">
          <p className="text-4xl mb-3">🔕</p>
          <p>Sin notificaciones</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => (
            <div
              key={n.id}
              className={`card border-l-4 ${TIPO_STYLE[n.tipo]} flex items-start gap-3 cursor-pointer transition-opacity ${n.leida ? 'opacity-60' : ''}`}
              onClick={() => !n.leida && leerMut.mutate(n.id)}
            >
              <span className="text-xl mt-0.5">{TIPO_ICON[n.tipo]}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${n.leida ? 'text-carbon-400' : 'text-white font-medium'}`}>{n.mensaje}</p>
                <p className="text-xs text-carbon-500 mt-1">{formatRelativeTime(n.createdAt)}</p>
              </div>
              {!n.leida && <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0" />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
