import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../lib/api';
import { toast } from '../stores/uiStore';
import { Modal } from '../components/ui/Modal';
import { SolBadge } from '../components/ui/StatoBadge';
import { formatDate, formatCurrency, generateOT } from '@logiflow/utils';
const TIPOS = ['DISTRIBUCION', 'RECOLECCION', 'TRANSFERENCIA', 'ULTIMA_MILLA'];
const TRANSPORTES = ['TORTON', 'RABON', 'VAN', 'PICKUP', 'PLATAFORMA'];
function MapPicker({ value, onChange }) {
    function Inner() {
        useMapEvents({ click(e) { onChange([e.latlng.lat, e.latlng.lng]); } });
        return value ? _jsx(Marker, { position: value, icon: L.divIcon({ className: '', html: '<div style="width:14px;height:14px;background:#f59e0b;border-radius:50%;border:2px solid #fff"></div>' }) }) : null;
    }
    return (_jsxs(MapContainer, { center: [19.4326, -99.1332], zoom: 11, style: { height: 220, width: '100%', borderRadius: 8 }, children: [_jsx(TileLayer, { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" }), _jsx(Inner, {})] }));
}
const defaultValues = {
    ot: '', cliente: '', rfcCliente: '', ordenCompra: '', tipo: 'DISTRIBUCION',
    fechaSolicitud: new Date().toISOString().slice(0, 10),
    fechaEntrega: '', horaEntrega: '', descripcionCarga: '',
    cantidad: 0, tarimas: 0, etiquetasPieza: 0, etiquetasColectivo: 0, papeletas: 0,
    cajaColectiva: false, playo: false, poliBurbuja: false, requiereAcond: false,
    gestionTarimas: false, lineaTransporte: '', tipoTransporte: 'VAN',
    requiereManiobra: false, variosDestinos: false, observaciones: '',
    costo: 0, direccionEntrega: '', latDestino: null, lngDestino: null,
    distanciaKm: null, tiempoRuta: '',
    itemsRemision: [{ partida: 1, descripcion: '', unidad: 'PIEZAS', cantidadSolicitada: 0, cantidadEntregada: 0 }],
};
export function SolicitudesPage() {
    const qc = useQueryClient();
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState(0);
    const [editId, setEditId] = useState(null);
    const [filtroEstado, setFiltroEstado] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [mostrarComp, setMostrarComp] = useState(false);
    const [mapPos, setMapPos] = useState(null);
    const [rutaInfo, setRutaInfo] = useState(null);
    const [calcRuta, setCalcRuta] = useState(false);
    const { data: solicitudes = [], isLoading } = useQuery({
        queryKey: ['solicitudes', filtroEstado, filtroTipo, busqueda, mostrarComp],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filtroEstado)
                params.set('estado', filtroEstado);
            if (filtroTipo)
                params.set('tipo', filtroTipo);
            if (busqueda)
                params.set('cliente', busqueda);
            if (!mostrarComp)
                params.set('mostrarCompletadas', 'false');
            const res = await api.get(`/solicitudes?${params}`);
            return res.data.data;
        },
    });
    const { register, handleSubmit, control, reset, setValue, watch } = useForm({ defaultValues });
    const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({ control, name: 'itemsRemision' });
    const latDest = watch('latDestino');
    const lngDest = watch('lngDestino');
    const tipoTransp = watch('tipoTransporte');
    const mutation = useMutation({
        mutationFn: (data) => editId ? api.put(`/solicitudes/${editId}`, data) : api.post('/solicitudes', data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['solicitudes'] });
            toast.success(editId ? 'Solicitud actualizada' : 'Solicitud creada');
            setOpen(false);
            reset(defaultValues);
            setEditId(null);
            setMapPos(null);
            setRutaInfo(null);
        },
        onError: (e) => toast.error(e.response?.data?.error || 'Error al guardar'),
    });
    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/solicitudes/${id}`),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['solicitudes'] }); toast.success('Solicitud eliminada'); },
        onError: () => toast.error('Error al eliminar'),
    });
    const genEntregaMutation = useMutation({
        mutationFn: (id) => api.post(`/solicitudes/${id}/generar-entrega`),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['solicitudes', 'entregas'] }); toast.success('Entrega generada'); },
        onError: (e) => toast.error(e.response?.data?.error || 'Error'),
    });
    function openNew() {
        reset({ ...defaultValues, ot: generateOT() });
        setEditId(null);
        setMapPos(null);
        setRutaInfo(null);
        setTab(0);
        setOpen(true);
    }
    function openEdit(s) {
        reset({
            ...defaultValues,
            ...s,
            fechaSolicitud: s.fechaSolicitud?.slice(0, 10) || '',
            fechaEntrega: s.fechaEntrega?.slice(0, 10) || '',
            tipoTransporte: s.tipoTransporte || 'VAN',
            rfcCliente: s.rfcCliente || '',
            ordenCompra: s.ordenCompra || '',
            itemsRemision: Array.isArray(s.itemsRemision) && s.itemsRemision.length > 0
                ? s.itemsRemision
                : defaultValues.itemsRemision,
        });
        if (s.latDestino && s.lngDestino)
            setMapPos([s.latDestino, s.lngDestino]);
        setEditId(s.id);
        setTab(0);
        setOpen(true);
    }
    async function handleCalcRuta() {
        if (!latDest || !lngDest)
            return toast.error('Selecciona destino en el mapa');
        setCalcRuta(true);
        try {
            const res = await api.post('/ruta/calcular', { destinoLat: latDest, destinoLng: lngDest, tipoTransporte: tipoTransp });
            const r = res.data.data;
            setRutaInfo(r);
            setValue('distanciaKm', r.km);
            setValue('tiempoRuta', r.tiempo);
            setValue('costo', r.costo);
            toast.success(`Ruta calculada: ${r.km} km · ${r.tiempo}`);
        }
        catch (e) {
            toast.error(e.response?.data?.error || 'Error al calcular ruta');
        }
        finally {
            setCalcRuta(false);
        }
    }
    async function handleGeocode() {
        const dir = watch('direccionEntrega');
        if (!dir)
            return toast.error('Ingresa una dirección');
        try {
            const res = await api.post('/ruta/geocodificar', { direccion: dir });
            const { lat, lng } = res.data.data;
            setMapPos([lat, lng]);
            setValue('latDestino', lat);
            setValue('lngDestino', lng);
            toast.success('Dirección geocodificada');
        }
        catch {
            toast.error('No se encontró la dirección');
        }
    }
    const TABS = ['General', 'Fechas', 'Carga', 'Ruta', 'Transporte', 'Remisión'];
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "flex items-center justify-between gap-3 flex-wrap", children: [_jsxs("div", { children: [_jsx("h1", { className: "font-display font-bold text-2xl text-white", children: "Solicitudes" }), _jsxs("p", { className: "text-carbon-400 text-sm", children: [solicitudes.length, " registros"] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { className: "btn-ghost text-sm", onClick: () => setMostrarComp((v) => !v), children: mostrarComp ? '🙈 Ocultar complet.' : '👁 Ver completadas' }), _jsx("button", { className: "btn-primary text-sm", onClick: openNew, children: "+ Nueva Solicitud" })] })] }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx("input", { value: busqueda, onChange: (e) => setBusqueda(e.target.value), placeholder: "Buscar cliente...", className: "input max-w-xs text-sm" }), _jsxs("select", { value: filtroEstado, onChange: (e) => setFiltroEstado(e.target.value), className: "input max-w-[160px] text-sm", children: [_jsx("option", { value: "", children: "Todos los estados" }), ['PENDIENTE', 'ASIGNADA', 'EN_RUTA', 'COMPLETADA', 'RECHAZADA', 'INCIDENCIA'].map((e) => (_jsx("option", { value: e, children: e.replace('_', ' ') }, e)))] }), _jsxs("select", { value: filtroTipo, onChange: (e) => setFiltroTipo(e.target.value), className: "input max-w-[170px] text-sm", children: [_jsx("option", { value: "", children: "Todos los tipos" }), TIPOS.map((t) => _jsx("option", { value: t, children: t.replace('_', ' ') }, t))] })] }), _jsx("div", { className: "card p-0 overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-carbon-700/50", children: _jsx("tr", { className: "text-carbon-400 text-xs", children: ['OT', 'Cliente', 'Tipo', 'Fecha Entrega', 'Estado', 'Km', 'Tiempo', 'Costo', 'Acciones'].map((h) => (_jsx("th", { className: "text-left px-4 py-3 whitespace-nowrap", children: h }, h))) }) }), _jsx("tbody", { children: isLoading ? (_jsx("tr", { children: _jsx("td", { colSpan: 9, className: "px-4 py-10 text-center text-carbon-500", children: "Cargando..." }) })) : solicitudes.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 9, className: "px-4 py-10 text-center text-carbon-500", children: "Sin solicitudes" }) })) : solicitudes.map((s) => (_jsxs("tr", { className: "border-t border-carbon-700/50 table-row-hover", children: [_jsx("td", { className: "px-4 py-3 font-mono text-amber-400 text-xs whitespace-nowrap", children: s.ot }), _jsx("td", { className: "px-4 py-3 font-medium", children: s.cliente }), _jsx("td", { className: "px-4 py-3 text-carbon-300 text-xs", children: s.tipo.replace('_', ' ') }), _jsx("td", { className: "px-4 py-3 text-carbon-400 text-xs", children: s.fechaEntrega ? formatDate(s.fechaEntrega) : '—' }), _jsx("td", { className: "px-4 py-3", children: _jsx(SolBadge, { estado: s.estado }) }), _jsx("td", { className: "px-4 py-3 text-carbon-300 text-xs", children: s.distanciaKm ? `${s.distanciaKm} km` : '—' }), _jsx("td", { className: "px-4 py-3 text-carbon-300 text-xs", children: s.tiempoRuta || '—' }), _jsx("td", { className: "px-4 py-3 font-mono text-xs", children: formatCurrency(s.costo) }), _jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex gap-1", children: [_jsx("button", { onClick: () => openEdit(s), className: "text-xs px-2 py-1 bg-carbon-700 hover:bg-carbon-600 rounded transition-colors", children: "\u270F\uFE0F" }), !s.entrega && (_jsx("button", { onClick: () => genEntregaMutation.mutate(s.id), className: "text-xs px-2 py-1 bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 rounded transition-colors", title: "Generar entrega", children: "\uD83D\uDE9A" })), _jsx("button", { onClick: () => { if (confirm(`¿Eliminar ${s.ot}?`))
                                                            deleteMutation.mutate(s.id); }, className: "text-xs px-2 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded transition-colors", children: "\uD83D\uDDD1" })] }) })] }, s.id))) })] }) }) }), _jsxs(Modal, { open: open, onClose: () => { setOpen(false); reset(defaultValues); }, title: editId ? 'Editar Solicitud' : 'Nueva Solicitud', size: "xl", children: [_jsx("div", { className: "flex border-b border-carbon-700 px-5", children: TABS.map((t, i) => (_jsx("button", { onClick: () => setTab(i), className: `px-4 py-3 text-sm transition-colors whitespace-nowrap ${tab === i ? 'text-amber-400 border-b-2 border-amber-400' : 'text-carbon-400 hover:text-white'}`, children: t }, t))) }), _jsxs("form", { onSubmit: handleSubmit((d) => mutation.mutate(d)), className: "p-5 space-y-4", children: [tab === 0 && (_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "OT *" }), _jsx("input", { ...register('ot', { required: true }), className: "input" })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Tipo *" }), _jsx("select", { ...register('tipo'), className: "input", children: TIPOS.map((t) => _jsx("option", { value: t, children: t.replace('_', ' ') }, t)) })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Cliente / Remitido a *" }), _jsx("input", { ...register('cliente', { required: true }), className: "input", placeholder: "Nombre de la empresa cliente" })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "RFC del Cliente" }), _jsx("input", { ...register('rfcCliente'), className: "input", placeholder: "ej. DCM991109KR2" })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Orden de Compra / Folio" }), _jsx("input", { ...register('ordenCompra'), className: "input", placeholder: "ej. OC-2024-001 o PENDIENTE" })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Observaciones" }), _jsx("textarea", { ...register('observaciones'), className: "input", rows: 2 })] })] })), tab === 1 && (_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "Fecha Solicitud *" }), _jsx("input", { type: "date", ...register('fechaSolicitud', { required: true }), className: "input" })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Fecha Recolecci\u00F3n" }), _jsx("input", { type: "date", ...register('fechaRecoleccion'), className: "input" })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Fecha Entrega" }), _jsx("input", { type: "date", ...register('fechaEntrega'), className: "input" })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Hora Entrega" }), _jsx("input", { type: "time", ...register('horaEntrega'), className: "input" })] })] })), tab === 2 && (_jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-4", children: [_jsxs("div", { className: "col-span-2 sm:col-span-3", children: [_jsx("label", { className: "label", children: "Descripci\u00F3n de Carga" }), _jsx("textarea", { ...register('descripcionCarga'), className: "input", rows: 2 })] }), [['cantidad', 'Cantidad'], ['tarimas', 'Tarimas'], ['etiquetasPieza', 'Etiq. Pieza'], ['etiquetasColectivo', 'Etiq. Colectivo'], ['papeletas', 'Papeletas']].map(([field, label]) => (_jsxs("div", { children: [_jsx("label", { className: "label", children: label }), _jsx("input", { type: "number", min: 0, ...register(field, { valueAsNumber: true }), className: "input" })] }, field))), _jsx("div", { className: "col-span-2 sm:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-3", children: [['cajaColectiva', 'Caja Colectiva'], ['playo', 'Playo'], ['poliBurbuja', 'Poli Burbuja'], ['requiereAcond', 'Acondicionamiento'], ['gestionTarimas', 'Gestión Tarimas'], ['variosDestinos', 'Varios Destinos'], ['requiereManiobra', 'Requiere Maniobra']].map(([field, label]) => (_jsxs("label", { className: "flex items-center gap-2 text-sm text-carbon-300 cursor-pointer", children: [_jsx("input", { type: "checkbox", ...register(field), className: "accent-amber-500" }), label] }, field))) })] })), tab === 3 && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex gap-2", children: [_jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "label", children: "Direcci\u00F3n de Entrega" }), _jsx("input", { ...register('direccionEntrega'), className: "input", placeholder: "Calle, Colonia, CDMX" })] }), _jsx("button", { type: "button", onClick: handleGeocode, className: "btn-ghost text-sm self-end", children: "\uD83D\uDCCD Geocodificar" })] }), _jsxs("div", { children: [_jsx("label", { className: "label text-xs text-carbon-500", children: "Haz clic en el mapa para seleccionar destino" }), _jsx(MapPicker, { value: mapPos, onChange: (v) => {
                                                    setMapPos(v);
                                                    setValue('latDestino', v[0]);
                                                    setValue('lngDestino', v[1]);
                                                } })] }), (latDest || lngDest) && (_jsxs("p", { className: "text-xs text-carbon-400", children: ["Destino: ", latDest?.toFixed(5), ", ", lngDest?.toFixed(5)] })), _jsx("button", { type: "button", onClick: handleCalcRuta, disabled: calcRuta, className: "btn-primary text-sm", children: calcRuta ? 'Calculando...' : '🗺 Calcular Ruta con OSRM' }), rutaInfo && (_jsxs("div", { className: "bg-carbon-700 rounded-lg p-4 space-y-2", children: [_jsxs("div", { className: "flex gap-4 text-sm", children: [_jsxs("span", { children: ["\uD83D\uDCCF ", _jsxs("b", { children: [rutaInfo.km, " km"] })] }), _jsxs("span", { children: ["\u23F1 ", _jsx("b", { children: rutaInfo.tiempo })] }), _jsxs("span", { children: ["\uD83D\uDCB0 ", _jsx("b", { children: formatCurrency(rutaInfo.costo) })] })] }), rutaInfo.alertas.map((a, i) => (_jsxs("p", { className: "text-xs text-amber-300", children: ["\u26A0\uFE0F ", a] }, i)))] }))] })), tab === 4 && (_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "L\u00EDnea de Transporte" }), _jsx("input", { ...register('lineaTransporte'), className: "input" })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Tipo de Transporte" }), _jsx("select", { ...register('tipoTransporte'), className: "input", children: TRANSPORTES.map((t) => _jsx("option", { value: t, children: t }, t)) })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Costo Total (MXN)" }), _jsx("input", { type: "number", step: "0.01", ...register('costo', { valueAsNumber: true }), className: "input" })] })] })), tab === 5 && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-white font-medium text-sm", children: "\u00CDtems de la Remisi\u00F3n" }), _jsx("p", { className: "text-carbon-400 text-xs mt-0.5", children: "Estos datos llenar\u00E1n el formato Excel autom\u00E1ticamente al asignar la entrega" })] }), _jsx("button", { type: "button", onClick: () => appendItem({ partida: itemFields.length + 1, descripcion: '', unidad: 'PIEZAS', cantidadSolicitada: 0, cantidadEntregada: 0 }), className: "text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 px-3 py-1.5 rounded-lg border border-amber-500/30", children: "+ Agregar \u00EDtem" })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "text-carbon-400 text-xs border-b border-carbon-700", children: [_jsx("th", { className: "text-left py-2 pr-3 w-12", children: "#" }), _jsx("th", { className: "text-left py-2 pr-3", children: "Descripci\u00F3n *" }), _jsx("th", { className: "text-left py-2 pr-3 w-28", children: "Unidad" }), _jsx("th", { className: "text-right py-2 pr-3 w-28", children: "Cant. Solic." }), _jsx("th", { className: "text-right py-2 pr-3 w-28", children: "Cant. Entregada" }), _jsx("th", { className: "w-8" })] }) }), _jsx("tbody", { children: itemFields.map((field, idx) => (_jsxs("tr", { className: "border-b border-carbon-700/40", children: [_jsx("td", { className: "py-2 pr-3", children: _jsx("input", { type: "number", min: 1, ...register(`itemsRemision.${idx}.partida`, { valueAsNumber: true }), className: "w-12 bg-carbon-900 border border-carbon-600 rounded px-2 py-1.5 text-center text-white text-xs focus:outline-none focus:border-amber-500" }) }), _jsx("td", { className: "py-2 pr-3", children: _jsx("input", { ...register(`itemsRemision.${idx}.descripcion`, { required: true }), placeholder: "ej. TARIMA, CAJA, SERVICIO\u2026", className: "w-full bg-carbon-900 border border-carbon-600 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500" }) }), _jsx("td", { className: "py-2 pr-3", children: _jsx("select", { ...register(`itemsRemision.${idx}.unidad`), className: "w-full bg-carbon-900 border border-carbon-600 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500", children: ['PIEZAS', 'CAJAS', 'TARIMAS', 'ROLLOS', 'KG', 'LT', 'SERVICIO', 'METROS'].map(u => _jsx("option", { value: u, children: u }, u)) }) }), _jsx("td", { className: "py-2 pr-3", children: _jsx("input", { type: "number", min: 0, ...register(`itemsRemision.${idx}.cantidadSolicitada`, { valueAsNumber: true }), className: "w-full bg-carbon-900 border border-carbon-600 rounded px-2 py-1.5 text-white text-xs text-right focus:outline-none focus:border-amber-500" }) }), _jsx("td", { className: "py-2 pr-3", children: _jsx("input", { type: "number", min: 0, ...register(`itemsRemision.${idx}.cantidadEntregada`, { valueAsNumber: true }), className: "w-full bg-carbon-900 border border-carbon-600 rounded px-2 py-1.5 text-white text-xs text-right focus:outline-none focus:border-amber-500" }) }), _jsx("td", { className: "py-2", children: itemFields.length > 1 && (_jsx("button", { type: "button", onClick: () => removeItem(idx), className: "text-red-400 hover:text-red-300 text-xs px-1", children: "\u2715" })) })] }, field.id))) })] }) }), _jsx("div", { className: "bg-carbon-700/40 border border-carbon-600 rounded-lg px-4 py-3 text-xs text-carbon-400", children: "\uD83D\uDCA1 Al asignar conductor y veh\u00EDculo en el m\u00F3dulo de Entregas, se generar\u00E1 autom\u00E1ticamente el formato de Remisi\u00F3n en Excel pre-llenado con estos datos, disponible para descarga desde la app del conductor." })] })), _jsxs("div", { className: "flex justify-between pt-4 border-t border-carbon-700", children: [_jsx("div", { className: "flex gap-2", children: tab > 0 && _jsx("button", { type: "button", onClick: () => setTab(t => t - 1), className: "btn-ghost text-sm", children: "\u2190 Anterior" }) }), _jsx("div", { className: "flex gap-2", children: tab < 5
                                            ? _jsx("button", { type: "button", onClick: () => setTab(t => t + 1), className: "btn-primary text-sm", children: "Siguiente \u2192" })
                                            : _jsx("button", { type: "submit", disabled: mutation.isPending, className: "btn-primary text-sm", children: mutation.isPending ? 'Guardando...' : editId ? 'Actualizar' : 'Crear Solicitud' }) })] })] })] })] }));
}
