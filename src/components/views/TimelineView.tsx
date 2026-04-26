import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarOff, AlertCircle, Sun, Sunrise, Clock } from 'lucide-react';
import { TaskItem } from '../TaskItem';
import { FilterBar } from '../FilterBar';
import { TimelineControls } from '../TimelineControls';
import { useTaskStore } from '../../store/useTaskStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { calculatePriority } from '../../lib/priority';
import { Typewriter } from '../Typewriter';
import type { Task } from '../../types';

type DateBucket = 'overdue' | 'today' | 'tomorrow' | 'later' | 'unscheduled';

function getDateCategory(task: Task): DateBucket {
  if (!task.dueDate) return 'unscheduled';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(task.dueDate);
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diff = Math.round((dueDay.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  return 'later';
}

const GROUP_META: Record<DateBucket, { label: string; sublabel?: string; icon: React.ReactNode; color: string; dot: string }> = {
  overdue:     { label: 'Overdue',       sublabel: 'Needs attention',   icon: <AlertCircle size={12} />, color: 'text-red-400',    dot: '#f87171' },
  today:       { label: 'Today',         sublabel: 'On your plate now', icon: <Sun size={12} />,         color: 'text-accent',     dot: 'var(--accent)' },
  tomorrow:    { label: 'Tomorrow',      sublabel: 'Coming up next',    icon: <Sunrise size={12} />,     color: 'text-blue-400',   dot: '#60a5fa' },
  later:       { label: 'Later',         sublabel: 'In the pipeline',   icon: <Clock size={12} />,       color: 'text-muted',      dot: '#6b7280' },
  unscheduled: { label: 'Unscheduled',   sublabel: 'No date set',       icon: <CalendarOff size={12} />, color: 'text-muted/50',   dot: '#374151' },
};

function GroupSection({ bucket, tasks, onComplete }: { bucket: DateBucket; tasks: Task[]; onComplete: (id: string) => void }) {
  if (tasks.length === 0) return null;
  const meta = GROUP_META[bucket];

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="relative">
      {/* Date label */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: meta.dot, boxShadow: `0 0 6px ${meta.dot}` }} />
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold tracking-wide ${meta.color} flex items-center gap-1.5`}>
            {meta.icon}
            {meta.label}
          </span>
          {meta.sublabel && <span className="text-[10px] text-muted/40">{meta.sublabel}</span>}
          <span className="text-[10px] text-muted/30 font-mono bg-white/[0.04] px-1.5 py-0.5 rounded-md">{tasks.length}</span>
        </div>
      </div>
      {/* Vertical timeline line */}
      <div className="absolute left-[3px] top-6 bottom-0 w-px bg-white/[0.05]" />
      <div className="pl-6 flex flex-col gap-1.5">
        {tasks.map(task => (
          <motion.div layout key={task.id}>
            <TaskItem task={task} onComplete={onComplete} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export function TimelineView() {
  const tasks               = useTaskStore(s => s.tasks);
  const loadTasks           = useTaskStore(s => s.loadTasks);
  const completeTask        = useTaskStore(s => s.completeTask);
  const activeFilters       = useTaskStore(s => s.activeFilters);
  const timelineSort        = useTaskStore(s => s.timelineSort);
  const timelineGroupByDate = useTaskStore(s => s.timelineGroupByDate);
  const showStatsAndCompleted = useSettingsStore(s => s.showStatsAndCompleted);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const filtered = useMemo(() => tasks.filter(t => {
    if (!showStatsAndCompleted && t.status === 'done') return false;
    if (activeFilters.deepWork  && t.energyLevel !== 'deep-work') return false;
    if (activeFilters.highImpact && t.impact !== 'high') return false;
    if (activeFilters.shortTask && t.estimatedMinutes > 15) return false;
    if (activeFilters.longTask  && t.estimatedMinutes < 60) return false;
    return true;
  }), [tasks, activeFilters, showStatsAndCompleted]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (timelineSort.key) {
      case 'priority': cmp = calculatePriority(a) - calculatePriority(b); break;
      case 'dueDate': {
        const at = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bt = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        cmp = at - bt; break;
      }
      case 'time':   cmp = a.estimatedMinutes - b.estimatedMinutes; break;
      case 'impact': {
        const order = { high: 0, medium: 1, low: 2 };
        cmp = (order[a.impact] ?? 1) - (order[b.impact] ?? 1); break;
      }
    }
    return timelineSort.direction === 'desc' ? -cmp : cmp;
  }), [filtered, timelineSort]);

  const groups = useMemo(() => ({
    overdue:     sorted.filter(t => getDateCategory(t) === 'overdue'),
    today:       sorted.filter(t => getDateCategory(t) === 'today'),
    tomorrow:    sorted.filter(t => getDateCategory(t) === 'tomorrow'),
    later:       sorted.filter(t => getDateCategory(t) === 'later'),
    unscheduled: sorted.filter(t => getDateCategory(t) === 'unscheduled'),
  }), [sorted]);

  const empty = sorted.length === 0;

  return (
    <div className="max-w-3xl mx-auto pt-10 px-6 pb-24">
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Timeline</h1>
          {!empty && (
            <p className="text-xs text-muted mt-0.5">{sorted.length} task{sorted.length !== 1 ? 's' : ''}</p>
          )}
        </div>
        <TimelineControls />
      </div>

      <FilterBar />

      {empty ? (
        <div className="text-sm text-muted/60 tracking-wide mt-8">
          <Typewriter />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {!timelineGroupByDate ? (
            <motion.div key="flat" layout className="flex flex-col gap-1.5 mt-6">
              {sorted.map(task => (
                <motion.div layout key={task.id}>
                  <TaskItem task={task} onComplete={completeTask} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div key="grouped" className="mt-6 space-y-8">
              {(['overdue','today','tomorrow','later','unscheduled'] as DateBucket[]).map(bucket => (
                <GroupSection key={bucket} bucket={bucket} tasks={groups[bucket]} onComplete={completeTask} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
