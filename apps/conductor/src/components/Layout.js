import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useConductorStore } from '../stores/conductorStore';
const NAV = [
    { to: '/inicio', icon: '🏠', label: 'Inicio' },
    { to: '/entregas', icon: '🚚', label: 'Entregas' },
    { to: '/historial', icon: '📋', label: 'Historial' },
    { to: '/notificaciones', icon: '🔔', label: 'Alertas' },
    { to: '/perfil', icon: '👤', label: 'Perfil' },
];
export function Layout() {
    const { conductor } = useConductorStore();
    const location = useLocation();
    const isChecklist = location.pathname.startsWith('/checklist');
    const { data: notifs = [] } = useQuery({
        queryKey: ['notif-conductor', conductor?.id],
        queryFn: async () => { const r = await api.get(`/notificaciones?conductorId=${conductor.id}`); return r.data.data; },
        enabled: !!conductor,
        refetchInterval: 30000,
    });
    const unread = notifs.filter((n) => !n.leida).length;
    return (_jsxs("div", { className: "flex flex-col min-h-screen bg-carbon-900", children: [!isChecklist && (_jsxs("header", { className: "bg-carbon-800/80 backdrop-blur-sm border-b border-carbon-700 px-4 py-3 flex items-center justify-between sticky top-0 z-10", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center font-display font-black text-carbon-900 text-sm", children: "L" }), _jsx("span", { className: "font-display font-bold text-white", children: "LogiFlow" })] }), _jsx("div", { className: "flex items-center gap-2", children: _jsx("div", { className: "w-8 h-8 bg-amber-500/20 border border-amber-500/40 rounded-full flex items-center justify-center text-amber-400 font-bold text-sm", children: conductor?.nombre.charAt(0) }) })] })), _jsx("main", { className: "flex-1 overflow-y-auto pb-20", children: _jsx(Outlet, {}) }), !isChecklist && (_jsx("nav", { className: "fixed bottom-0 left-0 right-0 bg-carbon-800 border-t border-carbon-700 bottom-nav z-20", children: _jsx("div", { className: "flex", children: NAV.map((item) => (_jsxs(NavLink, { to: item.to, className: ({ isActive }) => `flex-1 flex flex-col items-center gap-0.5 py-3 transition-colors relative
                   ${isActive ? 'text-amber-400' : 'text-carbon-500'}`, children: [_jsx("span", { className: "text-xl leading-none", children: item.icon }), _jsx("span", { className: "text-[10px] font-medium", children: item.label }), item.to === '/notificaciones' && unread > 0 && (_jsx("span", { className: "absolute top-2 right-1/4 w-4 h-4 bg-amber-500 text-carbon-900 text-[9px] font-bold rounded-full flex items-center justify-center", children: unread > 9 ? '9+' : unread }))] }, item.to))) }) }))] }));
}
