import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProgrammerStore {
  isProgrammerModeEnabled: boolean;
  toggleProgrammerMode: () => void;
  setProgrammerMode: (enabled: boolean) => void;
}

export const useProgrammerStore = create<ProgrammerStore>()(
  persist(
    (set) => ({
      isProgrammerModeEnabled: false,
      toggleProgrammerMode: () => set((state) => ({ isProgrammerModeEnabled: !state.isProgrammerModeEnabled })),
      setProgrammerMode: (enabled) => set({ isProgrammerModeEnabled: enabled }),
    }),
    {
      name: 'programmer-mode-storage',
    }
  )
);
