import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const SOL_COLORS = {
    PENDIENTE: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    ASIGNADA: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    EN_RUTA: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    COMPLETADA: 'bg-green-500/20 text-green-300 border-green-500/30',
    RECHAZADA: 'bg-red-500/20 text-red-300 border-red-500/30',
    INCIDENCIA: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
};
const SOL_LABELS = {
    PENDIENTE: 'Pendiente', ASIGNADA: 'Asignada', EN_RUTA: 'En Ruta',
    COMPLETADA: 'Completada', RECHAZADA: 'Rechazada', INCIDENCIA: 'Incidencia',
};
const COND_COLORS = {
    DISPONIBLE: 'bg-green-500/20 text-green-300 border-green-500/30',
    EN_RUTA: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    INACTIVO: 'bg-carbon-600/40 text-carbon-400 border-carbon-600/30',
};
const FACT_COLORS = {
    BORRADOR: 'bg-carbon-600/40 text-carbon-300 border-carbon-600/30',
    EMITIDA: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    PAGADA: 'bg-green-500/20 text-green-300 border-green-500/30',
    CANCELADA: 'bg-red-500/20 text-red-300 border-red-500/30',
};
export function SolBadge({ estado }) {
    return (_jsx("span", { className: `badge border ${SOL_COLORS[estado]}`, children: SOL_LABELS[estado] }));
}
export function CondBadge({ estado }) {
    return (_jsxs("span", { className: `badge border ${COND_COLORS[estado]}`, children: [estado === 'DISPONIBLE' ? '🟢' : estado === 'EN_RUTA' ? '🟣' : '⚫', " ", estado.replace('_', ' ')] }));
}
export function VehBadge({ estado }) {
    const cls = estado === 'DISPONIBLE'
        ? 'bg-green-500/20 text-green-300 border-green-500/30'
        : estado === 'EN_RUTA'
            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
            : 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    return _jsx("span", { className: `badge border ${cls}`, children: estado.replace('_', ' ') });
}
export function FactBadge({ estado }) {
    return _jsx("span", { className: `badge border ${FACT_COLORS[estado]}`, children: estado });
}
