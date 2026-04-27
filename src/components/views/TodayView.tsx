import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FilterX, Zap, Sunrise } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TaskItem } from '../TaskItem';
import { FilterBar } from '../FilterBar';
import { StatsRow } from '../StatsRow';
import { useTaskStore } from '../../store/useTaskStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { shortcut } from '../Typewriter';
import type { Task } from '../../types';

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

  const [isAdding, setIsAdding]     = useState(false);
  const [newTaskTitle, setNewTitle] = useState('');
  const [dragOver, setDragOver]     = useState<string | null>(null); // 'deep' | 'light'
  const inputRef = useRef<HTMLInputElement>(null);

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

  const filtered = useMemo(() => tasks.filter(t => {
    if (!showStatsAndCompleted && t.status === 'done') return false;
    if (activeFilters.deepWork  && t.energyLevel !== 'deep-work') return false;
    if (activeFilters.highImpact && t.impact !== 'high') return false;
    if (activeFilters.shortTask && t.estimatedMinutes > 15) return false;
    if (activeFilters.longTask  && t.estimatedMinutes < 60) return false;
    return true;
  }), [tasks, activeFilters, showStatsAndCompleted]);

  const deepTasks  = filtered.filter(t => t.energyLevel === 'deep-work');
  const lightTasks = filtered.filter(t => t.energyLevel === 'light-work');
  const total = filtered.length;
  const done  = filtered.filter(t => t.status === 'done').length;
  const pct   = total > 0 ? (done / total) * 100 : 0;
  const hasFilters = Object.values(activeFilters).some(Boolean);

  // Drag-drop between energy sections
  const handleDrop = async (e: React.DragEvent, energyLevel: Task['energyLevel']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) await updateTask(taskId, { energyLevel });
    setDragOver(null);
  };

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
          <button type="button" onClick={toggleBlitzMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-accent/15 text-accent border border-accent/25 hover:bg-accent/25 transition-all shadow-[0_0_12px_color-mix(in_srgb,var(--accent)_20%,transparent)]">
            <Zap size={13} /> Burst
          </button>
        </div>
      </div>

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
              {deepTasks.map(t => <TaskItem key={t.id} task={t} onComplete={completeTask} />)}
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
              {lightTasks.map(t => <TaskItem key={t.id} task={t} onComplete={completeTask} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
