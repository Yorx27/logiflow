import { create } from 'zustand';
export const useUIStore = create((set) => ({
    toasts: [],
    sidebarOpen: true,
    addToast: (message, type) => {
        const id = Math.random().toString(36).slice(2);
        set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
        setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4000);
    },
    removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
export const toast = {
    success: (msg) => useUIStore.getState().addToast(msg, 'success'),
    error: (msg) => useUIStore.getState().addToast(msg, 'error'),
    warning: (msg) => useUIStore.getState().addToast(msg, 'warning'),
    info: (msg) => useUIStore.getState().addToast(msg, 'info'),
};
