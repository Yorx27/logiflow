import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useConductorStore } from '../stores/conductorStore'
import { toast } from '../stores/toastStore'
import { formatDate, formatCurrency } from '@logiflow/utils'
import type { Entrega } from '@logiflow/types'

function SolBadgeMini({ estado }: { estado: string }) {
  const cls: Record<string, string> = {
    PENDIENTE: 'bg-yellow-500/20 text-yellow-300', ASIGNADA: 'bg-blue-500/20 text-blue-300',
    EN_RUTA: 'bg-purple-500/20 text-purple-300', COMPLETADA: 'bg-green-500/20 text-green-300',
    RECHAZADA: 'bg-red-500/20 text-red-300', INCIDENCIA: 'bg-orange-500/20 text-orange-300',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cls[estado] || 'bg-carbon-700 text-carbon-400'}`}>
      {estado.replace('_', ' ')}
    </span>
  )
}

export function InicioPage() {
  const nav = useNavigate()
  const qc = useQueryClient()
  const { conductor } = useConductorStore()

  const { data: entregas = [] } = useQuery<Entrega[]>({
    queryKey: ['mis-entregas', conductor?.id],
    queryFn: async () => { const r = await api.get(`/conductores/${conductor!.id}/entregas`); return r.data.data },
    enabled: !!conductor,
    refetchInterval: 15_000,
  })

  const enCurso = entregas.find((e) => e.estado === 'EN_RUTA')
  const asignadas = entregas.filter((e) => e.estado === 'ASIGNADA')
  const completadas = entregas.filter((e) => e.estado === 'COMPLETADA')
  const incidencias = entregas.filter((e) => e.estado === 'INCIDENCIA')

  const iniciarRutaMut = useMutation({
    mutationFn: (id: string) => api.put(`/entregas/${id}/estado`, { estado: 'EN_RUTA' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mis-entregas'] }); toast.success('¡Ruta iniciada!') },
    onError: () => toast.error('Error al iniciar ruta'),
  })

  const incidenciaMut = useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) =>
      api.put(`/entregas/${id}/estado`, { estado: 'INCIDENCIA', motivo }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mis-entregas'] }); toast.warning('Incidencia reportada') },
    onError: () => toast.error('Error al reportar incidencia'),
  })

  const rechazarMut = useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) =>
      api.put(`/entregas/${id}/estado`, { estado: 'RECHAZADA', motivo }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mis-entregas'] }); toast.info('Entrega rechazada') },
    onError: () => toast.error('Error'),
  })

  function handleIncidencia(entrega: Entrega) {
    const motivo = prompt('Describe la incidencia:')
    if (motivo) incidenciaMut.mutate({ id: entrega.id, motivo })
  }

  function handleRechazar(entrega: Entrega) {
    const motivo = prompt('Motivo del rechazo:')
    if (motivo) rechazarMut.mutate({ id: entrega.id, motivo })
  }

  return (
    <div className="p-4 space-y-4">
      {/* Hero card */}
      <div className="card bg-gradient-to-br from-amber-500/10 to-carbon-800 border-amber-500/20">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-amber-500/20 border-2 border-amber-500/40 rounded-full flex items-center justify-center text-amber-400 font-bold text-2xl flex-shrink-0">
            {conductor?.nombre.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-xl text-white truncate">{conductor?.nombre}</p>
            <p className="text-xs font-mono text-carbon-400">{conductor?.licencia}</p>
            <span className={`inline-flex items-center gap-1 text-xs font-semibold mt-1 px-2 py-0.5 rounded-full
              ${conductor?.estado === 'DISPONIBLE' ? 'bg-green-500/20 text-green-300' : 'bg-purple-500/20 text-purple-300'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {conductor?.estado?.replace('_', ' ')}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4 text-center">
          {[['Activas', asignadas.length + (enCurso ? 1 : 0), 'text-purple-400'],
            ['Completadas', completadas.length, 'text-green-400'],
            ['Incidencias', incidencias.length, 'text-orange-400']].map(([l, v, c]) => (
            <div key={String(l)} className="bg-carbon-700/50 rounded-xl py-2">
              <p className={`font-display font-bold text-xl ${c}`}>{v}</p>
              <p className="text-carbon-500 text-xs">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* En Curso */}
      {enCurso && (
        <div className="card border-2 border-amber-500/40 bg-amber-500/5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-400 rounded-full pulse-amber flex-shrink-0" />
            <h3 className="font-display font-bold text-amber-400">Entrega en Curso</h3>
          </div>
          <div>
            <p className="font-semibold text-white text-lg">{enCurso.solicitud?.cliente}</p>
            {enCurso.solicitud?.direccionEntrega && (
              <p className="text-sm text-carbon-400 mt-0.5">📍 {enCurso.solicitud.direccionEntrega}</p>
            )}
            {enCurso.solicitud?.descripcionCarga && (
              <p className="text-sm text-carbon-300 mt-1">📦 {enCurso.solicitud.descripcionCarga}</p>
            )}
            {enCurso.solicitud?.fechaEntrega && (
              <p className="text-xs text-carbon-400 mt-1">🗓 {formatDate(enCurso.solicitud.fechaEntrega)}{enCurso.solicitud.horaEntrega ? ` · ${enCurso.solicitud.horaEntrega}` : ''}</p>
            )}
            {enCurso.solicitud?.distanciaKm && (
              <p className="text-xs text-carbon-400">🗺 {enCurso.solicitud.distanciaKm} km · {enCurso.solicitud.tiempoRuta}</p>
            )}
          </div>
          {enCurso.evidencia && (
            <p className="text-xs text-carbon-400">📸 {enCurso.evidencia.fotos?.length || 0} fotos registradas</p>
          )}
          <button onClick={() => nav(`/checklist/${enCurso.id}`)} className="btn-primary">
            📋 Proceso de Entrega
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleIncidencia(enCurso)} className="btn-warning text-sm">⚠️ Incidencia</button>
            <button onClick={() => handleRechazar(enCurso)} className="btn-danger text-sm">❌ Rechazar</button>
          </div>
        </div>
      )}

      {/* Asignadas */}
      {asignadas.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-carbon-300 text-sm">Entregas Asignadas</h3>
          {asignadas.map((e) => (
            <div key={e.id} className="card space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-amber-400 text-xs">{e.solicitud?.ot}</p>
                  <p className="font-semibold text-white">{e.solicitud?.cliente}</p>
                  {e.solicitud?.descripcionCarga && <p className="text-xs text-carbon-400 mt-0.5">{e.solicitud.descripcionCarga}</p>}
                </div>
                <SolBadgeMini estado={e.estado} />
              </div>
              {e.solicitud?.fechaEntrega && (
                <p className="text-xs text-carbon-400">🗓 {formatDate(e.solicitud.fechaEntrega)}</p>
              )}
              {(e.solicitud?.costo ?? 0) > 0 && (
                <p className="text-xs text-carbon-400">💰 {formatCurrency(e.solicitud!.costo)}</p>
              )}
              <button
                onClick={() => iniciarRutaMut.mutate(e.id)}
                disabled={iniciarRutaMut.isPending}
                className="btn-primary text-sm"
              >
                🚀 Iniciar Ruta
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Últimas completadas */}
      {completadas.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-carbon-300 text-sm">Últimas Completadas</h3>
          {completadas.slice(0, 3).map((e) => (
            <div key={e.id} className="card flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-mono text-amber-400 text-xs">{e.solicitud?.ot}</p>
                <p className="text-sm text-white">{e.solicitud?.cliente}</p>
              </div>
              <div className="text-right">
                <SolBadgeMini estado={e.estado} />
                {e.evidencia && <p className="text-xs text-carbon-500 mt-1">{e.evidencia.fotos?.length || 0} fotos</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {entregas.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-carbon-400">Sin entregas asignadas</p>
        </div>
      )}
    </div>
  )
}
