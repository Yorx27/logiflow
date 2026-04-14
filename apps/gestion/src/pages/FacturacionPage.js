import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { api } from '../lib/api';
import { toast } from '../stores/uiStore';
import { Modal } from '../components/ui/Modal';
import { FactBadge } from '../components/ui/StatoBadge';
import { formatCurrency, formatDate } from '@logiflow/utils';
export function FacturacionPage() {
    const qc = useQueryClient();
    const [open, setOpen] = useState(false);
    const [gastos, setGastos] = useState(0);
    const { data: facturas = [], isLoading } = useQuery({
        queryKey: ['facturas'],
        queryFn: async () => { const r = await api.get('/facturas'); return r.data.data; },
    });
    const { data: solicitudes = [] } = useQuery({
        queryKey: ['solicitudes-all'],
        queryFn: async () => { const r = await api.get('/solicitudes?mostrarCompletadas=true'); return r.data.data; },
    });
    const { register, handleSubmit, watch, setValue, reset } = useForm({
        defaultValues: { numero: '', cliente: '', solicitudId: '', subtotal: 0, gastosAdic: 0 },
    });
    const subtotal = watch('subtotal') || 0;
    const iva = subtotal * 0.16;
    const total = subtotal + iva + (gastos || 0);
    const saveMut = useMutation({
        mutationFn: (d) => api.post('/facturas', { ...d, gastosAdic: gastos }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['facturas'] }); toast.success('Factura creada'); setOpen(false); reset(); setGastos(0); },
        onError: (e) => toast.error(e.response?.data?.error || 'Error'),
    });
    const estadoMut = useMutation({
        mutationFn: ({ id, estado }) => api.put(`/facturas/${id}/estado`, { estado }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['facturas'] }); toast.success('Estado actualizado'); },
        onError: () => toast.error('Error'),
    });
    function handleSolChange(e) {
        const sol = solicitudes.find((s) => s.id === e.target.value);
        if (sol) {
            setValue('cliente', sol.cliente);
            setValue('subtotal', sol.costo);
        }
    }
    function descargarPDF(id, numero) {
        window.open(`/api/facturas/${id}/pdf`, '_blank');
        toast.info(`Descargando ${numero}.pdf`);
    }
    const totales = facturas.reduce((acc, f) => {
        const t = f.subtotal + f.subtotal * 0.16 + f.gastosAdic;
        return { ...acc, total: acc.total + t };
    }, { total: 0 });
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "font-display font-bold text-2xl text-white", children: "Facturaci\u00F3n" }), _jsxs("p", { className: "text-carbon-400 text-sm", children: [facturas.length, " facturas \u00B7 Total: ", formatCurrency(totales.total)] })] }), _jsx("button", { className: "btn-primary text-sm", onClick: () => { reset(); setGastos(0); setOpen(true); }, children: "+ Nueva Factura" })] }), _jsx("div", { className: "card p-0 overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-carbon-700/50", children: _jsx("tr", { className: "text-carbon-400 text-xs", children: ['Número', 'Cliente', 'OT', 'Subtotal', 'IVA 16%', 'Gastos', 'Total', 'Estado', 'Fecha', 'Acciones'].map((h) => (_jsx("th", { className: "text-left px-4 py-3 whitespace-nowrap", children: h }, h))) }) }), _jsx("tbody", { children: isLoading ? (_jsx("tr", { children: _jsx("td", { colSpan: 10, className: "px-4 py-10 text-center text-carbon-500", children: "Cargando..." }) })) : facturas.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 10, className: "px-4 py-10 text-center text-carbon-500", children: "Sin facturas" }) })) : facturas.map((f) => {
                                    const iva = f.subtotal * 0.16;
                                    const tot = f.subtotal + iva + f.gastosAdic;
                                    return (_jsxs("tr", { className: "border-t border-carbon-700/50 table-row-hover", children: [_jsx("td", { className: "px-4 py-3 font-mono text-amber-400 text-xs", children: f.numero }), _jsx("td", { className: "px-4 py-3", children: f.cliente }), _jsx("td", { className: "px-4 py-3 text-carbon-400 text-xs", children: f.solicitud?.ot || '—' }), _jsx("td", { className: "px-4 py-3 font-mono text-xs", children: formatCurrency(f.subtotal) }), _jsx("td", { className: "px-4 py-3 font-mono text-xs text-carbon-400", children: formatCurrency(iva) }), _jsx("td", { className: "px-4 py-3 font-mono text-xs text-carbon-400", children: formatCurrency(f.gastosAdic) }), _jsx("td", { className: "px-4 py-3 font-mono text-xs font-bold", children: formatCurrency(tot) }), _jsx("td", { className: "px-4 py-3", children: _jsx(FactBadge, { estado: f.estado }) }), _jsx("td", { className: "px-4 py-3 text-carbon-400 text-xs", children: formatDate(f.fecha) }), _jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex gap-1", children: [_jsx("select", { defaultValue: f.estado, onChange: (e) => estadoMut.mutate({ id: f.id, estado: e.target.value }), className: "text-xs bg-carbon-700 border border-carbon-600 rounded px-1 py-0.5", children: ['BORRADOR', 'EMITIDA', 'PAGADA', 'CANCELADA'].map((e) => _jsx("option", { value: e, children: e }, e)) }), _jsx("button", { onClick: () => descargarPDF(f.id, f.numero), className: "text-xs px-2 py-1 bg-carbon-700 hover:bg-carbon-600 rounded", title: "Descargar PDF", children: "\uD83D\uDCC4" })] }) })] }, f.id));
                                }) })] }) }) }), _jsx(Modal, { open: open, onClose: () => setOpen(false), title: "Nueva Factura", size: "md", children: _jsxs("form", { onSubmit: handleSubmit((d) => saveMut.mutate(d)), className: "p-5 space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "N\u00FAmero *" }), _jsx("input", { ...register('numero', { required: true }), className: "input", placeholder: "FAC-2024-001" })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Vincular OT" }), _jsxs("select", { ...register('solicitudId'), className: "input", onChange: handleSolChange, children: [_jsx("option", { value: "", children: "Sin vincular" }), solicitudes.map((s) => _jsxs("option", { value: s.id, children: [s.ot, " \u2014 ", s.cliente] }, s.id))] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Cliente *" }), _jsx("input", { ...register('cliente', { required: true }), className: "input" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "Subtotal (MXN)" }), _jsx("input", { type: "number", step: "0.01", ...register('subtotal', { valueAsNumber: true }), className: "input" })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Gastos Adicionales" }), _jsx("input", { type: "number", step: "0.01", value: gastos, onChange: (e) => setGastos(Number(e.target.value)), className: "input" })] })] }), _jsxs("div", { className: "bg-carbon-700/50 rounded-lg p-4 space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-carbon-400", children: "Subtotal" }), _jsx("span", { children: formatCurrency(subtotal) })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-carbon-400", children: "IVA 16%" }), _jsx("span", { children: formatCurrency(iva) })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-carbon-400", children: "Gastos adic." }), _jsx("span", { children: formatCurrency(gastos) })] }), _jsxs("div", { className: "flex justify-between font-bold border-t border-carbon-600 pt-2", children: [_jsx("span", { children: "Total" }), _jsx("span", { className: "text-amber-400", children: formatCurrency(total) })] })] }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx("button", { type: "button", className: "btn-ghost text-sm", onClick: () => setOpen(false), children: "Cancelar" }), _jsx("button", { type: "submit", disabled: saveMut.isPending, className: "btn-primary text-sm", children: saveMut.isPending ? 'Creando...' : 'Crear Factura' })] })] }) })] }));
}
