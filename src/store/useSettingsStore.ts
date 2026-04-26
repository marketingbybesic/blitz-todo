import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  accentColor: string;
  fabAlignment: 'left' | 'right';
  isSettingsOpen: boolean;
  showStatsAndCompleted: boolean;
  theme: 'dark' | 'midnight' | 'light';
  streak: number;
  focusPoints: number;
  lastActiveDate: string;
  setAccentColor: (color: string) => void;
  setFabAlignment: (alignment: 'left' | 'right') => void;
  toggleSettingsModal: () => void;
  toggleStats: () => void;
  applyAccentColor: (color: string) => void;
  setTheme: (theme: 'dark' | 'midnight' | 'light') => void;
  incrementFocusPoints: (points: number) => void;
  checkAndUpdateStreak: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      accentColor: '#a855f7',
      fabAlignment: 'right' as const,
      isSettingsOpen: false,
      showStatsAndCompleted: false,
      theme: 'dark' as const,
      streak: 0,
      focusPoints: 0,
      lastActiveDate: '',

      setAccentColor: (color) => set({ accentColor: color }),

      setFabAlignment: (alignment) => set({ fabAlignment: alignment }),

      toggleSettingsModal: () =>
        set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),

      toggleStats: () =>
        set((state) => ({ showStatsAndCompleted: !state.showStatsAndCompleted })),

      applyAccentColor: (color) => {
        document.documentElement.style.setProperty('--accent', color);
      },

      setTheme: (theme) => {
        document.documentElement.className = theme;
        set({ theme });
      },

      incrementFocusPoints: (points) =>
        set((state) => ({ focusPoints: state.focusPoints + points })),

      checkAndUpdateStreak: () => {
        const today = new Date().toDateString();
        const state = get();
        if (state.lastActiveDate === today) return;
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        const newStreak = state.lastActiveDate === yesterday ? state.streak + 1 : 1;
        set({ streak: newStreak, lastActiveDate: today });
      },
    }),
    {
      name: 'blitz-settings',
      partialize: (state) => ({
        accentColor: state.accentColor,
        fabAlignment: state.fabAlignment,
        showStatsAndCompleted: state.showStatsAndCompleted,
        theme: state.theme,
        streak: state.streak,
        focusPoints: state.focusPoints,
        lastActiveDate: state.lastActiveDate,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accentColor) {
          document.documentElement.style.setProperty('--accent', state.accentColor);
        }
        if (state?.theme) {
          document.documentElement.className = state.theme;
        }
      },
    }
  )
);
