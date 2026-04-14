import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useConductorStore } from '../stores/conductorStore'
import { toast } from '../stores/toastStore'
import { formatDate } from '@logiflow/utils'
import type { Entrega } from '@logiflow/types'

// ─── Subestado stepper ───────────────────────────────────────────────────────

const PASOS = [
  { key: 'EN_RUTA',            icon: '🚛', label: 'En Ruta',      desc: 'Viajando al destino' },
  { key: 'EN_ESPERA',          icon: '⏳', label: 'En Espera',    desc: 'Esperando en destino' },
  { key: 'DESCARGA',           icon: '📦', label: 'Descarga',     desc: 'Descargando mercancía' },
  { key: 'ENTREGA_DOCUMENTOS', icon: '📄', label: 'Documentos',   desc: 'Entregando documentos' },
  { key: 'COMPLETADO',         icon: '✅', label: 'Completado',   desc: 'Entrega finalizada' },
] as const

type SubEstado = typeof PASOS[number]['key']

function ActividadStepper({
  entregaId,
  subEstadoActual,
  estadoGeneral,
}: {
  entregaId: string
  subEstadoActual?: string | null
  estadoGeneral: string
}) {
  const qc = useQueryClient()

  const cambiarMut = useMutation({
    mutationFn: (subEstado: SubEstado) =>
      api.put(`/entregas/${entregaId}/subestado`, { subEstado }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mis-entregas'] })
      toast.success('Actividad actualizada')
    },
    onError: () => toast.error('Error al actualizar actividad'),
  })

  const curIdx = PASOS.findIndex(p => p.key === subEstadoActual)

  if (!['ASIGNADA', 'EN_RUTA'].includes(estadoGeneral)) return null

  return (
    <div className="bg-carbon-800 rounded-2xl p-4 space-y-4">
      <p className="text-xs text-carbon-400 font-medium uppercase tracking-wider">Actividad actual</p>

      {/* Stepper visual */}
      <div className="flex items-center justify-between">
        {PASOS.map((paso, i) => {
          const done = i < curIdx
          const active = i === curIdx
          return (
            <div key={paso.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => cambiarMut.mutate(paso.key)}
                  disabled={cambiarMut.isPending || (i > curIdx + 1)}
                  title={paso.desc}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all
                    ${active ? 'bg-amber-500 text-carbon-900 shadow-lg shadow-amber-500/30 scale-110' : ''}
                    ${done ? 'bg-emerald-500/20 text-emerald-400' : ''}
                    ${!active && !done ? 'bg-carbon-700 text-carbon-500' : ''}
                    ${i <= curIdx + 1 && !done && !active ? 'hover:bg-carbon-600 cursor-pointer' : ''}
                    disabled:cursor-not-allowed`}>
                  {paso.icon}
                </button>
                <span className={`text-xs text-center leading-tight
                  ${active ? 'text-amber-400 font-semibold' : done ? 'text-emerald-400' : 'text-carbon-600'}`}
                  style={{ fontSize: '10px' }}>
                  {paso.label}
                </span>
              </div>
              {i < PASOS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 -mt-4 rounded ${done ? 'bg-emerald-500/50' : 'bg-carbon-700'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Descripción del paso actual */}
      {curIdx >= 0 && (
        <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm
          ${curIdx === PASOS.length - 1 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/10 text-amber-300'}`}>
          <span className="text-lg">{PASOS[curIdx].icon}</span>
          <div>
            <p className="font-semibold">{PASOS[curIdx].label}</p>
            <p className="text-xs opacity-80">{PASOS[curIdx].desc}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Panel de subida de documentos ───────────────────────────────────────────

function DocumentosPanel({ entregaId, docs }: { entregaId: string; docs: any[] }) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [subiendo, setSubiendo] = useState(false)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setSubiendo(true)
    try {
      const form = new FormData()
      Array.from(files).forEach(f => form.append('archivos', f))
      await api.post(`/entregas/${entregaId}/documentos`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      qc.invalidateQueries({ queryKey: ['mis-entregas'] })
      toast.success(`${files.length} archivo(s) adjuntado(s)`)
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al subir')
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-2xl">📎</span>
        <div>
          <p className="text-white font-semibold text-sm">Adjuntar documentos</p>
          <p className="text-blue-300/80 text-xs">Acuse, remisión firmada, fotos de documentos</p>
        </div>
      </div>

      {/* Archivos ya adjuntos */}
      {docs.length > 0 && (
        <div className="space-y-1.5">
          {docs.map((d: any) => (
            <a key={d.id} href={`${import.meta.env.VITE_API_URL || ''}${d.url}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 bg-carbon-800/60 rounded-xl px-3 py-2 text-sm">
              <span>{d.tipo?.startsWith('image') ? '🖼' : '📄'}</span>
              <span className="text-white text-xs truncate flex-1">{d.nombre}</span>
              <span className="text-blue-400 text-xs">↗</span>
            </a>
          ))}
        </div>
      )}

      {/* Botón subir */}
      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/*,application/pdf"
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={subiendo}
        className="w-full flex items-center justify-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 active:bg-blue-500/40 text-blue-300 rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-50">
        {subiendo ? (
          <><span className="animate-spin">⏳</span> Subiendo…</>
        ) : (
          <><span>📂</span> Seleccionar archivos</>
        )}
      </button>
      <p className="text-xs text-carbon-500 text-center">PDF, JPG o PNG · máx. 10 MB por archivo</p>
    </div>
  )
}

// ─── Descarga de remisión ─────────────────────────────────────────────────────

function RemisionCard({ entregaId, remisionUrl }: { entregaId: string; remisionUrl?: string }) {
  if (!remisionUrl) return null
  return (
    <a
      href={`${import.meta.env.VITE_API_URL || ''}/api/entregas/${entregaId}/remision`}
      target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-3 bg-emerald-500/10 active:bg-emerald-500/20 border border-emerald-500/25 rounded-2xl px-4 py-3 transition-colors">
      <span className="text-2xl">📋</span>
      <div className="flex-1">
        <p className="text-white font-semibold text-sm">Remisión disponible</p>
        <p className="text-emerald-400/80 text-xs">Toca para descargar el formato Excel</p>
      </div>
      <span className="text-emerald-400 text-lg">⬇</span>
    </a>
  )
}

// ─── Filtro badge ─────────────────────────────────────────────────────────────

type Filtro = 'TODAS' | 'ACTIVAS' | 'COMPLETADAS' | 'INCIDENCIAS'

function Badge({ estado }: { estado: string }) {
  const cls: Record<string, string> = {
    PENDIENTE: 'bg-yellow-500/20 text-yellow-300',
    ASIGNADA: 'bg-blue-500/20 text-blue-300',
    EN_RUTA: 'bg-purple-500/20 text-purple-300',
    COMPLETADA: 'bg-green-500/20 text-green-300',
    RECHAZADA: 'bg-red-500/20 text-red-300',
    INCIDENCIA: 'bg-orange-500/20 text-orange-300',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${cls[estado] || ''}`}>
      {estado.replace('_', ' ')}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function MisEntregasPage() {
  const nav = useNavigate()
  const qc = useQueryClient()
  const { conductor } = useConductorStore()
  const [filtro, setFiltro] = useState<Filtro>('TODAS')
  const [expandida, setExpandida] = useState<string | null>(null)

  const { data: entregas = [] } = useQuery<Entrega[]>({
    queryKey: ['mis-entregas', conductor?.id],
    queryFn: async () => {
      const r = await api.get(`/conductores/${conductor!.id}/entregas`)
      return r.data.data
    },
    enabled: !!conductor,
    refetchInterval: 10_000,
  })

  const filtradas = entregas.filter((e) => {
    if (filtro === 'ACTIVAS') return ['ASIGNADA', 'EN_RUTA'].includes(e.estado)
    if (filtro === 'COMPLETADAS') return e.estado === 'COMPLETADA'
    if (filtro === 'INCIDENCIAS') return e.estado === 'INCIDENCIA'
    return true
  })

  const FILTROS: { key: Filtro; label: string; count?: number }[] = [
    { key: 'TODAS', label: 'Todas', count: entregas.length },
    { key: 'ACTIVAS', label: 'Activas', count: entregas.filter(e => ['ASIGNADA', 'EN_RUTA'].includes(e.estado)).length },
    { key: 'COMPLETADAS', label: 'Completadas' },
    { key: 'INCIDENCIAS', label: 'Incidencias' },
  ]

  return (
    <div className="p-4 space-y-4 pb-24">
      <h1 className="font-display font-bold text-xl text-white">Mis Entregas</h1>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTROS.map((f) => (
          <button key={f.key} onClick={() => setFiltro(f.key)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors
              ${filtro === f.key ? 'bg-amber-500 text-carbon-900' : 'bg-carbon-700 text-carbon-300'}`}>
            {f.label}
            {f.count !== undefined && f.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${filtro === f.key ? 'bg-carbon-900/30' : 'bg-carbon-600'}`}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtradas.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-2">📭</p>
          <p className="text-carbon-400">Sin entregas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map((e) => {
            const expanded = expandida === e.id
            const docs = (e as any).documentos ?? []
            const subEstado = (e as any).subEstado
            const remisionUrl = (e as any).remisionUrl
            const estaEnDocumentos = subEstado === 'ENTREGA_DOCUMENTOS'

            return (
              <div key={e.id} className="card space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2"
                  onClick={() => setExpandida(expanded ? null : e.id)}>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-amber-400 text-xs">{e.solicitud?.ot}</p>
                    <p className="font-semibold text-white truncate">{e.solicitud?.cliente}</p>
                    {e.solicitud?.descripcionCarga && (
                      <p className="text-xs text-carbon-400 mt-0.5 truncate">📦 {e.solicitud.descripcionCarga}</p>
                    )}
                    {e.solicitud?.direccionEntrega && (
                      <p className="text-xs text-carbon-400 truncate">📍 {e.solicitud.direccionEntrega}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge estado={e.estado} />
                    <span className="text-carbon-500 text-xs">{expanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Fecha */}
                <div className="flex items-center justify-between text-xs text-carbon-500">
                  {e.solicitud?.fechaEntrega && <span>🗓 {formatDate(e.solicitud.fechaEntrega)}</span>}
                  {docs.length > 0 && <span className="text-blue-400">📎 {docs.length} doc(s)</span>}
                  {e.evidencia && <span>📸 {(e.evidencia as any).fotos?.length || 0} fotos</span>}
                </div>

                {/* Acciones rápidas */}
                {e.estado === 'ASIGNADA' && (
                  <button
                    onClick={() => api.put(`/entregas/${e.id}/subestado`, { subEstado: 'EN_RUTA' })
                      .then(() => qc.invalidateQueries({ queryKey: ['mis-entregas'] }))}
                    className="btn-primary text-sm w-full">
                    🚛 Iniciar Ruta
                  </button>
                )}
                {e.estado === 'EN_RUTA' && (
                  <button onClick={() => nav(`/checklist/${e.id}`)} className="btn-primary text-sm w-full">
                    📋 Proceso de Entrega (Checklist)
                  </button>
                )}

                {/* Detalle expandido */}
                {expanded && (
                  <div className="space-y-3 pt-2 border-t border-carbon-700">

                    {/* Remisión */}
                    <RemisionCard entregaId={e.id} remisionUrl={remisionUrl} />

                    {/* Stepper de actividad */}
                    <ActividadStepper
                      entregaId={e.id}
                      subEstadoActual={subEstado}
                      estadoGeneral={e.estado}
                    />

                    {/* Panel de documentos — solo visible en ENTREGA_DOCUMENTOS */}
                    {estaEnDocumentos && (
                      <DocumentosPanel entregaId={e.id} docs={docs} />
                    )}

                    {/* Si hay docs pero no está en ese estado, mostrarlos de solo lectura */}
                    {!estaEnDocumentos && docs.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs text-carbon-400">📎 Documentos adjuntos</p>
                        {docs.map((d: any) => (
                          <a key={d.id} href={`${import.meta.env.VITE_API_URL || ''}${d.url}`} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-carbon-700/50 rounded-xl px-3 py-2 text-sm">
                            <span>{d.tipo?.startsWith('image') ? '🖼' : '📄'}</span>
                            <span className="text-white text-xs truncate">{d.nombre}</span>
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Motivo incidencia/rechazo */}
                    {e.motivo && (
                      <p className="text-xs text-orange-300 bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-2">
                        ℹ️ {e.motivo}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
