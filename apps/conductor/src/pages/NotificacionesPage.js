import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useConductorStore } from '../stores/conductorStore';
import { toast } from '../stores/toastStore';
import { formatRelativeTime } from '@logiflow/utils';
const ICONS = { SUCCESS: '✅', ERROR: '❌', WARNING: '⚠️', INFO: 'ℹ️' };
export function NotificacionesPage() {
    const { conductor } = useConductorStore();
    const qc = useQueryClient();
    const { data: notifs = [] } = useQuery({
        queryKey: ['notif-conductor', conductor?.id],
        queryFn: async () => { const r = await api.get(`/notificaciones?conductorId=${conductor.id}`); return r.data.data; },
        enabled: !!conductor,
        refetchInterval: 30000,
    });
    const limpiarMut = useMutation({
        mutationFn: () => api.delete(`/notificaciones/limpiar?conductorId=${conductor.id}`),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['notif-conductor'] }); toast.success('Notificaciones limpiadas'); },
    });
    return (_jsxs("div", { className: "p-4 space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "font-display font-bold text-xl text-white", children: "Notificaciones" }), notifs.length > 0 && (_jsx("button", { onClick: () => limpiarMut.mutate(), className: "text-xs text-carbon-400 hover:text-white underline", children: "Limpiar" }))] }), notifs.length === 0 ? (_jsxs("div", { className: "card text-center py-12", children: [_jsx("p", { className: "text-4xl mb-2", children: "\uD83D\uDD15" }), _jsx("p", { className: "text-carbon-400", children: "Sin notificaciones" })] })) : (_jsx("div", { className: "space-y-2", children: notifs.map((n) => (_jsxs("div", { className: `card flex items-start gap-3 ${n.leida ? 'opacity-60' : ''}`, children: [_jsx("span", { className: "text-xl", children: ICONS[n.tipo] }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm text-white", children: n.mensaje }), _jsx("p", { className: "text-xs text-carbon-500 mt-0.5", children: formatRelativeTime(n.createdAt) })] }), !n.leida && _jsx("div", { className: "w-2 h-2 bg-amber-400 rounded-full mt-1 flex-shrink-0" })] }, n.id))) }))] }));
}
