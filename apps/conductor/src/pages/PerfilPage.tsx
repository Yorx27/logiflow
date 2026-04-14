import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useConductorStore } from '../stores/conductorStore'
import { formatDate } from '@logiflow/utils'
import type { Entrega } from '@logiflow/types'

export function PerfilPage() {
  const nav = useNavigate()
  const { conductor, logout } = useConductorStore()

  const { data: entregas = [] } = useQuery<Entrega[]>({
    queryKey: ['mis-entregas', conductor?.id],
    queryFn: async () => { const r = await api.get(`/conductores/${conductor!.id}/entregas`); return r.data.data },
    enabled: !!conductor,
  })

  const completadas = entregas.filter((e) => e.estado === 'COMPLETADA').length
  const incidencias = entregas.filter((e) => e.estado === 'INCIDENCIA').length
  const enRuta = entregas.find((e) => e.estado === 'EN_RUTA')
  const tasa = entregas.length ? Math.round((completadas / entregas.length) * 100) : 0

  function handleLogout() {
    logout()
    nav('/login', { replace: true })
  }

  return (
    <div className="p-4 space-y-4">
      {/* Avatar */}
      <div className="card flex flex-col items-center gap-3 text-center py-6">
        <div className="w-20 h-20 bg-amber-500/20 border-2 border-amber-500/40 rounded-full flex items-center justify-center text-amber-400 font-bold text-3xl">
          {conductor?.nombre.charAt(0)}
        </div>
        <div>
          <h2 className="font-display font-bold text-xl text-white">{conductor?.nombre}</h2>
          <p className="font-mono text-carbon-400 text-sm">{conductor?.licencia}</p>
          <span className={`inline-flex items-center gap-1 text-xs font-semibold mt-2 px-3 py-1 rounded-full
            ${conductor?.estado === 'DISPONIBLE' ? 'bg-green-500/20 text-green-300' : 'bg-purple-500/20 text-purple-300'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {conductor?.estado?.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          ['Entregas', entregas.length, 'text-white'],
          ['Completadas', completadas, 'text-green-400'],
          ['Tasa éxito', `${tasa}%`, 'text-amber-400'],
        ].map(([l, v, c]) => (
          <div key={String(l)} className="card">
            <p className={`font-display font-bold text-xl ${c}`}>{v}</p>
            <p className="text-xs text-carbon-400">{l}</p>
          </div>
        ))}
      </div>

      {/* Info */}
      {conductor?.telefono && (
        <div className="card">
          <p className="text-carbon-400 text-xs mb-1">Teléfono</p>
          <p className="text-white">📞 {conductor.telefono}</p>
        </div>
      )}

      {/* Vehículo */}
      {enRuta?.vehiculo && (
        <div className="card">
          <p className="text-carbon-400 text-xs mb-2">Vehículo asignado</p>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚚</span>
            <div>
              <p className="font-semibold text-white font-mono">{enRuta.vehiculo.placa}</p>
              <p className="text-xs text-carbon-400">{enRuta.vehiculo.tipo} · {enRuta.vehiculo.modelo}</p>
            </div>
          </div>
        </div>
      )}

      {incidencias > 0 && (
        <div className="card bg-orange-500/5 border-orange-500/20">
          <p className="text-orange-300 text-sm">⚠️ {incidencias} incidencia{incidencias > 1 ? 's' : ''} registrada{incidencias > 1 ? 's' : ''}</p>
        </div>
      )}

      <button onClick={handleLogout} className="btn-danger">🚪 Cerrar Sesión</button>
    </div>
  )
}
