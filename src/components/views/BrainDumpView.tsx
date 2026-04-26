import { useEffect } from 'react';
import { TaskItem } from '../TaskItem';
import { useTaskStore } from '../../store/useTaskStore';
import { calculateGravity } from '../../lib/gravity';
import { Typewriter } from '../Typewriter';

export function BrainDumpView() {
  const tasks = useTaskStore((state) => state.tasks);
  const loadTasks = useTaskStore((state) => state.loadTasks);
  const completeTask = useTaskStore((state) => state.completeTask);
  const sorted = useTaskStore((state) => state.brainDumpSorted);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const chaosTasks = tasks.filter((t) => !t.startDate && !t.dueDate);

  const displayTasks = sorted
    ? [...chaosTasks].sort((a, b) => calculateGravity(b) - calculateGravity(a))
    : chaosTasks;

  if (chaosTasks.length === 0) {
    return (
      <div className="max-w-3xl mx-auto pt-12 px-8">
        <h1 className="text-2xl font-bold tracking-tight mb-8">Brain Dump</h1>
        <div className="text-sm text-muted/60 tracking-wide">
          <Typewriter />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pt-12 px-8">
      <h1 className="text-2xl font-bold tracking-tight mb-8">Brain Dump</h1>
      <div className="flex flex-col gap-1">
        {displayTasks.map((task) => (
          <TaskItem key={task.id} task={task} onComplete={completeTask} />
        ))}
      </div>
    </div>
  );
}
