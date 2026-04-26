import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SlidersHorizontal, Eye, EyeOff, ArrowUp, ArrowDown, X, Brain, Target, Timer, Hourglass, Zap } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';

type SortKey = 'priority' | 'dueDate' | 'time' | 'impact';

const SORT_OPTIONS: { key: SortKey; label: string; icon: React.ReactNode }[] = [
  { key: 'priority', label: 'Priority',  icon: <Zap size={12} /> },
  { key: 'dueDate',  label: 'Due Date',  icon: <Timer size={12} /> },
  { key: 'time',     label: 'Duration',  icon: <Hourglass size={12} /> },
  { key: 'impact',   label: 'Impact',    icon: <Target size={12} /> },
];

export function TimelineControls() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const timelineSort          = useTaskStore(s => s.timelineSort);
  const setTimelineSort       = useTaskStore(s => s.setTimelineSort);
  const timelineGroupByDate   = useTaskStore(s => s.timelineGroupByDate);
  const toggleTimelineGroupByDate = useTaskStore(s => s.toggleTimelineGroupByDate);
  const activeFilters         = useTaskStore(s => s.activeFilters);
  const toggleFilter          = useTaskStore(s => s.toggleFilter);
  const clearFilters          = useTaskStore(s => s.clearFilters);

  const activeCount =
    (timelineSort.key !== 'priority' ? 1 : 0) +
    Object.values(activeFilters).filter(Boolean).length;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSort = (key: SortKey) => {
    if (timelineSort.key === key) {
      setTimelineSort(key, timelineSort.direction === 'asc' ? 'desc' : 'asc');
    } else {
      setTimelineSort(key, 'desc');
    }
  };

  const filterChips = [
    { key: 'deepWork' as const,   label: 'Deep Work',   icon: <Brain size={11} /> },
    { key: 'highImpact' as const, label: 'High Impact', icon: <Target size={11} /> },
    { key: 'shortTask' as const,  label: '< 15 min',    icon: <Timer size={11} /> },
    { key: 'longTask' as const,   label: '60+ min',     icon: <Hourglass size={11} /> },
  ];

  return (
    <div className="flex items-center gap-2" ref={panelRef}>
      {/* Group-by-date eye toggle */}
      <button
        type="button"
        onClick={toggleTimelineGroupByDate}
        title={timelineGroupByDate ? 'Ungroup by date' : 'Group by date'}
        className={`p-2 rounded-lg transition-all duration-200 ${
          timelineGroupByDate
            ? 'bg-accent/15 text-accent shadow-[0_0_12px_color-mix(in_srgb,var(--accent)_25%,transparent)]'
            : 'text-muted hover:text-foreground hover:bg-card'
        }`}
      >
        {timelineGroupByDate ? <Eye size={15} /> : <EyeOff size={15} />}
      </button>

      {/* Filter / Sort trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
            open || activeCount > 0
              ? 'bg-accent/15 text-accent border border-accent/25 shadow-[0_0_12px_color-mix(in_srgb,var(--accent)_20%,transparent)]'
              : 'bg-card text-muted border border-border hover:text-foreground hover:border-border/60'
          }`}
        >
          <SlidersHorizontal size={13} />
          Sort & Filter
          {activeCount > 0 && (
            <span className="ml-0.5 bg-accent text-background text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -6 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute right-0 top-full mt-2 w-72 z-50 rounded-2xl border border-white/[0.08] bg-black/90 backdrop-blur-2xl shadow-[0_24px_60px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              {/* Sort section */}
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-muted">Sort</span>
                  {activeCount > 0 && (
                    <button
                      type="button"
                      onClick={() => { clearFilters(); setTimelineSort('priority', 'desc'); }}
                      className="flex items-center gap-1 text-[10px] text-muted hover:text-foreground transition-colors"
                    >
                      <X size={10} />
                      Clear all
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {SORT_OPTIONS.map(opt => {
                    const isActive = timelineSort.key === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleSort(opt.key)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                          isActive
                            ? 'bg-accent/20 text-accent border border-accent/30'
                            : 'bg-white/[0.04] text-muted border border-transparent hover:border-white/10 hover:text-foreground'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          {opt.icon}
                          {opt.label}
                        </span>
                        {isActive && (
                          timelineSort.direction === 'asc'
                            ? <ArrowUp size={11} className="text-accent" />
                            : <ArrowDown size={11} className="text-accent" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/[0.06] mx-4" />

              {/* Filter section */}
              <div className="px-4 pt-3 pb-4">
                <div className="text-[10px] font-semibold tracking-[0.15em] uppercase text-muted mb-3">Filter</div>
                <div className="flex flex-wrap gap-1.5">
                  {filterChips.map(chip => {
                    const isActive = activeFilters[chip.key];
                    return (
                      <button
                        key={chip.key}
                        type="button"
                        onClick={() => toggleFilter(chip.key)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150 ${
                          isActive
                            ? 'bg-accent/20 text-accent border border-accent/30 shadow-[0_0_8px_color-mix(in_srgb,var(--accent)_20%,transparent)]'
                            : 'bg-white/[0.04] text-muted border border-transparent hover:border-white/10 hover:text-foreground'
                        }`}
                      >
                        {chip.icon}
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
