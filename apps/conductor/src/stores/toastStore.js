import { create } from 'zustand';
export const useToastStore = create((set) => ({
    toasts: [],
    add: (message, type) => {
        const id = Math.random().toString(36).slice(2);
        set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
        setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4000);
    },
    remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
export const toast = {
    success: (msg) => useToastStore.getState().add(msg, 'success'),
    error: (msg) => useToastStore.getState().add(msg, 'error'),
    warning: (msg) => useToastStore.getState().add(msg, 'warning'),
    info: (msg) => useToastStore.getState().add(msg, 'info'),
};
