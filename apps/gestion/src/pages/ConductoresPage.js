import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { api } from '../lib/api';
import { toast } from '../stores/uiStore';
import { Modal } from '../components/ui/Modal';
import { CondBadge } from '../components/ui/StatoBadge';
export function ConductoresPage() {
    const qc = useQueryClient();
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const { data: conductores = [], isLoading } = useQuery({
        queryKey: ['conductores'],
        queryFn: async () => { const r = await api.get('/conductores'); return r.data.data; },
    });
    const { register, handleSubmit, reset } = useForm({
        defaultValues: { nombre: '', telefono: '', licencia: '' },
    });
    const saveMut = useMutation({
        mutationFn: (d) => editId ? api.put(`/conductores/${editId}`, d) : api.post('/conductores', d),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['conductores'] });
            toast.success(editId ? 'Conductor actualizado' : 'Conductor creado');
            setOpen(false);
            reset();
            setEditId(null);
        },
        onError: (e) => toast.error(e.response?.data?.error || 'Error'),
    });
    const estadoMut = useMutation({
        mutationFn: ({ id, estado }) => api.put(`/conductores/${id}/estado`, { estado }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['conductores'] }); toast.success('Estado actualizado'); },
        onError: (e) => toast.error(e.response?.data?.error || 'Error'),
    });
    function openEdit(c) {
        reset({ nombre: c.nombre, telefono: c.telefono || '', licencia: c.licencia });
        setEditId(c.id);
        setOpen(true);
    }
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "font-display font-bold text-2xl text-white", children: "Conductores" }), _jsxs("p", { className: "text-carbon-400 text-sm", children: [conductores.length, " registros"] })] }), _jsx("button", { className: "btn-primary text-sm", onClick: () => { reset(); setEditId(null); setOpen(true); }, children: "+ Nuevo Conductor" })] }), isLoading ? (_jsx("p", { className: "text-carbon-500 text-center py-10", children: "Cargando..." })) : (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", children: conductores.map((c) => (_jsxs("div", { className: "card flex flex-col gap-3", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-11 h-11 bg-amber-500/15 border border-amber-500/30 rounded-full flex items-center justify-center text-amber-400 font-bold text-lg", children: c.nombre.charAt(0) }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-white", children: c.nombre }), _jsx("p", { className: "text-xs text-carbon-400 font-mono", children: c.licencia })] })] }), _jsx(CondBadge, { estado: c.estado })] }), c.telefono && (_jsxs("p", { className: "text-sm text-carbon-400", children: ["\uD83D\uDCDE ", c.telefono] })), _jsxs("div", { className: "flex items-center justify-between gap-2 pt-2 border-t border-carbon-700", children: [_jsxs("div", { className: "text-xs text-carbon-400", children: [c._count?.entregas ?? 0, " entregas totales"] }), _jsxs("div", { className: "flex gap-1", children: [_jsx("button", { onClick: () => openEdit(c), className: "text-xs px-2 py-1 bg-carbon-700 hover:bg-carbon-600 rounded", children: "\u270F\uFE0F Editar" }), c.estado !== 'EN_RUTA' && (_jsx("button", { onClick: () => estadoMut.mutate({ id: c.id, estado: c.estado === 'DISPONIBLE' ? 'INACTIVO' : 'DISPONIBLE' }), className: `text-xs px-2 py-1 rounded ${c.estado === 'DISPONIBLE' ? 'bg-red-500/20 text-red-300 hover:bg-red-500/40' : 'bg-green-500/20 text-green-300 hover:bg-green-500/40'}`, children: c.estado === 'DISPONIBLE' ? 'Desactivar' : 'Activar' }))] })] })] }, c.id))) })), _jsx(Modal, { open: open, onClose: () => setOpen(false), title: editId ? 'Editar Conductor' : 'Nuevo Conductor', size: "sm", children: _jsxs("form", { onSubmit: handleSubmit((d) => saveMut.mutate(d)), className: "p-5 space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "Nombre *" }), _jsx("input", { ...register('nombre', { required: true }), className: "input" })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Licencia *" }), _jsx("input", { ...register('licencia', { required: true }), className: "input", placeholder: "MX-001-2024" })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Tel\u00E9fono" }), _jsx("input", { ...register('telefono'), className: "input", placeholder: "+52 55 1234-5678" })] }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx("button", { type: "button", className: "btn-ghost text-sm", onClick: () => setOpen(false), children: "Cancelar" }), _jsx("button", { type: "submit", disabled: saveMut.isPending, className: "btn-primary text-sm", children: saveMut.isPending ? 'Guardando...' : editId ? 'Actualizar' : 'Crear' })] })] }) })] }));
}
