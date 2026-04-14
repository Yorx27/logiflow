import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { toast } from '../stores/uiStore';
import { formatRelativeTime } from '@logiflow/utils';
const TIPO_STYLE = {
    SUCCESS: 'border-l-green-500 bg-green-500/5',
    ERROR: 'border-l-red-500 bg-red-500/5',
    WARNING: 'border-l-amber-500 bg-amber-500/5',
    INFO: 'border-l-blue-500 bg-blue-500/5',
};
const TIPO_ICON = { SUCCESS: '✅', ERROR: '❌', WARNING: '⚠️', INFO: 'ℹ️' };
export function NotificacionesPage() {
    const qc = useQueryClient();
    const { data: notifs = [], isLoading } = useQuery({
        queryKey: ['notificaciones'],
        queryFn: async () => { const r = await api.get('/notificaciones'); return r.data.data; },
    });
    const leerMut = useMutation({
        mutationFn: (id) => api.put(`/notificaciones/${id}/leer`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['notificaciones'] }),
    });
    const limpiarMut = useMutation({
        mutationFn: () => api.delete('/notificaciones/limpiar'),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['notificaciones'] }); toast.success('Notificaciones limpiadas'); },
    });
    const unread = notifs.filter((n) => !n.leida).length;
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "font-display font-bold text-2xl text-white", children: "Notificaciones" }), _jsxs("p", { className: "text-carbon-400 text-sm", children: [unread, " sin leer \u00B7 ", notifs.length, " total"] })] }), notifs.length > 0 && (_jsx("button", { onClick: () => { if (confirm('¿Limpiar todas las notificaciones?'))
                            limpiarMut.mutate(); }, className: "btn-ghost text-sm", children: "\uD83D\uDDD1 Limpiar todo" }))] }), isLoading ? (_jsx("p", { className: "text-carbon-500 text-center py-10", children: "Cargando..." })) : notifs.length === 0 ? (_jsxs("div", { className: "card text-center py-16 text-carbon-500", children: [_jsx("p", { className: "text-4xl mb-3", children: "\uD83D\uDD15" }), _jsx("p", { children: "Sin notificaciones" })] })) : (_jsx("div", { className: "space-y-2", children: notifs.map((n) => (_jsxs("div", { className: `card border-l-4 ${TIPO_STYLE[n.tipo]} flex items-start gap-3 cursor-pointer transition-opacity ${n.leida ? 'opacity-60' : ''}`, onClick: () => !n.leida && leerMut.mutate(n.id), children: [_jsx("span", { className: "text-xl mt-0.5", children: TIPO_ICON[n.tipo] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: `text-sm ${n.leida ? 'text-carbon-400' : 'text-white font-medium'}`, children: n.mensaje }), _jsx("p", { className: "text-xs text-carbon-500 mt-1", children: formatRelativeTime(n.createdAt) })] }), !n.leida && _jsx("div", { className: "w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0" })] }, n.id))) }))] }));
}
