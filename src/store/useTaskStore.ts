import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { z } from 'zod';
import { db } from '../lib/db';
import type { Task, Zone } from '../types';
import { useSettingsStore } from './useSettingsStore';

type View = 'today' | 'timeline' | 'dump' | 'zones' | 'vault' | 'kanban';
type SortKey = 'priority' | 'dueDate' | 'time' | 'impact';
type SortDirection = 'asc' | 'desc';

interface TaskState {
  tasks: Task[];
  burstModeActive: boolean;
  isSidebarOpen: boolean;
  currentView: View;
  brainDumpSorted: boolean;
  activeFilters: { deepWork: boolean; highImpact: boolean; shortTask: boolean; longTask: boolean };
  toggleFilter: (type: 'deepWork' | 'highImpact' | 'shortTask' | 'longTask') => void;
  clearFilters: () => void;
  isCaptureOpen: boolean;
  toggleCaptureModal: () => void;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  zones: Zone[];
  loadZones: () => Promise<void>;
  addZone: (name: string) => Promise<void>;
  loadTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  undoComplete: () => Promise<void>;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addChecklistItem: (taskId: string, title: string) => Promise<void>;
  toggleChecklistItem: (taskId: string, itemId: string) => Promise<void>;
  deleteChecklistItem: (taskId: string, itemId: string) => Promise<void>;
  lastCompletedTask: Task | null;
  _undoTimer: ReturnType<typeof setTimeout> | null;
  toggleBlitzMode: () => void;
  toggleSidebar: () => void;
  setCurrentView: (view: View) => void;
  toggleBrainDumpSort: () => void;
  timelineSort: { key: SortKey; direction: SortDirection };
  setTimelineSort: (key: SortKey, direction: SortDirection) => void;
  timelineGroupByDate: boolean;
  toggleTimelineGroupByDate: () => void;
  quickCaptureQuery: string;
  quickCaptureSelectedZoneId: string | null;
  setQuickCaptureQuery: (query: string) => void;
  setQuickCaptureSelectedZoneId: (id: string | null) => void;
  submitQuickCapture: () => Promise<void>;
  morningTriageDismissed: boolean;
  activeTimers: Record<string, number>; // taskId → startTimestamp (ms)
  startTimer: (taskId: string) => void;
  stopTimer: (taskId: string) => Promise<void>;
  getTrackedMinutes: (taskId: string) => number;
  morningTriageDismissedDate?: string;
  isMorningTriageOpen: boolean;
  openMorningTriage: () => void;
  dismissMorningTriage: () => void;
  markMorningTriageChecked: () => void;
  openSchedulingWizard: () => void;
  // Multi-dimension sort (Excel-style)
  sortConfig: Array<{ field: 'priority' | 'dueDate' | 'estimatedMinutes' | 'impact' | 'energyLevel'; direction: 'asc' | 'desc' }>;
  setSortConfig: (config: Array<{ field: 'priority' | 'dueDate' | 'estimatedMinutes' | 'impact' | 'energyLevel'; direction: 'asc' | 'desc' }>) => void;
  addSort: (field: 'priority' | 'dueDate' | 'estimatedMinutes' | 'impact' | 'energyLevel') => void;
  removeSort: (field: string) => void;
  toggleSortDirection: (field: string) => void;
  // Filter values (multi-select style)
  filterValues: {
    impact: ('high' | 'medium' | 'low')[];
    energyLevel: ('deep-work' | 'light-work')[];
    status: ('todo' | 'in_progress' | 'done')[];
  };
  toggleFilterValue: (category: 'impact' | 'energyLevel' | 'status', value: string) => void;
  clearAllFilters: () => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
    tasks: [],
    burstModeActive: false,
    isSidebarOpen: true,
    currentView: 'today' as View,
    brainDumpSorted: false,
    activeFilters: { deepWork: false, highImpact: false, shortTask: false, longTask: false },
    timelineSort: { key: 'priority' as SortKey, direction: 'desc' as SortDirection },
    timelineGroupByDate: true,
    quickCaptureQuery: '',
    quickCaptureSelectedZoneId: null,
    morningTriageDismissed: false,
    activeTimers: {},
    morningTriageDismissedDate: undefined,
    isMorningTriageOpen: false,
    isCaptureOpen: false,
    selectedTaskId: null,
    zones: [],
    lastCompletedTask: null,
    _undoTimer: null as ReturnType<typeof setTimeout> | null,
    sortConfig: [],
    filterValues: { impact: [], energyLevel: [], status: [] },

    loadTasks: async () => {
      const allTasks = await db.tasks.toArray();
      set({ tasks: allTasks });
    },

