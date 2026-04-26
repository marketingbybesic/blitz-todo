import { GitCommit, Calendar, ArchiveRestore, Layers, Lock, Plus } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { useSettingsStore } from '../store/useSettingsStore';

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
  const fabAlignment = useSettingsStore((state) => state.fabAlignment);

  const fabPosition = fabAlignment === 'right' ? 'bottom-24 right-6' : 'bottom-24 left-6';

  return (
    <>
      <button
        type="button"
        onClick={toggleCaptureModal}
        className={`fixed md:hidden z-50 ${fabPosition} w-14 h-14 bg-accent rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.5)] text-white hover:scale-110 transition-transform`}
      >
        <Plus size={24} />
      </button>

      <nav className="grid grid-cols-5 items-center w-full px-2 md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#09090b]/90 backdrop-blur-xl border-t border-white/10">
        {tabs.map((tab) => {
          const isActive = currentView === tab.view;
          return (
            <button
              key={tab.view}
              type="button"
              onClick={() => setCurrentView(tab.view)}
              className={`flex flex-col items-center justify-center gap-1 py-3 transition-all duration-200 ${
                isActive ? 'text-accent' : 'text-muted hover:text-foreground'
              }`}
            >
              <tab.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-xs mt-1 font-medium tracking-wide">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
