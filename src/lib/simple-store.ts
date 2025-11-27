import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";

interface SimpleStore {
  count: number;
  increment: () => void;
}

const store = createStore<SimpleStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

export const useSimpleStore = () => useStore(store);
