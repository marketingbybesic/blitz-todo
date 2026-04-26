import { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, ArrowUp, ArrowDown } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { FilterBar } from './FilterBar';

type SortKey = 'priority' | 'dueDate' | 'time';
type SortDirection = 'asc' | 'desc';

export function TimelineControls() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineSort = useTaskStore((state) => state.timelineSort);
  const setTimelineSort = useTaskStore((state) => state.setTimelineSort);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'priority', label: 'Priority' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'time', label: 'Time Estimate' },
  ];

  const handleKeyClick = (key: SortKey) => {
    if (timelineSort.key === key) {
      setTimelineSort(key, timelineSort.direction === 'asc' ? 'desc' : 'asc');
    } else {
      setTimelineSort(key, 'desc');
    }
  };

  const handleDirectionToggle = (key: SortKey, e: React.MouseEvent) => {
    e.stopPropagation();
    if (timelineSort.key === key) {
      setTimelineSort(key, timelineSort.direction === 'asc' ? 'desc' : 'asc');
    } else {
      setTimelineSort(key, 'desc');
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 text-xs text-white/40 hover:text-white/80 transition-colors px-3 py-1.5 rounded-lg hover:bg-card/5"
      >
        <SlidersHorizontal size={16} />
        <span className="hidden md:inline">Sort & Filter</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 z-50 bg-card border border-white/10 rounded-xl p-4 shadow-2xl w-64">
          <div className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-3">
            Sort By
          </div>
          <div className="flex flex-col gap-2 mb-6">
            {sortOptions.map((opt) => {
              const isActive = timelineSort.key === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => handleKeyClick(opt.key)}
                  className="flex items-center justify-between w-full text-left group"
                >
                  <span className={`text-sm ${isActive ? 'text-accent font-medium' : 'text-white/60 group-hover:text-white/80'}`}>
                    {opt.label}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleDirectionToggle(opt.key, e)}
                    className={`p-1 rounded transition-colors ${isActive ? 'text-accent' : 'text-white/20 hover:text-white/40'}`}
                  >
                    {isActive && timelineSort.direction === 'asc' ? (
                      <ArrowUp size={14} />
                    ) : (
                      <ArrowDown size={14} />
                    )}
                  </button>
                </button>
              );
            })}
          </div>

          <div className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-3">
            Filters
          </div>
          <FilterBar />
        </div>
      )}
    </div>
  );
}
