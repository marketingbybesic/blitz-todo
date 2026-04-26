import { useEffect, useMemo } from 'react';
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
  const toggleCaptureModal = useTaskStore((state) => state.toggleCaptureModal);
  const showStatsAndCompleted = useSettingsStore((state) => state.showStatsAndCompleted);

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

  if (tasks.length === 0) {
    return (
      <div className="max-w-3xl mx-auto pt-12 px-8">
        <h1 className="text-2xl font-bold tracking-tight mb-8">Today</h1>
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
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pt-12 px-8">
      <h1 className="text-2xl font-bold tracking-tight mb-8">Today</h1>
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
