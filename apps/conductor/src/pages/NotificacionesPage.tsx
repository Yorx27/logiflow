import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useConductorStore } from '../stores/conductorStore'
import { toast } from '../stores/toastStore'
import { formatRelativeTime } from '@logiflow/utils'
import type { Notificacion } from '@logiflow/types'

const ICONS: Record<string, string> = { SUCCESS: '✅', ERROR: '❌', WARNING: '⚠️', INFO: 'ℹ️' }

export function NotificacionesPage() {
  const { conductor } = useConductorStore()
  const qc = useQueryClient()

  const { data: notifs = [] } = useQuery<Notificacion[]>({
    queryKey: ['notif-conductor', conductor?.id],
    queryFn: async () => { const r = await api.get(`/notificaciones?conductorId=${conductor!.id}`); return r.data.data },
    enabled: !!conductor,
    refetchInterval: 30_000,
  })

  const limpiarMut = useMutation({
    mutationFn: () => api.delete(`/notificaciones/limpiar?conductorId=${conductor!.id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notif-conductor'] }); toast.success('Notificaciones limpiadas') },
  })

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-xl text-white">Notificaciones</h1>
        {notifs.length > 0 && (
          <button onClick={() => limpiarMut.mutate()} className="text-xs text-carbon-400 hover:text-white underline">Limpiar</button>
        )}
      </div>

      {notifs.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-2">🔕</p>
          <p className="text-carbon-400">Sin notificaciones</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => (
            <div key={n.id} className={`card flex items-start gap-3 ${n.leida ? 'opacity-60' : ''}`}>
              <span className="text-xl">{ICONS[n.tipo]}</span>
              <div className="flex-1">
                <p className="text-sm text-white">{n.mensaje}</p>
                <p className="text-xs text-carbon-500 mt-0.5">{formatRelativeTime(n.createdAt)}</p>
              </div>
              {!n.leida && <div className="w-2 h-2 bg-amber-400 rounded-full mt-1 flex-shrink-0" />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
