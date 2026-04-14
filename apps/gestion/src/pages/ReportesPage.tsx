import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { api } from '../lib/api'
import { toast } from '../stores/uiStore'
import { formatCurrency } from '@logiflow/utils'
import type { ReporteItem } from '@logiflow/types'

const TIPOS_REPORTE = [
  { value: 'solicitudes', label: 'Solicitudes por Estado' },
  { value: 'conductores', label: 'Desempeño por Conductor' },
  { value: 'facturacion', label: 'Facturación del Período' },
  { value: 'incidencias', label: 'Incidencias' },
]

const COLORS = ['#f59e0b', '#8b5cf6', '#22c55e', '#ef4444', '#3b82f6', '#f97316']

export function ReportesPage() {
  const [tipoReporte, setTipoReporte] = useState('solicitudes')
  const [tipoSol, setTipoSol] = useState('')
  const [ini, setIni] = useState('')
  const [fin, setFin] = useState('')
  const [enabled, setEnabled] = useState(false)

  const { data, isFetching } = useQuery<{ data: ReporteItem[]; total?: number }>({
    queryKey: ['reporte', tipoReporte, tipoSol, ini, fin, enabled],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (ini) params.set('ini', ini)
      if (fin) params.set('fin', fin)
      if (tipoSol && tipoReporte === 'solicitudes') params.set('tipo', tipoSol)
      const r = await api.get(`/reportes/${tipoReporte}?${params}`)
      return r.data
    },
    enabled,
  })

  function handleGenerar() { setEnabled(true) }

  async function exportExcel() {
    const params = new URLSearchParams()
    if (ini) params.set('ini', ini)
    if (fin) params.set('fin', fin)
    if (tipoSol) params.set('tipo', tipoSol)
    window.open(`/api/reportes/export/excel?${params}`, '_blank')
    toast.info('Exportando Excel...')
  }

  const rows = data?.data || []
  const total = rows.reduce((s, r) => s + r.value, 0)

  return (
    <div className="space-y-5">
      <h1 className="font-display font-bold text-2xl text-white">Reportes</h1>

      {/* Config */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="label">Tipo de Reporte</label>
            <select value={tipoReporte} onChange={(e) => { setTipoReporte(e.target.value); setEnabled(false) }} className="input text-sm">
              {TIPOS_REPORTE.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          {tipoReporte === 'solicitudes' && (
            <div>
              <label className="label">Tipo Solicitud</label>
              <select value={tipoSol} onChange={(e) => setTipoSol(e.target.value)} className="input text-sm">
                <option value="">Todos</option>
                {['DISTRIBUCION', 'RECOLECCION', 'TRANSFERENCIA', 'ULTIMA_MILLA'].map((t) => (
                  <option key={t} value={t}>{t.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label">Fecha Inicio</label>
            <input type="date" value={ini} onChange={(e) => setIni(e.target.value)} className="input text-sm" />
          </div>
          <div>
            <label className="label">Fecha Fin</label>
            <input type="date" value={fin} onChange={(e) => setFin(e.target.value)} className="input text-sm" />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={handleGenerar} disabled={isFetching} className="btn-primary text-sm">
            {isFetching ? 'Generando...' : '📊 Generar Reporte'}
          </button>
          {rows.length > 0 && (
            <button onClick={exportExcel} className="btn-ghost text-sm">📥 Exportar Excel</button>
          )}
        </div>
      </div>

      {/* Results */}
      {rows.length > 0 && (
        <>
          {data?.total !== undefined && (
            <div className="card">
              <p className="text-sm text-carbon-400">Total del período</p>
              <p className="font-display font-bold text-2xl text-amber-400">{formatCurrency(data.total)}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Table */}
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-carbon-700/50">
                  <tr className="text-carbon-400 text-xs">
                    <th className="text-left px-4 py-3">Concepto</th>
                    <th className="text-right px-4 py-3">Valor</th>
                    <th className="text-right px-4 py-3">%</th>
                    <th className="text-left px-4 py-3">Extra</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-t border-carbon-700/50 table-row-hover">
                      <td className="px-4 py-2.5 font-medium">{r.label}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-amber-400">{tipoReporte === 'facturacion' ? formatCurrency(r.value) : r.value}</td>
                      <td className="px-4 py-2.5 text-right text-carbon-400 text-xs">{total ? Math.round((r.value / total) * 100) : 0}%</td>
                      <td className="px-4 py-2.5 text-xs text-carbon-400 max-w-[200px] truncate">{r.extra || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Chart */}
            <div className="card">
              <h3 className="font-semibold text-sm text-carbon-300 mb-4">Visualización</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={rows} margin={{ top: 0, right: 0, left: -20, bottom: 20 }}>
                  <XAxis dataKey="label" tick={{ fill: '#9898a8', fontSize: 10 }} angle={-30} textAnchor="end" />
                  <YAxis tick={{ fill: '#9898a8', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: '#1e1e28', border: '1px solid #2e2e3a', borderRadius: 8 }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {rows.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {enabled && rows.length === 0 && !isFetching && (
        <div className="card text-center py-10 text-carbon-500">
          Sin datos para el período seleccionado
        </div>
      )}
    </div>
  )
}
