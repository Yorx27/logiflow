import { jsx as _jsx } from "react/jsx-runtime";
import { useToastStore } from '../stores/toastStore';
const COLORS = {
    success: 'bg-green-500/90 text-white',
    error: 'bg-red-500/90 text-white',
    warning: 'bg-amber-500/90 text-carbon-900',
    info: 'bg-blue-500/90 text-white',
};
export function ToastContainer() {
    const { toasts, remove } = useToastStore();
    return (_jsx("div", { className: "fixed top-20 left-0 right-0 z-50 flex flex-col items-center gap-2 pointer-events-none px-4", children: toasts.map((t) => (_jsx("div", { className: `w-full max-w-sm rounded-xl px-4 py-3 shadow-lg text-sm font-medium pointer-events-auto
                      ${COLORS[t.type]}`, onClick: () => remove(t.id), children: t.message }, t.id))) }));
}
