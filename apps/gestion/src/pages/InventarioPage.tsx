import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { api } from '../lib/api'
import { toast } from '../stores/uiStore'
import { formatCurrency, formatDateTime } from '@logiflow/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Producto {
  id: string
  sku: string
  nombre: string
  descripcion?: string
  unidad: string
  categoria?: string
  stockActual: number
  stockMinimo: number
  precio?: number
  activo: boolean
  createdAt: string
  updatedAt: string
  _count?: { movimientos: number }
}

interface Movimiento {
  id: string
  productoId: string
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE'
  cantidad: number
  stockAntes: number
  stockDespues: number
  motivo?: string
  referencia?: string
  createdAt: string
  producto?: { sku: string; nombre: string; unidad: string }
}

type Tab = 'stock' | 'productos' | 'movimientos'

const UNIDADES = ['pza', 'kg', 'lt', 'caja', 'pallet', 'rollo', 'metro', 'bolsa', 'par']
const CATEGORIAS = ['Embalaje', 'Documentación', 'Consumibles', 'Herramientas', 'Equipamiento', 'Tarimas', 'Otros']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stockColor(p: Producto): string {
  if (p.stockActual === 0) return 'text-red-400'
  if (p.stockMinimo > 0 && p.stockActual <= p.stockMinimo) return 'text-amber-400'
  return 'text-emerald-400'
}

