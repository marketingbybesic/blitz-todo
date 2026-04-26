import { useEffect } from 'react';
import { TaskItem } from '../TaskItem';
import { useTaskStore } from '../../store/useTaskStore';
import { QuoteGenerator } from '../QuoteGenerator';
import { Typewriter } from '../Typewriter';

export function VaultView() {
  const tasks = useTaskStore((state) => state.tasks);
  const loadTasks = useTaskStore((state) => state.loadTasks);
  const completeTask = useTaskStore((state) => state.completeTask);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const completedTasks = tasks.filter((t) => t.status === 'done');

  return (
    <div className="max-w-3xl mx-auto pt-12 px-8">
      <h1 className="text-2xl font-bold tracking-tight mb-8">The Vault</h1>

      <QuoteGenerator />

      <div className="w-full h-32 border border-dashed border-white/10 rounded-xl flex items-center justify-center text-white/20 text-xs uppercase tracking-widest mb-6">
        Calendar Integration Coming Soon
      </div>

      {/* Completed Tasks */}
      <div>
        <label className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-4 block">
          Completed Tasks
        </label>
        {completedTasks.length === 0 ? (
          <div className="text-sm text-muted/60 tracking-wide">
            <Typewriter />
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {completedTasks.map((task) => (
              <TaskItem key={task.id} task={task} onComplete={completeTask} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
