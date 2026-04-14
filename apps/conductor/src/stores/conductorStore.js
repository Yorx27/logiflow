import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const useConductorStore = create()(persist((set) => ({
    conductor: null,
    accessToken: null,
    setSession: (conductor, accessToken) => set({ conductor, accessToken }),
    logout: () => set({ conductor: null, accessToken: null }),
}), { name: 'logiflow-conductor' }));
