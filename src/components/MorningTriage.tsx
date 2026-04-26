import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { flushSync } from 'react-dom';
import { useTaskStore } from '../store/useTaskStore';

type Direction = 'left' | 'up' | 'right';

const cardVariants = {
  enter: { opacity: 0, y: 60, scale: 0.92 },
  center: { opacity: 1, y: 0, scale: 1 },
  exit: (direction: Direction) => {
    switch (direction) {
      case 'left':
        return { opacity: 0, x: '-120vw', rotate: -8, scale: 0.85 };
      case 'up':
        return { opacity: 0, y: '-120vh', rotate: 4, scale: 0.85 };
      case 'right':
        return { opacity: 0, x: '120vw', rotate: 8, scale: 0.85 };
    }
  },
};

export function MorningTriage() {
  const tasks = useTaskStore((state) => state.tasks);
  const loadTasks = useTaskStore((state) => state.loadTasks);
  const updateTask = useTaskStore((state) => state.updateTask);

  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [direction, setDirection] = useState<Direction>('up');

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

  const nextTask = () => {
    if (index + 1 >= triageTasks.length) {
      setVisible(false);
    } else {
      setIndex((prev) => prev + 1);
    }
  };

  const doToday = async () => {
    if (!currentTask) return;
    flushSync(() => setDirection('up'));
    await updateTask(currentTask.id, {
      dueDate: formatDateISO(today),
    });
    nextTask();
  };

  const snooze = async () => {
    if (!currentTask) return;
    flushSync(() => setDirection('right'));
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    await updateTask(currentTask.id, {
      dueDate: formatDateISO(tomorrow),
    });
    nextTask();
  };

  const backlog = async () => {
    if (!currentTask) return;
    flushSync(() => setDirection('left'));
    await updateTask(currentTask.id, {
      dueDate: undefined,
      startDate: undefined,
    });
    nextTask();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      if (!visible || !currentTask) return;

      switch (e.key) {
        case '1':
          e.preventDefault();
          doToday();
          break;
        case '2':
          e.preventDefault();
          snooze();
          break;
        case '3':
          e.preventDefault();
          backlog();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, currentTask, doToday, snooze, backlog]);

  const remaining = triageTasks.length - index;
  const progress = (index / triageTasks.length) * 100;

  return (
    <AnimatePresence>
      {visible && currentTask && (
        <motion.div
          className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentTask.id}
              custom={direction}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.55 }}
              className="flex flex-col items-center gap-10 px-12 py-14 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 max-w-2xl w-full mx-4"
            >
              <div className="text-center w-full">
                <div className="text-xs font-semibold text-muted uppercase tracking-widest mb-6">
                  Morning Triage
                </div>
                <h2 className="text-4xl font-bold text-white tracking-tight text-center leading-tight">
                  {currentTask.title}
                </h2>
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={doToday}
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-transparent border-2 border-accent shadow-[0_0_15px_color-mix(in_srgb,var(--accent)_30%,transparent)] hover:bg-accent/20 hover:shadow-[0_0_25px_color-mix(in_srgb,var(--accent)_50%,transparent)] transition-all duration-300"
                >
                  Do Today [1]
                </button>

                <button
                  type="button"
                  onClick={snooze}
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-transparent border-2 border-white/20 hover:border-white/40 hover:bg-white/5 transition-all duration-300"
                >
                  Snooze [2]
                </button>

                <button
                  type="button"
                  onClick={backlog}
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-transparent border-2 border-red-500/30 hover:border-red-500/50 hover:bg-red-500/10 transition-all duration-300"
                >
                  Backlog [3]
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-2 px-4 pointer-events-none">
            <div className="text-xs font-medium text-muted">
              {remaining} {remaining === 1 ? 'task' : 'tasks'} remaining
            </div>
            <div className="w-full max-w-md h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-accent rounded-full shadow-[0_0_10px_color-mix(in_srgb,var(--accent)_70%,transparent)]"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
