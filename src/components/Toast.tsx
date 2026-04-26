import { AnimatePresence, motion } from 'framer-motion';
import { useTaskStore } from '../store/useTaskStore';

export function Toast() {
  const lastCompletedTask = useTaskStore((state) => state.lastCompletedTask);
  const undoComplete = useTaskStore((state) => state.undoComplete);

  return (
    <AnimatePresence>
      {lastCompletedTask && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-20 md:bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-card border border-white/10 rounded-xl px-4 py-3 shadow-2xl"
        >
          <span className="text-sm text-muted">Task completed.</span>
          <button
            type="button"
            onClick={undoComplete}
            className="text-xs font-semibold text-accent hover:text-accent/80 transition-colors"
          >
            Undo
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
