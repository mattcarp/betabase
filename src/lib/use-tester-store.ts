import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TesterStore {
  isTesterModeEnabled: boolean;
  ladybugPosition: { x: number; y: number };
  toggleTesterMode: () => void;
  setTesterMode: (enabled: boolean) => void;
  setLadybugPosition: (position: { x: number; y: number }) => void;
}

export const useTesterStore = create<TesterStore>()(
  persist(
    (set) => ({
      isTesterModeEnabled: false,
      ladybugPosition: { x: 50, y: 50 },
      toggleTesterMode: () => set((state) => ({ isTesterModeEnabled: !state.isTesterModeEnabled })),
      setTesterMode: (enabled) => set({ isTesterModeEnabled: enabled }),
      setLadybugPosition: (position) => set({ ladybugPosition: position }),
    }),
    {
      name: 'tester-mode-storage',
    }
  )
);
