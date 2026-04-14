import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Conductor } from '@logiflow/types'

interface ConductorState {
  conductor: Conductor | null
  accessToken: string | null
  setSession: (conductor: Conductor, accessToken: string) => void
  logout: () => void
}

export const useConductorStore = create<ConductorState>()(
  persist(
    (set) => ({
      conductor: null,
      accessToken: null,
      setSession: (conductor, accessToken) => set({ conductor, accessToken }),
      logout: () => set({ conductor: null, accessToken: null }),
    }),
    { name: 'logiflow-conductor' },
  ),
)
