import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { SolBadge } from '../components/ui/StatoBadge';
import { CondBadge } from '../components/ui/StatoBadge';
import { formatDate, formatRelativeTime } from '@logiflow/utils';
export function AppConductorPage() {
    const [selectedId, setSelectedId] = useState(null);
    const { data: conductores = [] } = useQuery({
        queryKey: ['conductores'],
        queryFn: async () => { const r = await api.get('/conductores'); return r.data.data; },
    });
    const selected = conductores.find((c) => c.id === selectedId);
    const { data: entregas = [] } = useQuery({
        queryKey: ['cond-entregas', selectedId],
        queryFn: async () => { const r = await api.get(`/conductores/${selectedId}/entregas`); return r.data.data; },
        enabled: !!selectedId,
    });
    const { data: notifs = [] } = useQuery({
        queryKey: ['notif-cond', selectedId],
        queryFn: async () => { const r = await api.get(`/notificaciones?conductorId=${selectedId}`); return r.data.data; },
        enabled: !!selectedId,
    });
    const completadas = entregas.filter((e) => e.estado === 'COMPLETADA').length;
    const activas = entregas.filter((e) => ['ASIGNADA', 'EN_RUTA'].includes(e.estado)).length;
    const incidencias = entregas.filter((e) => e.estado === 'INCIDENCIA').length;
    return (_jsxs("div", { className: "space-y-5", children: [_jsx("h1", { className: "font-display font-bold text-2xl text-white", children: "App Conductor \u2014 Vista interna" }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Seleccionar Conductor" }), _jsxs("select", { value: selectedId || '', onChange: (e) => setSelectedId(e.target.value || null), className: "input max-w-xs", children: [_jsx("option", { value: "", children: "Seleccionar..." }), conductores.map((c) => _jsxs("option", { value: c.id, children: [c.nombre, " \u00B7 ", c.licencia] }, c.id))] })] }), selected && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "card flex flex-col sm:flex-row items-start sm:items-center gap-4", children: [_jsx("div", { className: "w-16 h-16 bg-amber-500/15 border-2 border-amber-500/40 rounded-full flex items-center justify-center text-amber-400 font-bold text-2xl", children: selected.nombre.charAt(0) }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [_jsx("h2", { className: "font-display font-bold text-xl text-white", children: selected.nombre }), _jsx(CondBadge, { estado: selected.estado })] }), _jsx("p", { className: "text-carbon-400 text-sm font-mono mt-0.5", children: selected.licencia })] }), _jsx("div", { className: "grid grid-cols-3 gap-4 text-center", children: [['Activas', activas, 'text-purple-400'], ['Completadas', completadas, 'text-green-400'], ['Incidencias', incidencias, 'text-orange-400']].map(([l, v, c]) => (_jsxs("div", { children: [_jsx("p", { className: `font-display font-bold text-xl ${c}`, children: v }), _jsx("p", { className: "text-carbon-500 text-xs", children: l })] }, String(l)))) })] }), _jsxs("div", { className: "card space-y-3", children: [_jsxs("h3", { className: "font-semibold text-carbon-300", children: ["Entregas (", entregas.length, ")"] }), entregas.length === 0 ? (_jsx("p", { className: "text-carbon-500 text-sm", children: "Sin entregas asignadas" })) : (_jsx("div", { className: "space-y-2", children: entregas.slice(0, 10).map((e) => (_jsxs("div", { className: "bg-carbon-700/50 rounded-lg p-3 flex items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "font-mono text-amber-400 text-xs", children: e.solicitud?.ot }), _jsx("p", { className: "text-sm font-medium", children: e.solicitud?.cliente }), e.solicitud?.fechaEntrega && _jsx("p", { className: "text-xs text-carbon-400", children: formatDate(e.solicitud.fechaEntrega) })] }), _jsx(SolBadge, { estado: e.estado })] }, e.id))) }))] }), _jsxs("div", { className: "card space-y-3", children: [_jsxs("h3", { className: "font-semibold text-carbon-300", children: ["Notificaciones (", notifs.length, ")"] }), notifs.length === 0 ? (_jsx("p", { className: "text-carbon-500 text-sm", children: "Sin notificaciones" })) : (_jsx("div", { className: "space-y-2", children: notifs.map((n) => (_jsxs("div", { className: "flex items-start gap-2 text-sm bg-carbon-700/30 rounded-lg p-2", children: [_jsx("span", { children: n.tipo === 'SUCCESS' ? '✅' : n.tipo === 'ERROR' ? '❌' : n.tipo === 'WARNING' ? '⚠️' : 'ℹ️' }), _jsxs("div", { children: [_jsx("p", { className: "text-carbon-300", children: n.mensaje }), _jsx("p", { className: "text-xs text-carbon-500", children: formatRelativeTime(n.createdAt) })] })] }, n.id))) }))] })] }))] }));
}
