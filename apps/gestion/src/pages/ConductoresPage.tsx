import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { api } from '../lib/api'
import { toast } from '../stores/uiStore'
import { Modal } from '../components/ui/Modal'
import { CondBadge } from '../components/ui/StatoBadge'
import type { Conductor } from '@logiflow/types'

export function ConductoresPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const { data: conductores = [], isLoading } = useQuery<Conductor[]>({
    queryKey: ['conductores'],
    queryFn: async () => { const r = await api.get('/conductores'); return r.data.data },
  })

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { nombre: '', telefono: '', licencia: '' },
  })

  const saveMut = useMutation({
    mutationFn: (d: any) => editId ? api.put(`/conductores/${editId}`, d) : api.post('/conductores', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conductores'] })
      toast.success(editId ? 'Conductor actualizado' : 'Conductor creado')
      setOpen(false); reset(); setEditId(null)
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Error'),
  })

  const estadoMut = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: string }) => api.put(`/conductores/${id}/estado`, { estado }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['conductores'] }); toast.success('Estado actualizado') },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Error'),
  })

  function openEdit(c: Conductor) {
    reset({ nombre: c.nombre, telefono: c.telefono || '', licencia: c.licencia })
    setEditId(c.id)
    setOpen(true)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Conductores</h1>
          <p className="text-carbon-400 text-sm">{conductores.length} registros</p>
        </div>
        <button className="btn-primary text-sm" onClick={() => { reset(); setEditId(null); setOpen(true) }}>+ Nuevo Conductor</button>
      </div>

      {isLoading ? (
        <p className="text-carbon-500 text-center py-10">Cargando...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {conductores.map((c) => (
            <div key={c.id} className="card flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-amber-500/15 border border-amber-500/30 rounded-full flex items-center justify-center text-amber-400 font-bold text-lg">
                    {c.nombre.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{c.nombre}</p>
                    <p className="text-xs text-carbon-400 font-mono">{c.licencia}</p>
                  </div>
                </div>
                <CondBadge estado={c.estado} />
              </div>

              {c.telefono && (
                <p className="text-sm text-carbon-400">📞 {c.telefono}</p>
              )}

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-carbon-700">
                <div className="text-xs text-carbon-400">
                  {(c as any)._count?.entregas ?? 0} entregas totales
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(c)} className="text-xs px-2 py-1 bg-carbon-700 hover:bg-carbon-600 rounded">✏️ Editar</button>
                  {c.estado !== 'EN_RUTA' && (
                    <button
                      onClick={() => estadoMut.mutate({ id: c.id, estado: c.estado === 'DISPONIBLE' ? 'INACTIVO' : 'DISPONIBLE' })}
                      className={`text-xs px-2 py-1 rounded ${c.estado === 'DISPONIBLE' ? 'bg-red-500/20 text-red-300 hover:bg-red-500/40' : 'bg-green-500/20 text-green-300 hover:bg-green-500/40'}`}
                    >
                      {c.estado === 'DISPONIBLE' ? 'Desactivar' : 'Activar'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editId ? 'Editar Conductor' : 'Nuevo Conductor'} size="sm">
        <form onSubmit={handleSubmit((d) => saveMut.mutate(d))} className="p-5 space-y-4">
          <div>
            <label className="label">Nombre *</label>
            <input {...register('nombre', { required: true })} className="input" />
          </div>
          <div>
            <label className="label">Licencia *</label>
            <input {...register('licencia', { required: true })} className="input" placeholder="MX-001-2024" />
          </div>
          <div>
            <label className="label">Teléfono</label>
            <input {...register('telefono')} className="input" placeholder="+52 55 1234-5678" />
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