function stockBadge(p: Producto) {
  if (p.stockActual === 0) return { label: 'Sin stock', cls: 'bg-red-500/15 text-red-400 border-red-500/30' }
  if (p.stockMinimo > 0 && p.stockActual <= p.stockMinimo) return { label: 'Stock bajo', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' }
  return { label: 'OK', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' }
}

function tipoBadge(tipo: string) {
  if (tipo === 'ENTRADA') return 'bg-emerald-500/15 text-emerald-400'
  if (tipo === 'SALIDA') return 'bg-red-500/15 text-red-400'
  return 'bg-blue-500/15 text-blue-400'
}

// ─── Modal Producto ───────────────────────────────────────────────────────────

function ProductoModal({
  producto,
  onClose,
}: {
  producto: Producto | null
  onClose: () => void
}) {
  const qc = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<any>({
    defaultValues: producto ?? {
      sku: '', nombre: '', unidad: 'pza', categoria: '', stockMinimo: 0, precio: '', descripcion: '', activo: true,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: any) =>
      producto
        ? api.put(`/inventario/productos/${producto.id}`, data).then(r => r.data)
        : api.post('/inventario/productos', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventario-productos'] })
      qc.invalidateQueries({ queryKey: ['inventario-stock'] })
      toast.success(producto ? 'Producto actualizado' : 'Producto creado')
      onClose()
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al guardar'),
  })

  const onSubmit = (data: any) => {
    data.stockMinimo = Number(data.stockMinimo)
    if (data.precio !== '' && data.precio !== null) data.precio = Number(data.precio)
    else data.precio = null
    mutation.mutate(data)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-carbon-800 border border-carbon-700 rounded-xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-carbon-700">
          <h2 className="font-display font-bold text-white">{producto ? 'Editar producto' : 'Nuevo producto'}</h2>
          <button onClick={onClose} className="text-carbon-400 hover:text-white text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-carbon-400 mb-1">SKU *</label>
              <input {...register('sku', { required: true })}
                className="w-full bg-carbon-900 border border-carbon-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                placeholder="INV-001"
              />
              {errors.sku && <p className="text-red-400 text-xs mt-1">Requerido</p>}
            </div>
            <div>
              <label className="block text-xs text-carbon-400 mb-1">Unidad</label>
              <select {...register('unidad')}
                className="w-full bg-carbon-900 border border-carbon-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-carbon-400 mb-1">Nombre *</label>
            <input {...register('nombre', { required: true })}
              className="w-full bg-carbon-900 border border-carbon-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              placeholder="Nombre del producto"
            />
            {errors.nombre && <p className="text-red-400 text-xs mt-1">Requerido</p>}
          </div>

          <div>
            <label className="block text-xs text-carbon-400 mb-1">Descripción</label>
            <textarea {...register('descripcion')}
              rows={2}
              className="w-full bg-carbon-900 border border-carbon-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
              placeholder="Descripción opcional"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-carbon-400 mb-1">Categoría</label>
              <select {...register('categoria')}
                className="w-full bg-carbon-900 border border-carbon-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                <option value="">Sin categoría</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-carbon-400 mb-1">Stock mínimo</label>
              <input {...register('stockMinimo')} type="number" min="0"
                className="w-full bg-carbon-900 border border-carbon-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs text-carbon-400 mb-1">Precio unit.</label>
              <input {...register('precio')} type="number" step="0.01" min="0"
                className="w-full bg-carbon-900 border border-carbon-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-carbon-300 hover:text-white border border-carbon-600 rounded-lg">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting || mutation.isPending}
              className="px-6 py-2 text-sm bg-amber-500 hover:bg-amber-400 text-carbon-900 font-semibold rounded-lg disabled:opacity-50">
              {mutation.isPending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Modal Movimiento ─────────────────────────────────────────────────────────

function MovimientoModal({
  productos,
  productoPreseleccionado,
  onClose,
}: {
  productos: Producto[]
  productoPreseleccionado?: string
  onClose: () => void
}) {
  const qc = useQueryClient()
  const { register, handleSubmit, watch, formState: { errors } } = useForm<any>({
    defaultValues: { productoId: productoPreseleccionado ?? '', tipo: 'ENTRADA', cantidad: 1, motivo: '' },
  })

  const tipo = watch('tipo')
  const productoId = watch('productoId')
  const productoSel = productos.find(p => p.id === productoId)

  const mutation = useMutation({
    mutationFn: (data: any) =>
      api.post('/inventario/movimientos', { ...data, cantidad: Number(data.cantidad) }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventario-productos'] })
      qc.invalidateQueries({ queryKey: ['inventario-movimientos'] })
      qc.invalidateQueries({ queryKey: ['inventario-stock'] })
      toast.success('Movimiento registrado')
      onClose()
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al registrar'),
  })

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-carbon-800 border border-carbon-700 rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-carbon-700">
          <h2 className="font-display font-bold text-white">Registrar movimiento</h2>
          <button onClick={onClose} className="text-carbon-400 hover:text-white text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-carbon-400 mb-1">Tipo *</label>
            <div className="grid grid-cols-3 gap-2">
              {(['ENTRADA', 'SALIDA', 'AJUSTE'] as const).map(t => (
                <label key={t}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border cursor-pointer text-sm font-medium transition-colors
                    ${tipo === t
                      ? t === 'ENTRADA' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : t === 'SALIDA' ? 'bg-red-500/20 border-red-500 text-red-400'
                        : 'bg-blue-500/20 border-blue-500 text-blue-400'
                      : 'border-carbon-600 text-carbon-400 hover:border-carbon-500'}`}>
                  <input type="radio" {...register('tipo')} value={t} className="sr-only" />
                  {t === 'ENTRADA' ? '↑' : t === 'SALIDA' ? '↓' : '↕'} {t}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-carbon-400 mb-1">Producto *</label>
            <select {...register('productoId', { required: true })}
              className="w-full bg-carbon-900 border border-carbon-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
              <option value="">Seleccionar producto…</option>
              {productos.map(p => (
                <option key={p.id} value={p.id}>{p.sku} — {p.nombre} (stock: {p.stockActual} {p.unidad})</option>
              ))}
            </select>
            {errors.productoId && <p className="text-red-400 text-xs mt-1">Requerido</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-carbon-400 mb-1">
                {tipo === 'AJUSTE' ? 'Nuevo stock total *' : 'Cantidad *'}
              </label>
              <input {...register('cantidad', { required: true, min: 1 })}
                type="number" min="1"
                className="w-full bg-carbon-900 border border-carbon-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
              {productoSel && tipo !== 'AJUSTE' && (
                <p className="text-xs text-carbon-500 mt-1">Stock actual: {productoSel.stockActual} {productoSel.unidad}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-carbon-400 mb-1">Referencia</label>
              <input {...register('referencia')}
                className="w-full bg-carbon-900 border border-carbon-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                placeholder="OT, folio, etc."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-carbon-400 mb-1">Motivo</label>
            <input {...register('motivo')}
              className="w-full bg-carbon-900 border border-carbon-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              placeholder="Descripción del movimiento"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-carbon-300 hover:text-white border border-carbon-600 rounded-lg">
              Cancelar
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="px-6 py-2 text-sm bg-amber-500 hover:bg-amber-400 text-carbon-900 font-semibold rounded-lg disabled:opacity-50">
              {mutation.isPending ? 'Guardando…' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Tab: Stock ───────────────────────────────────────────────────────────────

function TabStock({ onMovimiento }: { onMovimiento: (productoId?: string) => void }) {
  const { data } = useQuery({
    queryKey: ['inventario-stock'],
    queryFn: () => api.get('/inventario/stock').then(r => r.data.data),
    refetchInterval: 30000,
  })

  if (!data) return <div className="text-carbon-400 py-12 text-center text-sm">Cargando…</div>

  const { resumen, alertas, ultimosMovimientos } = data

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total productos', value: resumen.total, icon: '📦', color: 'text-white' },
          { label: 'Stock OK', value: resumen.stockOk, icon: '✅', color: 'text-emerald-400' },
          { label: 'Stock bajo', value: resumen.stockBajo, icon: '⚠️', color: 'text-amber-400' },
          { label: 'Sin stock', value: resumen.sinStock, icon: '🚫', color: 'text-red-400' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-carbon-800 border border-carbon-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-carbon-400">{kpi.label}</span>
              <span className="text-lg">{kpi.icon}</span>
            </div>
            <p className={`text-3xl font-display font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <h3 className="text-amber-400 font-semibold text-sm mb-3">⚠️ Alertas de stock ({alertas.length})</h3>
          <div className="space-y-2">
            {alertas.map((p: Producto) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-white font-medium">{p.nombre}</span>
                  <span className="text-carbon-400 ml-2 text-xs">SKU: {p.sku}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-bold ${stockColor(p)}`}>{p.stockActual} {p.unidad}</span>
                  <span className="text-carbon-500 text-xs">/ mín. {p.stockMinimo}</span>
                  <button
                    onClick={() => onMovimiento(p.id)}
                    className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 px-2 py-1 rounded-lg">
                    + Entrada
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Últimos movimientos */}
      <div className="bg-carbon-800 border border-carbon-700 rounded-xl">
        <div className="px-5 py-4 border-b border-carbon-700">
          <h3 className="font-semibold text-white text-sm">Últimos movimientos</h3>
        </div>
        {ultimosMovimientos.length === 0 ? (
          <p className="text-carbon-400 text-sm px-5 py-8 text-center">Sin movimientos registrados</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-carbon-400 text-xs border-b border-carbon-700">
                <th className="text-left px-5 py-3">Producto</th>
                <th className="text-left px-4 py-3">Tipo</th>
                <th className="text-right px-4 py-3">Cantidad</th>
                <th className="text-right px-4 py-3">Stock resultante</th>
                <th className="text-left px-4 py-3">Motivo</th>
                <th className="text-left px-4 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {ultimosMovimientos.map((m: Movimiento) => (
                <tr key={m.id} className="border-b border-carbon-700/50 hover:bg-carbon-700/30">
                  <td className="px-5 py-3 text-white font-medium">{m.producto?.nombre}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${tipoBadge(m.tipo)}`}>{m.tipo}</span>
                  </td>
                  <td className={`px-4 py-3 text-right font-bold ${m.tipo === 'ENTRADA' ? 'text-emerald-400' : m.tipo === 'SALIDA' ? 'text-red-400' : 'text-blue-400'}`}>
                    {m.tipo === 'ENTRADA' ? '+' : m.tipo === 'SALIDA' ? '-' : '='}{Math.abs(m.cantidad)} {m.producto?.unidad}
                  </td>
                  <td className="px-4 py-3 text-right text-white">{m.stockDespues} {m.producto?.unidad}</td>
                  <td className="px-4 py-3 text-carbon-400 max-w-[160px] truncate">{m.motivo || '—'}</td>
                  <td className="px-4 py-3 text-carbon-400 text-xs">{formatDateTime(m.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ─── Tab: Productos ───────────────────────────────────────────────────────────

function TabProductos({ onMovimiento }: { onMovimiento: (productoId?: string) => void }) {
  const qc = useQueryClient()
  const [buscar, setBuscar] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [modalProducto, setModalProducto] = useState<Producto | null | 'nuevo'>(null)

  const { data: productos = [], isLoading } = useQuery<Producto[]>({
    queryKey: ['inventario-productos', buscar, categoriaFiltro],
    queryFn: () => {
      const params: any = { activo: 'true' }
      if (buscar) params.buscar = buscar
      if (categoriaFiltro) params.categoria = categoriaFiltro
      return api.get('/inventario/productos', { params }).then(r => r.data.data)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/inventario/productos/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventario-productos'] })
      toast.success('Producto desactivado')
    },
    onError: () => toast.error('Error al desactivar'),
  })

  return (
    <>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={buscar}
            onChange={e => setBuscar(e.target.value)}
            placeholder="Buscar por SKU o nombre…"
            className="bg-carbon-800 border border-carbon-700 rounded-lg px-3 py-2 text-sm text-white placeholder-carbon-500 focus:outline-none focus:border-amber-500 w-64"
          />
          <select
            value={categoriaFiltro}
            onChange={e => setCategoriaFiltro(e.target.value)}
            className="bg-carbon-800 border border-carbon-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
            <option value="">Todas las categorías</option>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            onClick={() => setModalProducto('nuevo')}
            className="ml-auto flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-carbon-900 font-semibold text-sm px-4 py-2 rounded-lg">
            + Nuevo producto
          </button>
        </div>

        {/* Tabla */}
        <div className="bg-carbon-800 border border-carbon-700 rounded-xl overflow-hidden">
          {isLoading ? (
            <p className="text-carbon-400 text-sm px-5 py-8 text-center">Cargando…</p>
          ) : productos.length === 0 ? (
            <p className="text-carbon-400 text-sm px-5 py-8 text-center">No se encontraron productos</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-carbon-400 text-xs border-b border-carbon-700">
                  <th className="text-left px-5 py-3">SKU</th>
                  <th className="text-left px-4 py-3">Nombre</th>
                  <th className="text-left px-4 py-3">Categoría</th>
                  <th className="text-right px-4 py-3">Stock</th>
                  <th className="text-right px-4 py-3">Mínimo</th>
                  <th className="text-right px-4 py-3">Precio</th>
                  <th className="text-center px-4 py-3">Estado</th>
                  <th className="text-right px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map(p => {
                  const badge = stockBadge(p)
                  return (
                    <tr key={p.id} className="border-b border-carbon-700/50 hover:bg-carbon-700/30">
                      <td className="px-5 py-3 font-mono text-xs text-carbon-400">{p.sku}</td>
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">{p.nombre}</p>
                        {p.descripcion && <p className="text-carbon-500 text-xs truncate max-w-[200px]">{p.descripcion}</p>}
                      </td>
                      <td className="px-4 py-3 text-carbon-400">{p.categoria || '—'}</td>
                      <td className={`px-4 py-3 text-right font-bold ${stockColor(p)}`}>
                        {p.stockActual} <span className="text-carbon-500 font-normal">{p.unidad}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-carbon-400">{p.stockMinimo}</td>
                      <td className="px-4 py-3 text-right text-carbon-400">
                        {p.precio ? formatCurrency(p.precio) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded border text-xs font-medium ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onMovimiento(p.id)}
                            className="text-xs bg-carbon-700 hover:bg-carbon-600 text-carbon-300 px-2 py-1 rounded"
                            title="Registrar movimiento">
                            ± Mov
                          </button>
                          <button
                            onClick={() => setModalProducto(p)}
                            className="text-xs bg-carbon-700 hover:bg-carbon-600 text-carbon-300 px-2 py-1 rounded"
                            title="Editar">
                            ✏️
                          </button>
                          <button
                            onClick={() => { if (confirm(`¿Desactivar "${p.nombre}"?`)) deleteMutation.mutate(p.id) }}
                            className="text-xs bg-red-500/15 hover:bg-red-500/25 text-red-400 px-2 py-1 rounded"
                            title="Desactivar">
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modalProducto && (
        <ProductoModal
          producto={modalProducto === 'nuevo' ? null : modalProducto}
          onClose={() => setModalProducto(null)}
        />
      )}
    </>
  )
}

// ─── Tab: Movimientos ─────────────────────────────────────────────────────────

function TabMovimientos() {
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [productoFiltro, setProductoFiltro] = useState('')
  const [page, setPage] = useState(1)

  const { data: productosData } = useQuery<Producto[]>({
    queryKey: ['inventario-productos-lista'],
    queryFn: () => api.get('/inventario/productos', { params: { activo: 'true' } }).then(r => r.data.data),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['inventario-movimientos', tipoFiltro, productoFiltro, page],
    queryFn: () => {
      const params: any = { page, limit: 30 }
      if (tipoFiltro) params.tipo = tipoFiltro
      if (productoFiltro) params.productoId = productoFiltro
      return api.get('/inventario/movimientos', { params }).then(r => r.data)
    },
  })

  const movimientos: Movimiento[] = data?.data ?? []
  const total: number = data?.total ?? 0
  const pages = Math.ceil(total / 30)

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={tipoFiltro}
          onChange={e => { setTipoFiltro(e.target.value); setPage(1) }}
          className="bg-carbon-800 border border-carbon-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
          <option value="">Todos los tipos</option>
          <option value="ENTRADA">Entradas</option>
          <option value="SALIDA">Salidas</option>
          <option value="AJUSTE">Ajustes</option>
        </select>
        <select
          value={productoFiltro}
          onChange={e => { setProductoFiltro(e.target.value); setPage(1) }}
          className="bg-carbon-800 border border-carbon-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 max-w-xs">
          <option value="">Todos los productos</option>
          {productosData?.map(p => <option key={p.id} value={p.id}>{p.sku} — {p.nombre}</option>)}
        </select>
        <span className="ml-auto text-carbon-500 text-xs">{total} movimientos</span>
      </div>

      {/* Tabla */}
      <div className="bg-carbon-800 border border-carbon-700 rounded-xl overflow-hidden">
        {isLoading ? (
          <p className="text-carbon-400 text-sm px-5 py-8 text-center">Cargando…</p>
        ) : movimientos.length === 0 ? (
          <p className="text-carbon-400 text-sm px-5 py-8 text-center">Sin movimientos registrados</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-carbon-400 text-xs border-b border-carbon-700">
                <th className="text-left px-5 py-3">Fecha</th>
                <th className="text-left px-4 py-3">Producto</th>
                <th className="text-center px-4 py-3">Tipo</th>
                <th className="text-right px-4 py-3">Cantidad</th>
                <th className="text-right px-4 py-3">Antes</th>
                <th className="text-right px-4 py-3">Después</th>
                <th className="text-left px-4 py-3">Referencia</th>
                <th className="text-left px-4 py-3">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map(m => (
                <tr key={m.id} className="border-b border-carbon-700/50 hover:bg-carbon-700/30">
                  <td className="px-5 py-3 text-carbon-400 text-xs whitespace-nowrap">{formatDateTime(m.createdAt)}</td>
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{m.producto?.nombre}</p>
                    <p className="text-carbon-500 text-xs">{m.producto?.sku}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${tipoBadge(m.tipo)}`}>{m.tipo}</span>
                  </td>
                  <td className={`px-4 py-3 text-right font-bold ${m.tipo === 'ENTRADA' ? 'text-emerald-400' : m.tipo === 'SALIDA' ? 'text-red-400' : 'text-blue-400'}`}>
                    {m.tipo === 'ENTRADA' ? '+' : m.tipo === 'SALIDA' ? '-' : '='}{Math.abs(m.cantidad)} {m.producto?.unidad}
                  </td>
                  <td className="px-4 py-3 text-right text-carbon-400">{m.stockAntes}</td>
                  <td className="px-4 py-3 text-right text-white font-medium">{m.stockDespues}</td>
                  <td className="px-4 py-3 text-carbon-400 text-xs">{m.referencia || '—'}</td>
                  <td className="px-4 py-3 text-carbon-400 text-xs max-w-[160px] truncate">{m.motivo || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1 text-sm bg-carbon-800 border border-carbon-700 rounded text-carbon-300 disabled:opacity-40">← Ant</button>
          <span className="text-carbon-400 text-sm">{page} / {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
            className="px-3 py-1 text-sm bg-carbon-800 border border-carbon-700 rounded text-carbon-300 disabled:opacity-40">Sig →</button>
        </div>
      )}
    </div>
  )
}

// ─── Page Principal ───────────────────────────────────────────────────────────

export function InventarioPage() {
  const [tab, setTab] = useState<Tab>('stock')
  const [showMovModal, setShowMovModal] = useState(false)
  const [productoPresel, setProductoPresel] = useState<string | undefined>()

  const { data: productos = [] } = useQuery<Producto[]>({
    queryKey: ['inventario-productos-lista'],
    queryFn: () => api.get('/inventario/productos', { params: { activo: 'true' } }).then(r => r.data.data),
  })

  const abrirMovimiento = (productoId?: string) => {
    setProductoPresel(productoId)
    setShowMovModal(true)
  }

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'stock', label: 'Resumen Stock', icon: '📊' },
    { id: 'productos', label: 'Productos', icon: '📦' },
    { id: 'movimientos', label: 'Movimientos', icon: '↕️' },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Inventario</h1>
          <p className="text-carbon-400 text-sm mt-0.5">Control de productos, entradas y salidas</p>
        </div>
        <button
          onClick={() => abrirMovimiento()}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-carbon-900 font-semibold text-sm px-4 py-2 rounded-lg">
          ± Registrar movimiento
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-carbon-800 border border-carbon-700 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${tab === t.id
                ? 'bg-amber-500 text-carbon-900'
                : 'text-carbon-400 hover:text-white'}`}>
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'stock' && <TabStock onMovimiento={abrirMovimiento} />}
      {tab === 'productos' && <TabProductos onMovimiento={abrirMovimiento} />}
      {tab === 'movimientos' && <TabMovimientos />}

      {/* Modal movimiento */}
      {showMovModal && (
        <MovimientoModal
          productos={productos}
          productoPreseleccionado={productoPresel}
          onClose={() => { setShowMovModal(false); setProductoPresel(undefined) }}
        />
      )}
    </div>
  )
}
