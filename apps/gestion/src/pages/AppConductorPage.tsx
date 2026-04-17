import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { SolBadge } from '../components/ui/StatoBadge'
import { CondBadge } from '../components/ui/StatoBadge'
import { formatDate, formatRelativeTime, formatCurrency } from '@logiflow/utils'
import type { Conductor, Entrega, Notificacion } from '@logiflow/types'

export function AppConductorPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const qc = useQueryClient()

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

  const { data: gastos = [] } = useQuery<any[]>({
    queryKey: ['gastos-conductor', selectedId],
    queryFn: async () => { const r = await api.get(`/gastos/conductor?conductorId=${selectedId}`); return r.data.data },
    enabled: !!selectedId,
  })

  const aprobarMut = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: string }) =>
      api.put(`/gastos/conductor/${id}/estado`, { estado }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gastos-conductor', selectedId] }),
  })

  const completadas = entregas.filter((e) => e.estado === 'COMPLETADA').length
  const activas = entregas.filter((e) => ['ASIGNADA', 'EN_RUTA'].includes(e.estado)).length
  const incidencias = entregas.filter((e) => e.estado === 'INCIDENCIA').length

  const gastosPendientes = gastos.filter((g: any) => g.estado === 'PENDIENTE')
  const totalGastos = gastos.reduce((s: number, g: any) =>
    s + g.estacionamiento + g.gasolina + g.tag + g.casetas + g.comidas + g.otros, 0)

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

          {/* Gastos */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-carbon-300">Gastos ({gastos.length})</h3>
              <div className="flex gap-3 text-sm">
                <span className="text-carbon-400">Total: <span className="text-white font-bold">{formatCurrency(totalGastos)}</span></span>
                {gastosPendientes.length > 0 && (
                  <span className="bg-amber-500/20 text-amber-400 rounded-full px-2 py-0.5 text-xs font-bold">
                    {gastosPendientes.length} pendientes
                  </span>
                )}
              </div>
            </div>
            {gastos.length === 0 ? (
              <p className="text-carbon-500 text-sm">Sin gastos registrados</p>
            ) : (
              <div className="space-y-2">
                {gastos.slice(0, 10).map((g: any) => {
                  const total = g.estacionamiento + g.gasolina + g.tag + g.casetas + g.comidas + g.otros
                  return (
                    <div key={g.id} className="bg-carbon-700/50 rounded-lg p-3 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-carbon-400">{new Date(g.createdAt).toLocaleDateString('es-MX')}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                          {g.gasolina > 0 && <span className="text-xs text-carbon-300">Gas: {formatCurrency(g.gasolina)}</span>}
                          {g.casetas > 0 && <span className="text-xs text-carbon-300">Casetas: {formatCurrency(g.casetas)}</span>}
                          {g.estacionamiento > 0 && <span className="text-xs text-carbon-300">Estac: {formatCurrency(g.estacionamiento)}</span>}
                          {g.comidas > 0 && <span className="text-xs text-carbon-300">Comidas: {formatCurrency(g.comidas)}</span>}
                          {g.tag > 0 && <span className="text-xs text-carbon-300">TAG: {formatCurrency(g.tag)}</span>}
                          {g.otros > 0 && <span className="text-xs text-carbon-300">Otros: {formatCurrency(g.otros)}</span>}
                        </div>
                        {g.observaciones && <p className="text-xs text-carbon-500 mt-1 truncate">{g.observaciones}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-bold text-sm text-white">{formatCurrency(total)}</span>
                        {g.estado === 'PENDIENTE' ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => aprobarMut.mutate({ id: g.id, estado: 'APROBADO' })}
                              className="w-7 h-7 bg-green-500/20 hover:bg-green-500/40 text-green-400 rounded-lg text-xs font-bold transition-colors"
                              title="Aprobar"
                            >✓</button>
                            <button
                              onClick={() => aprobarMut.mutate({ id: g.id, estado: 'RECHAZADO' })}
                              className="w-7 h-7 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg text-xs font-bold transition-colors"
                              title="Rechazar"
                            >✕</button>
                          </div>
                        ) : (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            g.estado === 'APROBADO' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>{g.estado}</span>
                        )}
                      </div>
                    </div>
                  )
                })}
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
