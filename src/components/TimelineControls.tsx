import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown, Calendar } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';

type SortKey = 'priority' | 'dueDate' | 'time';

export function TimelineControls() {
  const timelineSort = useTaskStore((state) => state.timelineSort);
  const setTimelineSort = useTaskStore((state) => state.setTimelineSort);
  const timelineGroupByDate = useTaskStore((state) => state.timelineGroupByDate);
  const toggleTimelineGroupByDate = useTaskStore((state) => state.toggleTimelineGroupByDate);

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'time', label: 'Duration' },
    { key: 'priority', label: 'Priority' },
    { key: 'dueDate', label: 'Due Date' },
  ];

  const handleSortClick = (key: SortKey) => {
    if (timelineSort.key === key) {
      setTimelineSort(key, timelineSort.direction === 'asc' ? 'desc' : 'asc');
    } else {
      setTimelineSort(key, 'desc');
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center bg-white/5 rounded-lg p-1 gap-1">
        {sortOptions.map((opt) => {
          const isActive = timelineSort.key === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => handleSortClick(opt.key)}
              className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${isActive ? 'bg-accent text-white' : 'text-white/40 hover:text-white/60'}`}
            >
              {opt.label}
              {isActive && (timelineSort.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted/50">Group</span>
        <button
          type="button"
          onClick={toggleTimelineGroupByDate}
          className={`relative w-9 h-5 rounded-full transition-colors ${timelineGroupByDate ? 'bg-accent' : 'bg-card'}`}
        >
          <motion.span
            className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white"
            animate={{ x: timelineGroupByDate ? 16 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </button>
      </div>
    </div>
  );
}
