import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Clock, Play, ArrowRight, RotateCcw, X } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';

export function MorningTriage() {
  const tasks               = useTaskStore(s => s.tasks);
  const zones               = useTaskStore(s => s.zones);
  const updateTask          = useTaskStore(s => s.updateTask);
  const isMorningTriageOpen = useTaskStore(s => s.isMorningTriageOpen);
  const dismissMorningTriage = useTaskStore(s => s.dismissMorningTriage);

  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const todayISO    = new Date().toISOString();
  const tomorrowISO = (() => { const d = new Date(today); d.setDate(d.getDate()+1); return d.toISOString(); })();

  const overdue = useMemo(() => tasks.filter(t => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate); d.setHours(0,0,0,0);
    return d < today;
  }), [tasks, today]);

  if (!isMorningTriageOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-2xl flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-lg bg-black border border-white/[0.08] rounded-2xl shadow-[0_40px_80px_rgba(0,0,0,0.9)] overflow-hidden"
          initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 16 }} transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-white/[0.06]">
            <div>
              <h2 className="text-base font-bold tracking-tight">Morning Triage</h2>
              <p className="text-xs text-muted mt-0.5">
                {overdue.length > 0
                  ? `${overdue.length} overdue task${overdue.length !== 1 ? 's' : ''} to review`
                  : 'No overdue tasks — you\'re all caught up!'}
              </p>
            </div>
            <button type="button" onClick={dismissMorningTriage}
              className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-white/[0.05] transition-colors">
              <X size={15} />
            </button>
          </div>

          {/* Tasks */}
          {overdue.length > 0 && (
            <div className="max-h-64 overflow-y-auto px-4 py-3 space-y-2">
              {overdue.map(task => {
                const zone = zones.find(z => z.id === task.zoneId);
                return (
                  <div key={task.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] group hover:border-white/10 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground/90 truncate">{task.title}</div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted">
                        {zone && <span className="flex items-center gap-1"><Calendar size={9}/>{zone.name}</span>}
                        <span className="flex items-center gap-1"><Clock size={9}/>{task.estimatedMinutes}m</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => updateTask(task.id, { dueDate: todayISO })}
                        className="p-1.5 rounded-lg text-accent hover:bg-accent/10 transition-colors" title="Snooze to today">
                        <RotateCcw size={12} />
                      </button>
                      <button type="button" onClick={() => updateTask(task.id, { dueDate: tomorrowISO })}
                        className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-white/[0.05] transition-colors" title="Postpone to tomorrow">
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/[0.06]">
            <button type="button" onClick={dismissMorningTriage}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-background text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_30%,transparent)]">
              <Play size={14} />
              {overdue.length > 0 ? 'Start the Day' : 'Let\'s Go'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
