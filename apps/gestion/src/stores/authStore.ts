import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Usuario } from '@logiflow/types'

interface AuthState {
  user: Usuario | null
  accessToken: string | null
  refreshToken: string | null
  setAuth: (user: Usuario, accessToken: string, refreshToken: string) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: 'logiflow-auth' },
  ),
)
