import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { toast } from '../stores/uiStore'
import { Modal } from '../components/ui/Modal'
import { SolBadge } from '../components/ui/StatoBadge'
import { formatDate, formatDateTime } from '@logiflow/utils'
import type { Entrega, Conductor, Vehiculo } from '@logiflow/types'

// ─── Sub-estado helpers ───────────────────────────────────────────────────────

const SUB_PASOS = [
  { key: 'EN_RUTA',            icon: '🚛', label: 'En Ruta' },
  { key: 'EN_ESPERA',          icon: '⏳', label: 'En Espera' },
  { key: 'DESCARGA',           icon: '📦', label: 'Descarga' },
  { key: 'ENTREGA_DOCUMENTOS', icon: '📄', label: 'Docs' },
  { key: 'COMPLETADO',         icon: '✅', label: 'Completado' },
] as const

function SubEstadoTimeline({ subEstado }: { subEstado?: string | null }) {
  if (!subEstado) return <span className="text-carbon-500 text-xs">—</span>
  const idx = SUB_PASOS.findIndex(p => p.key === subEstado)
  return (
    <div className="flex items-center gap-0.5">
      {SUB_PASOS.map((paso, i) => {
        const done = i < idx
        const active = i === idx
        return (
          <div key={paso.key} className="flex items-center">
            <div title={paso.label}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all
                ${active ? 'bg-amber-500 text-carbon-900 ring-2 ring-amber-400/50' : done ? 'bg-emerald-500/30 text-emerald-400' : 'bg-carbon-700 text-carbon-600'}`}>
              {paso.icon}
            </div>
            {i < SUB_PASOS.length - 1 && (
              <div className={`w-3 h-0.5 ${done ? 'bg-emerald-500/50' : 'bg-carbon-700'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Detalle completo de entrega ──────────────────────────────────────────────

function DetalleModal({ entrega, onClose }: { entrega: Entrega; onClose: () => void }) {
  const qc = useQueryClient()
  const docs: any[] = (entrega as any).documentos ?? []
  const ev = entrega.evidencia

  const estadoMut = useMutation({
    mutationFn: (body: { estado: string; motivo?: string }) =>
      api.put(`/entregas/${entrega.id}/estado`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['entregas'] }); toast.success('Estado actualizado') },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Error'),
  })

  const [nuevoEstado, setNuevoEstado] = useState('')
  const [motivo, setMotivo] = useState('')

  return (
    <Modal open onClose={onClose} title={`Detalle — ${entrega.solicitud?.ot}`} size="lg">
      <div className="p-5 space-y-5">

        {/* Subestado timeline expandido */}
        <div className="bg-carbon-700/40 rounded-xl p-4">
          <p className="text-xs text-carbon-400 mb-3">Actividad del conductor</p>
          <div className="flex items-center justify-between">
            {SUB_PASOS.map((paso, i) => {
              const curIdx = SUB_PASOS.findIndex(p => p.key === (entrega as any).subEstado)
              const done = i < curIdx
              const active = i === curIdx
              return (
                <div key={paso.key} className="flex flex-col items-center gap-1 flex-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base
                    ${active ? 'bg-amber-500 text-carbon-900 ring-2 ring-amber-400/40 shadow-lg' : done ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40' : 'bg-carbon-800 text-carbon-600 ring-1 ring-carbon-600'}`}>
                    {paso.icon}
                  </div>
                  <span className={`text-xs ${active ? 'text-amber-400 font-semibold' : done ? 'text-emerald-400' : 'text-carbon-600'}`}>
                    {paso.label}
                  </span>
                  {i < SUB_PASOS.length - 1 && (
                    <div className="absolute" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Info + descarga remisión */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-carbon-700/40 rounded-lg p-3">
            <p className="text-xs text-carbon-400 mb-1">Cliente</p>
            <p className="text-white font-medium">{entrega.solicitud?.cliente}</p>
            {(entrega.solicitud as any)?.rfcCliente && (
              <p className="text-carbon-400 text-xs">RFC: {(entrega.solicitud as any).rfcCliente}</p>
            )}
          </div>
          <div className="bg-carbon-700/40 rounded-lg p-3">
            <p className="text-xs text-carbon-400 mb-1">Conductor / Vehículo</p>
            <p className="text-white font-medium">{entrega.conductor?.nombre || '—'}</p>
            <p className="text-carbon-400 text-xs">{entrega.vehiculo?.placa} · {entrega.vehiculo?.tipo}</p>
          </div>
        </div>

        {/* Remisión */}
        {(entrega as any).remisionUrl ? (
          <a
            href={`http://localhost:3001/api/entregas/${entrega.id}/remision`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-4 transition-colors group">
            <span className="text-2xl">📋</span>
            <div className="flex-1">
              <p className="text-emerald-400 font-medium text-sm">Remisión generada</p>
              <p className="text-carbon-400 text-xs">Descargar formato Excel · {entrega.solicitud?.ot}</p>
            </div>
            <span className="text-emerald-400 text-xs group-hover:translate-x-0.5 transition-transform">⬇ Descargar</span>
          </a>
        ) : (
          <div className="flex items-center gap-3 bg-carbon-700/40 border border-carbon-600 rounded-xl p-4">
            <span className="text-2xl opacity-40">📋</span>
            <p className="text-carbon-500 text-sm">Remisión no generada — asigna conductor para crearla</p>
          </div>
        )}

        {/* Documentos adjuntos */}
        {docs.length > 0 && (
          <div>
            <p className="text-white font-medium text-sm mb-2">📎 Documentos adjuntos ({docs.length})</p>
            <div className="grid grid-cols-2 gap-2">
              {docs.map((d: any) => (
                <a key={d.id} href={`http://localhost:3001${d.url}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-carbon-700/50 hover:bg-carbon-700 rounded-lg p-2.5 transition-colors">
                  <span className="text-lg">{d.tipo?.startsWith('image') ? '🖼' : '📄'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs truncate">{d.nombre}</p>
                    <p className="text-carbon-500 text-xs">{formatDateTime(d.createdAt)}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Checklist de evidencia */}
        {ev && (
          <div>
            <p className="text-white font-medium text-sm mb-2">✅ Checklist de evidencia</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                ['Llegada', ev.checkLlegada], ['Contacto', ev.checkContacto],
                ['Descarga', ev.checkDescarga], ['Conteo', ev.checkConteo],
                ['Condición', ev.checkCondicion], ['Remisión', ev.checkRemision], ['Acuse', ev.checkAcuse],
              ].map(([label, ts]) => (
                <div key={String(label)} className={`flex items-center gap-2 p-2 rounded-lg ${ts ? 'bg-green-500/10 text-green-300' : 'bg-carbon-700/50 text-carbon-500'}`}>
                  <span>{ts ? '✅' : '⬜'}</span>
                  <span className="text-xs">{String(label)}{ts ? ` — ${new Date(String(ts)).toLocaleTimeString('es-MX')}` : ''}</span>
                </div>
              ))}
            </div>
            {ev.tieneFirma && ev.firmaUrl && (
              <div className="mt-3">
                <p className="text-xs text-carbon-400 mb-1">Firma del receptor</p>
                <img src={`http://localhost:3001${ev.firmaUrl}`} alt="firma" className="bg-white rounded-lg max-h-24 object-contain p-2" />
              </div>
            )}
            {(ev as any).fotos?.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-carbon-400 mb-1">Fotos ({(ev as any).fotos.length})</p>
                <div className="grid grid-cols-4 gap-2">
                  {(ev as any).fotos.map((f: any) => (
                    <img key={f.id} src={`http://localhost:3001${f.url}`} alt={f.nombre} className="w-full h-16 object-cover rounded-lg bg-carbon-700" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cambiar estado general */}
        {(entrega.estado === 'ASIGNADA' || entrega.estado === 'EN_RUTA') && (
          <div className="border-t border-carbon-700 pt-4 space-y-3">
            <p className="text-xs text-carbon-400 font-medium uppercase tracking-wide">Cambiar estado de la entrega</p>
            <div className="flex gap-3">
              <select value={nuevoEstado} onChange={e => setNuevoEstado(e.target.value)} className="input flex-1 text-sm">
                <option value="">Seleccionar…</option>
                <option value="EN_RUTA">En Ruta</option>
                <option value="COMPLETADA">Completada</option>
                <option value="RECHAZADA">Rechazada</option>
                <option value="INCIDENCIA">Incidencia</option>
              </select>
              <button disabled={!nuevoEstado || estadoMut.isPending || ((nuevoEstado === 'RECHAZADA' || nuevoEstado === 'INCIDENCIA') && !motivo)}
                onClick={() => estadoMut.mutate({ estado: nuevoEstado, motivo: motivo || undefined })}
                className="btn-primary text-sm px-4 disabled:opacity-40">
                {estadoMut.isPending ? '…' : 'Actualizar'}
              </button>
            </div>
            {(nuevoEstado === 'RECHAZADA' || nuevoEstado === 'INCIDENCIA') && (
              <input value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Motivo obligatorio…" className="input text-sm" />
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function EntregasPage() {
  const qc = useQueryClient()
  const [asignarId, setAsignarId] = useState<string | null>(null)
  const [detalleEnt, setDetalleEnt] = useState<Entrega | null>(null)
  const [selectedCond, setSelectedCond] = useState('')
  const [selectedVeh, setSelectedVeh] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  const { data: entregas = [], isLoading } = useQuery<Entrega[]>({
    queryKey: ['entregas', filtroEstado],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filtroEstado) params.set('estado', filtroEstado)
      const res = await api.get(`/entregas?${params}`)
      return res.data.data
    },
    refetchInterval: 15000,
  })

  const { data: conductores = [] } = useQuery<Conductor[]>({
    queryKey: ['conductores'],
    queryFn: async () => { const r = await api.get('/conductores'); return r.data.data },
  })

  const { data: vehiculos = [] } = useQuery<Vehiculo[]>({
    queryKey: ['vehiculos'],
    queryFn: async () => { const r = await api.get('/vehiculos'); return r.data.data },
  })

  const asignarMut = useMutation({
    mutationFn: () => api.put(`/entregas/${asignarId}/asignar`, { conductorId: selectedCond, vehiculoId: selectedVeh }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entregas'] })
      toast.success('Entrega asignada — remisión generada automáticamente ✅')
      setAsignarId(null)
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Error al asignar'),
  })

  const disponCond = conductores.filter((c) => c.estado === 'DISPONIBLE')
  const disponVeh = vehiculos.filter((v) => v.estado === 'DISPONIBLE')

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Entregas</h1>
          <p className="text-carbon-400 text-sm">{entregas.length} registros · actualiza cada 15s</p>
        </div>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="input max-w-[180px] text-sm">
          <option value="">Todos los estados</option>
          {['PENDIENTE', 'ASIGNADA', 'EN_RUTA', 'COMPLETADA', 'RECHAZADA', 'INCIDENCIA'].map((e) => (
            <option key={e} value={e}>{e.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-carbon-700/50">
              <tr className="text-carbon-400 text-xs">
                {['OT', 'Cliente', 'Conductor', 'Vehículo', 'Estado', 'Actividad', 'Remisión', 'Fecha', 'Acciones'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-carbon-500">Cargando...</td></tr>
              ) : entregas.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-carbon-500">Sin entregas</td></tr>
              ) : entregas.map((e) => (
                <tr key={e.id} className="border-t border-carbon-700/50 table-row-hover cursor-pointer" onClick={() => setDetalleEnt(e)}>
                  <td className="px-4 py-3 font-mono text-amber-400 text-xs whitespace-nowrap">{e.solicitud?.ot}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{e.solicitud?.cliente}</p>
                    {(e.solicitud as any)?.rfcCliente && <p className="text-carbon-500 text-xs">{(e.solicitud as any).rfcCliente}</p>}
                  </td>
                  <td className="px-4 py-3 text-carbon-300 text-xs">{e.conductor?.nombre || <span className="text-carbon-600">—</span>}</td>
                  <td className="px-4 py-3 text-carbon-300 text-xs">{e.vehiculo?.placa || <span className="text-carbon-600">—</span>}</td>
                  <td className="px-4 py-3"><SolBadge estado={e.estado} /></td>
                  <td className="px-4 py-3">
                    <SubEstadoTimeline subEstado={(e as any).subEstado} />
                  </td>
                  <td className="px-4 py-3">
                    {(e as any).remisionUrl ? (
                      <a href={`http://localhost:3001/api/entregas/${e.id}/remision`}
                        onClick={ev => ev.stopPropagation()}
                        target="_blank" rel="noopener noreferrer"
                        className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                        📋 Descargar
                      </a>
                    ) : (
                      <span className="text-carbon-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-carbon-400 text-xs">{formatDate(e.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap" onClick={ev => ev.stopPropagation()}>
                      {e.estado === 'PENDIENTE' && (
                        <button
                          onClick={() => { setAsignarId(e.id); setSelectedCond(''); setSelectedVeh('') }}
                          className="text-xs px-2 py-1 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 rounded">
                          Asignar
                        </button>
                      )}
                      <button onClick={() => setDetalleEnt(e)}
                        className="text-xs px-2 py-1 bg-carbon-700 hover:bg-carbon-600 text-carbon-300 rounded">
                        Ver
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Asignar Modal */}
      <Modal open={!!asignarId} onClose={() => setAsignarId(null)} title="Asignar Conductor y Vehículo" size="sm">
        <div className="p-5 space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 text-xs text-amber-300">
            💡 Al asignar, se generará automáticamente la remisión en Excel
          </div>
          <div>
            <label className="label">Conductor (Disponible)</label>
            <select value={selectedCond} onChange={(e) => setSelectedCond(e.target.value)} className="input">
              <option value="">Seleccionar...</option>
              {disponCond.map((c) => <option key={c.id} value={c.id}>{c.nombre} · {c.licencia}</option>)}
            </select>
            {disponCond.length === 0 && <p className="text-xs text-orange-400 mt-1">No hay conductores disponibles</p>}
          </div>
          <div>
            <label className="label">Vehículo (Disponible)</label>
            <select value={selectedVeh} onChange={(e) => setSelectedVeh(e.target.value)} className="input">
              <option value="">Seleccionar...</option>
              {disponVeh.map((v) => <option key={v.id} value={v.id}>{v.placa} · {v.tipo} · {v.modelo}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-ghost text-sm" onClick={() => setAsignarId(null)}>Cancelar</button>
            <button
              className="btn-primary text-sm"
              disabled={!selectedCond || !selectedVeh || asignarMut.isPending}
              onClick={() => asignarMut.mutate()}
            >{asignarMut.isPending ? 'Asignando…' : 'Asignar y Generar Remisión'}</button>
          </div>
        </div>
      </Modal>

      {/* Detalle Modal */}
      {detalleEnt && <DetalleModal entrega={detalleEnt} onClose={() => setDetalleEnt(null)} />}
    </div>
  )
}
