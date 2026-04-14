import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useConductorStore } from '../stores/conductorStore';
import { toast } from '../stores/toastStore';
import { formatDate } from '@logiflow/utils';
// ─── Subestado stepper ───────────────────────────────────────────────────────
const PASOS = [
    { key: 'EN_RUTA', icon: '🚛', label: 'En Ruta', desc: 'Viajando al destino' },
    { key: 'EN_ESPERA', icon: '⏳', label: 'En Espera', desc: 'Esperando en destino' },
    { key: 'DESCARGA', icon: '📦', label: 'Descarga', desc: 'Descargando mercancía' },
    { key: 'ENTREGA_DOCUMENTOS', icon: '📄', label: 'Documentos', desc: 'Entregando documentos' },
    { key: 'COMPLETADO', icon: '✅', label: 'Completado', desc: 'Entrega finalizada' },
];
function ActividadStepper({ entregaId, subEstadoActual, estadoGeneral, }) {
    const qc = useQueryClient();
    const cambiarMut = useMutation({
        mutationFn: (subEstado) => api.put(`/entregas/${entregaId}/subestado`, { subEstado }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['mis-entregas'] });
            toast.success('Actividad actualizada');
        },
        onError: () => toast.error('Error al actualizar actividad'),
    });
    const curIdx = PASOS.findIndex(p => p.key === subEstadoActual);
    if (!['ASIGNADA', 'EN_RUTA'].includes(estadoGeneral))
        return null;
    return (_jsxs("div", { className: "bg-carbon-800 rounded-2xl p-4 space-y-4", children: [_jsx("p", { className: "text-xs text-carbon-400 font-medium uppercase tracking-wider", children: "Actividad actual" }), _jsx("div", { className: "flex items-center justify-between", children: PASOS.map((paso, i) => {
                    const done = i < curIdx;
                    const active = i === curIdx;
                    return (_jsxs("div", { className: "flex items-center flex-1", children: [_jsxs("div", { className: "flex flex-col items-center gap-1", children: [_jsx("button", { onClick: () => cambiarMut.mutate(paso.key), disabled: cambiarMut.isPending || (i > curIdx + 1), title: paso.desc, className: `w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all
                    ${active ? 'bg-amber-500 text-carbon-900 shadow-lg shadow-amber-500/30 scale-110' : ''}
                    ${done ? 'bg-emerald-500/20 text-emerald-400' : ''}
                    ${!active && !done ? 'bg-carbon-700 text-carbon-500' : ''}
                    ${i <= curIdx + 1 && !done && !active ? 'hover:bg-carbon-600 cursor-pointer' : ''}
                    disabled:cursor-not-allowed`, children: paso.icon }), _jsx("span", { className: `text-xs text-center leading-tight
                  ${active ? 'text-amber-400 font-semibold' : done ? 'text-emerald-400' : 'text-carbon-600'}`, style: { fontSize: '10px' }, children: paso.label })] }), i < PASOS.length - 1 && (_jsx("div", { className: `flex-1 h-0.5 mx-1 -mt-4 rounded ${done ? 'bg-emerald-500/50' : 'bg-carbon-700'}` }))] }, paso.key));
                }) }), curIdx >= 0 && (_jsxs("div", { className: `flex items-center gap-2 rounded-xl px-3 py-2 text-sm
          ${curIdx === PASOS.length - 1 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/10 text-amber-300'}`, children: [_jsx("span", { className: "text-lg", children: PASOS[curIdx].icon }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold", children: PASOS[curIdx].label }), _jsx("p", { className: "text-xs opacity-80", children: PASOS[curIdx].desc })] })] }))] }));
}
// ─── Panel de subida de documentos ───────────────────────────────────────────
function DocumentosPanel({ entregaId, docs }) {
    const qc = useQueryClient();
    const fileRef = useRef(null);
    const [subiendo, setSubiendo] = useState(false);
    async function handleFiles(files) {
        if (!files || files.length === 0)
            return;
        setSubiendo(true);
        try {
            const form = new FormData();
            Array.from(files).forEach(f => form.append('archivos', f));
            await api.post(`/entregas/${entregaId}/documentos`, form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            qc.invalidateQueries({ queryKey: ['mis-entregas'] });
            toast.success(`${files.length} archivo(s) adjuntado(s)`);
        }
        catch (e) {
            toast.error(e.response?.data?.message || 'Error al subir');
        }
        finally {
            setSubiendo(false);
        }
    }
    return (_jsxs("div", { className: "bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-2xl", children: "\uD83D\uDCCE" }), _jsxs("div", { children: [_jsx("p", { className: "text-white font-semibold text-sm", children: "Adjuntar documentos" }), _jsx("p", { className: "text-blue-300/80 text-xs", children: "Acuse, remisi\u00F3n firmada, fotos de documentos" })] })] }), docs.length > 0 && (_jsx("div", { className: "space-y-1.5", children: docs.map((d) => (_jsxs("a", { href: `http://localhost:3001${d.url}`, target: "_blank", rel: "noopener noreferrer", className: "flex items-center gap-2 bg-carbon-800/60 rounded-xl px-3 py-2 text-sm", children: [_jsx("span", { children: d.tipo?.startsWith('image') ? '🖼' : '📄' }), _jsx("span", { className: "text-white text-xs truncate flex-1", children: d.nombre }), _jsx("span", { className: "text-blue-400 text-xs", children: "\u2197" })] }, d.id))) })), _jsx("input", { ref: fileRef, type: "file", multiple: true, accept: "image/*,application/pdf", className: "hidden", onChange: e => handleFiles(e.target.files) }), _jsx("button", { onClick: () => fileRef.current?.click(), disabled: subiendo, className: "w-full flex items-center justify-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 active:bg-blue-500/40 text-blue-300 rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-50", children: subiendo ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "animate-spin", children: "\u23F3" }), " Subiendo\u2026"] })) : (_jsxs(_Fragment, { children: [_jsx("span", { children: "\uD83D\uDCC2" }), " Seleccionar archivos"] })) }), _jsx("p", { className: "text-xs text-carbon-500 text-center", children: "PDF, JPG o PNG \u00B7 m\u00E1x. 10 MB por archivo" })] }));
}
// ─── Descarga de remisión ─────────────────────────────────────────────────────
function RemisionCard({ entregaId, remisionUrl }) {
    if (!remisionUrl)
        return null;
    return (_jsxs("a", { href: `http://localhost:3001/api/entregas/${entregaId}/remision`, target: "_blank", rel: "noopener noreferrer", className: "flex items-center gap-3 bg-emerald-500/10 active:bg-emerald-500/20 border border-emerald-500/25 rounded-2xl px-4 py-3 transition-colors", children: [_jsx("span", { className: "text-2xl", children: "\uD83D\uDCCB" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-white font-semibold text-sm", children: "Remisi\u00F3n disponible" }), _jsx("p", { className: "text-emerald-400/80 text-xs", children: "Toca para descargar el formato Excel" })] }), _jsx("span", { className: "text-emerald-400 text-lg", children: "\u2B07" })] }));
}
function Badge({ estado }) {
    const cls = {
        PENDIENTE: 'bg-yellow-500/20 text-yellow-300',
        ASIGNADA: 'bg-blue-500/20 text-blue-300',
        EN_RUTA: 'bg-purple-500/20 text-purple-300',
        COMPLETADA: 'bg-green-500/20 text-green-300',
        RECHAZADA: 'bg-red-500/20 text-red-300',
        INCIDENCIA: 'bg-orange-500/20 text-orange-300',
    };
    return (_jsx("span", { className: `inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${cls[estado] || ''}`, children: estado.replace('_', ' ') }));
}
// ─── Page ─────────────────────────────────────────────────────────────────────
export function MisEntregasPage() {
    const nav = useNavigate();
    const qc = useQueryClient();
    const { conductor } = useConductorStore();
    const [filtro, setFiltro] = useState('TODAS');
    const [expandida, setExpandida] = useState(null);
    const { data: entregas = [] } = useQuery({
        queryKey: ['mis-entregas', conductor?.id],
        queryFn: async () => {
            const r = await api.get(`/conductores/${conductor.id}/entregas`);
            return r.data.data;
        },
        enabled: !!conductor,
        refetchInterval: 10000,
    });
    const filtradas = entregas.filter((e) => {
        if (filtro === 'ACTIVAS')
            return ['ASIGNADA', 'EN_RUTA'].includes(e.estado);
        if (filtro === 'COMPLETADAS')
            return e.estado === 'COMPLETADA';
        if (filtro === 'INCIDENCIAS')
            return e.estado === 'INCIDENCIA';
        return true;
    });
    const FILTROS = [
        { key: 'TODAS', label: 'Todas', count: entregas.length },
        { key: 'ACTIVAS', label: 'Activas', count: entregas.filter(e => ['ASIGNADA', 'EN_RUTA'].includes(e.estado)).length },
        { key: 'COMPLETADAS', label: 'Completadas' },
        { key: 'INCIDENCIAS', label: 'Incidencias' },
    ];
    return (_jsxs("div", { className: "p-4 space-y-4 pb-24", children: [_jsx("h1", { className: "font-display font-bold text-xl text-white", children: "Mis Entregas" }), _jsx("div", { className: "flex gap-2 overflow-x-auto pb-1 -mx-1 px-1", children: FILTROS.map((f) => (_jsxs("button", { onClick: () => setFiltro(f.key), className: `flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors
              ${filtro === f.key ? 'bg-amber-500 text-carbon-900' : 'bg-carbon-700 text-carbon-300'}`, children: [f.label, f.count !== undefined && f.count > 0 && (_jsx("span", { className: `text-xs px-1.5 py-0.5 rounded-full ${filtro === f.key ? 'bg-carbon-900/30' : 'bg-carbon-600'}`, children: f.count }))] }, f.key))) }), filtradas.length === 0 ? (_jsxs("div", { className: "card text-center py-12", children: [_jsx("p", { className: "text-4xl mb-2", children: "\uD83D\uDCED" }), _jsx("p", { className: "text-carbon-400", children: "Sin entregas" })] })) : (_jsx("div", { className: "space-y-3", children: filtradas.map((e) => {
                    const expanded = expandida === e.id;
                    const docs = e.documentos ?? [];
                    const subEstado = e.subEstado;
                    const remisionUrl = e.remisionUrl;
                    const estaEnDocumentos = subEstado === 'ENTREGA_DOCUMENTOS';
                    return (_jsxs("div", { className: "card space-y-3", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", onClick: () => setExpandida(expanded ? null : e.id), children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-mono text-amber-400 text-xs", children: e.solicitud?.ot }), _jsx("p", { className: "font-semibold text-white truncate", children: e.solicitud?.cliente }), e.solicitud?.descripcionCarga && (_jsxs("p", { className: "text-xs text-carbon-400 mt-0.5 truncate", children: ["\uD83D\uDCE6 ", e.solicitud.descripcionCarga] })), e.solicitud?.direccionEntrega && (_jsxs("p", { className: "text-xs text-carbon-400 truncate", children: ["\uD83D\uDCCD ", e.solicitud.direccionEntrega] }))] }), _jsxs("div", { className: "flex flex-col items-end gap-1.5", children: [_jsx(Badge, { estado: e.estado }), _jsx("span", { className: "text-carbon-500 text-xs", children: expanded ? '▲' : '▼' })] })] }), _jsxs("div", { className: "flex items-center justify-between text-xs text-carbon-500", children: [e.solicitud?.fechaEntrega && _jsxs("span", { children: ["\uD83D\uDDD3 ", formatDate(e.solicitud.fechaEntrega)] }), docs.length > 0 && _jsxs("span", { className: "text-blue-400", children: ["\uD83D\uDCCE ", docs.length, " doc(s)"] }), e.evidencia && _jsxs("span", { children: ["\uD83D\uDCF8 ", e.evidencia.fotos?.length || 0, " fotos"] })] }), e.estado === 'ASIGNADA' && (_jsx("button", { onClick: () => api.put(`/entregas/${e.id}/subestado`, { subEstado: 'EN_RUTA' })
                                    .then(() => qc.invalidateQueries({ queryKey: ['mis-entregas'] })), className: "btn-primary text-sm w-full", children: "\uD83D\uDE9B Iniciar Ruta" })), e.estado === 'EN_RUTA' && (_jsx("button", { onClick: () => nav(`/checklist/${e.id}`), className: "btn-primary text-sm w-full", children: "\uD83D\uDCCB Proceso de Entrega (Checklist)" })), expanded && (_jsxs("div", { className: "space-y-3 pt-2 border-t border-carbon-700", children: [_jsx(RemisionCard, { entregaId: e.id, remisionUrl: remisionUrl }), _jsx(ActividadStepper, { entregaId: e.id, subEstadoActual: subEstado, estadoGeneral: e.estado }), estaEnDocumentos && (_jsx(DocumentosPanel, { entregaId: e.id, docs: docs })), !estaEnDocumentos && docs.length > 0 && (_jsxs("div", { className: "space-y-1.5", children: [_jsx("p", { className: "text-xs text-carbon-400", children: "\uD83D\uDCCE Documentos adjuntos" }), docs.map((d) => (_jsxs("a", { href: `http://localhost:3001${d.url}`, target: "_blank", rel: "noopener noreferrer", className: "flex items-center gap-2 bg-carbon-700/50 rounded-xl px-3 py-2 text-sm", children: [_jsx("span", { children: d.tipo?.startsWith('image') ? '🖼' : '📄' }), _jsx("span", { className: "text-white text-xs truncate", children: d.nombre })] }, d.id)))] })), e.motivo && (_jsxs("p", { className: "text-xs text-orange-300 bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-2", children: ["\u2139\uFE0F ", e.motivo] }))] }))] }, e.id));
                }) }))] }));
}