    loadZones: async () => {
      const allZones = await db.zones.toArray();
      set({ zones: allZones });
    },

    addZone: async (name) => {
      const now = new Date().toISOString();
      const newZone: Zone = {
        id: crypto.randomUUID(),
        name: name.trim(),
        createdAt: now,
      };
      await db.zones.add(newZone);
      await get().loadZones();
    },

    addTask: async (taskInput) => {
      const now = new Date().toISOString();
      const newTask: Task = {
        ...taskInput,
        id: crypto.randomUUID(),
        createdAt: now,
      };
      await db.tasks.add(newTask);
      await get().loadTasks();
    },

    completeTask: async (id) => {
      const task = get().tasks.find((t) => t.id === id);
      if (!task) return;

      const state = get();
      if (state._undoTimer) clearTimeout(state._undoTimer);

      set({ lastCompletedTask: task });
      const timer = setTimeout(() => {
        set({ lastCompletedTask: null });
      }, 5000);
      set({ _undoTimer: timer });

      await db.tasks.update(id, { status: 'done', completedAt: new Date().toISOString() });
      await get().loadTasks();
      useSettingsStore.getState().incrementFocusPoints(5);
    },

    undoComplete: async () => {
      const state = get();
      if (!state.lastCompletedTask) return;

      if (state._undoTimer) clearTimeout(state._undoTimer);

      await db.tasks.update(state.lastCompletedTask.id, { status: 'todo', completedAt: undefined });
      await get().loadTasks();
      set({ lastCompletedTask: null, _undoTimer: null });
    },

    updateTask: async (id, updates) => {
      await db.tasks.update(id, updates);
      await get().loadTasks();
    },

    deleteTask: async (id) => {
      await db.tasks.delete(id);
      await get().loadTasks();
    },

    addChecklistItem: async (taskId, title) => {
      const task = await db.tasks.get(taskId);
      if (!task) return;
      const newItem = { id: crypto.randomUUID(), title, isDone: false };
      await db.tasks.update(taskId, {
        checklist: [...(task.checklist || []), newItem],
      });
      await get().loadTasks();
    },

    toggleChecklistItem: async (taskId, itemId) => {
      const task = await db.tasks.get(taskId);
      if (!task) return;
      const updatedChecklist = (task.checklist || []).map((item) =>
        item.id === itemId ? { ...item, isDone: !item.isDone } : item
      );
      await db.tasks.update(taskId, { checklist: updatedChecklist });
      await get().loadTasks();
    },

    deleteChecklistItem: async (taskId, itemId) => {
      const task = await db.tasks.get(taskId);
      if (!task) return;
      const updatedChecklist = (task.checklist || []).filter(
        (item) => item.id !== itemId
      );
      await db.tasks.update(taskId, { checklist: updatedChecklist });
      await get().loadTasks();
    },

    toggleBlitzMode: () => {
      set((state) => ({ burstModeActive: !state.burstModeActive }));
    },

    toggleSidebar: () => {
      set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
    },

    setCurrentView: (view) => {
      set({ currentView: view });
    },

    toggleBrainDumpSort: () => {
      set((state) => ({ brainDumpSorted: !state.brainDumpSorted }));
    },

    setTimelineSort: (key, direction) => {
      set({ timelineSort: { key, direction } });
    },

    toggleTimelineGroupByDate: () => {
      set((state) => ({ timelineGroupByDate: !state.timelineGroupByDate }));
    },

    setQuickCaptureQuery: (query) => set({ quickCaptureQuery: query }),

    setQuickCaptureSelectedZoneId: (id) => set({ quickCaptureSelectedZoneId: id }),

    submitQuickCapture: async () => {
      const state = get();
      let query = state.quickCaptureQuery.trim();
      if (!query) return;

      const hashtagRegex = /#([\w-]+)/g;
      const hashtags: string[] = [];
      let match: RegExpExecArray | null;
      while ((match = hashtagRegex.exec(query)) !== null) {
        hashtags.push(match[1].toLowerCase());
      }
      query = query.replace(hashtagRegex, '').trim();

      if (!query) return;

      let zoneId: string | undefined = state.quickCaptureSelectedZoneId || undefined;
      if (hashtags.length > 0 && state.zones.length > 0) {
        for (const tag of hashtags) {
          const matched = state.zones.find(
            (z) => z.name.toLowerCase().replace(/\s+/g, '-') === tag || z.name.toLowerCase().replace(/\s+/g, '') === tag
          );
          if (matched) {
            zoneId = matched.id;
            break;
          }
        }
      }

      await state.addTask({
        title: query,
        energyLevel: 'light-work',
        estimatedMinutes: 15,
        isTarget: false,
        status: 'todo',
        impact: 'medium',
        dueDate: undefined,
        content: undefined,
        zoneId: zoneId || undefined,
        startDate: undefined,
        checklist: [],
      });

      set({ quickCaptureQuery: '', quickCaptureSelectedZoneId: null, isCaptureOpen: false });
    },

