import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { toast } from '../stores/uiStore';
import { Modal } from '../components/ui/Modal';
import { SolBadge } from '../components/ui/StatoBadge';
import { formatDate, formatDateTime } from '@logiflow/utils';
// ─── Sub-estado helpers ───────────────────────────────────────────────────────
const SUB_PASOS = [
    { key: 'EN_RUTA', icon: '🚛', label: 'En Ruta' },
    { key: 'EN_ESPERA', icon: '⏳', label: 'En Espera' },
    { key: 'DESCARGA', icon: '📦', label: 'Descarga' },
    { key: 'ENTREGA_DOCUMENTOS', icon: '📄', label: 'Docs' },
    { key: 'COMPLETADO', icon: '✅', label: 'Completado' },
];
function SubEstadoTimeline({ subEstado }) {
    if (!subEstado)
        return _jsx("span", { className: "text-carbon-500 text-xs", children: "\u2014" });
    const idx = SUB_PASOS.findIndex(p => p.key === subEstado);
    return (_jsx("div", { className: "flex items-center gap-0.5", children: SUB_PASOS.map((paso, i) => {
            const done = i < idx;
            const active = i === idx;
            return (_jsxs("div", { className: "flex items-center", children: [_jsx("div", { title: paso.label, className: `w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all
                ${active ? 'bg-amber-500 text-carbon-900 ring-2 ring-amber-400/50' : done ? 'bg-emerald-500/30 text-emerald-400' : 'bg-carbon-700 text-carbon-600'}`, children: paso.icon }), i < SUB_PASOS.length - 1 && (_jsx("div", { className: `w-3 h-0.5 ${done ? 'bg-emerald-500/50' : 'bg-carbon-700'}` }))] }, paso.key));
        }) }));
}
// ─── Detalle completo de entrega ──────────────────────────────────────────────
function DetalleModal({ entrega, onClose }) {
    const qc = useQueryClient();
    const docs = entrega.documentos ?? [];
    const ev = entrega.evidencia;
    const estadoMut = useMutation({
        mutationFn: (body) => api.put(`/entregas/${entrega.id}/estado`, body),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['entregas'] }); toast.success('Estado actualizado'); },
        onError: (e) => toast.error(e.response?.data?.error || 'Error'),
    });
    const [nuevoEstado, setNuevoEstado] = useState('');
    const [motivo, setMotivo] = useState('');
    return (_jsx(Modal, { open: true, onClose: onClose, title: `Detalle — ${entrega.solicitud?.ot}`, size: "lg", children: _jsxs("div", { className: "p-5 space-y-5", children: [_jsxs("div", { className: "bg-carbon-700/40 rounded-xl p-4", children: [_jsx("p", { className: "text-xs text-carbon-400 mb-3", children: "Actividad del conductor" }), _jsx("div", { className: "flex items-center justify-between", children: SUB_PASOS.map((paso, i) => {
                                const curIdx = SUB_PASOS.findIndex(p => p.key === entrega.subEstado);
                                const done = i < curIdx;
                                const active = i === curIdx;
                                return (_jsxs("div", { className: "flex flex-col items-center gap-1 flex-1", children: [_jsx("div", { className: `w-9 h-9 rounded-full flex items-center justify-center text-base
                    ${active ? 'bg-amber-500 text-carbon-900 ring-2 ring-amber-400/40 shadow-lg' : done ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40' : 'bg-carbon-800 text-carbon-600 ring-1 ring-carbon-600'}`, children: paso.icon }), _jsx("span", { className: `text-xs ${active ? 'text-amber-400 font-semibold' : done ? 'text-emerald-400' : 'text-carbon-600'}`, children: paso.label }), i < SUB_PASOS.length - 1 && (_jsx("div", { className: "absolute" }))] }, paso.key));
                            }) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3 text-sm", children: [_jsxs("div", { className: "bg-carbon-700/40 rounded-lg p-3", children: [_jsx("p", { className: "text-xs text-carbon-400 mb-1", children: "Cliente" }), _jsx("p", { className: "text-white font-medium", children: entrega.solicitud?.cliente }), entrega.solicitud?.rfcCliente && (_jsxs("p", { className: "text-carbon-400 text-xs", children: ["RFC: ", entrega.solicitud.rfcCliente] }))] }), _jsxs("div", { className: "bg-carbon-700/40 rounded-lg p-3", children: [_jsx("p", { className: "text-xs text-carbon-400 mb-1", children: "Conductor / Veh\u00EDculo" }), _jsx("p", { className: "text-white font-medium", children: entrega.conductor?.nombre || '—' }), _jsxs("p", { className: "text-carbon-400 text-xs", children: [entrega.vehiculo?.placa, " \u00B7 ", entrega.vehiculo?.tipo] })] })] }), entrega.remisionUrl ? (_jsxs("a", { href: `http://localhost:3001/api/entregas/${entrega.id}/remision`, target: "_blank", rel: "noopener noreferrer", className: "flex items-center gap-3 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-4 transition-colors group", children: [_jsx("span", { className: "text-2xl", children: "\uD83D\uDCCB" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-emerald-400 font-medium text-sm", children: "Remisi\u00F3n generada" }), _jsxs("p", { className: "text-carbon-400 text-xs", children: ["Descargar formato Excel \u00B7 ", entrega.solicitud?.ot] })] }), _jsx("span", { className: "text-emerald-400 text-xs group-hover:translate-x-0.5 transition-transform", children: "\u2B07 Descargar" })] })) : (_jsxs("div", { className: "flex items-center gap-3 bg-carbon-700/40 border border-carbon-600 rounded-xl p-4", children: [_jsx("span", { className: "text-2xl opacity-40", children: "\uD83D\uDCCB" }), _jsx("p", { className: "text-carbon-500 text-sm", children: "Remisi\u00F3n no generada \u2014 asigna conductor para crearla" })] })), docs.length > 0 && (_jsxs("div", { children: [_jsxs("p", { className: "text-white font-medium text-sm mb-2", children: ["\uD83D\uDCCE Documentos adjuntos (", docs.length, ")"] }), _jsx("div", { className: "grid grid-cols-2 gap-2", children: docs.map((d) => (_jsxs("a", { href: `http://localhost:3001${d.url}`, target: "_blank", rel: "noopener noreferrer", className: "flex items-center gap-2 bg-carbon-700/50 hover:bg-carbon-700 rounded-lg p-2.5 transition-colors", children: [_jsx("span", { className: "text-lg", children: d.tipo?.startsWith('image') ? '🖼' : '📄' }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-white text-xs truncate", children: d.nombre }), _jsx("p", { className: "text-carbon-500 text-xs", children: formatDateTime(d.createdAt) })] })] }, d.id))) })] })), ev && (_jsxs("div", { children: [_jsx("p", { className: "text-white font-medium text-sm mb-2", children: "\u2705 Checklist de evidencia" }), _jsx("div", { className: "grid grid-cols-2 gap-2 text-sm", children: [
                                ['Llegada', ev.checkLlegada], ['Contacto', ev.checkContacto],
                                ['Descarga', ev.checkDescarga], ['Conteo', ev.checkConteo],
                                ['Condición', ev.checkCondicion], ['Remisión', ev.checkRemision], ['Acuse', ev.checkAcuse],
                            ].map(([label, ts]) => (_jsxs("div", { className: `flex items-center gap-2 p-2 rounded-lg ${ts ? 'bg-green-500/10 text-green-300' : 'bg-carbon-700/50 text-carbon-500'}`, children: [_jsx("span", { children: ts ? '✅' : '⬜' }), _jsxs("span", { className: "text-xs", children: [String(label), ts ? ` — ${new Date(String(ts)).toLocaleTimeString('es-MX')}` : ''] })] }, String(label)))) }), ev.tieneFirma && ev.firmaUrl && (_jsxs("div", { className: "mt-3", children: [_jsx("p", { className: "text-xs text-carbon-400 mb-1", children: "Firma del receptor" }), _jsx("img", { src: `http://localhost:3001${ev.firmaUrl}`, alt: "firma", className: "bg-white rounded-lg max-h-24 object-contain p-2" })] })), ev.fotos?.length > 0 && (_jsxs("div", { className: "mt-3", children: [_jsxs("p", { className: "text-xs text-carbon-400 mb-1", children: ["Fotos (", ev.fotos.length, ")"] }), _jsx("div", { className: "grid grid-cols-4 gap-2", children: ev.fotos.map((f) => (_jsx("img", { src: `http://localhost:3001${f.url}`, alt: f.nombre, className: "w-full h-16 object-cover rounded-lg bg-carbon-700" }, f.id))) })] }))] })), (entrega.estado === 'ASIGNADA' || entrega.estado === 'EN_RUTA') && (_jsxs("div", { className: "border-t border-carbon-700 pt-4 space-y-3", children: [_jsx("p", { className: "text-xs text-carbon-400 font-medium uppercase tracking-wide", children: "Cambiar estado de la entrega" }), _jsxs("div", { className: "flex gap-3", children: [_jsxs("select", { value: nuevoEstado, onChange: e => setNuevoEstado(e.target.value), className: "input flex-1 text-sm", children: [_jsx("option", { value: "", children: "Seleccionar\u2026" }), _jsx("option", { value: "EN_RUTA", children: "En Ruta" }), _jsx("option", { value: "COMPLETADA", children: "Completada" }), _jsx("option", { value: "RECHAZADA", children: "Rechazada" }), _jsx("option", { value: "INCIDENCIA", children: "Incidencia" })] }), _jsx("button", { disabled: !nuevoEstado || estadoMut.isPending || ((nuevoEstado === 'RECHAZADA' || nuevoEstado === 'INCIDENCIA') && !motivo), onClick: () => estadoMut.mutate({ estado: nuevoEstado, motivo: motivo || undefined }), className: "btn-primary text-sm px-4 disabled:opacity-40", children: estadoMut.isPending ? '…' : 'Actualizar' })] }), (nuevoEstado === 'RECHAZADA' || nuevoEstado === 'INCIDENCIA') && (_jsx("input", { value: motivo, onChange: e => setMotivo(e.target.value), placeholder: "Motivo obligatorio\u2026", className: "input text-sm" }))] }))] }) }));
}
// ─── Page ─────────────────────────────────────────────────────────────────────
export function EntregasPage() {
    const qc = useQueryClient();
    const [asignarId, setAsignarId] = useState(null);
    const [detalleEnt, setDetalleEnt] = useState(null);
    const [selectedCond, setSelectedCond] = useState('');
    const [selectedVeh, setSelectedVeh] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');
    const { data: entregas = [], isLoading } = useQuery({
        queryKey: ['entregas', filtroEstado],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filtroEstado)
                params.set('estado', filtroEstado);
            const res = await api.get(`/entregas?${params}`);
            return res.data.data;
        },
        refetchInterval: 15000,
    });
    const { data: conductores = [] } = useQuery({
        queryKey: ['conductores'],
        queryFn: async () => { const r = await api.get('/conductores'); return r.data.data; },
    });
    const { data: vehiculos = [] } = useQuery({
        queryKey: ['vehiculos'],
        queryFn: async () => { const r = await api.get('/vehiculos'); return r.data.data; },
    });
    const asignarMut = useMutation({
        mutationFn: () => api.put(`/entregas/${asignarId}/asignar`, { conductorId: selectedCond, vehiculoId: selectedVeh }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['entregas'] });
            toast.success('Entrega asignada — remisión generada automáticamente ✅');
            setAsignarId(null);
        },
        onError: (e) => toast.error(e.response?.data?.error || 'Error al asignar'),
    });
    const disponCond = conductores.filter((c) => c.estado === 'DISPONIBLE');
    const disponVeh = vehiculos.filter((v) => v.estado === 'DISPONIBLE');
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "flex items-center justify-between flex-wrap gap-3", children: [_jsxs("div", { children: [_jsx("h1", { className: "font-display font-bold text-2xl text-white", children: "Entregas" }), _jsxs("p", { className: "text-carbon-400 text-sm", children: [entregas.length, " registros \u00B7 actualiza cada 15s"] })] }), _jsxs("select", { value: filtroEstado, onChange: (e) => setFiltroEstado(e.target.value), className: "input max-w-[180px] text-sm", children: [_jsx("option", { value: "", children: "Todos los estados" }), ['PENDIENTE', 'ASIGNADA', 'EN_RUTA', 'COMPLETADA', 'RECHAZADA', 'INCIDENCIA'].map((e) => (_jsx("option", { value: e, children: e.replace('_', ' ') }, e)))] })] }), _jsx("div", { className: "card p-0 overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-carbon-700/50", children: _jsx("tr", { className: "text-carbon-400 text-xs", children: ['OT', 'Cliente', 'Conductor', 'Vehículo', 'Estado', 'Actividad', 'Remisión', 'Fecha', 'Acciones'].map((h) => (_jsx("th", { className: "text-left px-4 py-3 whitespace-nowrap", children: h }, h))) }) }), _jsx("tbody", { children: isLoading ? (_jsx("tr", { children: _jsx("td", { colSpan: 9, className: "px-4 py-10 text-center text-carbon-500", children: "Cargando..." }) })) : entregas.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 9, className: "px-4 py-10 text-center text-carbon-500", children: "Sin entregas" }) })) : entregas.map((e) => (_jsxs("tr", { className: "border-t border-carbon-700/50 table-row-hover cursor-pointer", onClick: () => setDetalleEnt(e), children: [_jsx("td", { className: "px-4 py-3 font-mono text-amber-400 text-xs whitespace-nowrap", children: e.solicitud?.ot }), _jsxs("td", { className: "px-4 py-3", children: [_jsx("p", { className: "font-medium text-white", children: e.solicitud?.cliente }), e.solicitud?.rfcCliente && _jsx("p", { className: "text-carbon-500 text-xs", children: e.solicitud.rfcCliente })] }), _jsx("td", { className: "px-4 py-3 text-carbon-300 text-xs", children: e.conductor?.nombre || _jsx("span", { className: "text-carbon-600", children: "\u2014" }) }), _jsx("td", { className: "px-4 py-3 text-carbon-300 text-xs", children: e.vehiculo?.placa || _jsx("span", { className: "text-carbon-600", children: "\u2014" }) }), _jsx("td", { className: "px-4 py-3", children: _jsx(SolBadge, { estado: e.estado }) }), _jsx("td", { className: "px-4 py-3", children: _jsx(SubEstadoTimeline, { subEstado: e.subEstado }) }), _jsx("td", { className: "px-4 py-3", children: e.remisionUrl ? (_jsx("a", { href: `http://localhost:3001/api/entregas/${e.id}/remision`, onClick: ev => ev.stopPropagation(), target: "_blank", rel: "noopener noreferrer", className: "text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1", children: "\uD83D\uDCCB Descargar" })) : (_jsx("span", { className: "text-carbon-600 text-xs", children: "\u2014" })) }), _jsx("td", { className: "px-4 py-3 text-carbon-400 text-xs", children: formatDate(e.createdAt) }), _jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex gap-1 flex-wrap", onClick: ev => ev.stopPropagation(), children: [e.estado === 'PENDIENTE' && (_jsx("button", { onClick: () => { setAsignarId(e.id); setSelectedCond(''); setSelectedVeh(''); }, className: "text-xs px-2 py-1 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 rounded", children: "Asignar" })), _jsx("button", { onClick: () => setDetalleEnt(e), className: "text-xs px-2 py-1 bg-carbon-700 hover:bg-carbon-600 text-carbon-300 rounded", children: "Ver" })] }) })] }, e.id))) })] }) }) }), _jsx(Modal, { open: !!asignarId, onClose: () => setAsignarId(null), title: "Asignar Conductor y Veh\u00EDculo", size: "sm", children: _jsxs("div", { className: "p-5 space-y-4", children: [_jsx("div", { className: "bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 text-xs text-amber-300", children: "\uD83D\uDCA1 Al asignar, se generar\u00E1 autom\u00E1ticamente la remisi\u00F3n en Excel" }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Conductor (Disponible)" }), _jsxs("select", { value: selectedCond, onChange: (e) => setSelectedCond(e.target.value), className: "input", children: [_jsx("option", { value: "", children: "Seleccionar..." }), disponCond.map((c) => _jsxs("option", { value: c.id, children: [c.nombre, " \u00B7 ", c.licencia] }, c.id))] }), disponCond.length === 0 && _jsx("p", { className: "text-xs text-orange-400 mt-1", children: "No hay conductores disponibles" })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Veh\u00EDculo (Disponible)" }), _jsxs("select", { value: selectedVeh, onChange: (e) => setSelectedVeh(e.target.value), className: "input", children: [_jsx("option", { value: "", children: "Seleccionar..." }), disponVeh.map((v) => _jsxs("option", { value: v.id, children: [v.placa, " \u00B7 ", v.tipo, " \u00B7 ", v.modelo] }, v.id))] })] }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx("button", { className: "btn-ghost text-sm", onClick: () => setAsignarId(null), children: "Cancelar" }), _jsx("button", { className: "btn-primary text-sm", disabled: !selectedCond || !selectedVeh || asignarMut.isPending, onClick: () => asignarMut.mutate(), children: asignarMut.isPending ? 'Asignando…' : 'Asignar y Generar Remisión' })] })] }) }), detalleEnt && _jsx(DetalleModal, { entrega: detalleEnt, onClose: () => setDetalleEnt(null) })] }));
}
