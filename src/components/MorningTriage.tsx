import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTaskStore } from '../store/useTaskStore';

export function MorningTriage() {
  const tasks = useTaskStore((state) => state.tasks);
  const loadTasks = useTaskStore((state) => state.loadTasks);
  const updateTask = useTaskStore((state) => state.updateTask);

  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const overdue = tasks.filter((t) => {
    if (!t.dueDate) return false;
    const due = new Date(t.dueDate);
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    return dueDay <= yesterday;
  });

  const brainDump = tasks.filter((t) => !t.startDate && !t.dueDate);

  const triageTasks = [...overdue, ...brainDump];
  const currentTask = triageTasks[index];

  useEffect(() => {
    if (triageTasks.length === 0) {
      setVisible(false);
    }
  }, [triageTasks.length]);

  if (!visible || triageTasks.length === 0) return null;

  const formatDateISO = (date: Date) => date.toISOString();

  const doToday = async () => {
    if (!currentTask) return;
    await updateTask(currentTask.id, {
      dueDate: formatDateISO(today),
    });
    nextTask();
  };

  const snooze = async () => {
    if (!currentTask) return;
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    await updateTask(currentTask.id, {
      dueDate: formatDateISO(tomorrow),
    });
    nextTask();
  };

  const backlog = async () => {
    if (!currentTask) return;
    await updateTask(currentTask.id, {
      dueDate: undefined,
      startDate: undefined,
    });
    nextTask();
  };

  const nextTask = () => {
    if (index + 1 >= triageTasks.length) {
      setVisible(false);
    } else {
      setIndex((prev) => prev + 1);
    }
  };

  return (
    <AnimatePresence>
      {visible && currentTask && (
        <motion.div
          className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            key={currentTask.id}
            className="flex flex-col items-center gap-8 px-8"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
          >
            <div className="text-center">
              <div className="text-xs font-semibold text-muted uppercase tracking-widest mb-4">
                Morning Triage ({index + 1} / {triageTasks.length})
              </div>
              <h2 className="text-2xl font-medium text-white tracking-tight max-w-xl">
                {currentTask.title}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={doToday}
                className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-transparent border-2 border-[#a855f7] shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:bg-[#a855f7]/20 hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] transition-all duration-300"
              >
                Do Today
              </button>

              <button
                type="button"
                onClick={snooze}
                className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-transparent border-2 border-white/20 hover:border-white/40 hover:bg-white/5 transition-all duration-300"
              >
                Snooze
              </button>

              <button
                type="button"
                onClick={backlog}
                className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-transparent border-2 border-red-500/30 hover:border-red-500/50 hover:bg-red-500/10 transition-all duration-300"
              >
                Backlog
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
