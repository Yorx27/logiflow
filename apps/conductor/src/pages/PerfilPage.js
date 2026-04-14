import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useConductorStore } from '../stores/conductorStore';
export function PerfilPage() {
    const nav = useNavigate();
    const { conductor, logout } = useConductorStore();
    const { data: entregas = [] } = useQuery({
        queryKey: ['mis-entregas', conductor?.id],
        queryFn: async () => { const r = await api.get(`/conductores/${conductor.id}/entregas`); return r.data.data; },
        enabled: !!conductor,
    });
    const completadas = entregas.filter((e) => e.estado === 'COMPLETADA').length;
    const incidencias = entregas.filter((e) => e.estado === 'INCIDENCIA').length;
    const enRuta = entregas.find((e) => e.estado === 'EN_RUTA');
    const tasa = entregas.length ? Math.round((completadas / entregas.length) * 100) : 0;
    function handleLogout() {
        logout();
        nav('/login', { replace: true });
    }
    return (_jsxs("div", { className: "p-4 space-y-4", children: [_jsxs("div", { className: "card flex flex-col items-center gap-3 text-center py-6", children: [_jsx("div", { className: "w-20 h-20 bg-amber-500/20 border-2 border-amber-500/40 rounded-full flex items-center justify-center text-amber-400 font-bold text-3xl", children: conductor?.nombre.charAt(0) }), _jsxs("div", { children: [_jsx("h2", { className: "font-display font-bold text-xl text-white", children: conductor?.nombre }), _jsx("p", { className: "font-mono text-carbon-400 text-sm", children: conductor?.licencia }), _jsxs("span", { className: `inline-flex items-center gap-1 text-xs font-semibold mt-2 px-3 py-1 rounded-full
            ${conductor?.estado === 'DISPONIBLE' ? 'bg-green-500/20 text-green-300' : 'bg-purple-500/20 text-purple-300'}`, children: [_jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-current" }), conductor?.estado?.replace('_', ' ')] })] })] }), _jsx("div", { className: "grid grid-cols-3 gap-3 text-center", children: [
                    ['Entregas', entregas.length, 'text-white'],
                    ['Completadas', completadas, 'text-green-400'],
                    ['Tasa éxito', `${tasa}%`, 'text-amber-400'],
                ].map(([l, v, c]) => (_jsxs("div", { className: "card", children: [_jsx("p", { className: `font-display font-bold text-xl ${c}`, children: v }), _jsx("p", { className: "text-xs text-carbon-400", children: l })] }, String(l)))) }), conductor?.telefono && (_jsxs("div", { className: "card", children: [_jsx("p", { className: "text-carbon-400 text-xs mb-1", children: "Tel\u00E9fono" }), _jsxs("p", { className: "text-white", children: ["\uD83D\uDCDE ", conductor.telefono] })] })), enRuta?.vehiculo && (_jsxs("div", { className: "card", children: [_jsx("p", { className: "text-carbon-400 text-xs mb-2", children: "Veh\u00EDculo asignado" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-2xl", children: "\uD83D\uDE9A" }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-white font-mono", children: enRuta.vehiculo.placa }), _jsxs("p", { className: "text-xs text-carbon-400", children: [enRuta.vehiculo.tipo, " \u00B7 ", enRuta.vehiculo.modelo] })] })] })] })), incidencias > 0 && (_jsx("div", { className: "card bg-orange-500/5 border-orange-500/20", children: _jsxs("p", { className: "text-orange-300 text-sm", children: ["\u26A0\uFE0F ", incidencias, " incidencia", incidencias > 1 ? 's' : '', " registrada", incidencias > 1 ? 's' : ''] }) })), _jsx("button", { onClick: handleLogout, className: "btn-danger", children: "\uD83D\uDEAA Cerrar Sesi\u00F3n" })] }));
}
