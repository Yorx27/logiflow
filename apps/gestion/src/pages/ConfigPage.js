import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { api } from '../lib/api';
import { toast } from '../stores/uiStore';
import { formatCurrency } from '@logiflow/utils';
import { useEffect } from 'react';
export function ConfigPage() {
    const qc = useQueryClient();
    const { data: cfg, isLoading } = useQuery({
        queryKey: ['config'],
        queryFn: async () => { const r = await api.get('/config'); return r.data.data; },
    });
    const { register, handleSubmit, reset, watch } = useForm();
    useEffect(() => {
        if (cfg)
            reset(cfg);
    }, [cfg, reset]);
    const saveMut = useMutation({
        mutationFn: (d) => api.put('/config', d),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['config'] }); toast.success('Configuración guardada'); },
        onError: () => toast.error('Error al guardar'),
    });
    const watched = watch();
    const sample = cfg ? {
        etiq: 10 * 100 * (watched.costoEtiqueta || cfg.costoEtiqueta),
        tarima: 4 * (watched.costoTarima || cfg.costoTarima),
        papeleta: 5 * (watched.costoPapeleta || cfg.costoPapeleta),
    } : null;
    if (isLoading)
        return _jsx("p", { className: "text-carbon-500 text-center py-20", children: "Cargando..." });
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "font-display font-bold text-2xl text-white", children: "Configuraci\u00F3n" }), _jsxs("form", { onSubmit: handleSubmit((d) => saveMut.mutate(d)), className: "space-y-6", children: [_jsxs("div", { className: "card space-y-4", children: [_jsx("h2", { className: "font-display font-semibold text-lg text-white border-b border-carbon-700 pb-3", children: "Informaci\u00F3n de la Empresa" }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "Nombre de la Empresa" }), _jsx("input", { ...register('empresa'), className: "input" })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Email" }), _jsx("input", { type: "email", ...register('email'), className: "input" })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Tel\u00E9fono" }), _jsx("input", { ...register('telefono'), className: "input" })] }), _jsxs("div", { className: "sm:col-span-2", children: [_jsx("label", { className: "label", children: "Direcci\u00F3n (origen para c\u00E1lculo de rutas)" }), _jsx("input", { ...register('direccion'), className: "input", placeholder: "Av. Reforma 123, CDMX" }), _jsx("p", { className: "text-xs text-carbon-500 mt-1", children: "Al guardar, se geocodificar\u00E1 autom\u00E1ticamente como punto de origen." })] })] })] }), _jsxs("div", { className: "card space-y-4", children: [_jsx("h2", { className: "font-display font-semibold text-lg text-white border-b border-carbon-700 pb-3", children: "Costos Operativos" }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-4", children: [
                                    ['costoEtiqueta', 'Costo por Etiqueta', 'MXN c/u'],
                                    ['costoTarima', 'Costo por Tarima', 'MXN c/u'],
                                    ['costoPapeleta', 'Costo por Papeleta', 'MXN c/u'],
                                    ['costoCajaColectiva', 'Caja Colectiva', 'MXN fijo'],
                                    ['costoPlayo', 'Playo', 'MXN × 10m'],
                                    ['costoPoliBurbuja', 'Poli Burbuja', 'MXN × 10m'],
                                ].map(([field, label, unit]) => (_jsxs("div", { children: [_jsx("label", { className: "label", children: label }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: "number", step: "0.01", min: 0, ...register(field, { valueAsNumber: true }), className: "input pr-16" }), _jsx("span", { className: "absolute right-3 top-1/2 -translate-y-1/2 text-xs text-carbon-500", children: unit })] })] }, field))) })] }), sample && (_jsxs("div", { className: "card bg-amber-500/5 border-amber-500/20", children: [_jsx("h3", { className: "font-semibold text-sm text-amber-400 mb-3", children: "Vista previa de c\u00E1lculos" }), _jsxs("div", { className: "grid grid-cols-3 gap-3 text-sm", children: [_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-carbon-400 text-xs", children: "1000 etiquetas" }), _jsx("p", { className: "text-white font-mono font-bold", children: formatCurrency(sample.etiq) })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-carbon-400 text-xs", children: "4 tarimas" }), _jsx("p", { className: "text-white font-mono font-bold", children: formatCurrency(sample.tarima) })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-carbon-400 text-xs", children: "5 papeletas" }), _jsx("p", { className: "text-white font-mono font-bold", children: formatCurrency(sample.papeleta) })] })] })] })), _jsx("div", { className: "flex justify-end", children: _jsx("button", { type: "submit", disabled: saveMut.isPending, className: "btn-primary", children: saveMut.isPending ? 'Guardando...' : '💾 Guardar Configuración' }) })] })] }));
}
