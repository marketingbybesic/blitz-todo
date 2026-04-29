import { useState } from 'react';
import { ChevronDown, ChevronUp, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { motion, AnimatePresence } from 'framer-motion';

const SORT_FIELDS = [
  { id: 'priority' as const, label: 'Priority', icon: '⚡' },
  { id: 'dueDate' as const, label: 'Due Date', icon: '📅' },
  { id: 'estimatedMinutes' as const, label: 'Duration', icon: '⏱' },
  { id: 'impact' as const, label: 'Impact', icon: '🎯' },
  { id: 'energyLevel' as const, label: 'Energy', icon: '🔋' },
];

const FILTER_OPTIONS = {
  impact: [
    { value: 'high', label: 'High', color: 'text-accent' },
    { value: 'medium', label: 'Medium', color: 'text-blue-400' },
    { value: 'low', label: 'Low', color: 'text-muted' },
  ],
  energyLevel: [
    { value: 'deep-work', label: 'Deep Work', color: 'text-accent' },
    { value: 'light-work', label: 'Light Work', color: 'text-green-400' },
  ],
  status: [
    { value: 'todo', label: 'To Do', color: 'text-blue-400' },
    { value: 'in_progress', label: 'In Progress', color: 'text-orange-400' },
    { value: 'done', label: 'Done', color: 'text-green-400' },
  ],
} as const;

export function FilterBar() {
  const [isOpen, setIsOpen] = useState(false);
  const sortConfig        = useTaskStore(s => s.sortConfig);
  const addSort           = useTaskStore(s => s.addSort);
  const removeSort        = useTaskStore(s => s.removeSort);
  const toggleSortDirection = useTaskStore(s => s.toggleSortDirection);
  const filterValues      = useTaskStore(s => s.filterValues);
  const toggleFilterValue = useTaskStore(s => s.toggleFilterValue);
  const clearAllFilters   = useTaskStore(s => s.clearAllFilters);

  const activeCount = sortConfig.length + Object.values(filterValues).flat().length;

  return (
    <div className="relative mb-4">
      {/* Trigger bar */}
      <div className="flex items-center gap-2 px-6 py-2 border-b border-white/[0.04]">
        <button
          type="button"
          onClick={() => setIsOpen(o => !o)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            isOpen || activeCount > 0
              ? 'bg-accent/15 text-accent border border-accent/25'
              : 'bg-white/[0.04] text-muted/50 border border-white/[0.05] hover:text-foreground'
          }`}
        >
          <SlidersHorizontal size={11} />
          {activeCount > 0 ? `${activeCount} active` : 'Sort & Filter'}
          <ChevronDown size={10} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Active sort chips */}
        {sortConfig.map((s, i) => (
          <div key={s.field} className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-accent/10 border border-accent/20 text-[10px] text-accent">
            <span className="font-semibold">{i + 1}</span>
            <span>{SORT_FIELDS.find(f => f.id === s.field)?.label}</span>
            <button type="button" onClick={() => toggleSortDirection(s.field)}>
              {s.direction === 'desc' ? <ChevronDown size={9} /> : <ChevronUp size={9} />}
            </button>
            <button type="button" onClick={() => removeSort(s.field)} className="text-accent/50 hover:text-accent ml-0.5">
              <X size={9} />
            </button>
          </div>
        ))}

        {activeCount > 0 && (
          <button type="button" onClick={clearAllFilters} className="text-[10px] text-muted/40 hover:text-muted transition-colors ml-auto">
            Clear all
          </button>
        )}
      </div>

      {/* Dropdown panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="absolute top-full left-0 right-0 z-40 bg-black/95 backdrop-blur-xl border border-white/[0.07] border-t-0 overflow-hidden"
          >
            <div className="p-4 grid grid-cols-2 gap-4">
              {/* Sort section */}
              <div>
                <div className="text-[9px] font-semibold text-muted/40 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <ArrowUpDown size={9} /> Sort (click to add, click again to flip)
                </div>
                <div className="flex flex-col gap-1">
                  {SORT_FIELDS.map(field => {
                    const active = sortConfig.find(s => s.field === field.id);
                    const order  = sortConfig.findIndex(s => s.field === field.id) + 1;
                    return (
                      <button
                        key={field.id}
                        type="button"
                        onClick={() => addSort(field.id)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all text-left ${
                          active
                            ? 'bg-accent/10 text-accent border border-accent/20'
                            : 'bg-white/[0.03] text-muted/60 border border-white/[0.04] hover:text-foreground hover:bg-white/[0.05]'
                        }`}
                      >
                        <span>{field.icon} {field.label}</span>
                        {active && (
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-bold text-muted/40">#{order}</span>
                            {active.direction === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filter section */}
              <div className="flex flex-col gap-3">
                {(Object.entries(FILTER_OPTIONS) as [keyof typeof FILTER_OPTIONS, typeof FILTER_OPTIONS[keyof typeof FILTER_OPTIONS]][]).map(([category, options]) => (
                  <div key={category}>
                    <div className="text-[9px] font-semibold text-muted/40 uppercase tracking-widest mb-1.5 capitalize">
                      {category === 'energyLevel' ? 'Energy' : category}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(options as readonly { value: string; label: string; color: string }[]).map(opt => {
                        const isActive = (filterValues[category] as string[]).includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => toggleFilterValue(category, opt.value)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                              isActive
                                ? `${opt.color} bg-white/[0.08] border border-current/30`
                                : 'text-muted/50 bg-white/[0.03] border border-white/[0.05] hover:text-foreground'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
