import { Brain, Target, Timer, Hourglass } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';

export function FilterBar() {
  const activeFilters = useTaskStore((state) => state.activeFilters);
  const toggleFilter = useTaskStore((state) => state.toggleFilter);

  return (
    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
      <button
        type="button"
        onClick={() => toggleFilter('deepWork')}
        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all backdrop-blur-md border cursor-pointer flex items-center gap-1.5 shrink-0 ${
          activeFilters.deepWork
            ? 'bg-accent/20 text-accent border-accent/30'
            : 'bg-card/[0.03] text-white/40 border-white/5 hover:bg-card/[0.08] hover:text-white/80 hover:border-accent hover:text-accent hover:shadow-[0_0_10px_color-mix(in_srgb,var(--accent)_40%,transparent)]'
        }`}
      >
        <Brain size={12} strokeWidth={2.5} />
        Deep Work
      </button>
      <button
        type="button"
        onClick={() => toggleFilter('highImpact')}
        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all backdrop-blur-md border cursor-pointer flex items-center gap-1.5 shrink-0 ${
          activeFilters.highImpact
            ? 'bg-accent/20 text-accent border-accent/30'
            : 'bg-card/[0.03] text-white/40 border-white/5 hover:bg-card/[0.08] hover:text-white/80 hover:border-accent hover:text-accent hover:shadow-[0_0_10px_color-mix(in_srgb,var(--accent)_40%,transparent)]'
        }`}
      >
        <Target size={12} strokeWidth={2.5} />
        High Impact
      </button>
      <button
        type="button"
        onClick={() => toggleFilter('shortTask')}
        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all backdrop-blur-md border cursor-pointer flex items-center gap-1.5 shrink-0 ${
          activeFilters.shortTask
            ? 'bg-accent/20 text-accent border-accent/30'
            : 'bg-card/[0.03] text-white/40 border-white/5 hover:bg-card/[0.08] hover:text-white/80 hover:border-accent hover:text-accent hover:shadow-[0_0_10px_color-mix(in_srgb,var(--accent)_40%,transparent)]'
        }`}
      >
        <Timer size={12} strokeWidth={2.5} />
        Short Task
      </button>
      <button
        type="button"
        onClick={() => toggleFilter('longTask')}
        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all backdrop-blur-md border cursor-pointer flex items-center gap-1.5 shrink-0 ${
          activeFilters.longTask
            ? 'bg-accent/20 text-accent border-accent/30'
            : 'bg-card/[0.03] text-white/40 border-white/5 hover:bg-card/[0.08] hover:text-white/80 hover:border-accent hover:text-accent hover:shadow-[0_0_10px_color-mix(in_srgb,var(--accent)_40%,transparent)]'
        }`}
      >
        <Hourglass size={12} strokeWidth={2.5} />
        Deep Focus
      </button>
    </div>
  );
}
