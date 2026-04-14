import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { SolBadge } from '../components/ui/StatoBadge'
import { CondBadge } from '../components/ui/StatoBadge'
import { formatDate, formatRelativeTime } from '@logiflow/utils'
import type { Conductor, Entrega, Notificacion } from '@logiflow/types'

export function AppConductorPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data: conductores = [] } = useQuery<Conductor[]>({
    queryKey: ['conductores'],
    queryFn: async () => { const r = await api.get('/conductores'); return r.data.data },
  })

  const selected = conductores.find((c) => c.id === selectedId)

  const { data: entregas = [] } = useQuery<Entrega[]>({
    queryKey: ['cond-entregas', selectedId],
    queryFn: async () => { const r = await api.get(`/conductores/${selectedId}/entregas`); return r.data.data },
    enabled: !!selectedId,
  })

  const { data: notifs = [] } = useQuery<Notificacion[]>({
    queryKey: ['notif-cond', selectedId],
    queryFn: async () => { const r = await api.get(`/notificaciones?conductorId=${selectedId}`); return r.data.data },
    enabled: !!selectedId,
  })

  const completadas = entregas.filter((e) => e.estado === 'COMPLETADA').length
  const activas = entregas.filter((e) => ['ASIGNADA', 'EN_RUTA'].includes(e.estado)).length
  const incidencias = entregas.filter((e) => e.estado === 'INCIDENCIA').length

  return (
    <div className="space-y-5">
      <h1 className="font-display font-bold text-2xl text-white">App Conductor — Vista interna</h1>

      <div>
        <label className="label">Seleccionar Conductor</label>
        <select value={selectedId || ''} onChange={(e) => setSelectedId(e.target.value || null)} className="input max-w-xs">
          <option value="">Seleccionar...</option>
          {conductores.map((c) => <option key={c.id} value={c.id}>{c.nombre} · {c.licencia}</option>)}
        </select>
      </div>

      {selected && (
        <>
          {/* Hero */}
          <div className="card flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-16 h-16 bg-amber-500/15 border-2 border-amber-500/40 rounded-full flex items-center justify-center text-amber-400 font-bold text-2xl">
              {selected.nombre.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="font-display font-bold text-xl text-white">{selected.nombre}</h2>
                <CondBadge estado={selected.estado} />
              </div>
              <p className="text-carbon-400 text-sm font-mono mt-0.5">{selected.licencia}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[['Activas', activas, 'text-purple-400'], ['Completadas', completadas, 'text-green-400'], ['Incidencias', incidencias, 'text-orange-400']].map(([l, v, c]) => (
                <div key={String(l)}>
                  <p className={`font-display font-bold text-xl ${c}`}>{v}</p>
                  <p className="text-carbon-500 text-xs">{l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Entregas */}
          <div className="card space-y-3">
            <h3 className="font-semibold text-carbon-300">Entregas ({entregas.length})</h3>
            {entregas.length === 0 ? (
              <p className="text-carbon-500 text-sm">Sin entregas asignadas</p>
            ) : (
              <div className="space-y-2">
                {entregas.slice(0, 10).map((e) => (
                  <div key={e.id} className="bg-carbon-700/50 rounded-lg p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-amber-400 text-xs">{e.solicitud?.ot}</p>
                      <p className="text-sm font-medium">{e.solicitud?.cliente}</p>
                      {e.solicitud?.fechaEntrega && <p className="text-xs text-carbon-400">{formatDate(e.solicitud.fechaEntrega)}</p>}
                    </div>
                    <SolBadge estado={e.estado} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notificaciones */}
          <div className="card space-y-3">
            <h3 className="font-semibold text-carbon-300">Notificaciones ({notifs.length})</h3>
            {notifs.length === 0 ? (
              <p className="text-carbon-500 text-sm">Sin notificaciones</p>
            ) : (
              <div className="space-y-2">
                {notifs.map((n) => (
                  <div key={n.id} className="flex items-start gap-2 text-sm bg-carbon-700/30 rounded-lg p-2">
                    <span>{n.tipo === 'SUCCESS' ? '✅' : n.tipo === 'ERROR' ? '❌' : n.tipo === 'WARNING' ? '⚠️' : 'ℹ️'}</span>
                    <div>
                      <p className="text-carbon-300">{n.mensaje}</p>
                      <p className="text-xs text-carbon-500">{formatRelativeTime(n.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
