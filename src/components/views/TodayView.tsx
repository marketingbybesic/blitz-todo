import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FilterX } from 'lucide-react';
import { TaskItem } from '../TaskItem';
import { FilterBar } from '../FilterBar';
import { useTaskStore } from '../../store/useTaskStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { shortcut } from '../Typewriter';

export function TodayView() {
  const tasks = useTaskStore((state) => state.tasks);
  const loadTasks = useTaskStore((state) => state.loadTasks);
  const completeTask = useTaskStore((state) => state.completeTask);
  const activeFilters = useTaskStore((state) => state.activeFilters);
  const clearFilters = useTaskStore((state) => state.clearFilters);
  const toggleCaptureModal = useTaskStore((state) => state.toggleCaptureModal);
  const addTask = useTaskStore((state) => state.addTask);
  const isCaptureOpen = useTaskStore((state) => state.isCaptureOpen);
  const showStatsAndCompleted = useSettingsStore((state) => state.showStatsAndCompleted);

  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddTask = useCallback(async () => {
    if (!newTaskTitle.trim()) return;
    await addTask({
      title: newTaskTitle.trim(),
      energyLevel: 'light-work',
      estimatedMinutes: 15,
      isTarget: false,
      status: 'todo',
      impact: 'medium',
      dueDate: undefined,
      content: undefined,
      zoneId: undefined,
      startDate: undefined,
      checklist: [],
    });
    setNewTaskTitle('');
    setIsAdding(false);
  }, [newTaskTitle, addTask]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        if (isAdding || isCaptureOpen) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        setIsAdding(true);
      } else if (e.key === 'Escape' && isAdding) {
        setIsAdding(false);
        setNewTaskTitle('');
      } else if (e.key === 'Enter' && isAdding && !e.shiftKey) {
        e.preventDefault();
        handleAddTask();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isAdding, isCaptureOpen, handleAddTask]);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (!showStatsAndCompleted && t.status === 'done') return false;
      if (activeFilters.deepWork && t.energyLevel !== 'deep-work') return false;
      if (activeFilters.highImpact && t.impact !== 'high') return false;
      if (activeFilters.shortTask && t.estimatedMinutes > 15) return false;
      if (activeFilters.longTask && t.estimatedMinutes < 60) return false;
      return true;
    });
  }, [tasks, activeFilters, showStatsAndCompleted]);

  const deepTasks = filteredTasks.filter((t) => t.energyLevel === 'deep-work');
  const lightTasks = filteredTasks.filter((t) => t.energyLevel === 'light-work');

  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter((t) => t.status === 'done').length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const hasActiveFilters = activeFilters.deepWork || activeFilters.highImpact || activeFilters.shortTask || activeFilters.longTask;

  const header = (
    <div className="flex items-center justify-between mb-8">
      <h1 className="text-2xl font-bold tracking-tight">Today</h1>
      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 transition-colors"
        >
          <FilterX size={14} />
          Clear Filters
        </button>
      )}
    </div>
  );

  const inlineInput = isAdding && (
    <div className="mb-6">
      <input
        ref={inputRef}
        type="text"
        value={newTaskTitle}
        onChange={(e) => setNewTaskTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTask();
          }
          if (e.key === 'Escape') {
            setIsAdding(false);
            setNewTaskTitle('');
          }
        }}
        placeholder="What needs to get done?"
        className="w-full bg-transparent border-b border-white/10 text-foreground focus:outline-none focus:border-accent text-sm py-2 placeholder:text-white/20"
      />
    </div>
  );

  if (tasks.length === 0) {
    return (
      <div className="max-w-3xl mx-auto pt-12 px-8">
        {header}
        {inlineInput || (
          <button
            type="button"
            onClick={toggleCaptureModal}
            className="w-full text-left group"
          >
            <div className="text-sm text-muted/60 tracking-wide">
              Your slate is clean.
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-muted/40 group-hover:text-muted/60 transition-colors">
                Tap to capture a task
              </span>
              <span className="text-xs text-muted/30 font-mono">{shortcut}</span>
            </div>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pt-12 px-8">
      {header}
      {inlineInput}
      <FilterBar />

      <div className="relative pl-6 min-h-[50vh]">
        {/* Progress track */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-card/5 rounded-full overflow-hidden">
          <div
            className="absolute bottom-0 left-0 w-full bg-accent transition-all duration-700 ease-out rounded-full shadow-[0_0_10px_var(--accent)]"
            style={{ height: `${progressPercentage}%` }}
          />
        </div>

        {deepTasks.length > 0 && (
          <>
            <div className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4 mt-8">
              Deep Work
            </div>
            <div className="flex flex-col gap-1">
              {deepTasks.map((task) => (
                <TaskItem key={task.id} task={task} onComplete={completeTask} />
              ))}
            </div>
          </>
        )}

        {lightTasks.length > 0 && (
          <>
            <div className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4 mt-8">
              Light Work
            </div>
            <div className="flex flex-col gap-1">
              {lightTasks.map((task) => (
                <TaskItem key={task.id} task={task} onComplete={completeTask} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
