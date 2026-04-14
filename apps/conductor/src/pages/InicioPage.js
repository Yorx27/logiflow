import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useConductorStore } from '../stores/conductorStore';
import { toast } from '../stores/toastStore';
import { formatDate, formatCurrency } from '@logiflow/utils';
function SolBadgeMini({ estado }) {
    const cls = {
        PENDIENTE: 'bg-yellow-500/20 text-yellow-300', ASIGNADA: 'bg-blue-500/20 text-blue-300',
        EN_RUTA: 'bg-purple-500/20 text-purple-300', COMPLETADA: 'bg-green-500/20 text-green-300',
        RECHAZADA: 'bg-red-500/20 text-red-300', INCIDENCIA: 'bg-orange-500/20 text-orange-300',
    };
    return (_jsx("span", { className: `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cls[estado] || 'bg-carbon-700 text-carbon-400'}`, children: estado.replace('_', ' ') }));
}
export function InicioPage() {
    const nav = useNavigate();
    const qc = useQueryClient();
    const { conductor } = useConductorStore();
    const { data: entregas = [] } = useQuery({
        queryKey: ['mis-entregas', conductor?.id],
        queryFn: async () => { const r = await api.get(`/conductores/${conductor.id}/entregas`); return r.data.data; },
        enabled: !!conductor,
        refetchInterval: 15000,
    });
    const enCurso = entregas.find((e) => e.estado === 'EN_RUTA');
    const asignadas = entregas.filter((e) => e.estado === 'ASIGNADA');
    const completadas = entregas.filter((e) => e.estado === 'COMPLETADA');
    const incidencias = entregas.filter((e) => e.estado === 'INCIDENCIA');
    const iniciarRutaMut = useMutation({
        mutationFn: (id) => api.put(`/entregas/${id}/estado`, { estado: 'EN_RUTA' }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['mis-entregas'] }); toast.success('¡Ruta iniciada!'); },
        onError: () => toast.error('Error al iniciar ruta'),
    });
    const incidenciaMut = useMutation({
        mutationFn: ({ id, motivo }) => api.put(`/entregas/${id}/estado`, { estado: 'INCIDENCIA', motivo }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['mis-entregas'] }); toast.warning('Incidencia reportada'); },
        onError: () => toast.error('Error al reportar incidencia'),
    });
    const rechazarMut = useMutation({
        mutationFn: ({ id, motivo }) => api.put(`/entregas/${id}/estado`, { estado: 'RECHAZADA', motivo }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['mis-entregas'] }); toast.info('Entrega rechazada'); },
        onError: () => toast.error('Error'),
    });
    function handleIncidencia(entrega) {
        const motivo = prompt('Describe la incidencia:');
        if (motivo)
            incidenciaMut.mutate({ id: entrega.id, motivo });
    }
    function handleRechazar(entrega) {
        const motivo = prompt('Motivo del rechazo:');
        if (motivo)
            rechazarMut.mutate({ id: entrega.id, motivo });
    }
    return (_jsxs("div", { className: "p-4 space-y-4", children: [_jsxs("div", { className: "card bg-gradient-to-br from-amber-500/10 to-carbon-800 border-amber-500/20", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-14 h-14 bg-amber-500/20 border-2 border-amber-500/40 rounded-full flex items-center justify-center text-amber-400 font-bold text-2xl flex-shrink-0", children: conductor?.nombre.charAt(0) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-display font-bold text-xl text-white truncate", children: conductor?.nombre }), _jsx("p", { className: "text-xs font-mono text-carbon-400", children: conductor?.licencia }), _jsxs("span", { className: `inline-flex items-center gap-1 text-xs font-semibold mt-1 px-2 py-0.5 rounded-full
              ${conductor?.estado === 'DISPONIBLE' ? 'bg-green-500/20 text-green-300' : 'bg-purple-500/20 text-purple-300'}`, children: [_jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-current" }), conductor?.estado?.replace('_', ' ')] })] })] }), _jsx("div", { className: "grid grid-cols-3 gap-3 mt-4 text-center", children: [['Activas', asignadas.length + (enCurso ? 1 : 0), 'text-purple-400'],
                            ['Completadas', completadas.length, 'text-green-400'],
                            ['Incidencias', incidencias.length, 'text-orange-400']].map(([l, v, c]) => (_jsxs("div", { className: "bg-carbon-700/50 rounded-xl py-2", children: [_jsx("p", { className: `font-display font-bold text-xl ${c}`, children: v }), _jsx("p", { className: "text-carbon-500 text-xs", children: l })] }, String(l)))) })] }), enCurso && (_jsxs("div", { className: "card border-2 border-amber-500/40 bg-amber-500/5 space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-3 h-3 bg-amber-400 rounded-full pulse-amber flex-shrink-0" }), _jsx("h3", { className: "font-display font-bold text-amber-400", children: "Entrega en Curso" })] }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-white text-lg", children: enCurso.solicitud?.cliente }), enCurso.solicitud?.direccionEntrega && (_jsxs("p", { className: "text-sm text-carbon-400 mt-0.5", children: ["\uD83D\uDCCD ", enCurso.solicitud.direccionEntrega] })), enCurso.solicitud?.descripcionCarga && (_jsxs("p", { className: "text-sm text-carbon-300 mt-1", children: ["\uD83D\uDCE6 ", enCurso.solicitud.descripcionCarga] })), enCurso.solicitud?.fechaEntrega && (_jsxs("p", { className: "text-xs text-carbon-400 mt-1", children: ["\uD83D\uDDD3 ", formatDate(enCurso.solicitud.fechaEntrega), enCurso.solicitud.horaEntrega ? ` · ${enCurso.solicitud.horaEntrega}` : ''] })), enCurso.solicitud?.distanciaKm && (_jsxs("p", { className: "text-xs text-carbon-400", children: ["\uD83D\uDDFA ", enCurso.solicitud.distanciaKm, " km \u00B7 ", enCurso.solicitud.tiempoRuta] }))] }), enCurso.evidencia && (_jsxs("p", { className: "text-xs text-carbon-400", children: ["\uD83D\uDCF8 ", enCurso.evidencia.fotos?.length || 0, " fotos registradas"] })), _jsx("button", { onClick: () => nav(`/checklist/${enCurso.id}`), className: "btn-primary", children: "\uD83D\uDCCB Proceso de Entrega" }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsx("button", { onClick: () => handleIncidencia(enCurso), className: "btn-warning text-sm", children: "\u26A0\uFE0F Incidencia" }), _jsx("button", { onClick: () => handleRechazar(enCurso), className: "btn-danger text-sm", children: "\u274C Rechazar" })] })] })), asignadas.length > 0 && (_jsxs("div", { className: "space-y-3", children: [_jsx("h3", { className: "font-semibold text-carbon-300 text-sm", children: "Entregas Asignadas" }), asignadas.map((e) => (_jsxs("div", { className: "card space-y-3", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { children: [_jsx("p", { className: "font-mono text-amber-400 text-xs", children: e.solicitud?.ot }), _jsx("p", { className: "font-semibold text-white", children: e.solicitud?.cliente }), e.solicitud?.descripcionCarga && _jsx("p", { className: "text-xs text-carbon-400 mt-0.5", children: e.solicitud.descripcionCarga })] }), _jsx(SolBadgeMini, { estado: e.estado })] }), e.solicitud?.fechaEntrega && (_jsxs("p", { className: "text-xs text-carbon-400", children: ["\uD83D\uDDD3 ", formatDate(e.solicitud.fechaEntrega)] })), (e.solicitud?.costo ?? 0) > 0 && (_jsxs("p", { className: "text-xs text-carbon-400", children: ["\uD83D\uDCB0 ", formatCurrency(e.solicitud.costo)] })), _jsx("button", { onClick: () => iniciarRutaMut.mutate(e.id), disabled: iniciarRutaMut.isPending, className: "btn-primary text-sm", children: "\uD83D\uDE80 Iniciar Ruta" })] }, e.id)))] })), completadas.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx("h3", { className: "font-semibold text-carbon-300 text-sm", children: "\u00DAltimas Completadas" }), completadas.slice(0, 3).map((e) => (_jsxs("div", { className: "card flex items-center justify-between gap-3 py-3", children: [_jsxs("div", { children: [_jsx("p", { className: "font-mono text-amber-400 text-xs", children: e.solicitud?.ot }), _jsx("p", { className: "text-sm text-white", children: e.solicitud?.cliente })] }), _jsxs("div", { className: "text-right", children: [_jsx(SolBadgeMini, { estado: e.estado }), e.evidencia && _jsxs("p", { className: "text-xs text-carbon-500 mt-1", children: [e.evidencia.fotos?.length || 0, " fotos"] })] })] }, e.id)))] })), entregas.length === 0 && (_jsxs("div", { className: "card text-center py-12", children: [_jsx("p", { className: "text-4xl mb-3", children: "\uD83D\uDCED" }), _jsx("p", { className: "text-carbon-400", children: "Sin entregas asignadas" })] }))] }));
}
