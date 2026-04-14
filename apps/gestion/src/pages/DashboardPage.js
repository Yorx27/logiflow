import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, } from 'recharts';
import { api } from '../lib/api';
import { formatDate, formatCurrency } from '@logiflow/utils';
import { SolBadge } from '../components/ui/StatoBadge';
const KPI_CONFIG = [
    { key: 'pendientes', label: 'Pendientes', icon: '⏳', color: 'text-yellow-400' },
    { key: 'enRuta', label: 'En Ruta', icon: '🚚', color: 'text-purple-400' },
    { key: 'conductoresDisp', label: 'Conductores Disp.', icon: '👤', color: 'text-green-400' },
    { key: 'completadas', label: 'Completadas', icon: '✅', color: 'text-green-400' },
    { key: 'rechazadas', label: 'Rechazadas', icon: '❌', color: 'text-red-400' },
    { key: 'incidencias', label: 'Incidencias', icon: '⚠️', color: 'text-orange-400' },
];
const PIE_COLORS = ['#fbbf24', '#8b5cf6', '#22c55e', '#ef4444', '#f97316', '#3b82f6'];
export function DashboardPage() {
    const { data: kpis, isLoading: kLoading } = useQuery({
        queryKey: ['kpis'],
        queryFn: async () => {
            const [p, e, c, comp, r, i] = await Promise.all([
                api.get('/solicitudes?estado=PENDIENTE'),
                api.get('/solicitudes?estado=EN_RUTA'),
                api.get('/conductores'),
                api.get('/solicitudes?estado=COMPLETADA'),
                api.get('/solicitudes?estado=RECHAZADA'),
                api.get('/solicitudes?estado=INCIDENCIA'),
            ]);
            return {
                pendientes: p.data.data.length,
                enRuta: e.data.data.length,
                conductoresDisp: c.data.data.filter((x) => x.estado === 'DISPONIBLE').length,
                completadas: comp.data.data.length,
                rechazadas: r.data.data.length,
                incidencias: i.data.data.length,
            };
        },
        refetchInterval: 30000,
    });
    const { data: recientes } = useQuery({
        queryKey: ['solicitudes-recientes'],
        queryFn: async () => {
            const res = await api.get('/solicitudes?mostrarCompletadas=true');
            return res.data.data.slice(0, 10);
        },
        refetchInterval: 30000,
    });
    // Last 7 days bar data (simplified)
    const barData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
            dia: d.toLocaleDateString('es-MX', { weekday: 'short' }),
            entregas: Math.floor(Math.random() * 8) + 1,
        };
    });
    const pieData = kpis
        ? KPI_CONFIG.slice(0, -1).map((k) => ({ name: k.label, value: kpis[k.key] || 0 }))
        : [];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "font-display font-bold text-2xl text-white", children: "Dashboard" }), _jsx("p", { className: "text-carbon-400 text-sm mt-1", children: "Resumen operacional en tiempo real" })] }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3", children: KPI_CONFIG.map((k) => (_jsxs("div", { className: "card flex flex-col gap-1", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-carbon-400 text-xs", children: k.label }), _jsx("span", { className: "text-base", children: k.icon })] }), _jsx("p", { className: `font-display font-bold text-2xl ${k.color}`, children: kLoading ? '—' : kpis?.[k.key] ?? 0 })] }, k.key))) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "card", children: [_jsx("h3", { className: "font-semibold text-sm text-carbon-300 mb-4", children: "Entregas por d\u00EDa (7 d\u00EDas)" }), _jsx(ResponsiveContainer, { width: "100%", height: 200, children: _jsxs(BarChart, { data: barData, margin: { top: 0, right: 0, left: -20, bottom: 0 }, children: [_jsx(XAxis, { dataKey: "dia", tick: { fill: '#9898a8', fontSize: 11 } }), _jsx(YAxis, { tick: { fill: '#9898a8', fontSize: 11 } }), _jsx(Tooltip, { contentStyle: { background: '#1e1e28', border: '1px solid #2e2e3a', borderRadius: 8 }, labelStyle: { color: '#fff' } }), _jsx(Bar, { dataKey: "entregas", fill: "#f59e0b", radius: [4, 4, 0, 0] })] }) })] }), _jsxs("div", { className: "card", children: [_jsx("h3", { className: "font-semibold text-sm text-carbon-300 mb-4", children: "Distribuci\u00F3n por estado" }), _jsx(ResponsiveContainer, { width: "100%", height: 200, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: pieData, cx: "50%", cy: "50%", innerRadius: 50, outerRadius: 80, dataKey: "value", children: pieData.map((_, i) => (_jsx(Cell, { fill: PIE_COLORS[i % PIE_COLORS.length] }, i))) }), _jsx(Legend, { wrapperStyle: { fontSize: 11, color: '#9898a8' } }), _jsx(Tooltip, { contentStyle: { background: '#1e1e28', border: '1px solid #2e2e3a', borderRadius: 8 } })] }) })] })] }), _jsxs("div", { className: "card", children: [_jsx("h3", { className: "font-semibold text-sm text-carbon-300 mb-4", children: "Actividad reciente" }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "text-carbon-400 text-xs border-b border-carbon-700", children: [_jsx("th", { className: "text-left pb-2", children: "OT" }), _jsx("th", { className: "text-left pb-2", children: "Cliente" }), _jsx("th", { className: "text-left pb-2", children: "Tipo" }), _jsx("th", { className: "text-left pb-2", children: "Estado" }), _jsx("th", { className: "text-left pb-2", children: "Fecha" }), _jsx("th", { className: "text-right pb-2", children: "Costo" })] }) }), _jsxs("tbody", { children: [recientes?.map((s) => (_jsxs("tr", { className: "border-b border-carbon-700/50 table-row-hover", children: [_jsx("td", { className: "py-2.5 font-mono text-amber-400 text-xs", children: s.ot }), _jsx("td", { className: "py-2.5", children: s.cliente }), _jsx("td", { className: "py-2.5 text-carbon-300 text-xs", children: s.tipo.replace('_', ' ') }), _jsx("td", { className: "py-2.5", children: _jsx(SolBadge, { estado: s.estado }) }), _jsx("td", { className: "py-2.5 text-carbon-400 text-xs", children: s.fechaEntrega ? formatDate(s.fechaEntrega) : '—' }), _jsx("td", { className: "py-2.5 text-right font-mono text-xs", children: formatCurrency(s.costo) })] }, s.id))), !recientes?.length && (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "py-8 text-center text-carbon-500", children: "Sin actividad reciente" }) }))] })] }) })] })] }));
}
