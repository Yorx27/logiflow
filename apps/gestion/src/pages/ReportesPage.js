import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '../lib/api';
import { toast } from '../stores/uiStore';
import { formatCurrency } from '@logiflow/utils';
const TIPOS_REPORTE = [
    { value: 'solicitudes', label: 'Solicitudes por Estado' },
    { value: 'conductores', label: 'Desempeño por Conductor' },
    { value: 'facturacion', label: 'Facturación del Período' },
    { value: 'incidencias', label: 'Incidencias' },
];
const COLORS = ['#f59e0b', '#8b5cf6', '#22c55e', '#ef4444', '#3b82f6', '#f97316'];
export function ReportesPage() {
    const [tipoReporte, setTipoReporte] = useState('solicitudes');
    const [tipoSol, setTipoSol] = useState('');
    const [ini, setIni] = useState('');
    const [fin, setFin] = useState('');
    const [enabled, setEnabled] = useState(false);
    const { data, isFetching } = useQuery({
        queryKey: ['reporte', tipoReporte, tipoSol, ini, fin, enabled],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (ini)
                params.set('ini', ini);
            if (fin)
                params.set('fin', fin);
            if (tipoSol && tipoReporte === 'solicitudes')
                params.set('tipo', tipoSol);
            const r = await api.get(`/reportes/${tipoReporte}?${params}`);
            return r.data;
        },
        enabled,
    });
    function handleGenerar() { setEnabled(true); }
    async function exportExcel() {
        const params = new URLSearchParams();
        if (ini)
            params.set('ini', ini);
        if (fin)
            params.set('fin', fin);
        if (tipoSol)
            params.set('tipo', tipoSol);
        window.open(`/api/reportes/export/excel?${params}`, '_blank');
        toast.info('Exportando Excel...');
    }
    const rows = data?.data || [];
    const total = rows.reduce((s, r) => s + r.value, 0);
    return (_jsxs("div", { className: "space-y-5", children: [_jsx("h1", { className: "font-display font-bold text-2xl text-white", children: "Reportes" }), _jsxs("div", { className: "card", children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "Tipo de Reporte" }), _jsx("select", { value: tipoReporte, onChange: (e) => { setTipoReporte(e.target.value); setEnabled(false); }, className: "input text-sm", children: TIPOS_REPORTE.map((t) => _jsx("option", { value: t.value, children: t.label }, t.value)) })] }), tipoReporte === 'solicitudes' && (_jsxs("div", { children: [_jsx("label", { className: "label", children: "Tipo Solicitud" }), _jsxs("select", { value: tipoSol, onChange: (e) => setTipoSol(e.target.value), className: "input text-sm", children: [_jsx("option", { value: "", children: "Todos" }), ['DISTRIBUCION', 'RECOLECCION', 'TRANSFERENCIA', 'ULTIMA_MILLA'].map((t) => (_jsx("option", { value: t, children: t.replace('_', ' ') }, t)))] })] })), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Fecha Inicio" }), _jsx("input", { type: "date", value: ini, onChange: (e) => setIni(e.target.value), className: "input text-sm" })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Fecha Fin" }), _jsx("input", { type: "date", value: fin, onChange: (e) => setFin(e.target.value), className: "input text-sm" })] })] }), _jsxs("div", { className: "flex gap-2 mt-4", children: [_jsx("button", { onClick: handleGenerar, disabled: isFetching, className: "btn-primary text-sm", children: isFetching ? 'Generando...' : '📊 Generar Reporte' }), rows.length > 0 && (_jsx("button", { onClick: exportExcel, className: "btn-ghost text-sm", children: "\uD83D\uDCE5 Exportar Excel" }))] })] }), rows.length > 0 && (_jsxs(_Fragment, { children: [data?.total !== undefined && (_jsxs("div", { className: "card", children: [_jsx("p", { className: "text-sm text-carbon-400", children: "Total del per\u00EDodo" }), _jsx("p", { className: "font-display font-bold text-2xl text-amber-400", children: formatCurrency(data.total) })] })), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-5", children: [_jsx("div", { className: "card p-0 overflow-hidden", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-carbon-700/50", children: _jsxs("tr", { className: "text-carbon-400 text-xs", children: [_jsx("th", { className: "text-left px-4 py-3", children: "Concepto" }), _jsx("th", { className: "text-right px-4 py-3", children: "Valor" }), _jsx("th", { className: "text-right px-4 py-3", children: "%" }), _jsx("th", { className: "text-left px-4 py-3", children: "Extra" })] }) }), _jsx("tbody", { children: rows.map((r, i) => (_jsxs("tr", { className: "border-t border-carbon-700/50 table-row-hover", children: [_jsx("td", { className: "px-4 py-2.5 font-medium", children: r.label }), _jsx("td", { className: "px-4 py-2.5 text-right font-mono text-amber-400", children: tipoReporte === 'facturacion' ? formatCurrency(r.value) : r.value }), _jsxs("td", { className: "px-4 py-2.5 text-right text-carbon-400 text-xs", children: [total ? Math.round((r.value / total) * 100) : 0, "%"] }), _jsx("td", { className: "px-4 py-2.5 text-xs text-carbon-400 max-w-[200px] truncate", children: r.extra || '—' })] }, i))) })] }) }), _jsxs("div", { className: "card", children: [_jsx("h3", { className: "font-semibold text-sm text-carbon-300 mb-4", children: "Visualizaci\u00F3n" }), _jsx(ResponsiveContainer, { width: "100%", height: 220, children: _jsxs(BarChart, { data: rows, margin: { top: 0, right: 0, left: -20, bottom: 20 }, children: [_jsx(XAxis, { dataKey: "label", tick: { fill: '#9898a8', fontSize: 10 }, angle: -30, textAnchor: "end" }), _jsx(YAxis, { tick: { fill: '#9898a8', fontSize: 10 } }), _jsx(Tooltip, { contentStyle: { background: '#1e1e28', border: '1px solid #2e2e3a', borderRadius: 8 }, labelStyle: { color: '#fff' } }), _jsx(Bar, { dataKey: "value", radius: [4, 4, 0, 0], children: rows.map((_, i) => _jsx(Cell, { fill: COLORS[i % COLORS.length] }, i)) })] }) })] })] })] })), enabled && rows.length === 0 && !isFetching && (_jsx("div", { className: "card text-center py-10 text-carbon-500", children: "Sin datos para el per\u00EDodo seleccionado" }))] }));
}
