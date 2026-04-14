import { create } from 'zustand'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}

interface UIState {
  toasts: Toast[]
  sidebarOpen: boolean
  addToast: (message: string, type: Toast['type']) => void
  removeToast: (id: string) => void
  toggleSidebar: () => void
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  sidebarOpen: true,
  addToast: (message, type) => {
    const id = Math.random().toString(36).slice(2)
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4000)
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}))

export const toast = {
  success: (msg: string) => useUIStore.getState().addToast(msg, 'success'),
  error: (msg: string) => useUIStore.getState().addToast(msg, 'error'),
  warning: (msg: string) => useUIStore.getState().addToast(msg, 'warning'),
  info: (msg: string) => useUIStore.getState().addToast(msg, 'info'),
}
