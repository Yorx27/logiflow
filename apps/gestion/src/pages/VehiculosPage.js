import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { api } from '../lib/api';
import { toast } from '../stores/uiStore';
import { Modal } from '../components/ui/Modal';
import { VehBadge } from '../components/ui/StatoBadge';
import { formatCurrency } from '@logiflow/utils';
const TIPO_ICONS = {
    TORTON: '🚛', RABON: '🚚', VAN: '🚐', PICKUP: '🛻', PLATAFORMA: '🏗',
};
export function VehiculosPage() {
    const qc = useQueryClient();
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const { data: vehiculos = [], isLoading } = useQuery({
        queryKey: ['vehiculos'],
        queryFn: async () => { const r = await api.get('/vehiculos'); return r.data.data; },
    });
    const { register, handleSubmit, reset } = useForm({
        defaultValues: { placa: '', modelo: '', tipo: 'VAN', capacidad: '', costoKm: 10 },
    });
    const saveMut = useMutation({
        mutationFn: (d) => editId ? api.put(`/vehiculos/${editId}`, d) : api.post('/vehiculos', d),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['vehiculos'] });
            toast.success(editId ? 'Vehículo actualizado' : 'Vehículo creado');
            setOpen(false);
            reset();
            setEditId(null);
        },
        onError: (e) => toast.error(e.response?.data?.error || 'Error'),
    });
    function openEdit(v) {
        reset({ placa: v.placa, modelo: v.modelo, tipo: v.tipo, capacidad: v.capacidad, costoKm: v.costoKm });
        setEditId(v.id);
        setOpen(true);
    }
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "font-display font-bold text-2xl text-white", children: "Veh\u00EDculos" }), _jsxs("p", { className: "text-carbon-400 text-sm", children: [vehiculos.length, " registros"] })] }), _jsx("button", { className: "btn-primary text-sm", onClick: () => { reset(); setEditId(null); setOpen(true); }, children: "+ Nuevo Veh\u00EDculo" })] }), isLoading ? (_jsx("p", { className: "text-carbon-500 text-center py-10", children: "Cargando..." })) : (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", children: vehiculos.map((v) => {
                    const borderColor = v.estado === 'DISPONIBLE' ? 'border-green-500/30' : v.estado === 'EN_RUTA' ? 'border-purple-500/30' : 'border-orange-500/30';
                    return (_jsxs("div", { className: `card border-2 ${borderColor} flex flex-col gap-3`, children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "text-3xl", children: TIPO_ICONS[v.tipo] || '🚗' }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-white font-mono", children: v.placa }), _jsx("p", { className: "text-xs text-carbon-400", children: v.modelo })] })] }), _jsx(VehBadge, { estado: v.estado })] }), _jsxs("div", { className: "grid grid-cols-3 gap-2 text-xs", children: [_jsxs("div", { className: "bg-carbon-700/50 rounded-lg p-2 text-center", children: [_jsx("p", { className: "text-carbon-500", children: "Tipo" }), _jsx("p", { className: "text-white font-medium", children: v.tipo })] }), _jsxs("div", { className: "bg-carbon-700/50 rounded-lg p-2 text-center", children: [_jsx("p", { className: "text-carbon-500", children: "Capacidad" }), _jsx("p", { className: "text-white font-medium", children: v.capacidad })] }), _jsxs("div", { className: "bg-carbon-700/50 rounded-lg p-2 text-center", children: [_jsx("p", { className: "text-carbon-500", children: "$/km" }), _jsx("p", { className: "text-amber-400 font-medium", children: formatCurrency(v.costoKm) })] })] }), _jsx("div", { className: "flex justify-end pt-1 border-t border-carbon-700", children: v.estado !== 'EN_RUTA' && (_jsx("button", { onClick: () => openEdit(v), className: "text-xs px-2 py-1 bg-carbon-700 hover:bg-carbon-600 rounded", children: "\u270F\uFE0F Editar" })) })] }, v.id));
                }) })), _jsx(Modal, { open: open, onClose: () => setOpen(false), title: editId ? 'Editar Vehículo' : 'Nuevo Vehículo', size: "sm", children: _jsxs("form", { onSubmit: handleSubmit((d) => saveMut.mutate({ ...d, costoKm: Number(d.costoKm) })), className: "p-5 space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "Placa *" }), _jsx("input", { ...register('placa', { required: true }), className: "input", placeholder: "ABC-123-MX" })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Modelo *" }), _jsx("input", { ...register('modelo', { required: true }), className: "input" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "Tipo *" }), _jsx("select", { ...register('tipo'), className: "input", children: ['TORTON', 'RABON', 'VAN', 'PICKUP', 'PLATAFORMA'].map((t) => _jsx("option", { value: t, children: t }, t)) })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Capacidad" }), _jsx("input", { ...register('capacidad'), className: "input", placeholder: "10 ton" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Costo por km (MXN)" }), _jsx("input", { type: "number", step: "0.01", ...register('costoKm'), className: "input" })] }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx("button", { type: "button", className: "btn-ghost text-sm", onClick: () => setOpen(false), children: "Cancelar" }), _jsx("button", { type: "submit", disabled: saveMut.isPending, className: "btn-primary text-sm", children: saveMut.isPending ? 'Guardando...' : editId ? 'Actualizar' : 'Crear' })] })] }) })] }));
}
