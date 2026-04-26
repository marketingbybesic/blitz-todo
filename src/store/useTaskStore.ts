import { create } from 'zustand';
import { db } from '../lib/db';
import type { Task, Zone } from '../types';

type View = 'today' | 'timeline' | 'dump' | 'zones' | 'vault';
type SortKey = 'priority' | 'dueDate' | 'time';
type SortDirection = 'asc' | 'desc';

interface TaskState {
  tasks: Task[];
  burstModeActive: boolean;
  isSidebarOpen: boolean;
  currentView: View;
  brainDumpSorted: boolean;
  activeFilters: { deepWork: boolean; highImpact: boolean; shortTask: boolean; longTask: boolean };
  toggleFilter: (type: 'deepWork' | 'highImpact' | 'shortTask' | 'longTask') => void;
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
}

export const useTaskStore = create<TaskState>()(
  (set, get) => ({
    tasks: [],
    burstModeActive: false,
    isSidebarOpen: true,
    currentView: 'today' as View,
    brainDumpSorted: false,
    activeFilters: { deepWork: false, highImpact: false, shortTask: false, longTask: false },
    timelineSort: { key: 'priority' as SortKey, direction: 'desc' as SortDirection },
    isCaptureOpen: false,
    selectedTaskId: null,
    zones: [],
    lastCompletedTask: null,
    _undoTimer: null as ReturnType<typeof setTimeout> | null,

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
      const allTasks = await db.tasks.toArray();
      const task = allTasks.find((t) => t.id === id);
      if (!task) return;

      const state = get();
      if (state._undoTimer) clearTimeout(state._undoTimer);

      set({ lastCompletedTask: task });
      const timer = setTimeout(() => {
        set({ lastCompletedTask: null });
      }, 5000);
      (set as unknown as (fn: (s: typeof state) => Partial<typeof state>) => void)((s) => ({ ...s, _undoTimer: timer }));

      await db.tasks.update(id, { status: 'done', completedAt: new Date().toISOString() });
      await get().loadTasks();
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

    toggleFilter: (type) => {
      set((state) => ({
        activeFilters: {
          ...state.activeFilters,
          [type]: !state.activeFilters[type],
        },
      }));
    },

    toggleCaptureModal: () => {
      set((state) => ({ isCaptureOpen: !state.isCaptureOpen }));
    },

    setSelectedTaskId: (id) => {
      set({ selectedTaskId: id });
    },
  })
);
