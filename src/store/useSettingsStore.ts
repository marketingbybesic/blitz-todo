import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AIProvider } from '../lib/ai';

interface SettingsState {
  accentColor: string;
  fabAlignment: 'left' | 'right';
  isSettingsOpen: boolean;
  showStatsAndCompleted: boolean;
  theme: 'dark' | 'midnight' | 'light';
  streak: number;
  focusPoints: number;
  lastActiveDate: string;
  calendarEvents: string; // JSON stringified CalEvent[]
  calendarName: string;
  syncFolder: string;
  notificationsEnabled: boolean;
  showCompletedInTimeline: boolean;
  pomodoroMinutes: number;
  setCalendarEvents: (json: string, name: string) => void;
  setSyncFolder: (path: string) => void;
  toggleNotifications: () => void;
  toggleShowCompleted: () => void;
  setPomodoroMinutes: (m: number) => void;
  userApiKey: string;
  aiProvider: AIProvider;
  aiModel: string;
  aiEnabled: boolean;
  setUserApiKey: (key: string, provider: AIProvider, model: string) => void;
  clearUserApiKey: () => void;
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
      calendarEvents: '',
      calendarName: '',
      syncFolder: '',
      notificationsEnabled: false,
      showCompletedInTimeline: false,
      pomodoroMinutes: 25,
      userApiKey: '',
      aiProvider: 'openai' as AIProvider,
      aiModel: 'gpt-4o-mini',
      aiEnabled: false,

      setUserApiKey: (key, provider, model) => {
        const settings = { provider, apiKey: key, model, enabled: true };
        localStorage.setItem('blitz-ai-settings', JSON.stringify(settings));
        set({ userApiKey: key, aiProvider: provider, aiModel: model, aiEnabled: true });
      },

      clearUserApiKey: () => {
        localStorage.removeItem('blitz-ai-settings');
        set({ userApiKey: '', aiEnabled: false });
      },

      setAccentColor: (color) => set({ accentColor: color }),

      setFabAlignment: (alignment) => set({ fabAlignment: alignment }),

      toggleSettingsModal: () =>
        set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),

      toggleStats: () =>
        set((state) => ({ showStatsAndCompleted: !state.showStatsAndCompleted })),

      setCalendarEvents: (json, name) => set({ calendarEvents: json, calendarName: name }),
      setSyncFolder: (path) => set({ syncFolder: path }),
      toggleNotifications: () => set(s => ({ notificationsEnabled: !s.notificationsEnabled })),
      toggleShowCompleted: () => set(s => ({ showCompletedInTimeline: !s.showCompletedInTimeline })),
      setPomodoroMinutes: (m) => set({ pomodoroMinutes: m }),

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
        set({ streak: newStreak, lastActiveDate: today, focusPoints: state.focusPoints + 10 });
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
        calendarEvents: state.calendarEvents,
        calendarName: state.calendarName,
        syncFolder: state.syncFolder,
        notificationsEnabled: state.notificationsEnabled,
        showCompletedInTimeline: state.showCompletedInTimeline,
        pomodoroMinutes: state.pomodoroMinutes,
        userApiKey: state.userApiKey,
        aiProvider: state.aiProvider,
        aiModel: state.aiModel,
        aiEnabled: state.aiEnabled,
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
