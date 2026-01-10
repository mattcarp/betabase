import { create } from 'zustand';

// Tech Support Staff is the primary role - always enabled, non-toggleable
// This ensures users always have access to the base Chat functionality

interface TechSupportStore {
  isTechSupportEnabled: true; // Always true - this is a constant
}

export const useTechSupportStore = create<TechSupportStore>()(() => ({
  isTechSupportEnabled: true, // Primary role - always ON, cannot be disabled
}));
