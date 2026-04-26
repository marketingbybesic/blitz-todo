import { useEffect, useMemo } from 'react';
import { TaskItem } from '../TaskItem';
import { FilterBar } from '../FilterBar';
import { TimelineControls } from '../TimelineControls';
import { useTaskStore } from '../../store/useTaskStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { calculatePriority } from '../../lib/priority';
import { Typewriter } from '../Typewriter';
import type { Task } from '../../types';

function getDateCategory(task: Task): 'overdue' | 'today' | 'tomorrow' | 'later' {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const dateToCheck = task.dueDate || task.startDate;
  if (!dateToCheck) return 'later';

  const check = new Date(dateToCheck);
  const checkDay = new Date(check.getFullYear(), check.getMonth(), check.getDate());
  const diffMs = checkDay.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  return 'later';
}

export function TimelineView() {
  const tasks = useTaskStore((state) => state.tasks);
  const loadTasks = useTaskStore((state) => state.loadTasks);
  const completeTask = useTaskStore((state) => state.completeTask);
  const activeFilters = useTaskStore((state) => state.activeFilters);
  const timelineSort = useTaskStore((state) => state.timelineSort);
  const showStatsAndCompleted = useSettingsStore((state) => state.showStatsAndCompleted);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (!showStatsAndCompleted && t.status === 'done') return false;
      if (activeFilters.deepWork && t.energyLevel !== 'deep-work') return false;
      if (activeFilters.highImpact && t.impact !== 'high') return false;
      return true;
    });
  }, [tasks, activeFilters, showStatsAndCompleted]);

  const sorted = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      let comparison = 0;
      switch (timelineSort.key) {
        case 'priority':
          comparison = calculatePriority(a) - calculatePriority(b);
          break;
        case 'dueDate': {
          const aTime = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          const bTime = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          comparison = aTime - bTime;
          break;
        }
        case 'time':
          comparison = a.estimatedMinutes - b.estimatedMinutes;
          break;
      }
      return timelineSort.direction === 'desc' ? -comparison : comparison;
    });
  }, [filteredTasks, timelineSort]);

  const overdue = sorted.filter((t) => getDateCategory(t) === 'overdue');
  const today = sorted.filter((t) => getDateCategory(t) === 'today');
  const tomorrow = sorted.filter((t) => getDateCategory(t) === 'tomorrow');
  const later = sorted.filter((t) => getDateCategory(t) === 'later');

  const hasAny = overdue.length > 0 || today.length > 0 || tomorrow.length > 0 || later.length > 0;

  if (!hasAny) {
    return (
      <div className="max-w-3xl mx-auto pt-12 px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Timeline</h1>
          <TimelineControls />
        </div>
        <FilterBar />
        <div className="text-sm text-muted/60 tracking-wide">
          <Typewriter />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pt-12 px-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Timeline</h1>
        <TimelineControls />
      </div>
      <FilterBar />

      {overdue.length > 0 && (
        <>
          <div className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-4 mt-8">
            Overdue
          </div>
          <div className="flex flex-col gap-1">
            {overdue.map((task) => (
              <TaskItem key={task.id} task={task} onComplete={completeTask} />
            ))}
          </div>
        </>
      )}

      {today.length > 0 && (
        <>
          <div className="text-xs font-semibold text-accent uppercase tracking-widest mb-4 mt-8">
            Today
          </div>
          <div className="flex flex-col gap-1">
            {today.map((task) => (
              <TaskItem key={task.id} task={task} onComplete={completeTask} />
            ))}
          </div>
        </>
      )}

      {tomorrow.length > 0 && (
        <>
          <div className="text-xs font-semibold text-muted uppercase tracking-widest mb-4 mt-8">
            Tomorrow
          </div>
          <div className="flex flex-col gap-1">
            {tomorrow.map((task) => (
              <TaskItem key={task.id} task={task} onComplete={completeTask} />
            ))}
          </div>
        </>
      )}

      {later.length > 0 && (
        <>
          <div className="text-xs font-semibold text-muted uppercase tracking-widest mb-4 mt-8">
            Later This Week
          </div>
          <div className="flex flex-col gap-1">
            {later.map((task) => (
              <TaskItem key={task.id} task={task} onComplete={completeTask} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
