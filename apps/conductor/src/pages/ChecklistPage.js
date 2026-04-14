import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import SignatureCanvas from 'react-signature-canvas';
import { api } from '../lib/api';
import { toast } from '../stores/toastStore';
// ─── Sub-components ────────────────────────────────────────────────────────────
function CheckItem({ label, checked, onToggle, timestamp }) {
    return (_jsxs("button", { type: "button", onClick: onToggle, className: `check-item w-full ${checked ? 'check-item-active' : 'check-item-inactive'}`, children: [_jsx("div", { className: `w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
        ${checked ? 'bg-green-500 border-green-500' : 'border-carbon-500'}`, children: checked && _jsx("span", { className: "text-white text-xs font-bold", children: "\u2713" }) }), _jsxs("div", { className: "flex-1 text-left", children: [_jsx("p", { className: "text-sm font-medium", children: label }), checked && timestamp && (_jsx("p", { className: "text-xs opacity-60 mt-0.5", children: new Date(timestamp).toLocaleTimeString('es-MX') }))] })] }));
}
function PhotoGrid({ fotos, onRemove }) {
    if (!fotos.length)
        return null;
    return (_jsx("div", { className: "grid grid-cols-4 gap-2 mt-2", children: fotos.map((f, i) => (_jsxs("div", { className: "relative aspect-square", children: [_jsx("img", { src: f.url, alt: f.name, className: "w-full h-full object-cover rounded-lg bg-carbon-700" }), _jsx("button", { onClick: () => onRemove(i), className: "absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center", children: "\u00D7" })] }, i))) }));
}
// ─── Main Component ────────────────────────────────────────────────────────────
export function ChecklistPage() {
    const { entregaId } = useParams();
    const nav = useNavigate();
    const qc = useQueryClient();
    const [step, setStep] = useState(0);
    const [checks, setChecks] = useState({});
    const [fotosDescarga, setFotosDescarga] = useState([]);
    const [fotosDocs, setFotosDocs] = useState([]);
    const [observaciones, setObservaciones] = useState('');
    const [uploading, setUploading] = useState(false);
    const sigRef = useRef(null);
    const fileDescRef = useRef(null);
    const fileDocsRef = useRef(null);
    const { data: entrega } = useQuery({
        queryKey: ['entrega', entregaId],
        queryFn: async () => { const r = await api.get(`/entregas`); return r.data.data.find((e) => e.id === entregaId); },
        enabled: !!entregaId,
    });
    const { data: evidencia, refetch: refetchEv } = useQuery({
        queryKey: ['evidencia', entregaId],
        queryFn: async () => { const r = await api.get(`/evidencias/${entregaId}`); return r.data.data; },
        enabled: !!entregaId,
    });
    // Sync checks from server
    useEffect(() => {
        if (evidencia) {
            setChecks({
                llegada: evidencia.checkLlegada || null,
                contacto: evidencia.checkContacto || null,
                descarga: evidencia.checkDescarga || null,
                conteo: evidencia.checkConteo || null,
                condicion: evidencia.checkCondicion || null,
                remision: evidencia.checkRemision || null,
                acuse: evidencia.checkAcuse || null,
            });
        }
    }, [evidencia]);
    async function toggleCheck(tipo) {
        if (checks[tipo])
            return; // already checked, can't uncheck
        const ts = new Date().toISOString();
        setChecks((c) => ({ ...c, [tipo]: ts }));
        try {
            await api.post(`/evidencias/${entregaId}/check`, { tipo, timestamp: ts });
            refetchEv();
        }
        catch {
            toast.error('Error al registrar check');
            setChecks((c) => ({ ...c, [tipo]: null }));
        }
    }
    function handleFotos(files, categoria) {
        if (!files)
            return;
        const arr = Array.from(files);
        const newFotos = arr.map((f) => ({ url: URL.createObjectURL(f), name: f.name, file: f }));
        if (categoria === 'descarga')
            setFotosDescarga((p) => [...p, ...newFotos].slice(0, 8));
        else
            setFotosDocs((p) => [...p, ...newFotos].slice(0, 8));
    }
    async function uploadFotos(categoria, fotos) {
        if (!fotos.length)
            return;
        const form = new FormData();
        fotos.forEach((f) => form.append('fotos', f.file));
        form.append('categoria', categoria);
        await api.post(`/evidencias/${entregaId}/fotos`, form);
    }
    async function handleFinalizar() {
        setUploading(true);
        try {
            // Upload photos
            await uploadFotos('DESCARGA', fotosDescarga);
            await uploadFotos('DOCUMENTOS', fotosDocs);
            // Upload signature if present
            if (!sigRef.current?.isEmpty()) {
                const firma = sigRef.current.toDataURL('image/png');
                await api.post(`/evidencias/${entregaId}/firma`, { firma });
            }
            // Finalize
            await api.put(`/evidencias/${entregaId}/finalizar`, { observaciones });
            qc.invalidateQueries({ queryKey: ['mis-entregas'] });
            toast.success('¡Entrega completada!');
            nav('/inicio');
        }
        catch (e) {
            toast.error(e.response?.data?.error || 'Error al finalizar');
        }
        finally {
            setUploading(false);
        }
    }
    // Progress
    const STEPS = ['Llegada', 'Descarga', 'Documentación', 'Confirmación'];
    const progressPct = ((step) / (STEPS.length - 1)) * 100;
    // Validations
    const canStep1 = !!checks.llegada;
    const canStep2 = !!checks.descarga;
    const canStep3 = !!checks.remision;
    return (_jsxs("div", { className: "min-h-screen flex flex-col bg-carbon-900", children: [_jsxs("div", { className: "bg-carbon-800 border-b border-carbon-700 px-4 pt-4 pb-3 sticky top-0 z-10", children: [_jsxs("div", { className: "flex items-center gap-3 mb-3", children: [_jsx("button", { onClick: () => nav('/inicio'), className: "w-9 h-9 bg-carbon-700 rounded-xl flex items-center justify-center text-carbon-300", children: "\u2190" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-display font-bold text-white", children: entrega?.solicitud?.cliente }), _jsx("p", { className: "text-xs font-mono text-carbon-400", children: entrega?.solicitud?.ot })] })] }), _jsx("div", { className: "flex items-center gap-2 mb-2", children: STEPS.map((s, i) => (_jsxs("div", { className: "flex items-center gap-2 flex-1", children: [_jsx("div", { className: `w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors
                ${i < step ? 'bg-green-500 text-white' : i === step ? 'bg-amber-500 text-carbon-900' : 'bg-carbon-700 text-carbon-500'}`, children: i < step ? '✓' : i + 1 }), i < STEPS.length - 1 && (_jsx("div", { className: "h-0.5 flex-1 bg-carbon-700 rounded overflow-hidden", children: _jsx("div", { className: "h-full bg-amber-500 transition-all", style: { width: i < step ? '100%' : '0%' } }) }))] }, s))) }), _jsx("p", { className: "text-xs text-carbon-400 text-center", children: STEPS[step] })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-4 pb-28", children: [step === 0 && (_jsxs("div", { className: "space-y-3", children: [_jsx("h2", { className: "font-display font-bold text-lg text-white", children: "Paso 1 \u2014 Llegada al destino" }), entrega?.solicitud?.direccionEntrega && (_jsx("div", { className: "card bg-blue-500/5 border-blue-500/20", children: _jsxs("p", { className: "text-sm text-blue-300", children: ["\uD83D\uDCCD ", entrega.solicitud.direccionEntrega] }) })), _jsx(CheckItem, { label: "Confirmar llegada al destino", checked: !!checks.llegada, onToggle: () => toggleCheck('llegada'), timestamp: checks.llegada }), _jsx(CheckItem, { label: "Contacto con receptor establecido", checked: !!checks.contacto, onToggle: () => toggleCheck('contacto'), timestamp: checks.contacto }), !checks.llegada && (_jsx("p", { className: "text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2", children: "Debes confirmar la llegada para continuar" }))] })), step === 1 && (_jsxs("div", { className: "space-y-3", children: [_jsx("h2", { className: "font-display font-bold text-lg text-white", children: "Paso 2 \u2014 Descarga de mercanc\u00EDa" }), _jsx(CheckItem, { label: "Descarga iniciada", checked: !!checks.descarga, onToggle: () => toggleCheck('descarga'), timestamp: checks.descarga }), _jsx(CheckItem, { label: "Conteo de piezas verificado", checked: !!checks.conteo, onToggle: () => toggleCheck('conteo'), timestamp: checks.conteo }), _jsx(CheckItem, { label: "Mercanc\u00EDa en buen estado", checked: !!checks.condicion, onToggle: () => toggleCheck('condicion'), timestamp: checks.condicion }), _jsxs("div", { children: [_jsxs("p", { className: "label", children: ["Fotos de descarga (", fotosDescarga.length, "/8)"] }), _jsx("button", { type: "button", onClick: () => fileDescRef.current?.click(), disabled: fotosDescarga.length >= 8, className: "btn-ghost text-sm", children: "\uD83D\uDCF7 Tomar / Subir Fotos" }), _jsx("input", { ref: fileDescRef, type: "file", accept: "image/*", capture: "environment", multiple: true, className: "hidden", onChange: (e) => handleFotos(e.target.files, 'descarga') }), _jsx(PhotoGrid, { fotos: fotosDescarga, onRemove: (i) => setFotosDescarga((p) => p.filter((_, j) => j !== i)) })] })] })), step === 2 && (_jsxs("div", { className: "space-y-4", children: [_jsx("h2", { className: "font-display font-bold text-lg text-white", children: "Paso 3 \u2014 Documentaci\u00F3n" }), _jsx(CheckItem, { label: "Remisi\u00F3n / Carta porte entregada", checked: !!checks.remision, onToggle: () => toggleCheck('remision'), timestamp: checks.remision }), _jsx(CheckItem, { label: "Acuse de recibo obtenido", checked: !!checks.acuse, onToggle: () => toggleCheck('acuse'), timestamp: checks.acuse }), _jsxs("div", { children: [_jsxs("p", { className: "label", children: ["Fotos de documentos firmados (", fotosDocs.length, "/8)"] }), _jsx("button", { type: "button", onClick: () => fileDocsRef.current?.click(), disabled: fotosDocs.length >= 8, className: "btn-ghost text-sm", children: "\uD83D\uDCC4 Tomar / Subir Fotos" }), _jsx("input", { ref: fileDocsRef, type: "file", accept: "image/*", capture: "environment", multiple: true, className: "hidden", onChange: (e) => handleFotos(e.target.files, 'docs') }), _jsx(PhotoGrid, { fotos: fotosDocs, onRemove: (i) => setFotosDocs((p) => p.filter((_, j) => j !== i)) })] }), _jsxs("div", { children: [_jsx("p", { className: "label", children: "Firma digital del receptor" }), _jsx("div", { className: "bg-white rounded-xl overflow-hidden border border-carbon-600", children: _jsx(SignatureCanvas, { ref: sigRef, penColor: "#0d0f14", canvasProps: {
                                                className: 'w-full',
                                                style: { height: 160, display: 'block', touchAction: 'none' },
                                            } }) }), _jsx("button", { type: "button", onClick: () => sigRef.current?.clear(), className: "text-xs text-carbon-400 mt-2 underline", children: "Limpiar firma" })] })] })), step === 3 && (_jsxs("div", { className: "space-y-4", children: [_jsx("h2", { className: "font-display font-bold text-lg text-white", children: "Paso 4 \u2014 Confirmaci\u00F3n" }), _jsxs("div", { className: "card space-y-2", children: [_jsx("p", { className: "font-semibold text-carbon-300 text-sm", children: "Resumen de checks" }), [
                                        ['llegada', 'Llegada'], ['contacto', 'Contacto'], ['descarga', 'Descarga'],
                                        ['conteo', 'Conteo'], ['condicion', 'Condición'], ['remision', 'Remisión'], ['acuse', 'Acuse'],
                                    ].map(([key, label]) => (_jsxs("div", { className: `flex items-center gap-2 text-sm ${checks[key] ? 'text-green-400' : 'text-carbon-600'}`, children: [_jsx("span", { children: checks[key] ? '✅' : '⬜' }), _jsx("span", { children: label }), checks[key] && _jsx("span", { className: "text-xs opacity-60 ml-auto", children: new Date(checks[key]).toLocaleTimeString('es-MX') })] }, key)))] }), _jsxs("div", { className: "grid grid-cols-2 gap-3 text-sm", children: [_jsxs("div", { className: "card text-center", children: [_jsx("p", { className: "text-carbon-400 text-xs", children: "Fotos descarga" }), _jsx("p", { className: "font-bold text-white text-lg", children: fotosDescarga.length })] }), _jsxs("div", { className: "card text-center", children: [_jsx("p", { className: "text-carbon-400 text-xs", children: "Fotos documentos" }), _jsx("p", { className: "font-bold text-white text-lg", children: fotosDocs.length })] })] }), sigRef.current && !sigRef.current.isEmpty() && (_jsxs("div", { className: "card flex items-center gap-2 text-green-400 text-sm", children: [_jsx("span", { children: "\u2705" }), " Firma digital capturada"] })), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Observaciones finales" }), _jsx("textarea", { value: observaciones, onChange: (e) => setObservaciones(e.target.value), className: "input", rows: 3, placeholder: "Alguna observaci\u00F3n sobre la entrega..." })] }), _jsx("button", { onClick: handleFinalizar, disabled: uploading, className: "btn-primary text-base", children: uploading ? 'Enviando evidencias...' : '✅ Confirmar Entrega' })] }))] }), _jsxs("div", { className: "fixed bottom-0 left-0 right-0 bg-carbon-800 border-t border-carbon-700 px-4 py-3 flex gap-3", children: [step > 0 && (_jsx("button", { onClick: () => setStep(s => s - 1), className: "btn-ghost flex-none w-auto px-5", children: "\u2190 Anterior" })), step < 3 && (_jsx("button", { onClick: () => {
                            if (step === 0 && !canStep1) {
                                toast.error('Confirma tu llegada primero');
                                return;
                            }
                            if (step === 1 && !canStep2) {
                                toast.error('Confirma el inicio de descarga');
                                return;
                            }
                            if (step === 2 && !canStep3) {
                                toast.error('Confirma la entrega de remisión');
                                return;
                            }
                            setStep(s => s + 1);
                        }, className: "btn-primary", children: "Siguiente \u2192" }))] })] }));
}
