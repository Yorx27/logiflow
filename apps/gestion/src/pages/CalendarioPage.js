import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { SolBadge } from '../components/ui/StatoBadge';
const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
export function CalendarioPage() {
    const [current, setCurrent] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(null);
    const { data: entregas = [] } = useQuery({
        queryKey: ['entregas-calendario'],
        queryFn: async () => { const r = await api.get('/entregas'); return r.data.data; },
    });
    const year = current.getFullYear();
    const month = current.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = Array.from({ length: firstDay + daysInMonth }, (_, i) => i < firstDay ? null : i - firstDay + 1);
    function entregasForDay(day) {
        const d = new Date(year, month, day);
        return entregas.filter((e) => {
            const fecha = e.solicitud?.fechaEntrega;
            if (!fecha)
                return false;
            const f = new Date(fecha);
            return f.getFullYear() === d.getFullYear() && f.getMonth() === d.getMonth() && f.getDate() === d.getDate();
        });
    }
    const selectedEntregas = selectedDay
        ? entregas.filter((e) => {
            const fecha = e.solicitud?.fechaEntrega;
            if (!fecha)
                return false;
            const f = new Date(fecha);
            return (f.getFullYear() === selectedDay.getFullYear() &&
                f.getMonth() === selectedDay.getMonth() &&
                f.getDate() === selectedDay.getDate());
        })
        : [];
    // Weekly summary
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    const weekEntregas = entregas.filter((e) => {
        const fecha = e.solicitud?.fechaEntrega;
        if (!fecha)
            return false;
        const f = new Date(fecha);
        return f >= startOfWeek && f <= endOfWeek;
    });
    return (_jsxs("div", { className: "space-y-5", children: [_jsx("h1", { className: "font-display font-bold text-2xl text-white", children: "Calendario" }), _jsx("div", { className: "grid grid-cols-3 gap-3", children: [
                    { label: 'Esta semana', value: weekEntregas.length, icon: '📅' },
                    { label: 'Completadas', value: weekEntregas.filter(e => e.estado === 'COMPLETADA').length, icon: '✅' },
                    { label: 'Pendientes', value: weekEntregas.filter(e => e.estado === 'PENDIENTE' || e.estado === 'ASIGNADA').length, icon: '⏳' },
                ].map((s) => (_jsxs("div", { className: "card text-center", children: [_jsx("div", { className: "text-2xl mb-1", children: s.icon }), _jsx("div", { className: "font-display font-bold text-2xl text-white", children: s.value }), _jsx("div", { className: "text-xs text-carbon-400", children: s.label })] }, s.label))) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-5", children: [_jsxs("div", { className: "lg:col-span-2 card", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h2", { className: "font-display font-bold text-lg", children: [MESES[month], " ", year] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => setCurrent(new Date(year, month - 1)), className: "btn-ghost text-sm px-3", children: "\u2039" }), _jsx("button", { onClick: () => setCurrent(new Date()), className: "btn-ghost text-sm px-3", children: "Hoy" }), _jsx("button", { onClick: () => setCurrent(new Date(year, month + 1)), className: "btn-ghost text-sm px-3", children: "\u203A" })] })] }), _jsx("div", { className: "grid grid-cols-7 gap-1 mb-2", children: DIAS_SEMANA.map((d) => (_jsx("div", { className: "text-center text-xs text-carbon-500 font-medium py-1", children: d }, d))) }), _jsx("div", { className: "grid grid-cols-7 gap-1", children: days.map((day, i) => {
                                    if (!day)
                                        return _jsx("div", {}, i);
                                    const ents = entregasForDay(day);
                                    const today = new Date();
                                    const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
                                    const isSelected = selectedDay?.getDate() === day && selectedDay?.getMonth() === month && selectedDay?.getFullYear() === year;
                                    return (_jsxs("button", { onClick: () => setSelectedDay(new Date(year, month, day)), className: `aspect-square flex flex-col items-center justify-start p-1 rounded-lg text-sm transition-colors
                    ${isSelected ? 'bg-amber-500/20 border border-amber-500/50' : isToday ? 'bg-blue-500/10 border border-blue-500/30' : 'hover:bg-carbon-700'}`, children: [_jsx("span", { className: `text-xs font-medium ${isToday ? 'text-blue-400' : isSelected ? 'text-amber-400' : 'text-carbon-300'}`, children: day }), ents.length > 0 && (_jsx("div", { className: "w-1.5 h-1.5 bg-blue-400 rounded-full mt-0.5" }))] }, i));
                                }) })] }), _jsxs("div", { className: "card", children: [_jsx("h3", { className: "font-semibold text-sm text-carbon-300 mb-4", children: selectedDay ? selectedDay.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Selecciona un día' }), selectedEntregas.length === 0 ? (_jsx("p", { className: "text-carbon-500 text-sm text-center py-8", children: "Sin entregas este d\u00EDa" })) : (_jsx("div", { className: "space-y-3", children: selectedEntregas.map((e) => (_jsxs("div", { className: "bg-carbon-700/50 rounded-lg p-3 space-y-1", children: [_jsx("p", { className: "font-mono text-amber-400 text-xs", children: e.solicitud?.ot }), _jsx("p", { className: "font-medium text-sm", children: e.solicitud?.cliente }), e.conductor && _jsxs("p", { className: "text-xs text-carbon-400", children: ["\uD83D\uDC64 ", e.conductor.nombre] }), _jsx(SolBadge, { estado: e.estado })] }, e.id))) }))] })] })] }));
}
