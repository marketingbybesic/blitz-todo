import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  accentColor: string;
  fabAlignment: 'left' | 'right';
  isSettingsOpen: boolean;
  showStatsAndCompleted: boolean;
  setAccentColor: (color: string) => void;
  setFabAlignment: (alignment: 'left' | 'right') => void;
  toggleSettingsModal: () => void;
  toggleStats: () => void;
  applyAccentColor: (color: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      accentColor: '#a855f7',
      fabAlignment: 'right',
      isSettingsOpen: false,
      showStatsAndCompleted: false,

      setAccentColor: (color) => set({ accentColor: color }),

      setFabAlignment: (alignment) => set({ fabAlignment: alignment }),

      toggleSettingsModal: () =>
        set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),

      toggleStats: () =>
        set((state) => ({ showStatsAndCompleted: !state.showStatsAndCompleted })),

      applyAccentColor: (color) => {
        document.documentElement.style.setProperty('--accent', color);
      },
    }),
    {
      name: 'blitz-settings',
      partialize: (state) => ({
        accentColor: state.accentColor,
        fabAlignment: state.fabAlignment,
        showStatsAndCompleted: state.showStatsAndCompleted,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accentColor) {
          document.documentElement.style.setProperty('--accent', state.accentColor);
        }
      },
    }
  )
);
