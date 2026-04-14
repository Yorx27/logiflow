import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { api } from '../lib/api'
import { toast } from '../stores/uiStore'
import { formatCurrency } from '@logiflow/utils'
import type { Configuracion } from '@logiflow/types'
import { useEffect } from 'react'

export function ConfigPage() {
  const qc = useQueryClient()
  const { data: cfg, isLoading } = useQuery<Configuracion>({
    queryKey: ['config'],
    queryFn: async () => { const r = await api.get('/config'); return r.data.data },
  })

  const { register, handleSubmit, reset, watch } = useForm<Configuracion>()

  useEffect(() => {
    if (cfg) reset(cfg)
  }, [cfg, reset])

  const saveMut = useMutation({
    mutationFn: (d: Partial<Configuracion>) => api.put('/config', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['config'] }); toast.success('Configuración guardada') },
    onError: () => toast.error('Error al guardar'),
  })

  const watched = watch()
  const sample = cfg ? {
    etiq: 10 * 100 * (watched.costoEtiqueta || cfg.costoEtiqueta),
    tarima: 4 * (watched.costoTarima || cfg.costoTarima),
    papeleta: 5 * (watched.costoPapeleta || cfg.costoPapeleta),
  } : null

  if (isLoading) return <p className="text-carbon-500 text-center py-20">Cargando...</p>

  return (
    <div className="space-y-6">
      <h1 className="font-display font-bold text-2xl text-white">Configuración</h1>

      <form onSubmit={handleSubmit((d) => saveMut.mutate(d))} className="space-y-6">
        {/* Empresa */}
        <div className="card space-y-4">
          <h2 className="font-display font-semibold text-lg text-white border-b border-carbon-700 pb-3">Información de la Empresa</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre de la Empresa</label>
              <input {...register('empresa')} className="input" />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" {...register('email')} className="input" />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input {...register('telefono')} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Dirección (origen para cálculo de rutas)</label>
              <input {...register('direccion')} className="input" placeholder="Av. Reforma 123, CDMX" />
              <p className="text-xs text-carbon-500 mt-1">Al guardar, se geocodificará automáticamente como punto de origen.</p>
            </div>
          </div>
        </div>

        {/* Costos */}
        <div className="card space-y-4">
          <h2 className="font-display font-semibold text-lg text-white border-b border-carbon-700 pb-3">Costos Operativos</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              ['costoEtiqueta', 'Costo por Etiqueta', 'MXN c/u'],
              ['costoTarima', 'Costo por Tarima', 'MXN c/u'],
              ['costoPapeleta', 'Costo por Papeleta', 'MXN c/u'],
              ['costoCajaColectiva', 'Caja Colectiva', 'MXN fijo'],
              ['costoPlayo', 'Playo', 'MXN × 10m'],
              ['costoPoliBurbuja', 'Poli Burbuja', 'MXN × 10m'],
            ].map(([field, label, unit]) => (
              <div key={field}>
                <label className="label">{label}</label>
                <div className="relative">
                  <input type="number" step="0.01" min={0} {...register(field as any, { valueAsNumber: true })} className="input pr-16" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-carbon-500">{unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        {sample && (
          <div className="card bg-amber-500/5 border-amber-500/20">
            <h3 className="font-semibold text-sm text-amber-400 mb-3">Vista previa de cálculos</h3>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="text-center">
                <p className="text-carbon-400 text-xs">1000 etiquetas</p>
                <p className="text-white font-mono font-bold">{formatCurrency(sample.etiq)}</p>
              </div>
              <div className="text-center">
                <p className="text-carbon-400 text-xs">4 tarimas</p>
                <p className="text-white font-mono font-bold">{formatCurrency(sample.tarima)}</p>
              </div>
              <div className="text-center">
                <p className="text-carbon-400 text-xs">5 papeletas</p>
                <p className="text-white font-mono font-bold">{formatCurrency(sample.papeleta)}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button type="submit" disabled={saveMut.isPending} className="btn-primary">
            {saveMut.isPending ? 'Guardando...' : '💾 Guardar Configuración'}
          </button>
        </div>
      </form>
    </div>
  )
}
