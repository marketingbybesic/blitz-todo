import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Timer, Square, Play } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';

interface TimeTrackerProps {
  taskId: string;
  compact?: boolean;
}

export function TimeTracker({ taskId, compact = false }: TimeTrackerProps) {
  const activeTimers   = useTaskStore(s => s.activeTimers);
  const startTimer     = useTaskStore(s => s.startTimer);
  const stopTimer      = useTaskStore(s => s.stopTimer);
  const getTracked     = useTaskStore(s => s.getTrackedMinutes);
  const tasks          = useTaskStore(s => s.tasks);
  const task           = tasks.find(t => t.id === taskId);

  const isRunning = !!activeTimers[taskId];
  const [display, setDisplay] = useState('0m');

  useEffect(() => {
    const update = () => {
      const mins = getTracked(taskId);
      if (mins < 60) setDisplay(`${mins}m`);
      else {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        setDisplay(m > 0 ? `${h}h ${m}m` : `${h}h`);
      }
    };
    update();
    if (!isRunning) return;
    const id = setInterval(update, 10000); // update every 10s
    return () => clearInterval(id);
  }, [isRunning, taskId, getTracked]);

  if (compact) {
    return (
      <button
        type="button"
        onClick={e => { e.stopPropagation(); isRunning ? stopTimer(taskId) : startTimer(taskId); }}
        title={isRunning ? `Stop timer (${display})` : `Start timer (${display} tracked)`}
        className={`flex items-center gap-1 text-[10px] font-mono transition-colors ${
          isRunning ? 'text-orange-400' : 'text-muted/30 hover:text-muted/70'
        }`}
      >
        {isRunning ? <Square size={9} fill="currentColor" /> : <Timer size={9} />}
        {(task?.timeTracked ?? 0) > 0 || isRunning ? display : null}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-bold tabular-nums font-mono">{display}</div>
          <div className="text-[10px] text-muted/40">
            {isRunning ? 'Timer running' : 'Time tracked'}
          </div>
        </div>
        <button
          type="button"
          onClick={() => isRunning ? stopTimer(taskId) : startTimer(taskId)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            isRunning
              ? 'bg-orange-400/15 text-orange-400 border border-orange-400/25 hover:bg-orange-400/25'
              : 'bg-accent/15 text-accent border border-accent/25 hover:bg-accent/25'
          }`}
        >
          {isRunning ? <><Square size={12} fill="currentColor" /> Stop</> : <><Play size={12} /> Start</>}
        </button>
      </div>
      {isRunning && (
        <motion.div className="h-1 rounded-full bg-orange-400/20 overflow-hidden"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div className="h-full bg-orange-400 rounded-full"
            animate={{ width: ['0%', '100%'] }}
            transition={{ duration: 600, ease: 'linear', repeat: Infinity }} />
        </motion.div>
      )}
    </div>
  );
}
