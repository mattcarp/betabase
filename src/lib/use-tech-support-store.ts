import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TechSupportStore {
  isTechSupportEnabled: boolean;
  toggleTechSupport: () => void;
  setTechSupport: (enabled: boolean) => void;
}

export const useTechSupportStore = create<TechSupportStore>()(
  persist(
    (set) => ({
      isTechSupportEnabled: true, // Default ON - this is the base role
      toggleTechSupport: () => set((state) => ({ isTechSupportEnabled: !state.isTechSupportEnabled })),
      setTechSupport: (enabled) => set({ isTechSupportEnabled: enabled }),
    }),
    {
      name: 'tech-support-mode-storage',
    }
  )
);
