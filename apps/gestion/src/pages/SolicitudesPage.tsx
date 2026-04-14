import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { api } from '../lib/api'
import { toast } from '../stores/uiStore'
import { Modal } from '../components/ui/Modal'
import { SolBadge } from '../components/ui/StatoBadge'
import { formatDate, formatCurrency, generateOT } from '@logiflow/utils'
import type { Solicitud } from '@logiflow/types'

const TIPOS = ['DISTRIBUCION', 'RECOLECCION', 'TRANSFERENCIA', 'ULTIMA_MILLA'] as const
const TRANSPORTES = ['TORTON', 'RABON', 'VAN', 'PICKUP', 'PLATAFORMA'] as const

function MapPicker({ value, onChange }: { value: [number, number] | null; onChange: (v: [number, number]) => void }) {
  function Inner() {
    useMapEvents({ click(e) { onChange([e.latlng.lat, e.latlng.lng]) } })
    return value ? <Marker position={value} icon={L.divIcon({ className: '', html: '<div style="width:14px;height:14px;background:#f59e0b;border-radius:50%;border:2px solid #fff"></div>' })} /> : null
  }
  return (
    <MapContainer center={[19.4326, -99.1332]} zoom={11} style={{ height: 220, width: '100%', borderRadius: 8 }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Inner />
    </MapContainer>
  )
}

const defaultValues = {
  ot: '', cliente: '', rfcCliente: '', ordenCompra: '', tipo: 'DISTRIBUCION' as const,
  fechaSolicitud: new Date().toISOString().slice(0, 10),
  fechaEntrega: '', horaEntrega: '', descripcionCarga: '',
  cantidad: 0, tarimas: 0, etiquetasPieza: 0, etiquetasColectivo: 0, papeletas: 0,
  cajaColectiva: false, playo: false, poliBurbuja: false, requiereAcond: false,
  gestionTarimas: false, lineaTransporte: '', tipoTransporte: 'VAN' as const,
  requiereManiobra: false, variosDestinos: false, observaciones: '',
  costo: 0, direccionEntrega: '', latDestino: null as number | null, lngDestino: null as number | null,
  distanciaKm: null as number | null, tiempoRuta: '',
  itemsRemision: [{ partida: 1, descripcion: '', unidad: 'PIEZAS', cantidadSolicitada: 0, cantidadEntregada: 0 }] as {
    partida: number; descripcion: string; unidad: string; cantidadSolicitada: number; cantidadEntregada: number
  }[],
}

export function SolicitudesPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState(0)
  const [editId, setEditId] = useState<string | null>(null)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [mostrarComp, setMostrarComp] = useState(false)
  const [mapPos, setMapPos] = useState<[number, number] | null>(null)
  const [rutaInfo, setRutaInfo] = useState<{ km: number; tiempo: string; costo: number; alertas: string[] } | null>(null)
  const [calcRuta, setCalcRuta] = useState(false)

  const { data: solicitudes = [], isLoading } = useQuery<Solicitud[]>({
    queryKey: ['solicitudes', filtroEstado, filtroTipo, busqueda, mostrarComp],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filtroEstado) params.set('estado', filtroEstado)
      if (filtroTipo) params.set('tipo', filtroTipo)
      if (busqueda) params.set('cliente', busqueda)
      if (!mostrarComp) params.set('mostrarCompletadas', 'false')
      const res = await api.get(`/solicitudes?${params}`)
      return res.data.data
    },
  })

  const { register, handleSubmit, control, reset, setValue, watch } = useForm({ defaultValues })
  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({ control, name: 'itemsRemision' })
  const latDest = watch('latDestino')
  const lngDest = watch('lngDestino')
  const tipoTransp = watch('tipoTransporte')

  const mutation = useMutation({
    mutationFn: (data: any) => editId ? api.put(`/solicitudes/${editId}`, data) : api.post('/solicitudes', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['solicitudes'] })
      toast.success(editId ? 'Solicitud actualizada' : 'Solicitud creada')
      setOpen(false)
      reset(defaultValues)
      setEditId(null)
      setMapPos(null)
      setRutaInfo(null)
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Error al guardar'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/solicitudes/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['solicitudes'] }); toast.success('Solicitud eliminada') },
    onError: () => toast.error('Error al eliminar'),
  })

  const genEntregaMutation = useMutation({
    mutationFn: (id: string) => api.post(`/solicitudes/${id}/generar-entrega`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['solicitudes', 'entregas'] }); toast.success('Entrega generada') },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Error'),
  })

  function openNew() {
    reset({ ...defaultValues, ot: generateOT() })
    setEditId(null)
    setMapPos(null)
    setRutaInfo(null)
    setTab(0)
    setOpen(true)
  }

  function openEdit(s: Solicitud) {
    reset({
      ...defaultValues,
      ...(s as any),
      fechaSolicitud: s.fechaSolicitud?.slice(0, 10) || '',
      fechaEntrega: (s.fechaEntrega as any)?.slice(0, 10) || '',
      tipoTransporte: (s.tipoTransporte as any) || 'VAN',
      rfcCliente: (s as any).rfcCliente || '',
      ordenCompra: (s as any).ordenCompra || '',
      itemsRemision: Array.isArray((s as any).itemsRemision) && (s as any).itemsRemision.length > 0
        ? (s as any).itemsRemision
        : defaultValues.itemsRemision,
    } as any)
    if (s.latDestino && s.lngDestino) setMapPos([s.latDestino, s.lngDestino])
    setEditId(s.id)
    setTab(0)
    setOpen(true)
  }

  async function handleCalcRuta() {
    if (!latDest || !lngDest) return toast.error('Selecciona destino en el mapa')
    setCalcRuta(true)
    try {
      const res = await api.post('/ruta/calcular', { destinoLat: latDest, destinoLng: lngDest, tipoTransporte: tipoTransp })
      const r = res.data.data
      setRutaInfo(r)
      setValue('distanciaKm', r.km)
      setValue('tiempoRuta', r.tiempo)
      setValue('costo', r.costo)
      toast.success(`Ruta calculada: ${r.km} km · ${r.tiempo}`)
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al calcular ruta')
    } finally {
      setCalcRuta(false)
    }
  }

  async function handleGeocode() {
    const dir = watch('direccionEntrega')
    if (!dir) return toast.error('Ingresa una dirección')
    try {
      const res = await api.post('/ruta/geocodificar', { direccion: dir })
      const { lat, lng } = res.data.data
      setMapPos([lat, lng])
      setValue('latDestino', lat)
      setValue('lngDestino', lng)
      toast.success('Dirección geocodificada')
    } catch {
      toast.error('No se encontró la dirección')
    }
  }

  const TABS = ['General', 'Fechas', 'Carga', 'Ruta', 'Transporte', 'Remisión']

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Solicitudes</h1>
          <p className="text-carbon-400 text-sm">{solicitudes.length} registros</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost text-sm" onClick={() => setMostrarComp((v) => !v)}>
            {mostrarComp ? '🙈 Ocultar complet.' : '👁 Ver completadas'}
          </button>
          <button className="btn-primary text-sm" onClick={openNew}>+ Nueva Solicitud</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar cliente..." className="input max-w-xs text-sm" />
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="input max-w-[160px] text-sm">
          <option value="">Todos los estados</option>
          {['PENDIENTE', 'ASIGNADA', 'EN_RUTA', 'COMPLETADA', 'RECHAZADA', 'INCIDENCIA'].map((e) => (
            <option key={e} value={e}>{e.replace('_', ' ')}</option>
          ))}
        </select>
        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="input max-w-[170px] text-sm">
          <option value="">Todos los tipos</option>
          {TIPOS.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-carbon-700/50">
              <tr className="text-carbon-400 text-xs">
                {['OT', 'Cliente', 'Tipo', 'Fecha Entrega', 'Estado', 'Km', 'Tiempo', 'Costo', 'Acciones'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-carbon-500">Cargando...</td></tr>
              ) : solicitudes.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-carbon-500">Sin solicitudes</td></tr>
              ) : solicitudes.map((s) => (
                <tr key={s.id} className="border-t border-carbon-700/50 table-row-hover">
                  <td className="px-4 py-3 font-mono text-amber-400 text-xs whitespace-nowrap">{s.ot}</td>
                  <td className="px-4 py-3 font-medium">{s.cliente}</td>
                  <td className="px-4 py-3 text-carbon-300 text-xs">{s.tipo.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-carbon-400 text-xs">{s.fechaEntrega ? formatDate(s.fechaEntrega) : '—'}</td>
                  <td className="px-4 py-3"><SolBadge estado={s.estado} /></td>
                  <td className="px-4 py-3 text-carbon-300 text-xs">{s.distanciaKm ? `${s.distanciaKm} km` : '—'}</td>
                  <td className="px-4 py-3 text-carbon-300 text-xs">{s.tiempoRuta || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs">{formatCurrency(s.costo)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(s)} className="text-xs px-2 py-1 bg-carbon-700 hover:bg-carbon-600 rounded transition-colors">✏️</button>
                      {!s.entrega && (
                        <button onClick={() => genEntregaMutation.mutate(s.id)} className="text-xs px-2 py-1 bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 rounded transition-colors" title="Generar entrega">🚚</button>
                      )}
                      <button
                        onClick={() => { if (confirm(`¿Eliminar ${s.ot}?`)) deleteMutation.mutate(s.id) }}
                        className="text-xs px-2 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded transition-colors"
                      >🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal open={open} onClose={() => { setOpen(false); reset(defaultValues) }} title={editId ? 'Editar Solicitud' : 'Nueva Solicitud'} size="xl">
        {/* Tabs */}
        <div className="flex border-b border-carbon-700 px-5">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              className={`px-4 py-3 text-sm transition-colors whitespace-nowrap ${tab === i ? 'text-amber-400 border-b-2 border-amber-400' : 'text-carbon-400 hover:text-white'}`}>
              {t}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-5 space-y-4">
          {/* Tab 0: General */}
          {tab === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">OT *</label>
                <input {...register('ot', { required: true })} className="input" />
              </div>
              <div>
                <label className="label">Tipo *</label>
                <select {...register('tipo')} className="input">
                  {TIPOS.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Cliente / Remitido a *</label>
                <input {...register('cliente', { required: true })} className="input" placeholder="Nombre de la empresa cliente" />
              </div>
              <div>
                <label className="label">RFC del Cliente</label>
                <input {...register('rfcCliente')} className="input" placeholder="ej. DCM991109KR2" />
              </div>
              <div>
                <label className="label">Orden de Compra / Folio</label>
                <input {...register('ordenCompra')} className="input" placeholder="ej. OC-2024-001 o PENDIENTE" />
              </div>
              <div>
                <label className="label">Observaciones</label>
                <textarea {...register('observaciones')} className="input" rows={2} />
              </div>
            </div>
          )}

          {/* Tab 1: Fechas */}
          {tab === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Fecha Solicitud *</label>
                <input type="date" {...register('fechaSolicitud', { required: true })} className="input" />
              </div>
              <div>
                <label className="label">Fecha Recolección</label>
                <input type="date" {...(register as any)('fechaRecoleccion')} className="input" />
              </div>
              <div>
                <label className="label">Fecha Entrega</label>
                <input type="date" {...register('fechaEntrega')} className="input" />
              </div>
              <div>
                <label className="label">Hora Entrega</label>
                <input type="time" {...register('horaEntrega')} className="input" />
              </div>
            </div>
          )}

          {/* Tab 2: Carga */}
          {tab === 2 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="col-span-2 sm:col-span-3">
                <label className="label">Descripción de Carga</label>
                <textarea {...register('descripcionCarga')} className="input" rows={2} />
              </div>
              {[['cantidad', 'Cantidad'], ['tarimas', 'Tarimas'], ['etiquetasPieza', 'Etiq. Pieza'], ['etiquetasColectivo', 'Etiq. Colectivo'], ['papeletas', 'Papeletas']].map(([field, label]) => (
                <div key={field}>
                  <label className="label">{label}</label>
                  <input type="number" min={0} {...register(field as any, { valueAsNumber: true })} className="input" />
                </div>
              ))}
              <div className="col-span-2 sm:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[['cajaColectiva', 'Caja Colectiva'], ['playo', 'Playo'], ['poliBurbuja', 'Poli Burbuja'], ['requiereAcond', 'Acondicionamiento'], ['gestionTarimas', 'Gestión Tarimas'], ['variosDestinos', 'Varios Destinos'], ['requiereManiobra', 'Requiere Maniobra']].map(([field, label]) => (
                  <label key={field} className="flex items-center gap-2 text-sm text-carbon-300 cursor-pointer">
                    <input type="checkbox" {...register(field as any)} className="accent-amber-500" />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Ruta */}
          {tab === 3 && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="label">Dirección de Entrega</label>
                  <input {...register('direccionEntrega')} className="input" placeholder="Calle, Colonia, CDMX" />
                </div>
                <button type="button" onClick={handleGeocode} className="btn-ghost text-sm self-end">📍 Geocodificar</button>
              </div>
              <div>
                <label className="label text-xs text-carbon-500">Haz clic en el mapa para seleccionar destino</label>
                <MapPicker
                  value={mapPos}
                  onChange={(v) => {
                    setMapPos(v)
                    setValue('latDestino', v[0])
                    setValue('lngDestino', v[1])
                  }}
                />
              </div>
              {(latDest || lngDest) && (
                <p className="text-xs text-carbon-400">Destino: {latDest?.toFixed(5)}, {lngDest?.toFixed(5)}</p>
              )}
              <button type="button" onClick={handleCalcRuta} disabled={calcRuta} className="btn-primary text-sm">
                {calcRuta ? 'Calculando...' : '🗺 Calcular Ruta con OSRM'}
              </button>
              {rutaInfo && (
                <div className="bg-carbon-700 rounded-lg p-4 space-y-2">
                  <div className="flex gap-4 text-sm">
                    <span>📏 <b>{rutaInfo.km} km</b></span>
                    <span>⏱ <b>{rutaInfo.tiempo}</b></span>
                    <span>💰 <b>{formatCurrency(rutaInfo.costo)}</b></span>
                  </div>
                  {rutaInfo.alertas.map((a, i) => (
                    <p key={i} className="text-xs text-amber-300">⚠️ {a}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Transporte */}
          {tab === 4 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Línea de Transporte</label>
                <input {...register('lineaTransporte')} className="input" />
              </div>
              <div>
                <label className="label">Tipo de Transporte</label>
                <select {...register('tipoTransporte')} className="input">
                  {TRANSPORTES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Costo Total (MXN)</label>
                <input type="number" step="0.01" {...register('costo', { valueAsNumber: true })} className="input" />
              </div>
            </div>
          )}

          {/* Tab 5: Remisión */}
          {tab === 5 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium text-sm">Ítems de la Remisión</p>
                  <p className="text-carbon-400 text-xs mt-0.5">Estos datos llenarán el formato Excel automáticamente al asignar la entrega</p>
                </div>
                <button type="button"
                  onClick={() => appendItem({ partida: itemFields.length + 1, descripcion: '', unidad: 'PIEZAS', cantidadSolicitada: 0, cantidadEntregada: 0 })}
                  className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 px-3 py-1.5 rounded-lg border border-amber-500/30">
                  + Agregar ítem
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-carbon-400 text-xs border-b border-carbon-700">
                      <th className="text-left py-2 pr-3 w-12">#</th>
                      <th className="text-left py-2 pr-3">Descripción *</th>
                      <th className="text-left py-2 pr-3 w-28">Unidad</th>
                      <th className="text-right py-2 pr-3 w-28">Cant. Solic.</th>
                      <th className="text-right py-2 pr-3 w-28">Cant. Entregada</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemFields.map((field, idx) => (
                      <tr key={field.id} className="border-b border-carbon-700/40">
                        <td className="py-2 pr-3">
                          <input type="number" min={1} {...register(`itemsRemision.${idx}.partida`, { valueAsNumber: true })}
                            className="w-12 bg-carbon-900 border border-carbon-600 rounded px-2 py-1.5 text-center text-white text-xs focus:outline-none focus:border-amber-500" />
                        </td>
                        <td className="py-2 pr-3">
                          <input {...register(`itemsRemision.${idx}.descripcion`, { required: true })}
                            placeholder="ej. TARIMA, CAJA, SERVICIO…"
                            className="w-full bg-carbon-900 border border-carbon-600 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500" />
                        </td>
                        <td className="py-2 pr-3">
                          <select {...register(`itemsRemision.${idx}.unidad`)}
                            className="w-full bg-carbon-900 border border-carbon-600 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500">
                            {['PIEZAS','CAJAS','TARIMAS','ROLLOS','KG','LT','SERVICIO','METROS'].map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </td>
                        <td className="py-2 pr-3">
                          <input type="number" min={0} {...register(`itemsRemision.${idx}.cantidadSolicitada`, { valueAsNumber: true })}
                            className="w-full bg-carbon-900 border border-carbon-600 rounded px-2 py-1.5 text-white text-xs text-right focus:outline-none focus:border-amber-500" />
                        </td>
                        <td className="py-2 pr-3">
                          <input type="number" min={0} {...register(`itemsRemision.${idx}.cantidadEntregada`, { valueAsNumber: true })}
                            className="w-full bg-carbon-900 border border-carbon-600 rounded px-2 py-1.5 text-white text-xs text-right focus:outline-none focus:border-amber-500" />
                        </td>
                        <td className="py-2">
                          {itemFields.length > 1 && (
                            <button type="button" onClick={() => removeItem(idx)}
                              className="text-red-400 hover:text-red-300 text-xs px-1">✕</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-carbon-700/40 border border-carbon-600 rounded-lg px-4 py-3 text-xs text-carbon-400">
                💡 Al asignar conductor y vehículo en el módulo de Entregas, se generará automáticamente el formato de Remisión
                en Excel pre-llenado con estos datos, disponible para descarga desde la app del conductor.
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-carbon-700">
            <div className="flex gap-2">
              {tab > 0 && <button type="button" onClick={() => setTab(t => t - 1)} className="btn-ghost text-sm">← Anterior</button>}
            </div>
            <div className="flex gap-2">
              {tab < 5
                ? <button type="button" onClick={() => setTab(t => t + 1)} className="btn-primary text-sm">Siguiente →</button>
                : <button type="submit" disabled={mutation.isPending} className="btn-primary text-sm">{mutation.isPending ? 'Guardando...' : editId ? 'Actualizar' : 'Crear Solicitud'}</button>
              }
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
