import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CalendarOff } from 'lucide-react';
import { TaskItem } from '../TaskItem';
import { FilterBar } from '../FilterBar';
import { TimelineControls } from '../TimelineControls';
import { useTaskStore } from '../../store/useTaskStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { calculatePriority } from '../../lib/priority';
import { Typewriter } from '../Typewriter';
import type { Task } from '../../types';

function getDateCategory(task: Task): 'overdue' | 'today' | 'tomorrow' | 'later' | 'unscheduled' {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (!task.dueDate) return 'unscheduled';

  const check = new Date(task.dueDate);
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
  const timelineGroupByDate = useTaskStore((state) => state.timelineGroupByDate);
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

  const groups = useMemo(() => {
    if (!timelineGroupByDate) return null;

    const withDate = sorted.filter((t) => t.dueDate !== undefined);
    const graveyard = sorted.filter((t) => t.dueDate === undefined);

    return {
      overdue: withDate.filter((t) => getDateCategory(t) === 'overdue'),
      today: withDate.filter((t) => getDateCategory(t) === 'today'),
      tomorrow: withDate.filter((t) => getDateCategory(t) === 'tomorrow'),
      later: withDate.filter((t) => getDateCategory(t) === 'later'),
      graveyard,
    };
  }, [sorted, timelineGroupByDate]);

  const hasAny = sorted.length > 0;

  const renderTaskList = (taskList: Task[]) => (
    <motion.div layout className="flex flex-col gap-2">
      {taskList.map((task) => (
        <motion.div layout key={task.id}>
          <TaskItem task={task} onComplete={completeTask} />
        </motion.div>
      ))}
    </motion.div>
  );

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

      {!timelineGroupByDate ? (
        <motion.div layout className="flex flex-col gap-2 mt-8">
          {renderTaskList(sorted)}
        </motion.div>
      ) : groups ? (
        <div className="space-y-8 mt-8">
          {groups.overdue.length > 0 && (
            <div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-muted/50 mb-2">
                Overdue
              </div>
              {renderTaskList(groups.overdue)}
            </div>
          )}

          {groups.today.length > 0 && (
            <div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-muted/50 mb-2">
                Today
              </div>
              {renderTaskList(groups.today)}
            </div>
          )}

          {groups.tomorrow.length > 0 && (
            <div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-muted/50 mb-2">
                Tomorrow
              </div>
              {renderTaskList(groups.tomorrow)}
            </div>
          )}

          {groups.later.length > 0 && (
            <div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-muted/50 mb-2">
                Later This Week
              </div>
              {renderTaskList(groups.later)}
            </div>
          )}

          {groups.graveyard.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-muted/50 mb-2">
                <CalendarOff size={10} />
                Unscheduled
              </div>
              {renderTaskList(groups.graveyard)}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
