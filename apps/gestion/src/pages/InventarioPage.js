import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { api } from '../lib/api';
import { toast } from '../stores/uiStore';
import { formatCurrency, formatDateTime } from '@logiflow/utils';
const UNIDADES = ['pza', 'kg', 'lt', 'caja', 'pallet', 'rollo', 'metro', 'bolsa', 'par'];
const CATEGORIAS = ['Embalaje', 'Documentación', 'Consumibles', 'Herramientas', 'Equipamiento', 'Tarimas', 'Otros'];
// ─── Helpers ─────────────────────────────────────────────────────────────────
function stockColor(p) {
    if (p.stockActual === 0)
        return 'text-red-400';
    if (p.stockMinimo > 0 && p.stockActual <= p.stockMinimo)
        return 'text-amber-400';
    return 'text-emerald-400';
}
function stockBadge(p) {
    if (p.stockActual === 0)
        return { label: 'Sin stock', cls: 'bg-red-500/15 text-red-400 border-red-500/30' };
    if (p.stockMinimo > 0 && p.stockActual <= p.stockMinimo)
        return { label: 'Stock bajo', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
    return { label: 'OK', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
}
function tipoBadge(tipo) {
    if (tipo === 'ENTRADA')
        return 'bg-emerald-500/15 text-emerald-400';
    if (tipo === 'SALIDA')
        return 'bg-red-500/15 text-red-400';
    return 'bg-blue-500/15 text-blue-400';
}
// ─── Modal Producto ───────────────────────────────────────────────────────────
function ProductoModal({ producto, onClose, }) {
    const qc = useQueryClient();
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
        defaultValues: producto ?? {
            sku: '', nombre: '', unidad: 'pza', categoria: '', stockMinimo: 0, precio: '', descripcion: '', activo: true,
        },
    });
    const mutation = useMutation({
        mutationFn: (data) => producto
            ? api.put(`/inventario/productos/${producto.id}`, data).then(r => r.data)
            : api.post('/inventario/productos', data).then(r => r.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['inventario-productos'] });
            qc.invalidateQueries({ queryKey: ['inventario-stock'] });
            toast.success(producto ? 'Producto actualizado' : 'Producto creado');
            onClose();
        },
        onError: (e) => toast.error(e.response?.data?.message || 'Error al guardar'),
    });
    const onSubmit = (data) => {
        data.stockMinimo = Number(data.stockMinimo);
        if (data.precio !== '' && data.precio !== null)
            data.precio = Number(data.precio);
        else
            data.precio = null;
        mutation.mutate(data);
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-carbon-800 border border-carbon-700 rounded-xl w-full max-w-lg shadow-2xl", children: [_jsxs("div", { className: "flex items-center justify-between px-6 py-4 border-b border-carbon-700", children: [_jsx("h2", { className: "font-display font-bold text-white", children: producto ? 'Editar producto' : 'Nuevo producto' }), _jsx("button", { onClick: onClose, className: "text-carbon-400 hover:text-white text-xl", children: "\u2715" })] }), _jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "p-6 space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs text-carbon-400 mb-1", children: "SKU *" }), _jsx("input", { ...register('sku', { required: true }), className: "w-full bg-carbon-900 border border-carbon-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500", placeholder: "INV-001" }), errors.sku && _jsx("p", { className: "text-red-400 text-xs mt-1", children: "Requerido" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs text-carbon-400 mb-1", children: "Unidad" }), _jsx("select", { ...register('unidad'), className: "w-full bg-carbon-900 border border-carbon-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500", children: UNIDADES.map(u => _jsx("option", { value: u, children: u }, u)) })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs text-carbon-400 mb-1", children: "Nombre *" }), _jsx("input", { ...register('nombre', { required: true }), className: "w-full bg-carbon-900 border border-carbon-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500", placeholder: "Nombre del producto" }), errors.nombre && _jsx("p", { className: "text-red-400 text-xs mt-1", children: "Requerido" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs text-carbon-400 mb-1", children: "Descripci\u00F3n" }), _jsx("textarea", { ...register('descripcion'), rows: 2, className: "w-full bg-carbon-900 border border-carbon-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 resize-none", placeholder: "Descripci\u00F3n opcional" })] }), _jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs text-carbon-400 mb-1", children: "Categor\u00EDa" }), _jsxs("select", { ...register('categoria'), className: "w-full bg-carbon-900 border border-carbon-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500", children: [_jsx("option", { value: "", children: "Sin categor\u00EDa" }), CATEGORIAS.map(c => _jsx("option", { value: c, children: c }, c))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs text-carbon-400 mb-1", children: "Stock m\u00EDnimo" }), _jsx("input", { ...register('stockMinimo'), type: "number", min: "0", className: "w-full bg-carbon-900 border border-carbon-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs text-carbon-400 mb-1", children: "Precio unit." }), _jsx("input", { ...register('precio'), type: "number", step: "0.01", min: "0", className: "w-full bg-carbon-900 border border-carbon-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500", placeholder: "0.00" })] })] }), _jsxs("div", { className: "flex justify-end gap-3 pt-2", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-4 py-2 text-sm text-carbon-300 hover:text-white border border-carbon-600 rounded-lg", children: "Cancelar" }), _jsx("button", { type: "submit", disabled: isSubmitting || mutation.isPending, className: "px-6 py-2 text-sm bg-amber-500 hover:bg-amber-400 text-carbon-900 font-semibold rounded-lg disabled:opacity-50", children: mutation.isPending ? 'Guardando…' : 'Guardar' })] })] })] }) }));
}
// ─── Modal Movimiento ─────────────────────────────────────────────────────────
function MovimientoModal({ productos, productoPreseleccionado, onClose, }) {
    const qc = useQueryClient();
    const { register, handleSubmit, watch, formState: { errors } } = useForm({
        defaultValues: { productoId: productoPreseleccionado ?? '', tipo: 'ENTRADA', cantidad: 1, motivo: '' },
    });
    const tipo = watch('tipo');
    const productoId = watch('productoId');
    const productoSel = productos.find(p => p.id === productoId);
    const mutation = useMutation({
        mutationFn: (data) => api.post('/inventario/movimientos', { ...data, cantidad: Number(data.cantidad) }).then(r => r.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['inventario-productos'] });
            qc.invalidateQueries({ queryKey: ['inventario-movimientos'] });
            qc.invalidateQueries({ queryKey: ['inventario-stock'] });
            toast.success('Movimiento registrado');
            onClose();
        },
        onError: (e) => toast.error(e.response?.data?.message || 'Error al registrar'),
    });
    return (_jsx("div", { className: "fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-carbon-800 border border-carbon-700 rounded-xl w-full max-w-md shadow-2xl", children: [_jsxs("div", { className: "flex items-center justify-between px-6 py-4 border-b border-carbon-700", children: [_jsx("h2", { className: "font-display font-bold text-white", children: "Registrar movimiento" }), _jsx("button", { onClick: onClose, className: "text-carbon-400 hover:text-white text-xl", children: "\u2715" })] }), _jsxs("form", { onSubmit: handleSubmit(d => mutation.mutate(d)), className: "p-6 space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs text-carbon-400 mb-1", children: "Tipo *" }), _jsx("div", { className: "grid grid-cols-3 gap-2", children: ['ENTRADA', 'SALIDA', 'AJUSTE'].map(t => (_jsxs("label", { className: `flex items-center justify-center gap-1.5 p-2 rounded-lg border cursor-pointer text-sm font-medium transition-colors
                    ${tipo === t
                                            ? t === 'ENTRADA' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                                : t === 'SALIDA' ? 'bg-red-500/20 border-red-500 text-red-400'
                                                    : 'bg-blue-500/20 border-blue-500 text-blue-400'
                                            : 'border-carbon-600 text-carbon-400 hover:border-carbon-500'}`, children: [_jsx("input", { type: "radio", ...register('tipo'), value: t, className: "sr-only" }), t === 'ENTRADA' ? '↑' : t === 'SALIDA' ? '↓' : '↕', " ", t] }, t))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs text-carbon-400 mb-1", children: "Producto *" }), _jsxs("select", { ...register('productoId', { required: true }), className: "w-full bg-carbon-900 border border-carbon-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500", children: [_jsx("option", { value: "", children: "Seleccionar producto\u2026" }), productos.map(p => (_jsxs("option", { value: p.id, children: [p.sku, " \u2014 ", p.nombre, " (stock: ", p.stockActual, " ", p.unidad, ")"] }, p.id)))] }), errors.productoId && _jsx("p", { className: "text-red-400 text-xs mt-1", children: "Requerido" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs text-carbon-400 mb-1", children: tipo === 'AJUSTE' ? 'Nuevo stock total *' : 'Cantidad *' }), _jsx("input", { ...register('cantidad', { required: true, min: 1 }), type: "number", min: "1", className: "w-full bg-carbon-900 border border-carbon-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" }), productoSel && tipo !== 'AJUSTE' && (_jsxs("p", { className: "text-xs text-carbon-500 mt-1", children: ["Stock actual: ", productoSel.stockActual, " ", productoSel.unidad] }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs text-carbon-400 mb-1", children: "Referencia" }), _jsx("input", { ...register('referencia'), className: "w-full bg-carbon-900 border border-carbon-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500", placeholder: "OT, folio, etc." })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs text-carbon-400 mb-1", children: "Motivo" }), _jsx("input", { ...register('motivo'), className: "w-full bg-carbon-900 border border-carbon-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500", placeholder: "Descripci\u00F3n del movimiento" })] }), _jsxs("div", { className: "flex justify-end gap-3 pt-2", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-4 py-2 text-sm text-carbon-300 hover:text-white border border-carbon-600 rounded-lg", children: "Cancelar" }), _jsx("button", { type: "submit", disabled: mutation.isPending, className: "px-6 py-2 text-sm bg-amber-500 hover:bg-amber-400 text-carbon-900 font-semibold rounded-lg disabled:opacity-50", children: mutation.isPending ? 'Guardando…' : 'Registrar' })] })] })] }) }));
}
// ─── Tab: Stock ───────────────────────────────────────────────────────────────
function TabStock({ onMovimiento }) {
    const { data } = useQuery({
        queryKey: ['inventario-stock'],
        queryFn: () => api.get('/inventario/stock').then(r => r.data.data),
        refetchInterval: 30000,
    });
    if (!data)
        return _jsx("div", { className: "text-carbon-400 py-12 text-center text-sm", children: "Cargando\u2026" });
    const { resumen, alertas, ultimosMovimientos } = data;
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [
                    { label: 'Total productos', value: resumen.total, icon: '📦', color: 'text-white' },
                    { label: 'Stock OK', value: resumen.stockOk, icon: '✅', color: 'text-emerald-400' },
                    { label: 'Stock bajo', value: resumen.stockBajo, icon: '⚠️', color: 'text-amber-400' },
                    { label: 'Sin stock', value: resumen.sinStock, icon: '🚫', color: 'text-red-400' },
                ].map(kpi => (_jsxs("div", { className: "bg-carbon-800 border border-carbon-700 rounded-xl p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-xs text-carbon-400", children: kpi.label }), _jsx("span", { className: "text-lg", children: kpi.icon })] }), _jsx("p", { className: `text-3xl font-display font-bold ${kpi.color}`, children: kpi.value })] }, kpi.label))) }), alertas.length > 0 && (_jsxs("div", { className: "bg-amber-500/10 border border-amber-500/30 rounded-xl p-4", children: [_jsxs("h3", { className: "text-amber-400 font-semibold text-sm mb-3", children: ["\u26A0\uFE0F Alertas de stock (", alertas.length, ")"] }), _jsx("div", { className: "space-y-2", children: alertas.map((p) => (_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "text-white font-medium", children: p.nombre }), _jsxs("span", { className: "text-carbon-400 ml-2 text-xs", children: ["SKU: ", p.sku] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("span", { className: `font-bold ${stockColor(p)}`, children: [p.stockActual, " ", p.unidad] }), _jsxs("span", { className: "text-carbon-500 text-xs", children: ["/ m\u00EDn. ", p.stockMinimo] }), _jsx("button", { onClick: () => onMovimiento(p.id), className: "text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 px-2 py-1 rounded-lg", children: "+ Entrada" })] })] }, p.id))) })] })), _jsxs("div", { className: "bg-carbon-800 border border-carbon-700 rounded-xl", children: [_jsx("div", { className: "px-5 py-4 border-b border-carbon-700", children: _jsx("h3", { className: "font-semibold text-white text-sm", children: "\u00DAltimos movimientos" }) }), ultimosMovimientos.length === 0 ? (_jsx("p", { className: "text-carbon-400 text-sm px-5 py-8 text-center", children: "Sin movimientos registrados" })) : (_jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "text-carbon-400 text-xs border-b border-carbon-700", children: [_jsx("th", { className: "text-left px-5 py-3", children: "Producto" }), _jsx("th", { className: "text-left px-4 py-3", children: "Tipo" }), _jsx("th", { className: "text-right px-4 py-3", children: "Cantidad" }), _jsx("th", { className: "text-right px-4 py-3", children: "Stock resultante" }), _jsx("th", { className: "text-left px-4 py-3", children: "Motivo" }), _jsx("th", { className: "text-left px-4 py-3", children: "Fecha" })] }) }), _jsx("tbody", { children: ultimosMovimientos.map((m) => (_jsxs("tr", { className: "border-b border-carbon-700/50 hover:bg-carbon-700/30", children: [_jsx("td", { className: "px-5 py-3 text-white font-medium", children: m.producto?.nombre }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: `px-2 py-0.5 rounded text-xs font-medium ${tipoBadge(m.tipo)}`, children: m.tipo }) }), _jsxs("td", { className: `px-4 py-3 text-right font-bold ${m.tipo === 'ENTRADA' ? 'text-emerald-400' : m.tipo === 'SALIDA' ? 'text-red-400' : 'text-blue-400'}`, children: [m.tipo === 'ENTRADA' ? '+' : m.tipo === 'SALIDA' ? '-' : '=', Math.abs(m.cantidad), " ", m.producto?.unidad] }), _jsxs("td", { className: "px-4 py-3 text-right text-white", children: [m.stockDespues, " ", m.producto?.unidad] }), _jsx("td", { className: "px-4 py-3 text-carbon-400 max-w-[160px] truncate", children: m.motivo || '—' }), _jsx("td", { className: "px-4 py-3 text-carbon-400 text-xs", children: formatDateTime(m.createdAt) })] }, m.id))) })] }))] })] }));
}
// ─── Tab: Productos ───────────────────────────────────────────────────────────
function TabProductos({ onMovimiento }) {
    const qc = useQueryClient();
    const [buscar, setBuscar] = useState('');
    const [categoriaFiltro, setCategoriaFiltro] = useState('');
    const [modalProducto, setModalProducto] = useState(null);
    const { data: productos = [], isLoading } = useQuery({
        queryKey: ['inventario-productos', buscar, categoriaFiltro],
        queryFn: () => {
            const params = { activo: 'true' };
            if (buscar)
                params.buscar = buscar;
            if (categoriaFiltro)
                params.categoria = categoriaFiltro;
            return api.get('/inventario/productos', { params }).then(r => r.data.data);
        },
    });
    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/inventario/productos/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['inventario-productos'] });
            toast.success('Producto desactivado');
        },
        onError: () => toast.error('Error al desactivar'),
    });
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsx("input", { value: buscar, onChange: e => setBuscar(e.target.value), placeholder: "Buscar por SKU o nombre\u2026", className: "bg-carbon-800 border border-carbon-700 rounded-lg px-3 py-2 text-sm text-white placeholder-carbon-500 focus:outline-none focus:border-amber-500 w-64" }), _jsxs("select", { value: categoriaFiltro, onChange: e => setCategoriaFiltro(e.target.value), className: "bg-carbon-800 border border-carbon-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500", children: [_jsx("option", { value: "", children: "Todas las categor\u00EDas" }), CATEGORIAS.map(c => _jsx("option", { value: c, children: c }, c))] }), _jsx("button", { onClick: () => setModalProducto('nuevo'), className: "ml-auto flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-carbon-900 font-semibold text-sm px-4 py-2 rounded-lg", children: "+ Nuevo producto" })] }), _jsx("div", { className: "bg-carbon-800 border border-carbon-700 rounded-xl overflow-hidden", children: isLoading ? (_jsx("p", { className: "text-carbon-400 text-sm px-5 py-8 text-center", children: "Cargando\u2026" })) : productos.length === 0 ? (_jsx("p", { className: "text-carbon-400 text-sm px-5 py-8 text-center", children: "No se encontraron productos" })) : (_jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "text-carbon-400 text-xs border-b border-carbon-700", children: [_jsx("th", { className: "text-left px-5 py-3", children: "SKU" }), _jsx("th", { className: "text-left px-4 py-3", children: "Nombre" }), _jsx("th", { className: "text-left px-4 py-3", children: "Categor\u00EDa" }), _jsx("th", { className: "text-right px-4 py-3", children: "Stock" }), _jsx("th", { className: "text-right px-4 py-3", children: "M\u00EDnimo" }), _jsx("th", { className: "text-right px-4 py-3", children: "Precio" }), _jsx("th", { className: "text-center px-4 py-3", children: "Estado" }), _jsx("th", { className: "text-right px-4 py-3", children: "Acciones" })] }) }), _jsx("tbody", { children: productos.map(p => {
                                        const badge = stockBadge(p);
                                        return (_jsxs("tr", { className: "border-b border-carbon-700/50 hover:bg-carbon-700/30", children: [_jsx("td", { className: "px-5 py-3 font-mono text-xs text-carbon-400", children: p.sku }), _jsxs("td", { className: "px-4 py-3", children: [_jsx("p", { className: "text-white font-medium", children: p.nombre }), p.descripcion && _jsx("p", { className: "text-carbon-500 text-xs truncate max-w-[200px]", children: p.descripcion })] }), _jsx("td", { className: "px-4 py-3 text-carbon-400", children: p.categoria || '—' }), _jsxs("td", { className: `px-4 py-3 text-right font-bold ${stockColor(p)}`, children: [p.stockActual, " ", _jsx("span", { className: "text-carbon-500 font-normal", children: p.unidad })] }), _jsx("td", { className: "px-4 py-3 text-right text-carbon-400", children: p.stockMinimo }), _jsx("td", { className: "px-4 py-3 text-right text-carbon-400", children: p.precio ? formatCurrency(p.precio) : '—' }), _jsx("td", { className: "px-4 py-3 text-center", children: _jsx("span", { className: `px-2 py-0.5 rounded border text-xs font-medium ${badge.cls}`, children: badge.label }) }), _jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex items-center justify-end gap-1", children: [_jsx("button", { onClick: () => onMovimiento(p.id), className: "text-xs bg-carbon-700 hover:bg-carbon-600 text-carbon-300 px-2 py-1 rounded", title: "Registrar movimiento", children: "\u00B1 Mov" }), _jsx("button", { onClick: () => setModalProducto(p), className: "text-xs bg-carbon-700 hover:bg-carbon-600 text-carbon-300 px-2 py-1 rounded", title: "Editar", children: "\u270F\uFE0F" }), _jsx("button", { onClick: () => { if (confirm(`¿Desactivar "${p.nombre}"?`))
                                                                    deleteMutation.mutate(p.id); }, className: "text-xs bg-red-500/15 hover:bg-red-500/25 text-red-400 px-2 py-1 rounded", title: "Desactivar", children: "\uD83D\uDDD1" })] }) })] }, p.id));
                                    }) })] })) })] }), modalProducto && (_jsx(ProductoModal, { producto: modalProducto === 'nuevo' ? null : modalProducto, onClose: () => setModalProducto(null) }))] }));
}
// ─── Tab: Movimientos ─────────────────────────────────────────────────────────
function TabMovimientos() {
    const [tipoFiltro, setTipoFiltro] = useState('');
    const [productoFiltro, setProductoFiltro] = useState('');
    const [page, setPage] = useState(1);
    const { data: productosData } = useQuery({
        queryKey: ['inventario-productos-lista'],
        queryFn: () => api.get('/inventario/productos', { params: { activo: 'true' } }).then(r => r.data.data),
    });
    const { data, isLoading } = useQuery({
        queryKey: ['inventario-movimientos', tipoFiltro, productoFiltro, page],
        queryFn: () => {
            const params = { page, limit: 30 };
            if (tipoFiltro)
                params.tipo = tipoFiltro;
            if (productoFiltro)
                params.productoId = productoFiltro;
            return api.get('/inventario/movimientos', { params }).then(r => r.data);
        },
    });
    const movimientos = data?.data ?? [];
    const total = data?.total ?? 0;
    const pages = Math.ceil(total / 30);
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsxs("select", { value: tipoFiltro, onChange: e => { setTipoFiltro(e.target.value); setPage(1); }, className: "bg-carbon-800 border border-carbon-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500", children: [_jsx("option", { value: "", children: "Todos los tipos" }), _jsx("option", { value: "ENTRADA", children: "Entradas" }), _jsx("option", { value: "SALIDA", children: "Salidas" }), _jsx("option", { value: "AJUSTE", children: "Ajustes" })] }), _jsxs("select", { value: productoFiltro, onChange: e => { setProductoFiltro(e.target.value); setPage(1); }, className: "bg-carbon-800 border border-carbon-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 max-w-xs", children: [_jsx("option", { value: "", children: "Todos los productos" }), productosData?.map(p => _jsxs("option", { value: p.id, children: [p.sku, " \u2014 ", p.nombre] }, p.id))] }), _jsxs("span", { className: "ml-auto text-carbon-500 text-xs", children: [total, " movimientos"] })] }), _jsx("div", { className: "bg-carbon-800 border border-carbon-700 rounded-xl overflow-hidden", children: isLoading ? (_jsx("p", { className: "text-carbon-400 text-sm px-5 py-8 text-center", children: "Cargando\u2026" })) : movimientos.length === 0 ? (_jsx("p", { className: "text-carbon-400 text-sm px-5 py-8 text-center", children: "Sin movimientos registrados" })) : (_jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "text-carbon-400 text-xs border-b border-carbon-700", children: [_jsx("th", { className: "text-left px-5 py-3", children: "Fecha" }), _jsx("th", { className: "text-left px-4 py-3", children: "Producto" }), _jsx("th", { className: "text-center px-4 py-3", children: "Tipo" }), _jsx("th", { className: "text-right px-4 py-3", children: "Cantidad" }), _jsx("th", { className: "text-right px-4 py-3", children: "Antes" }), _jsx("th", { className: "text-right px-4 py-3", children: "Despu\u00E9s" }), _jsx("th", { className: "text-left px-4 py-3", children: "Referencia" }), _jsx("th", { className: "text-left px-4 py-3", children: "Motivo" })] }) }), _jsx("tbody", { children: movimientos.map(m => (_jsxs("tr", { className: "border-b border-carbon-700/50 hover:bg-carbon-700/30", children: [_jsx("td", { className: "px-5 py-3 text-carbon-400 text-xs whitespace-nowrap", children: formatDateTime(m.createdAt) }), _jsxs("td", { className: "px-4 py-3", children: [_jsx("p", { className: "text-white font-medium", children: m.producto?.nombre }), _jsx("p", { className: "text-carbon-500 text-xs", children: m.producto?.sku })] }), _jsx("td", { className: "px-4 py-3 text-center", children: _jsx("span", { className: `px-2 py-0.5 rounded text-xs font-medium ${tipoBadge(m.tipo)}`, children: m.tipo }) }), _jsxs("td", { className: `px-4 py-3 text-right font-bold ${m.tipo === 'ENTRADA' ? 'text-emerald-400' : m.tipo === 'SALIDA' ? 'text-red-400' : 'text-blue-400'}`, children: [m.tipo === 'ENTRADA' ? '+' : m.tipo === 'SALIDA' ? '-' : '=', Math.abs(m.cantidad), " ", m.producto?.unidad] }), _jsx("td", { className: "px-4 py-3 text-right text-carbon-400", children: m.stockAntes }), _jsx("td", { className: "px-4 py-3 text-right text-white font-medium", children: m.stockDespues }), _jsx("td", { className: "px-4 py-3 text-carbon-400 text-xs", children: m.referencia || '—' }), _jsx("td", { className: "px-4 py-3 text-carbon-400 text-xs max-w-[160px] truncate", children: m.motivo || '—' })] }, m.id))) })] })) }), pages > 1 && (_jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsx("button", { onClick: () => setPage(p => Math.max(1, p - 1)), disabled: page === 1, className: "px-3 py-1 text-sm bg-carbon-800 border border-carbon-700 rounded text-carbon-300 disabled:opacity-40", children: "\u2190 Ant" }), _jsxs("span", { className: "text-carbon-400 text-sm", children: [page, " / ", pages] }), _jsx("button", { onClick: () => setPage(p => Math.min(pages, p + 1)), disabled: page === pages, className: "px-3 py-1 text-sm bg-carbon-800 border border-carbon-700 rounded text-carbon-300 disabled:opacity-40", children: "Sig \u2192" })] }))] }));
}
// ─── Page Principal ───────────────────────────────────────────────────────────
export function InventarioPage() {
    const [tab, setTab] = useState('stock');
    const [showMovModal, setShowMovModal] = useState(false);
    const [productoPresel, setProductoPresel] = useState();
    const { data: productos = [] } = useQuery({
        queryKey: ['inventario-productos-lista'],
        queryFn: () => api.get('/inventario/productos', { params: { activo: 'true' } }).then(r => r.data.data),
    });
    const abrirMovimiento = (productoId) => {
        setProductoPresel(productoId);
        setShowMovModal(true);
    };
    const TABS = [
        { id: 'stock', label: 'Resumen Stock', icon: '📊' },
        { id: 'productos', label: 'Productos', icon: '📦' },
        { id: 'movimientos', label: 'Movimientos', icon: '↕️' },
    ];
    return (_jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "font-display font-bold text-2xl text-white", children: "Inventario" }), _jsx("p", { className: "text-carbon-400 text-sm mt-0.5", children: "Control de productos, entradas y salidas" })] }), _jsx("button", { onClick: () => abrirMovimiento(), className: "flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-carbon-900 font-semibold text-sm px-4 py-2 rounded-lg", children: "\u00B1 Registrar movimiento" })] }), _jsx("div", { className: "flex gap-1 bg-carbon-800 border border-carbon-700 rounded-xl p-1 w-fit", children: TABS.map(t => (_jsxs("button", { onClick: () => setTab(t.id), className: `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${tab === t.id
                        ? 'bg-amber-500 text-carbon-900'
                        : 'text-carbon-400 hover:text-white'}`, children: [_jsx("span", { children: t.icon }), t.label] }, t.id))) }), tab === 'stock' && _jsx(TabStock, { onMovimiento: abrirMovimiento }), tab === 'productos' && _jsx(TabProductos, { onMovimiento: abrirMovimiento }), tab === 'movimientos' && _jsx(TabMovimientos, {}), showMovModal && (_jsx(MovimientoModal, { productos: productos, productoPreseleccionado: productoPresel, onClose: () => { setShowMovModal(false); setProductoPresel(undefined); } }))] }));
}
