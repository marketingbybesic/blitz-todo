import { List, Calendar, Inbox, Layers, Archive, LayoutGrid, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTaskStore } from '../store/useTaskStore';

const tabs = [
  { icon: Calendar,   label: 'Today',    view: 'today'    as const },
  { icon: List,       label: 'Timeline', view: 'timeline' as const },
  { icon: LayoutGrid, label: 'Kanban',   view: 'kanban'   as const },
  { icon: Inbox,      label: 'Dump',     view: 'dump'     as const },
  { icon: Layers,     label: 'Zones',    view: 'zones'    as const },
  { icon: Archive,    label: 'Vault',    view: 'vault'    as const },
];

export function MobileNav() {
  const currentView       = useTaskStore(s => s.currentView);
  const setCurrentView    = useTaskStore(s => s.setCurrentView);
  const toggleCaptureModal = useTaskStore(s => s.toggleCaptureModal);

  return (
    <>
      {/* FAB */}
      <button
        type="button"
        onClick={toggleCaptureModal}
        className="fixed bottom-24 right-5 h-13 w-13 rounded-full bg-accent shadow-[0_0_20px_var(--accent)] flex items-center justify-center z-40 active:scale-90 transition-transform md:hidden"
        style={{ width: 52, height: 52 }}
      >
        <Plus size={22} strokeWidth={2} className="text-background" />
      </button>

      {/* Brand bar on mobile (replaces the desktop sidebar header) */}
      <div className="fixed top-0 left-0 right-0 h-12 flex items-center justify-between px-5 bg-background/80 backdrop-blur-xl border-b border-border z-50 md:hidden">
        <div className="flex items-center gap-2">
          <img src="/blitz-logo.png" alt="Blitz" className="h-6 w-auto object-contain" />
          <span className="text-xs font-bold tracking-widest text-foreground/70 uppercase">Blitz</span>
        </div>
      </div>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-2xl border-t border-border/60 z-50 flex items-center md:hidden">
        {tabs.map((tab) => {
          const isActive = currentView === tab.view;
          return (
            <button
              key={tab.view}
              type="button"
              onClick={() => setCurrentView(tab.view)}
              className="relative flex-1 flex flex-col items-center justify-center h-full gap-0.5 transition-all duration-200"
            >
              {isActive && (
                <motion.div
                  layoutId="mob-pill"
                  className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-accent"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <tab.icon
                size={18}
                strokeWidth={isActive ? 2.5 : 1.5}
                className={isActive ? 'text-accent' : 'text-muted'}
              />
              <span className={`text-[9px] font-medium tracking-wider ${isActive ? 'text-accent' : 'text-muted'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
