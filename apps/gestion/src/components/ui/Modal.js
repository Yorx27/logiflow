import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
const SIZES = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
};
export function Modal({ open, onClose, title, children, size = 'md' }) {
    const ref = useRef(null);
    useEffect(() => {
        if (!open)
            return;
        function onKey(e) {
            if (e.key === 'Escape')
                onClose();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);
    if (!open)
        return null;
    return (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", children: [_jsx("div", { className: "absolute inset-0 bg-black/60 backdrop-blur-sm", onClick: onClose }), _jsxs("div", { ref: ref, className: `relative bg-carbon-800 border border-carbon-700 rounded-card shadow-2xl
                    w-full ${SIZES[size]} max-h-[90vh] flex flex-col`, children: [_jsxs("div", { className: "flex items-center justify-between px-5 py-4 border-b border-carbon-700", children: [_jsx("h2", { className: "font-display font-bold text-lg text-white", children: title }), _jsx("button", { onClick: onClose, className: "w-8 h-8 rounded-lg hover:bg-carbon-700 flex items-center justify-center\n                       text-carbon-400 hover:text-white transition-colors", children: "\u2715" })] }), _jsx("div", { className: "overflow-y-auto flex-1", children: children })] })] }));
}
