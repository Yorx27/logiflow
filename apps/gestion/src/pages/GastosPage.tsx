import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { api } from '../lib/api'
import { toast } from '../stores/uiStore'
import { Modal } from '../components/ui/Modal'
import { formatCurrency } from '@logiflow/utils'

const FRECUENCIAS = ['DIARIO', 'SEMANAL', 'MENSUAL', 'ANUAL'] as const
const CATEGORIAS_FIJO = ['Nómina', 'Renta', 'Seguros', 'Mantenimiento', 'Servicios', 'Otro']
const CATEGORIAS_VAR  = ['Combustible', 'Reparación', 'Peajes', 'Administrativo', 'Otro']
const ESTADOS_COLOR: Record<string, string> = {
  PENDIENTE: 'bg-yellow-500/20 text-yellow-300',
  APROBADO:  'bg-green-500/20 text-green-300',
  RECHAZADO: 'bg-red-500/20 text-red-300',
}

// ── Resumen tarjetas ─────────────────────────────────────────────────────────
function ResumenCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className={`card border ${color} p-4`}>
      <p className="text-carbon-400 text-xs mb-1">{label}</p>
      <p className="font-display font-bold text-2xl text-white">{value}</p>
      {sub && <p className="text-carbon-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}

export function GastosPage() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'conductor' | 'fijos' | 'variables'>('conductor')
  const [modalFijo, setModalFijo]         = useState(false)
  const [modalVariable, setModalVariable] = useState(false)
  const [editFijoId, setEditFijoId]       = useState<string | null>(null)
  const [editVarId, setEditVarId]         = useState<string | null>(null)

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: resumen } = useQuery({
    queryKey: ['gastos-resumen'],
    queryFn: () => api.get('/gastos/resumen').then(r => r.data.data),
    refetchInterval: 30_000,
  })

  const { data: gastosConductor = [], isLoading: loadingCond } = useQuery({
    queryKey: ['gastos-conductor'],
    queryFn: () => api.get('/gastos/conductor').then(r => r.data.data),
    refetchInterval: 30_000,
  })

  const { data: gastosFijos = [], isLoading: loadingFijos } = useQuery({
    queryKey: ['gastos-fijos'],
    queryFn: () => api.get('/gastos/fijos').then(r => r.data.data),
  })

  const { data: gastosVariables = [], isLoading: loadingVars } = useQuery({
    queryKey: ['gastos-variables'],
    queryFn: () => api.get('/gastos/variables').then(r => r.data.data),
  })

  // ── Mutations ────────────────────────────────────────────────────────────
  const aprobarMut = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: string }) =>
      api.put(`/gastos/conductor/${id}/estado`, { estado }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gastos-conductor'] }); qc.invalidateQueries({ queryKey: ['gastos-resumen'] }) },
  })

  const deleteFijoMut = useMutation({
    mutationFn: (id: string) => api.delete(`/gastos/fijos/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gastos-fijos'] }); qc.invalidateQueries({ queryKey: ['gastos-resumen'] }); toast.success('Eliminado') },
  })

  const deleteVarMut = useMutation({
    mutationFn: (id: string) => api.delete(`/gastos/variables/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gastos-variables'] }); qc.invalidateQueries({ queryKey: ['gastos-resumen'] }); toast.success('Eliminado') },
  })

  // ── Forms ────────────────────────────────────────────────────────────────
  const fijoForm = useForm({ defaultValues: { nombre: '', monto: 0, frecuencia: 'MENSUAL' as const, categoria: '' } })
  const varForm  = useForm({ defaultValues: { nombre: '', monto: 0, fecha: new Date().toISOString().slice(0, 10), categoria: '', comprobante: '' } })

  const saveFijoMut = useMutation({
    mutationFn: (data: any) => editFijoId
      ? api.put(`/gastos/fijos/${editFijoId}`, data)
      : api.post('/gastos/fijos', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gastos-fijos'] }); qc.invalidateQueries({ queryKey: ['gastos-resumen'] })
      toast.success(editFijoId ? 'Actualizado' : 'Creado')
      setModalFijo(false); setEditFijoId(null); fijoForm.reset()
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Error'),
  })

  const saveVarMut = useMutation({
    mutationFn: (data: any) => editVarId
      ? api.put(`/gastos/variables/${editVarId}`, data)
      : api.post('/gastos/variables', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gastos-variables'] }); qc.invalidateQueries({ queryKey: ['gastos-resumen'] })
      toast.success(editVarId ? 'Actualizado' : 'Creado')
      setModalVariable(false); setEditVarId(null); varForm.reset()
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Error'),
  })

  function openEditFijo(g: any) {
    fijoForm.reset({ nombre: g.nombre, monto: g.monto, frecuencia: g.frecuencia, categoria: g.categoria || '' })
    setEditFijoId(g.id)
    setModalFijo(true)
  }

  function openEditVar(g: any) {
    varForm.reset({ nombre: g.nombre, monto: g.monto, fecha: g.fecha?.slice(0, 10) || '', categoria: g.categoria || '', comprobante: g.comprobante || '' })
    setEditVarId(g.id)
    setModalVariable(true)
  }

  const categoriasConductor = resumen?.conductorPorCategoria
  const CATICON: Record<string, string> = {
    estacionamiento: '🅿️', gasolina: '⛽', tag: '🏷️', casetas: '🛣️', comidas: '🍽️', otros: '📦'
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Gastos</h1>
          <p className="text-carbon-400 text-sm">Control de gastos operativos y de conductores</p>
        </div>
      </div>

      {/* Resumen */}
      {resumen && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ResumenCard label="Total Conductores" value={formatCurrency(resumen.totalConductor)} color="border-purple-500/30" />
          <ResumenCard label="Gastos Fijos" value={formatCurrency(resumen.totalFijos)} sub="mensuales activos" color="border-blue-500/30" />
          <ResumenCard label="Gastos Variables" value={formatCurrency(resumen.totalVariables)} color="border-amber-500/30" />
          <ResumenCard label="Total General" value={formatCurrency(resumen.totalGeneral)}
            sub={`${resumen.pendientesAprobacion} pendientes`} color="border-green-500/30" />
        </div>
      )}

      {/* Desglose conductores */}
      {categoriasConductor && (
        <div className="card">
          <p className="text-sm font-semibold text-carbon-300 mb-3">Desglose gastos de conductores</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {Object.entries(categoriasConductor).map(([cat, val]) => (
              <div key={cat} className="bg-carbon-700/50 rounded-xl py-3 text-center">
                <p className="text-xl">{CATICON[cat]}</p>
                <p className="font-bold text-white text-sm mt-1">{formatCurrency(val as number)}</p>
                <p className="text-carbon-500 text-[10px] capitalize">{cat}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-carbon-700 gap-1">
        {(['conductor', 'fijos', 'variables'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2.5 text-sm capitalize transition-colors ${activeTab === t ? 'text-amber-400 border-b-2 border-amber-400' : 'text-carbon-400 hover:text-white'}`}>
            {t === 'conductor' ? '🚚 Conductores' : t === 'fijos' ? '📌 Gastos Fijos' : '📊 Gastos Variables'}
          </button>
        ))}
      </div>

      {/* ── Tab: Conductores ── */}
      {activeTab === 'conductor' && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-carbon-700/50">
                <tr className="text-carbon-400 text-xs">
                  {['Conductor', 'Entrega', 'Estac.', 'Gasolina', 'Tag', 'Casetas', 'Comidas', 'Otros', 'Total', 'Estado', 'Fecha', 'Acciones'].map(h => (
                    <th key={h} className="text-left px-3 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingCond ? (
                  <tr><td colSpan={12} className="px-4 py-10 text-center text-carbon-500">Cargando...</td></tr>
                ) : gastosConductor.length === 0 ? (
                  <tr><td colSpan={12} className="px-4 py-10 text-center text-carbon-500">Sin registros</td></tr>
                ) : gastosConductor.map((g: any) => {
                  const total = g.estacionamiento + g.gasolina + g.tag + g.casetas + g.comidas + g.otros
                  return (
                    <tr key={g.id} className="border-t border-carbon-700/50 hover:bg-carbon-700/20">
                      <td className="px-3 py-3 font-medium whitespace-nowrap">{g.conductor?.nombre}</td>
                      <td className="px-3 py-3 text-xs text-amber-400">{g.entrega?.solicitud?.ot || '—'}</td>
                      <td className="px-3 py-3 text-xs">{formatCurrency(g.estacionamiento)}</td>
                      <td className="px-3 py-3 text-xs">{formatCurrency(g.gasolina)}</td>
                      <td className="px-3 py-3 text-xs">{formatCurrency(g.tag)}</td>
                      <td className="px-3 py-3 text-xs">{formatCurrency(g.casetas)}</td>
                      <td className="px-3 py-3 text-xs">{formatCurrency(g.comidas)}</td>
                      <td className="px-3 py-3 text-xs">{formatCurrency(g.otros)}{g.otrosDesc ? ` (${g.otrosDesc})` : ''}</td>
                      <td className="px-3 py-3 font-mono text-xs font-bold text-white">{formatCurrency(total)}</td>
                      <td className="px-3 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ESTADOS_COLOR[g.estado]}`}>{g.estado}</span>
                      </td>
                      <td className="px-3 py-3 text-xs text-carbon-400 whitespace-nowrap">
                        {new Date(g.createdAt).toLocaleDateString('es-MX')}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex gap-1">
                          {g.archivos?.length > 0 && (
                            <span className="text-xs px-2 py-1 bg-carbon-700 rounded" title="Ver archivos">
                              📎 {g.archivos.length}
                            </span>
                          )}
                          {g.estado === 'PENDIENTE' && (
                            <>
                              <button onClick={() => { aprobarMut.mutate({ id: g.id, estado: 'APROBADO' }); toast.success('Aprobado') }}
                                className="text-xs px-2 py-1 bg-green-500/20 hover:bg-green-500/40 text-green-300 rounded">✓</button>
                              <button onClick={() => { aprobarMut.mutate({ id: g.id, estado: 'RECHAZADO' }); toast.info('Rechazado') }}
                                className="text-xs px-2 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded">✕</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: Gastos Fijos ── */}
      {activeTab === 'fijos' && (
        <>
          <div className="flex justify-end">
            <button onClick={() => { setEditFijoId(null); fijoForm.reset(); setModalFijo(true) }} className="btn-primary text-sm">
              + Nuevo Gasto Fijo
            </button>
          </div>
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-carbon-700/50">
                  <tr className="text-carbon-400 text-xs">
                    {['Nombre', 'Categoría', 'Monto', 'Frecuencia', 'Estado', 'Acciones'].map(h => (
                      <th key={h} className="text-left px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingFijos ? (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-carbon-500">Cargando...</td></tr>
                  ) : gastosFijos.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-carbon-500">Sin gastos fijos registrados</td></tr>
                  ) : gastosFijos.map((g: any) => (
                    <tr key={g.id} className="border-t border-carbon-700/50 hover:bg-carbon-700/20">
                      <td className="px-4 py-3 font-medium">{g.nombre}</td>
                      <td className="px-4 py-3 text-carbon-400 text-xs">{g.categoria || '—'}</td>
                      <td className="px-4 py-3 font-mono">{formatCurrency(g.monto)}</td>
                      <td className="px-4 py-3 text-xs">{g.frecuencia}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${g.activo ? 'bg-green-500/20 text-green-300' : 'bg-carbon-600 text-carbon-400'}`}>
                          {g.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => openEditFijo(g)} className="text-xs px-2 py-1 bg-carbon-700 hover:bg-carbon-600 rounded">✏️</button>
                          <button onClick={() => { if (confirm(`¿Eliminar ${g.nombre}?`)) deleteFijoMut.mutate(g.id) }}
                            className="text-xs px-2 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded">🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Tab: Gastos Variables ── */}
      {activeTab === 'variables' && (
        <>
          <div className="flex justify-end">
            <button onClick={() => { setEditVarId(null); varForm.reset({ nombre: '', monto: 0, fecha: new Date().toISOString().slice(0, 10), categoria: '', comprobante: '' }); setModalVariable(true) }}
              className="btn-primary text-sm">+ Nuevo Gasto Variable</button>
          </div>
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-carbon-700/50">
                  <tr className="text-carbon-400 text-xs">
                    {['Nombre', 'Categoría', 'Monto', 'Fecha', 'Comprobante', 'Acciones'].map(h => (
                      <th key={h} className="text-left px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingVars ? (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-carbon-500">Cargando...</td></tr>
                  ) : gastosVariables.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-carbon-500">Sin gastos variables registrados</td></tr>
                  ) : gastosVariables.map((g: any) => (
                    <tr key={g.id} className="border-t border-carbon-700/50 hover:bg-carbon-700/20">
                      <td className="px-4 py-3 font-medium">{g.nombre}</td>
                      <td className="px-4 py-3 text-carbon-400 text-xs">{g.categoria || '—'}</td>
                      <td className="px-4 py-3 font-mono">{formatCurrency(g.monto)}</td>
                      <td className="px-4 py-3 text-carbon-400 text-xs">{new Date(g.fecha).toLocaleDateString('es-MX')}</td>
                      <td className="px-4 py-3 text-xs">{g.comprobante || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => openEditVar(g)} className="text-xs px-2 py-1 bg-carbon-700 hover:bg-carbon-600 rounded">✏️</button>
                          <button onClick={() => { if (confirm(`¿Eliminar ${g.nombre}?`)) deleteVarMut.mutate(g.id) }}
                            className="text-xs px-2 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded">🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal Gasto Fijo */}
      <Modal open={modalFijo} onClose={() => { setModalFijo(false); setEditFijoId(null) }} title={editFijoId ? 'Editar Gasto Fijo' : 'Nuevo Gasto Fijo'} size="md">
        <form onSubmit={fijoForm.handleSubmit(d => saveFijoMut.mutate(d))} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Nombre *</label>
              <input {...fijoForm.register('nombre', { required: true })} className="input" placeholder="ej. Renta de bodega" />
            </div>
            <div>
              <label className="label">Monto (MXN) *</label>
              <input type="number" step="0.01" {...fijoForm.register('monto', { valueAsNumber: true, required: true })} className="input" />
            </div>
            <div>
              <label className="label">Frecuencia</label>
              <select {...fijoForm.register('frecuencia')} className="input">
                {FRECUENCIAS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Categoría</label>
              <select {...fijoForm.register('categoria')} className="input">
                <option value="">Sin categoría</option>
                {CATEGORIAS_FIJO.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalFijo(false)} className="btn-ghost text-sm">Cancelar</button>
            <button type="submit" disabled={saveFijoMut.isPending} className="btn-primary text-sm">
              {saveFijoMut.isPending ? 'Guardando...' : editFijoId ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Gasto Variable */}
      <Modal open={modalVariable} onClose={() => { setModalVariable(false); setEditVarId(null) }} title={editVarId ? 'Editar Gasto Variable' : 'Nuevo Gasto Variable'} size="md">
        <form onSubmit={varForm.handleSubmit(d => saveVarMut.mutate(d))} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Nombre *</label>
              <input {...varForm.register('nombre', { required: true })} className="input" placeholder="ej. Reparación de llanta" />
            </div>
            <div>
              <label className="label">Monto (MXN) *</label>
              <input type="number" step="0.01" {...varForm.register('monto', { valueAsNumber: true, required: true })} className="input" />
            </div>
            <div>
              <label className="label">Fecha</label>
              <input type="date" {...varForm.register('fecha')} className="input" />
            </div>
            <div>
              <label className="label">Categoría</label>
              <select {...varForm.register('categoria')} className="input">
                <option value="">Sin categoría</option>
                {CATEGORIAS_VAR.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">No. Comprobante / Factura</label>
              <input {...varForm.register('comprobante')} className="input" placeholder="ej. FAC-0012" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalVariable(false)} className="btn-ghost text-sm">Cancelar</button>
            <button type="submit" disabled={saveVarMut.isPending} className="btn-primary text-sm">
              {saveVarMut.isPending ? 'Guardando...' : editVarId ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
