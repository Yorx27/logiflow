import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { api } from '../lib/api'
import { useConductorStore } from '../stores/conductorStore'
import { toast } from '../stores/toastStore'
import { formatCurrency } from '@logiflow/utils'

const ESTADO_COLOR: Record<string, string> = {
  PENDIENTE: 'bg-yellow-500/20 text-yellow-300',
  APROBADO:  'bg-green-500/20 text-green-300',
  RECHAZADO: 'bg-red-500/20 text-red-300',
}

const CATEGORIAS = [
  { key: 'estacionamiento', label: 'Estacionamiento', icon: '🅿️' },
  { key: 'gasolina',        label: 'Gasolina',        icon: '⛽' },
  { key: 'tag',             label: 'TAG',             icon: '🏷️' },
  { key: 'casetas',         label: 'Casetas',         icon: '🛣️' },
  { key: 'comidas',         label: 'Comidas',         icon: '🍽️' },
  { key: 'otros',           label: 'Otros',           icon: '📦' },
]

interface GastoForm {
  estacionamiento: number
  gasolina: number
  tag: number
  casetas: number
  comidas: number
  otros: number
  otrosDesc: string
  observaciones: string
}

export function GastosPage() {
  const qc = useQueryClient()
  const { conductor } = useConductorStore()
  const [showForm, setShowForm] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [uploadCat, setUploadCat] = useState('otros')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, reset, watch } = useForm<GastoForm>({
    defaultValues: {
      estacionamiento: 0, gasolina: 0, tag: 0,
      casetas: 0, comidas: 0, otros: 0,
      otrosDesc: '', observaciones: '',
    },
  })

  const valores = watch()
  const totalActual = (valores.estacionamiento || 0) + (valores.gasolina || 0) + (valores.tag || 0) +
                      (valores.casetas || 0) + (valores.comidas || 0) + (valores.otros || 0)

  const { data: gastos = [], isLoading } = useQuery({
    queryKey: ['mis-gastos', conductor?.id],
    queryFn: () => api.get(`/gastos/conductor?conductorId=${conductor!.id}`).then(r => r.data.data),
    enabled: !!conductor,
    refetchInterval: 30_000,
  })

  const saveMut = useMutation({
    mutationFn: (data: any) => api.post('/gastos/conductor', data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['mis-gastos'] })
      toast.success('Gastos registrados')
      reset()
      setShowForm(false)
    },
    onError: () => toast.error('Error al guardar'),
  })

  const uploadMut = useMutation({
    mutationFn: ({ id, files, categoria }: { id: string; files: FileList; categoria: string }) => {
      const fd = new FormData()
      Array.from(files).forEach(f => fd.append('archivos', f))
      fd.append('categoria', categoria)
      return api.post(`/gastos/conductor/${id}/archivos`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mis-gastos'] })
      toast.success('Archivo(s) subido(s)')
      setUploadingId(null)
    },
    onError: () => toast.error('Error al subir archivo'),
  })

  function onSubmit(data: GastoForm) {
    if (!conductor) return
    saveMut.mutate({ ...data, conductorId: conductor.id })
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!uploadingId || !e.target.files || e.target.files.length === 0) return
    uploadMut.mutate({ id: uploadingId, files: e.target.files, categoria: uploadCat })
    e.target.value = ''
  }

  function triggerUpload(gastoId: string, cat: string) {
    setUploadingId(gastoId)
    setUploadCat(cat)
    setTimeout(() => fileInputRef.current?.click(), 100)
  }

  const totalGastado = gastos.reduce((s: number, g: any) =>
    s + g.estacionamiento + g.gasolina + g.tag + g.casetas + g.comidas + g.otros, 0)

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-xl text-white">Mis Gastos</h1>
          <p className="text-xs text-carbon-400">Registra y sube comprobantes</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary text-sm px-4 py-2">
          {showForm ? '✕ Cerrar' : '+ Nuevo Gasto'}
        </button>
      </div>

      {/* Resumen */}
      <div className="card bg-gradient-to-br from-purple-500/10 to-carbon-800 border-purple-500/20">
        <p className="text-carbon-400 text-xs mb-1">Total gastado (todos)</p>
        <p className="font-display font-bold text-3xl text-white">{formatCurrency(totalGastado)}</p>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {CATEGORIAS.map(c => {
            const sum = gastos.reduce((s: number, g: any) => s + (g[c.key] || 0), 0)
            if (sum === 0) return null
            return (
              <div key={c.key} className="bg-carbon-700/50 rounded-xl py-2 text-center">
                <p className="text-lg">{c.icon}</p>
                <p className="text-white text-xs font-bold">{formatCurrency(sum)}</p>
                <p className="text-carbon-500 text-[10px]">{c.label}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="card space-y-4">
          <h3 className="font-semibold text-white text-sm">Registrar nuevo gasto</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIAS.map(c => (
                <div key={c.key}>
                  <label className="text-xs text-carbon-400 flex items-center gap-1 mb-1">
                    {c.icon} {c.label}
                  </label>
                  <input
                    type="number" step="0.01" min="0"
                    {...register(c.key as keyof GastoForm, { valueAsNumber: true })}
                    className="w-full bg-carbon-900 border border-carbon-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                    placeholder="0.00"
                  />
                </div>
              ))}
            </div>

            {(watch('otros') || 0) > 0 && (
              <div>
                <label className="text-xs text-carbon-400 mb-1 block">Descripción de "Otros"</label>
                <input {...register('otrosDesc')} placeholder="ej. Herramientas, limpieza..." className="input text-sm" />
              </div>
            )}

            <div>
              <label className="text-xs text-carbon-400 mb-1 block">Observaciones</label>
              <textarea {...register('observaciones')} rows={2} className="input text-sm resize-none" placeholder="Notas adicionales..." />
            </div>

            {totalActual > 0 && (
              <div className="bg-carbon-700 rounded-lg px-4 py-2 flex items-center justify-between">
                <span className="text-xs text-carbon-400">Total a registrar:</span>
                <span className="font-bold text-amber-400">{formatCurrency(totalActual)}</span>
              </div>
            )}

            <button type="submit" disabled={saveMut.isPending || totalActual === 0} className="btn-primary w-full">
              {saveMut.isPending ? 'Guardando...' : '✓ Registrar Gasto'}
            </button>
          </form>
        </div>
      )}

      {/* Lista de gastos */}
      {isLoading ? (
        <div className="card text-center py-10 text-carbon-500">Cargando...</div>
      ) : gastos.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">💸</p>
          <p className="text-carbon-400 text-sm">Sin gastos registrados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {gastos.map((g: any) => {
            const total = g.estacionamiento + g.gasolina + g.tag + g.casetas + g.comidas + g.otros
            return (
              <div key={g.id} className="card space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-carbon-400">{new Date(g.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    {g.entrega?.solicitud?.ot && (
                      <p className="text-xs font-mono text-amber-400">{g.entrega.solicitud.ot}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">{formatCurrency(total)}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${ESTADO_COLOR[g.estado]}`}>
                      {g.estado}
                    </span>
                  </div>
                </div>

                {/* Desglose */}
                <div className="grid grid-cols-3 gap-1.5">
                  {CATEGORIAS.map(c => {
                    const val = g[c.key]
                    if (!val) return null
                    return (
                      <div key={c.key} className="bg-carbon-700/60 rounded-lg px-2 py-1.5 flex items-center gap-1.5">
                        <span className="text-sm">{c.icon}</span>
                        <div>
                          <p className="text-[10px] text-carbon-400">{c.label}</p>
                          <p className="text-xs text-white font-medium">{formatCurrency(val)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {g.otrosDesc && <p className="text-xs text-carbon-400">📝 {g.otrosDesc}</p>}
                {g.observaciones && <p className="text-xs text-carbon-400 italic">{g.observaciones}</p>}

                {/* Archivos adjuntos */}
                {g.archivos?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {g.archivos.map((a: any) => (
                      <a key={a.id} href={`${import.meta.env.VITE_API_URL?.replace('/api', '')}${a.url}`}
                        target="_blank" rel="noreferrer"
                        className="text-xs px-2 py-1 bg-carbon-700 hover:bg-carbon-600 rounded flex items-center gap-1 text-carbon-300">
                        📎 {a.nombre.slice(0, 20)}{a.nombre.length > 20 ? '…' : ''}
                      </a>
                    ))}
                  </div>
                )}

                {/* Subir comprobante */}
                {g.estado !== 'RECHAZADO' && (
                  <div className="flex gap-2">
                    <select
                      value={uploadingId === g.id ? uploadCat : 'otros'}
                      onChange={e => { setUploadCat(e.target.value); setUploadingId(g.id) }}
                      className="text-xs bg-carbon-900 border border-carbon-600 rounded px-2 py-1.5 text-white focus:outline-none flex-1"
                    >
                      {CATEGORIAS.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
                    </select>
                    <button
                      onClick={() => triggerUpload(g.id, uploadCat)}
                      disabled={uploadMut.isPending && uploadingId === g.id}
                      className="text-xs px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded border border-amber-500/30 whitespace-nowrap"
                    >
                      {uploadMut.isPending && uploadingId === g.id ? 'Subiendo...' : '📎 Subir ticket'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Input oculto para archivos */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
