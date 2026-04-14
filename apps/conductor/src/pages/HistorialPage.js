import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useConductorStore } from '../stores/conductorStore';
import { formatDate, formatDateTime } from '@logiflow/utils';
export function HistorialPage() {
    const { conductor } = useConductorStore();
    const { data: entregas = [] } = useQuery({
        queryKey: ['mis-entregas', conductor?.id],
        queryFn: async () => { const r = await api.get(`/conductores/${conductor.id}/entregas`); return r.data.data; },
        enabled: !!conductor,
    });
    const completadas = entregas.filter((e) => e.estado === 'COMPLETADA').length;
    const incidencias = entregas.filter((e) => e.estado === 'INCIDENCIA').length;
    const total = entregas.length;
    const tasa = total ? Math.round((completadas / total) * 100) : 0;
    return (_jsxs("div", { className: "p-4 space-y-4", children: [_jsx("h1", { className: "font-display font-bold text-xl text-white", children: "Historial" }), _jsxs("div", { className: "card space-y-3", children: [_jsxs("div", { className: "grid grid-cols-3 gap-3 text-center", children: [_jsxs("div", { children: [_jsx("p", { className: "font-display font-bold text-2xl text-green-400", children: completadas }), _jsx("p", { className: "text-xs text-carbon-400", children: "Completadas" })] }), _jsxs("div", { children: [_jsx("p", { className: "font-display font-bold text-2xl text-orange-400", children: incidencias }), _jsx("p", { className: "text-xs text-carbon-400", children: "Incidencias" })] }), _jsxs("div", { children: [_jsxs("p", { className: "font-display font-bold text-2xl text-amber-400", children: [tasa, "%"] }), _jsx("p", { className: "text-xs text-carbon-400", children: "Tasa \u00E9xito" })] })] }), _jsx("div", { className: "h-2 bg-carbon-700 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-gradient-to-r from-amber-500 to-green-500 rounded-full transition-all", style: { width: `${tasa}%` } }) })] }), _jsx("div", { className: "space-y-3", children: entregas.length === 0 ? (_jsxs("div", { className: "card text-center py-12", children: [_jsx("p", { className: "text-4xl mb-2", children: "\uD83D\uDCED" }), _jsx("p", { className: "text-carbon-400", children: "Sin historial" })] })) : [...entregas].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map((e) => (_jsxs("div", { className: "card space-y-2", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { children: [_jsx("p", { className: "font-mono text-amber-400 text-xs", children: e.solicitud?.ot }), _jsx("p", { className: "font-semibold text-white", children: e.solicitud?.cliente })] }), _jsx("span", { className: `inline-flex px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0
                ${e.estado === 'COMPLETADA' ? 'bg-green-500/20 text-green-300' : 'bg-orange-500/20 text-orange-300'}`, children: e.estado.replace('_', ' ') })] }), e.evidencia?.horaFinalizacion && (_jsxs("p", { className: "text-xs text-carbon-400", children: ["\u2705 Finalizada: ", formatDateTime(e.evidencia.horaFinalizacion)] })), e.solicitud?.fechaEntrega && !e.evidencia?.horaFinalizacion && (_jsxs("p", { className: "text-xs text-carbon-400", children: ["\uD83D\uDDD3 ", formatDate(e.solicitud.fechaEntrega)] })), e.evidencia && (_jsxs("div", { className: "flex gap-3 text-xs text-carbon-500", children: [_jsxs("span", { children: ["\uD83D\uDCF8 ", e.evidencia.fotos?.length || 0, " fotos"] }), e.evidencia.tieneFirma && _jsx("span", { children: "\u270D\uFE0F Firma" })] }))] }, e.id))) })] }));
}
