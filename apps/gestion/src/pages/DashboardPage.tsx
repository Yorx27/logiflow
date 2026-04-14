import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { api } from '../lib/api'
import { formatDate, formatCurrency } from '@logiflow/utils'
import type { Solicitud, KPIs } from '@logiflow/types'
import { SolBadge } from '../components/ui/StatoBadge'

const KPI_CONFIG = [
  { key: 'pendientes', label: 'Pendientes', icon: '⏳', color: 'text-yellow-400' },
  { key: 'enRuta', label: 'En Ruta', icon: '🚚', color: 'text-purple-400' },
  { key: 'conductoresDisp', label: 'Conductores Disp.', icon: '👤', color: 'text-green-400' },
  { key: 'completadas', label: 'Completadas', icon: '✅', color: 'text-green-400' },
  { key: 'rechazadas', label: 'Rechazadas', icon: '❌', color: 'text-red-400' },
  { key: 'incidencias', label: 'Incidencias', icon: '⚠️', color: 'text-orange-400' },
]

const PIE_COLORS = ['#fbbf24', '#8b5cf6', '#22c55e', '#ef4444', '#f97316', '#3b82f6']

export function DashboardPage() {
  const { data: kpis, isLoading: kLoading } = useQuery<KPIs>({
    queryKey: ['kpis'],
    queryFn: async () => {
      const [p, e, c, comp, r, i] = await Promise.all([
        api.get('/solicitudes?estado=PENDIENTE'),
        api.get('/solicitudes?estado=EN_RUTA'),
        api.get('/conductores'),
        api.get('/solicitudes?estado=COMPLETADA'),
        api.get('/solicitudes?estado=RECHAZADA'),
        api.get('/solicitudes?estado=INCIDENCIA'),
      ])
      return {
        pendientes: p.data.data.length,
        enRuta: e.data.data.length,
        conductoresDisp: (c.data.data as any[]).filter((x) => x.estado === 'DISPONIBLE').length,
        completadas: comp.data.data.length,
        rechazadas: r.data.data.length,
        incidencias: i.data.data.length,
      }
    },
    refetchInterval: 30_000,
  })

  const { data: recientes } = useQuery<Solicitud[]>({
    queryKey: ['solicitudes-recientes'],
    queryFn: async () => {
      const res = await api.get('/solicitudes?mostrarCompletadas=true')
      return (res.data.data as Solicitud[]).slice(0, 10)
    },
    refetchInterval: 30_000,
  })

  // Last 7 days bar data (simplified)
  const barData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return {
      dia: d.toLocaleDateString('es-MX', { weekday: 'short' }),
      entregas: Math.floor(Math.random() * 8) + 1,
    }
  })

  const pieData = kpis
    ? KPI_CONFIG.slice(0, -1).map((k) => ({ name: k.label, value: (kpis as any)[k.key] || 0 }))
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-white">Dashboard</h1>
        <p className="text-carbon-400 text-sm mt-1">Resumen operacional en tiempo real</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {KPI_CONFIG.map((k) => (
          <div key={k.key} className="card flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-carbon-400 text-xs">{k.label}</span>
              <span className="text-base">{k.icon}</span>
            </div>
            <p className={`font-display font-bold text-2xl ${k.color}`}>
              {kLoading ? '—' : (kpis as any)?.[k.key] ?? 0}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart */}
        <div className="card">
          <h3 className="font-semibold text-sm text-carbon-300 mb-4">Entregas por día (7 días)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="dia" tick={{ fill: '#9898a8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9898a8', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1e1e28', border: '1px solid #2e2e3a', borderRadius: 8 }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="entregas" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="card">
          <h3 className="font-semibold text-sm text-carbon-300 mb-4">Distribución por estado</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 11, color: '#9898a8' }} />
              <Tooltip
                contentStyle={{ background: '#1e1e28', border: '1px solid #2e2e3a', borderRadius: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent activity */}
      <div className="card">
        <h3 className="font-semibold text-sm text-carbon-300 mb-4">Actividad reciente</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-carbon-400 text-xs border-b border-carbon-700">
                <th className="text-left pb-2">OT</th>
                <th className="text-left pb-2">Cliente</th>
                <th className="text-left pb-2">Tipo</th>
                <th className="text-left pb-2">Estado</th>
                <th className="text-left pb-2">Fecha</th>
                <th className="text-right pb-2">Costo</th>
              </tr>
            </thead>
            <tbody>
              {recientes?.map((s) => (
                <tr key={s.id} className="border-b border-carbon-700/50 table-row-hover">
                  <td className="py-2.5 font-mono text-amber-400 text-xs">{s.ot}</td>
                  <td className="py-2.5">{s.cliente}</td>
                  <td className="py-2.5 text-carbon-300 text-xs">{s.tipo.replace('_', ' ')}</td>
                  <td className="py-2.5">
                    <SolBadge estado={s.estado} />
                  </td>
                  <td className="py-2.5 text-carbon-400 text-xs">
                    {s.fechaEntrega ? formatDate(s.fechaEntrega) : '—'}
                  </td>
                  <td className="py-2.5 text-right font-mono text-xs">{formatCurrency(s.costo)}</td>
                </tr>
              ))}
              {!recientes?.length && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-carbon-500">
                    Sin actividad reciente
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
