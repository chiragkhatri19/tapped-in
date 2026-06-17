import { create } from 'zustand';

interface UiState {
  isDockVisible: boolean;
  setDockVisible: (visible: boolean) => void;
  hasPromptedDietPreference: boolean;
  setPromptedDietPreference: (prompted: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isDockVisible: true,
  setDockVisible: (visible) => set({ isDockVisible: visible }),
  hasPromptedDietPreference: false,
  setPromptedDietPreference: (prompted) => set({ hasPromptedDietPreference: prompted }),
}));
