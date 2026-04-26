import { useEffect } from 'react';
import { TaskItem } from '../TaskItem';
import { useTaskStore } from '../../store/useTaskStore';
import { shortcut } from '../Typewriter';

export function TodayView() {
  const tasks = useTaskStore((state) => state.tasks);
  const loadTasks = useTaskStore((state) => state.loadTasks);
  const completeTask = useTaskStore((state) => state.completeTask);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const deepTasks = tasks.filter((t) => t.energyLevel === 'deep-work');
  const lightTasks = tasks.filter((t) => t.energyLevel === 'light-work');

  const toggleCaptureModal = useTaskStore((state) => state.toggleCaptureModal);

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
  );
}