    openMorningTriage: () => {
      set({ isMorningTriageOpen: true, morningTriageDismissed: true });
    },

    dismissMorningTriage: () => {
      set({ isMorningTriageOpen: false, morningTriageDismissed: true });
    },

    markMorningTriageChecked: () => {
      set({ morningTriageDismissed: true });
    },

    startTimer: (taskId) => {
      const now = Date.now();
      set(s => ({ activeTimers: { ...s.activeTimers, [taskId]: now } }));
      // Also set status to in_progress if todo
      const task = get().tasks.find(t => t.id === taskId);
      if (task && task.status === 'todo') {
        db.tasks.update(taskId, { status: 'in_progress' }).then(() => get().loadTasks());
      }
    },

    stopTimer: async (taskId) => {
      const state = get();
      const startMs = state.activeTimers[taskId];
      if (!startMs) return;
      const elapsedMinutes = Math.round((Date.now() - startMs) / 60000);
      const task = state.tasks.find(t => t.id === taskId);
      const prevTracked = task?.timeTracked ?? 0;
      await db.tasks.update(taskId, { timeTracked: prevTracked + elapsedMinutes });
      const newTimers = { ...state.activeTimers };
      delete newTimers[taskId];
      set({ activeTimers: newTimers });
      await get().loadTasks();
    },

    getTrackedMinutes: (taskId) => {
      const state = get();
      const startMs = state.activeTimers[taskId];
      const task = state.tasks.find(t => t.id === taskId);
      const base = task?.timeTracked ?? 0;
      if (!startMs) return base;
      return base + Math.round((Date.now() - startMs) / 60000);
    },

    openSchedulingWizard: () => {
      set({ isMorningTriageOpen: true, morningTriageDismissed: true });
    },

    setSortConfig: (config) => set({ sortConfig: config }),

    addSort: (field) => set(s => {
      const existing = s.sortConfig.find(c => c.field === field);
      if (existing) return { sortConfig: s.sortConfig.map(c => c.field === field ? { ...c, direction: c.direction === 'asc' ? 'desc' : 'asc' } : c) as typeof s.sortConfig };
      return { sortConfig: [...s.sortConfig, { field, direction: 'desc' as const }] };
    }),

    removeSort: (field) => set(s => ({ sortConfig: s.sortConfig.filter(c => c.field !== field) })),

    toggleSortDirection: (field) => set(s => ({
      sortConfig: s.sortConfig.map(c => c.field === field ? { ...c, direction: c.direction === 'asc' ? 'desc' : 'asc' } : c) as typeof s.sortConfig,
    })),

    toggleFilterValue: (category, value) => set(s => {
      const current = s.filterValues[category] as string[];
      const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
      return { filterValues: { ...s.filterValues, [category]: next } };
    }),

    clearAllFilters: () => set({
      sortConfig: [],
      filterValues: { impact: [], energyLevel: [], status: [] },
      activeFilters: { deepWork: false, highImpact: false, shortTask: false, longTask: false },
    }),

    toggleFilter: (type) => {
      set((state) => ({
        activeFilters: {
          ...state.activeFilters,
          [type]: !state.activeFilters[type],
        },
      }));
    },

    clearFilters: () => {
      set({ activeFilters: { deepWork: false, highImpact: false, shortTask: false, longTask: false } });
    },

    toggleCaptureModal: () => {
      set((state) => ({ isCaptureOpen: !state.isCaptureOpen }));
    },

    setSelectedTaskId: (id) => {
      set({ selectedTaskId: id });
    },
  }),
  {
    name: 'blitz-tasks',
    partialize: (state) => ({
      morningTriageDismissed: state.morningTriageDismissed,
      morningTriageDismissedDate: new Date().toDateString(),
      activeFilters: state.activeFilters,
      timelineSort: state.timelineSort,
      timelineGroupByDate: state.timelineGroupByDate,
      isSidebarOpen: state.isSidebarOpen,
      currentView: state.currentView,
      sortConfig: state.sortConfig,
      filterValues: state.filterValues,
    }),
    onRehydrateStorage: () => (state) => {
      if (state) {
        const today = new Date().toDateString();
        if ((state as TaskState & { morningTriageDismissedDate?: string }).morningTriageDismissedDate !== today) {
          state.morningTriageDismissed = false;
        }
      }
    },
  }
));
