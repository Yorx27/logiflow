import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { api } from '../lib/api'
import { toast } from '../stores/uiStore'
import { Modal } from '../components/ui/Modal'
import { FactBadge } from '../components/ui/StatoBadge'
import { formatCurrency, formatDate } from '@logiflow/utils'
import type { Factura, Solicitud } from '@logiflow/types'

export function FacturacionPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [gastos, setGastos] = useState(0)

  const { data: facturas = [], isLoading } = useQuery<Factura[]>({
    queryKey: ['facturas'],
    queryFn: async () => { const r = await api.get('/facturas'); return r.data.data },
  })

  const { data: solicitudes = [] } = useQuery<Solicitud[]>({
    queryKey: ['solicitudes-all'],
    queryFn: async () => { const r = await api.get('/solicitudes?mostrarCompletadas=true'); return r.data.data },
  })

  const { register, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: { numero: '', cliente: '', solicitudId: '', subtotal: 0, gastosAdic: 0 },
  })

  const subtotal = watch('subtotal') || 0
  const iva = subtotal * 0.16
  const total = subtotal + iva + (gastos || 0)

  const saveMut = useMutation({
    mutationFn: (d: any) => api.post('/facturas', { ...d, gastosAdic: gastos }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['facturas'] }); toast.success('Factura creada'); setOpen(false); reset(); setGastos(0) },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Error'),
  })

  const estadoMut = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: string }) => api.put(`/facturas/${id}/estado`, { estado }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['facturas'] }); toast.success('Estado actualizado') },
    onError: () => toast.error('Error'),
  })

  function handleSolChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const sol = solicitudes.find((s) => s.id === e.target.value)
    if (sol) {
      setValue('cliente', sol.cliente)
      setValue('subtotal', sol.costo)
    }
  }

  function descargarPDF(id: string, numero: string) {
    window.open(`/api/facturas/${id}/pdf`, '_blank')
    toast.info(`Descargando ${numero}.pdf`)
  }

  const totales = facturas.reduce((acc, f) => {
    const t = f.subtotal + f.subtotal * 0.16 + f.gastosAdic
    return { ...acc, total: acc.total + t }
  }, { total: 0 })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Facturación</h1>
          <p className="text-carbon-400 text-sm">{facturas.length} facturas · Total: {formatCurrency(totales.total)}</p>
        </div>
        <button className="btn-primary text-sm" onClick={() => { reset(); setGastos(0); setOpen(true) }}>+ Nueva Factura</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-carbon-700/50">
              <tr className="text-carbon-400 text-xs">
                {['Número', 'Cliente', 'OT', 'Subtotal', 'IVA 16%', 'Gastos', 'Total', 'Estado', 'Fecha', 'Acciones'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-carbon-500">Cargando...</td></tr>
              ) : facturas.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-carbon-500">Sin facturas</td></tr>
              ) : facturas.map((f) => {
                const iva = f.subtotal * 0.16
                const tot = f.subtotal + iva + f.gastosAdic
                return (
                  <tr key={f.id} className="border-t border-carbon-700/50 table-row-hover">
                    <td className="px-4 py-3 font-mono text-amber-400 text-xs">{f.numero}</td>
                    <td className="px-4 py-3">{f.cliente}</td>
                    <td className="px-4 py-3 text-carbon-400 text-xs">{(f as any).solicitud?.ot || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{formatCurrency(f.subtotal)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-carbon-400">{formatCurrency(iva)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-carbon-400">{formatCurrency(f.gastosAdic)}</td>
                    <td className="px-4 py-3 font-mono text-xs font-bold">{formatCurrency(tot)}</td>
                    <td className="px-4 py-3"><FactBadge estado={f.estado} /></td>
                    <td className="px-4 py-3 text-carbon-400 text-xs">{formatDate(f.fecha)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <select
                          defaultValue={f.estado}
                          onChange={(e) => estadoMut.mutate({ id: f.id, estado: e.target.value })}
                          className="text-xs bg-carbon-700 border border-carbon-600 rounded px-1 py-0.5"
                        >
                          {['BORRADOR', 'EMITIDA', 'PAGADA', 'CANCELADA'].map((e) => <option key={e} value={e}>{e}</option>)}
                        </select>
                        <button onClick={() => descargarPDF(f.id, f.numero)} className="text-xs px-2 py-1 bg-carbon-700 hover:bg-carbon-600 rounded" title="Descargar PDF">📄</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva Factura" size="md">
        <form onSubmit={handleSubmit((d) => saveMut.mutate(d))} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Número *</label>
              <input {...register('numero', { required: true })} className="input" placeholder="FAC-2024-001" />
            </div>
            <div>
              <label className="label">Vincular OT</label>
              <select {...register('solicitudId')} className="input" onChange={handleSolChange}>
                <option value="">Sin vincular</option>
                {solicitudes.map((s) => <option key={s.id} value={s.id}>{s.ot} — {s.cliente}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Cliente *</label>
            <input {...register('cliente', { required: true })} className="input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Subtotal (MXN)</label>
              <input type="number" step="0.01" {...register('subtotal', { valueAsNumber: true })} className="input" />
            </div>
            <div>
              <label className="label">Gastos Adicionales</label>
              <input type="number" step="0.01" value={gastos} onChange={(e) => setGastos(Number(e.target.value))} className="input" />
            </div>
          </div>
          <div className="bg-carbon-700/50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-carbon-400">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-carbon-400">IVA 16%</span><span>{formatCurrency(iva)}</span></div>
            <div className="flex justify-between"><span className="text-carbon-400">Gastos adic.</span><span>{formatCurrency(gastos)}</span></div>
            <div className="flex justify-between font-bold border-t border-carbon-600 pt-2"><span>Total</span><span className="text-amber-400">{formatCurrency(total)}</span></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost text-sm" onClick={() => setOpen(false)}>Cancelar</button>
            <button type="submit" disabled={saveMut.isPending} className="btn-primary text-sm">{saveMut.isPending ? 'Creando...' : 'Crear Factura'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
