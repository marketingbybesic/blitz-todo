import { GitCommit, Calendar, ArchiveRestore, Layers, Lock, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTaskStore } from '../store/useTaskStore';

function DynamicCalendarIcon({ size, strokeWidth }: { size: number; strokeWidth: number }) {
  return (
    <div className="relative inline-flex">
      <Calendar size={size} strokeWidth={strokeWidth} />
      <span className="absolute top-[6px] left-0 right-0 text-center text-[8px] font-bold leading-none">
        {new Date().getDate()}
      </span>
    </div>
  );
}

const tabs = [
  { icon: GitCommit, label: 'Timeline', view: 'timeline' as const },
  { icon: DynamicCalendarIcon, label: 'Today', view: 'today' as const },
  { icon: ArchiveRestore, label: 'Dump', view: 'dump' as const },
  { icon: Layers, label: 'Zones', view: 'zones' as const },
  { icon: Lock, label: 'Vault', view: 'vault' as const },
];

export function MobileNav() {
  const currentView = useTaskStore((state) => state.currentView);
  const setCurrentView = useTaskStore((state) => state.setCurrentView);
  const toggleCaptureModal = useTaskStore((state) => state.toggleCaptureModal);

  return (
    <>
      <button
        type="button"
        onClick={toggleCaptureModal}
        className="fixed bottom-28 right-6 h-14 w-14 rounded-full bg-gradient-to-tr from-accent to-purple-400 shadow-[0_0_20px_var(--accent)] flex items-center justify-center z-40 active:scale-90 transition-transform md:hidden"
      >
        <Plus size={24} strokeWidth={1.5} className="text-white" />
      </button>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[85%] max-w-[320px] h-16 rounded-full bg-background/40 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] z-50 flex items-center px-2 md:hidden">
        <div className="flex w-full justify-between items-center h-full">
          {tabs.map((tab) => {
          const isActive = currentView === tab.view;
          return (
            <button
              key={tab.view}
              type="button"
              onClick={() => setCurrentView(tab.view)}
              className="relative flex flex-col items-center justify-center h-full gap-1 transition-all duration-200"
            >
              {isActive && (
                <motion.div
                  layoutId="pill"
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-8 rounded-full bg-accent/10 shadow-[0_0_12px_color-mix(in_srgb,var(--accent)_30%,transparent)]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <div className={`relative z-10 flex flex-col items-center gap-1 ${isActive ? 'text-accent' : 'text-muted hover:text-foreground'}`}>
                <tab.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className="text-[9px] font-medium tracking-wider">{tab.label}</span>
              </div>
            </button>
          );
        })}
        </div>
      </nav>
    </>
  );
}
