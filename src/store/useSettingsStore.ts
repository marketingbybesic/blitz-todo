import { create } from 'zustand';

interface SettingsState {
  accentColor: string;
  fabAlignment: 'left' | 'right';
  isSettingsOpen: boolean;
  setAccentColor: (color: string) => void;
  setFabAlignment: (alignment: 'left' | 'right') => void;
  toggleSettingsModal: () => void;
  applyAccentColor: (color: string) => void;
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  accentColor: '#a855f7',
  fabAlignment: 'right',
  isSettingsOpen: false,

  setAccentColor: (color) => set({ accentColor: color }),

  setFabAlignment: (alignment) => set({ fabAlignment: alignment }),

  toggleSettingsModal: () =>
    set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),

  applyAccentColor: (color) => {
    document.documentElement.style.setProperty('--accent', color);
  },
}));
