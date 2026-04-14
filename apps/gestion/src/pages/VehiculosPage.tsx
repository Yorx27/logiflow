import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { api } from '../lib/api'
import { toast } from '../stores/uiStore'
import { Modal } from '../components/ui/Modal'
import { VehBadge } from '../components/ui/StatoBadge'
import { formatCurrency } from '@logiflow/utils'
import type { Vehiculo } from '@logiflow/types'

const TIPO_ICONS: Record<string, string> = {
  TORTON: '🚛', RABON: '🚚', VAN: '🚐', PICKUP: '🛻', PLATAFORMA: '🏗',
}

export function VehiculosPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const { data: vehiculos = [], isLoading } = useQuery<Vehiculo[]>({
    queryKey: ['vehiculos'],
    queryFn: async () => { const r = await api.get('/vehiculos'); return r.data.data },
  })

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { placa: '', modelo: '', tipo: 'VAN', capacidad: '', costoKm: 10 },
  })

  const saveMut = useMutation({
    mutationFn: (d: any) => editId ? api.put(`/vehiculos/${editId}`, d) : api.post('/vehiculos', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehiculos'] })
      toast.success(editId ? 'Vehículo actualizado' : 'Vehículo creado')
      setOpen(false); reset(); setEditId(null)
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Error'),
  })

  function openEdit(v: Vehiculo) {
    reset({ placa: v.placa, modelo: v.modelo, tipo: v.tipo, capacidad: v.capacidad, costoKm: v.costoKm })
    setEditId(v.id)
    setOpen(true)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Vehículos</h1>
          <p className="text-carbon-400 text-sm">{vehiculos.length} registros</p>
        </div>
        <button className="btn-primary text-sm" onClick={() => { reset(); setEditId(null); setOpen(true) }}>+ Nuevo Vehículo</button>
      </div>

      {isLoading ? (
        <p className="text-carbon-500 text-center py-10">Cargando...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehiculos.map((v) => {
            const borderColor = v.estado === 'DISPONIBLE' ? 'border-green-500/30' : v.estado === 'EN_RUTA' ? 'border-purple-500/30' : 'border-orange-500/30'
            return (
              <div key={v.id} className={`card border-2 ${borderColor} flex flex-col gap-3`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{TIPO_ICONS[v.tipo] || '🚗'}</div>
                    <div>
                      <p className="font-semibold text-white font-mono">{v.placa}</p>
                      <p className="text-xs text-carbon-400">{v.modelo}</p>
                    </div>
                  </div>
                  <VehBadge estado={v.estado} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-carbon-700/50 rounded-lg p-2 text-center">
                    <p className="text-carbon-500">Tipo</p>
                    <p className="text-white font-medium">{v.tipo}</p>
                  </div>
                  <div className="bg-carbon-700/50 rounded-lg p-2 text-center">
                    <p className="text-carbon-500">Capacidad</p>
                    <p className="text-white font-medium">{v.capacidad}</p>
                  </div>
                  <div className="bg-carbon-700/50 rounded-lg p-2 text-center">
                    <p className="text-carbon-500">$/km</p>
                    <p className="text-amber-400 font-medium">{formatCurrency(v.costoKm)}</p>
                  </div>
                </div>
                <div className="flex justify-end pt-1 border-t border-carbon-700">
                  {v.estado !== 'EN_RUTA' && (
                    <button onClick={() => openEdit(v)} className="text-xs px-2 py-1 bg-carbon-700 hover:bg-carbon-600 rounded">✏️ Editar</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editId ? 'Editar Vehículo' : 'Nuevo Vehículo'} size="sm">
        <form onSubmit={handleSubmit((d) => saveMut.mutate({ ...d, costoKm: Number(d.costoKm) }))} className="p-5 space-y-4">
          <div>
            <label className="label">Placa *</label>
            <input {...register('placa', { required: true })} className="input" placeholder="ABC-123-MX" />
          </div>
          <div>
            <label className="label">Modelo *</label>
            <input {...register('modelo', { required: true })} className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tipo *</label>
              <select {...register('tipo')} className="input">
                {['TORTON', 'RABON', 'VAN', 'PICKUP', 'PLATAFORMA'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Capacidad</label>
              <input {...register('capacidad')} className="input" placeholder="10 ton" />
            </div>
          </div>
          <div>
            <label className="label">Costo por km (MXN)</label>
            <input type="number" step="0.01" {...register('costoKm')} className="input" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost text-sm" onClick={() => setOpen(false)}>Cancelar</button>
            <button type="submit" disabled={saveMut.isPending} className="btn-primary text-sm">
              {saveMut.isPending ? 'Guardando...' : editId ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
