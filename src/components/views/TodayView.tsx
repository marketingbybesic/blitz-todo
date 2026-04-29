import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FilterX, Zap, Sunrise, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskItem } from '../TaskItem';
import { FilterBar } from '../FilterBar';
import { StatsRow } from '../StatsRow';
import { useTaskStore } from '../../store/useTaskStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { shortcut } from '../Typewriter';
import { callAI } from '../../lib/ai';
import type { Task } from '../../types';

function SortableTaskItem({ task, onComplete }: { task: Task; onComplete: (id: string) => Promise<void> }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 1 : 'auto',
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskItem task={task} onComplete={onComplete} />
    </div>
  );
}

export function TodayView() {
  const tasks             = useTaskStore(s => s.tasks);
  const loadTasks         = useTaskStore(s => s.loadTasks);
  const completeTask      = useTaskStore(s => s.completeTask);
  const updateTask        = useTaskStore(s => s.updateTask);
  const activeFilters     = useTaskStore(s => s.activeFilters);
  const clearFilters      = useTaskStore(s => s.clearFilters);
  const toggleCaptureModal = useTaskStore(s => s.toggleCaptureModal);
  const addTask           = useTaskStore(s => s.addTask);
  const isCaptureOpen     = useTaskStore(s => s.isCaptureOpen);
  const toggleBlitzMode   = useTaskStore(s => s.toggleBlitzMode);
  const openMorningTriage = useTaskStore(s => s.openMorningTriage);
  const showStatsAndCompleted = useSettingsStore(s => s.showStatsAndCompleted);

  const [isAdding, setIsAdding]         = useState(false);
  const [newTaskTitle, setNewTitle]     = useState('');
  const [dragOver, setDragOver]         = useState<string | null>(null); // 'deep' | 'light'
  const [aiSortedIds, setAiSortedIds]   = useState<string[] | null>(null);
  const [aiSorting, setAiSorting]       = useState(false);
  const [aiSortHint, setAiSortHint]     = useState('');
  const [deepOrder, setDeepOrder]       = useState<string[]>([]);
  const [lightOrder, setLightOrder]     = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleSortMyDay = useCallback(async () => {
    const activeTasks = tasks.filter(t => t.status !== 'done');
    if (activeTasks.length === 0) return;
    setAiSorting(true);
    setAiSortHint('');
    try {
      const prompt = `You are a productivity coach. Sort these tasks by optimal execution order for today, considering urgency and effort.

Tasks:
${activeTasks.map((t, i) => `${i + 1}. "${t.title}" [impact: ${t.impact || 'medium'}, energy: ${t.energyLevel || 'light-work'}, est: ${t.estimatedMinutes || '?'}min, due: ${t.dueDate || 'no due date'}]`).join('\n')}

Return ONLY a JSON array of task IDs in optimal order, starting with quick wins (< 30min, high impact):
${JSON.stringify(activeTasks.map(t => t.id))}`;

      const resp = await callAI(prompt);
      const match = resp.match(/\[[\s\S]*?\]/);
      if (match) {
        const orderedIds: string[] = JSON.parse(match[0]);
        setAiSortedIds(orderedIds);
        setAiSortHint('Day sorted by AI priority');
        setTimeout(() => setAiSortHint(''), 3000);
      }
    } catch {
      setAiSortHint('AI unavailable — check your key in Settings');
      setTimeout(() => setAiSortHint(''), 4000);
    } finally {
      setAiSorting(false);
    }
  }, [tasks]);

  const handleAddTask = useCallback(async () => {
    if (!newTaskTitle.trim()) return;
    await addTask({ title: newTaskTitle.trim(), energyLevel: 'light-work', estimatedMinutes: 15, isTarget: false, status: 'todo', impact: 'medium', dueDate: undefined, content: undefined, zoneId: undefined, startDate: undefined, checklist: [] });
    setNewTitle(''); setIsAdding(false);
  }, [newTaskTitle, addTask]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        if (isAdding || isCaptureOpen) return;
        e.preventDefault(); e.stopImmediatePropagation(); setIsAdding(true);
      } else if (e.key === 'Escape' && isAdding) { setIsAdding(false); setNewTitle(''); }
      else if (e.key === 'Enter' && isAdding && !e.shiftKey) { e.preventDefault(); handleAddTask(); }
    };
    window.addEventListener('keydown', h, true);
    return () => window.removeEventListener('keydown', h, true);
  }, [isAdding, isCaptureOpen, handleAddTask]);

  useEffect(() => { if (isAdding && inputRef.current) inputRef.current.focus(); }, [isAdding]);
  useEffect(() => { loadTasks(); }, [loadTasks]);

  const filtered = useMemo(() => {
    let list = tasks.filter(t => {
      if (!showStatsAndCompleted && t.status === 'done') return false;
      if (activeFilters.deepWork  && t.energyLevel !== 'deep-work') return false;
      if (activeFilters.highImpact && t.impact !== 'high') return false;
      if (activeFilters.shortTask && t.estimatedMinutes > 15) return false;
      if (activeFilters.longTask  && t.estimatedMinutes < 60) return false;
      return true;
    });
    if (aiSortedIds) {
      const order = new Map(aiSortedIds.map((id, i) => [id, i]));
      list = [...list].sort((a, b) => {
        const ai = order.get(a.id) ?? 9999;
        const bi = order.get(b.id) ?? 9999;
        return ai - bi;
      });
    }
    return list;
  }, [tasks, activeFilters, showStatsAndCompleted, aiSortedIds]);

  const deepTasksBase  = filtered.filter(t => t.energyLevel === 'deep-work');
  const lightTasksBase = filtered.filter(t => t.energyLevel === 'light-work');
  const total = filtered.length;
  const done  = filtered.filter(t => t.status === 'done').length;
  const pct   = total > 0 ? (done / total) * 100 : 0;
  const hasFilters = Object.values(activeFilters).some(Boolean);

  // Sync order arrays when underlying task lists change
  useEffect(() => {
    const ids = deepTasksBase.map(t => t.id);
    setDeepOrder(prev => {
      const kept = prev.filter(id => ids.includes(id));
      const added = ids.filter(id => !prev.includes(id));
      return [...kept, ...added];
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepTasksBase.map(t => t.id).join(',')]);

  useEffect(() => {
    const ids = lightTasksBase.map(t => t.id);
    setLightOrder(prev => {
      const kept = prev.filter(id => ids.includes(id));
      const added = ids.filter(id => !prev.includes(id));
      return [...kept, ...added];
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightTasksBase.map(t => t.id).join(',')]);

  // Apply manual sort order on top of filtered lists
  const deepTasks = useMemo(() => {
    if (deepOrder.length === 0) return deepTasksBase;
    return deepOrder
      .map(id => deepTasksBase.find(t => t.id === id))
      .filter((t): t is Task => t !== undefined);
  }, [deepTasksBase, deepOrder]);

  const lightTasks = useMemo(() => {
    if (lightOrder.length === 0) return lightTasksBase;
    return lightOrder
      .map(id => lightTasksBase.find(t => t.id === id))
      .filter((t): t is Task => t !== undefined);
  }, [lightTasksBase, lightOrder]);

  // Drag-drop between energy sections (cross-section HTML drag)
  const handleDrop = async (e: React.DragEvent, energyLevel: Task['energyLevel']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) await updateTask(taskId, { energyLevel });
    setDragOver(null);
  };

  // dnd-kit reorder within a section
  const handleDragEnd = useCallback((event: DragEndEvent, section: 'deep' | 'light') => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (section === 'deep') {
      setDeepOrder(prev => {
        const oldIdx = prev.indexOf(String(active.id));
        const newIdx = prev.indexOf(String(over.id));
        if (oldIdx === -1 || newIdx === -1) return prev;
        return arrayMove(prev, oldIdx, newIdx);
      });
    } else {
      setLightOrder(prev => {
        const oldIdx = prev.indexOf(String(active.id));
        const newIdx = prev.indexOf(String(over.id));
        if (oldIdx === -1 || newIdx === -1) return prev;
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  }, []);

  if (tasks.length === 0) {
    return (
      <div className="max-w-3xl mx-auto pt-10 px-6 pb-24">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-bold tracking-tight">Today</h1>
          <div className="flex items-center gap-2">
            <button type="button" onClick={openMorningTriage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-card text-muted border border-border hover:text-foreground hover:border-border/60 transition-all">
              <Sunrise size={13} /> Triage
            </button>
            <button type="button" onClick={handleSortMyDay} disabled={aiSorting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-card text-muted border border-border hover:text-foreground hover:border-border/60 transition-all disabled:opacity-50">
              <Sparkles size={13} className={aiSorting ? 'animate-spin' : ''} /> Sort
            </button>
            <button type="button" onClick={toggleBlitzMode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-accent/15 text-accent border border-accent/25 hover:bg-accent/25 transition-all shadow-[0_0_12px_color-mix(in_srgb,var(--accent)_20%,transparent)]">
              <Zap size={13} /> Burst
            </button>
          </div>
        </div>
        {isAdding ? (
          <input ref={inputRef} type="text" value={newTaskTitle} onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => { if(e.key==='Enter'){e.preventDefault();handleAddTask();} if(e.key==='Escape'){setIsAdding(false);setNewTitle('');} }}
            placeholder="What needs to get done?"
            className="w-full bg-transparent border-b border-accent/30 text-foreground focus:outline-none focus:border-accent text-sm py-2 placeholder:text-muted/30 transition-colors" />
        ) : (
          <button type="button" onClick={toggleCaptureModal} className="w-full text-left group">
            <div className="text-sm text-muted/60 tracking-wide">Your slate is clean.</div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-muted/40 group-hover:text-muted/60 transition-colors">Tap to capture a task</span>
              <span className="text-xs text-muted/30 font-mono">{shortcut}</span>
            </div>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pt-10 px-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Today</h1>
          {total > 0 && <p className="text-xs text-muted mt-0.5">{done}/{total} done</p>}
        </div>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <button type="button" onClick={clearFilters}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-card text-muted border border-border hover:text-foreground transition-all">
              <FilterX size={12} /> Clear
            </button>
          )}
          <button type="button" onClick={openMorningTriage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-card text-muted border border-border hover:text-foreground hover:border-border/60 transition-all">
            <Sunrise size={13} /> Triage
          </button>
          <button type="button" onClick={handleSortMyDay} disabled={aiSorting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-card text-muted border border-border hover:text-foreground hover:border-border/60 transition-all disabled:opacity-50">
            <Sparkles size={13} className={aiSorting ? 'animate-spin' : ''} /> Sort My Day
          </button>
          <button type="button" onClick={toggleBlitzMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-accent/15 text-accent border border-accent/25 hover:bg-accent/25 transition-all shadow-[0_0_12px_color-mix(in_srgb,var(--accent)_20%,transparent)]">
            <Zap size={13} /> Burst
          </button>
        </div>
      </div>

      {/* AI sort hint */}
      <AnimatePresence>
        {aiSortHint && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mb-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-accent/10 border border-accent/20 text-xs text-accent"
          >
            <Sparkles size={11} />
            {aiSortHint}
            {aiSortedIds && (
              <button type="button" onClick={() => setAiSortedIds(null)}
                className="ml-auto text-accent/50 hover:text-accent transition-colors text-[10px]">
                Reset
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Sorted badge */}
      {aiSortedIds && !aiSortHint && (
        <div className="mb-3 flex items-center gap-1.5 text-[10px] text-accent/50">
          <Sparkles size={9} />
          <span>AI Sorted</span>
          <button type="button" onClick={() => setAiSortedIds(null)}
            className="ml-1 text-accent/30 hover:text-accent/60 transition-colors">
            ✕
          </button>
        </div>
      )}

      {/* Progress bar */}
      {total > 0 && (
        <div className="w-full h-px bg-white/[0.04] rounded-full mb-5 overflow-hidden">
          <motion.div className="h-full rounded-full"
            style={{ background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }}
            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }} />
        </div>
      )}

      {isAdding && (
        <div className="mb-5">
          <input ref={inputRef} type="text" value={newTaskTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => { if(e.key==='Enter'){e.preventDefault();handleAddTask();} if(e.key==='Escape'){setIsAdding(false);setNewTitle('');} }}
            placeholder="What needs to get done?"
            className="w-full bg-transparent border-b border-accent/30 text-foreground focus:outline-none focus:border-accent text-sm py-2 placeholder:text-muted/30 transition-colors" />
        </div>
      )}

      <FilterBar />
      {showStatsAndCompleted && <StatsRow />}

      {/* Drag-and-drop energy sections */}
      <div className="relative pl-4">
        <div className="absolute left-0 top-0 bottom-0 w-px bg-white/[0.04] rounded-full overflow-hidden">
          <motion.div className="absolute bottom-0 left-0 w-full rounded-full"
            style={{ background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)' }}
            animate={{ height: `${pct}%` }} transition={{ duration: 0.7, ease: 'easeOut' }} />
        </div>

        {deepTasks.length > 0 && (
          <div className="mb-6"
            onDragOver={e => { e.preventDefault(); setDragOver('deep'); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={e => handleDrop(e, 'deep-work')}>
            <div className={`text-[10px] font-bold text-muted/40 uppercase tracking-[0.2em] mb-2 transition-colors ${dragOver === 'deep' ? 'text-accent/60' : ''}`}>
              Deep Work
            </div>
            <div className={`flex flex-col gap-0.5 rounded-xl transition-all p-1 -m-1 ${dragOver === 'deep' ? 'bg-accent/5 ring-1 ring-accent/20' : ''}`}>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={e => handleDragEnd(e, 'deep')}>
                <SortableContext items={deepTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  {deepTasks.map(t => <SortableTaskItem key={t.id} task={t} onComplete={completeTask} />)}
                </SortableContext>
              </DndContext>
            </div>
          </div>
        )}

        {lightTasks.length > 0 && (
          <div
            onDragOver={e => { e.preventDefault(); setDragOver('light'); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={e => handleDrop(e, 'light-work')}>
            <div className={`text-[10px] font-bold text-muted/40 uppercase tracking-[0.2em] mb-2 transition-colors ${dragOver === 'light' ? 'text-blue-400/60' : ''}`}>
              Light Work
            </div>
            <div className={`flex flex-col gap-0.5 rounded-xl transition-all p-1 -m-1 ${dragOver === 'light' ? 'bg-blue-400/5 ring-1 ring-blue-400/20' : ''}`}>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={e => handleDragEnd(e, 'light')}>
                <SortableContext items={lightTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  {lightTasks.map(t => <SortableTaskItem key={t.id} task={t} onComplete={completeTask} />)}
                </SortableContext>
              </DndContext>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
