import { List, Calendar, Inbox, Layers, Archive, LayoutGrid, Plus, Zap, SlidersHorizontal, Sunrise, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '../store/useTaskStore';

const tabs = [
  { icon: Calendar,   label: 'Today',    view: 'today'    as const },
  { icon: List,       label: 'Timeline', view: 'timeline' as const },
  { icon: LayoutGrid, label: 'Kanban',   view: 'kanban'   as const },
  { icon: Inbox,      label: 'Dump',     view: 'dump'     as const },
  { icon: Layers,     label: 'Zones',    view: 'zones'    as const },
  { icon: Archive,    label: 'Vault',    view: 'vault'    as const },
];

// Context-aware secondary action per view
function getSecondaryAction(view: string, toggleBlitzMode: () => void, openMorningTriage: () => void) {
  switch (view) {
    case 'today': return { icon: <Zap size={16} />, label: 'Burst', action: toggleBlitzMode, accent: true };
    case 'timeline': return { icon: <SlidersHorizontal size={16} />, label: 'Filter', action: () => {}, accent: false };
    case 'dump': return { icon: <Brain size={16} />, label: 'Sort', action: () => {}, accent: false };
    default: return { icon: <Sunrise size={16} />, label: 'Triage', action: openMorningTriage, accent: false };
  }
}

export function MobileNav() {
  const currentView        = useTaskStore(s => s.currentView);
  const setCurrentView     = useTaskStore(s => s.setCurrentView);
  const toggleCaptureModal = useTaskStore(s => s.toggleCaptureModal);
  const toggleBlitzMode    = useTaskStore(s => s.toggleBlitzMode);
  const openMorningTriage  = useTaskStore(s => s.openMorningTriage);

  const secondary = getSecondaryAction(currentView, toggleBlitzMode, openMorningTriage);

  return (
    <>
      {/* Mobile brand header */}
      <div className="fixed top-0 left-0 right-0 h-12 flex items-center justify-between px-5 bg-black/80 backdrop-blur-xl border-b border-white/[0.06] z-50 md:hidden">
        <div className="flex items-center gap-2">
          <img src="/blitz-logo.svg" alt="Blitz" className="h-5 w-auto object-contain" />
          <span className="text-[11px] font-bold tracking-[0.2em] text-foreground/60 uppercase">Blitz</span>
        </div>
      </div>

      {/* Two stacked action pills (mobile FAB area) */}
      <div className="fixed bottom-24 right-4 flex flex-col gap-2 z-40 md:hidden">
        {/* Secondary context pill */}
        <motion.button
          type="button"
          onClick={secondary.action}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', delay: 0.05 }}
          className={`flex items-center gap-2 pl-3 pr-4 h-10 rounded-full text-xs font-semibold shadow-lg transition-all active:scale-95 ${
            secondary.accent
              ? 'bg-accent/20 text-accent border border-accent/30 shadow-[0_0_16px_color-mix(in_srgb,var(--accent)_30%,transparent)]'
              : 'bg-black/80 text-muted border border-white/10 backdrop-blur-xl'
          }`}
        >
          {secondary.icon}
          <span>{secondary.label}</span>
        </motion.button>

        {/* Primary capture pill */}
        <motion.button
          type="button"
          onClick={toggleCaptureModal}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring' }}
          className="flex items-center gap-2 pl-3 pr-4 h-11 rounded-full text-xs font-bold bg-accent text-background shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_50%,transparent)] active:scale-95 transition-all"
        >
          <Plus size={17} strokeWidth={2.5} />
          <span>New Task</span>
        </motion.button>
      </div>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-[60px] bg-black/90 backdrop-blur-2xl border-t border-white/[0.06] z-50 flex items-center md:hidden">
        {tabs.map((tab) => {
          const isActive = currentView === tab.view;
          return (
            <button
              key={tab.view}
              type="button"
              onClick={() => setCurrentView(tab.view)}
              className="relative flex-1 flex flex-col items-center justify-center h-full gap-0.5 transition-all duration-200"
            >
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="mob-indicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                    style={{ background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </AnimatePresence>
              <tab.icon size={17} strokeWidth={isActive ? 2.5 : 1.5} className={isActive ? 'text-accent' : 'text-muted'} />
              <span className={`text-[9px] font-medium tracking-wider ${isActive ? 'text-accent' : 'text-muted'}`}>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
