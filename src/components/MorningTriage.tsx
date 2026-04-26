import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Clock, Play } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';

export function MorningTriage() {
  const tasks = useTaskStore((state) => state.tasks);
  const zones = useTaskStore((state) => state.zones);
  const updateTask = useTaskStore((state) => state.updateTask);
  const isMorningTriageOpen = useTaskStore((state) => state.isMorningTriageOpen);
  const dismissMorningTriage = useTaskStore((state) => state.dismissMorningTriage);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayISO = now.toISOString();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowISO = tomorrow.toISOString();

  const overdueTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
      return dueDay < today;
    });
  }, [tasks, today]);

  const handleSnooze = async (taskId: string) => {
    await updateTask(taskId, { dueDate: todayISO });
  };

  const handlePostpone = async (taskId: string) => {
    await updateTask(taskId, { dueDate: tomorrowISO });
  };

  const handleStartDay = () => {
    dismissMorningTriage();
  };

  if (!isMorningTriageOpen || overdueTasks.length === 0) return null;

  return (
    <AnimatePresence>
      {isMorningTriageOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-2xl flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="max-w-2xl w-[90%] flex flex-col max-h-[80vh]">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-white">Morning Triage</h2>
              <p className="text-sm text-white/40 mt-2">
                {overdueTasks.length} overdue {overdueTasks.length === 1 ? 'task' : 'tasks'} waiting for you
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {overdueTasks.map((task) => {
                const zone = zones.find((z) => z.id === task.zoneId);
                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-card/30 border border-white/5"
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="text-sm font-medium text-white truncate">
                        {task.title}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-white/40">
                        {zone && (
                          <span className="flex items-center gap-1">
                            <Calendar size={10} />
                            {zone.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {task.estimatedMinutes}m
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSnooze(task.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                      >
                        Auto-Snooze
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePostpone(task.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white/60 hover:bg-white/10 transition-colors"
                      >
                        Postpone
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={handleStartDay}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
              >
                <Play size={16} />
                Start Day
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
