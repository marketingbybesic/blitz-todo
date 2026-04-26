import { Zap, Sparkles, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import { TodayView } from './views/TodayView';
import { TimelineView } from './views/TimelineView';
import { BrainDumpView } from './views/BrainDumpView';
import { ZonesView } from './views/ZonesView';
import { VaultView } from './views/VaultView';
import { Typewriter, shortcut } from './Typewriter';
import { useTaskStore } from '../store/useTaskStore';
import { useSettingsStore } from '../store/useSettingsStore';

export function Dashboard() {
  const currentView = useTaskStore((state) => state.currentView);
  const toggleBrainDumpSort = useTaskStore((state) => state.toggleBrainDumpSort);
  const toggleBlitzMode = useTaskStore((state) => state.toggleBlitzMode);
  const toggleCaptureModal = useTaskStore((state) => state.toggleCaptureModal);
  const toggleSidebar = useTaskStore((state) => state.toggleSidebar);
  const toggleSettingsModal = useSettingsStore((state) => state.toggleSettingsModal);

  const renderHeader = () => {
    switch (currentView) {
      case 'today':
        return {
          title: 'Today',
          action: (
            <button
              type="button"
              onClick={toggleBlitzMode}
              className="px-3 py-1 text-[11px] font-bold rounded-full bg-accent text-white flex items-center gap-1"
            >
              <Zap size={12} />
              Burst
            </button>
          ),
        };
      case 'timeline':
        return {
          title: 'Timeline',
          action: null,
        };
      case 'dump':
        return {
          title: 'Brain Dump',
          action: (
            <button
              type="button"
              onClick={toggleBrainDumpSort}
              className="px-3 py-1 text-[11px] font-bold rounded-full bg-accent text-white flex items-center gap-1"
            >
              <Sparkles size={12} />
              Sort
            </button>
          ),
        };
      case 'zones':
        return {
          title: 'Zones',
          action: null,
        };
      case 'vault':
        return {
          title: 'The Vault',
          action: null,
        };
      default:
        return {
          title: 'Today',
          action: null,
        };
    }
  };

  const header = renderHeader();

  const renderView = () => {
    switch (currentView) {
      case 'today':
        return <TodayView />;
      case 'timeline':
        return <TimelineView />;
      case 'dump':
        return <BrainDumpView />;
      case 'zones':
        return <ZonesView />;
      case 'vault':
        return <VaultView />;
      default:
        return (
          <div className="max-w-3xl mx-auto pt-12 px-8">
            <button
              type="button"
              onClick={toggleCaptureModal}
              className="w-full text-left group"
            >
              <div className="text-sm text-muted/60 tracking-wide">
                <Typewriter />
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-muted/40 group-hover:text-muted/60 transition-colors">
                  Tap to capture a task
                </span>
                <span className="text-xs text-muted/30 font-mono">{shortcut}</span>
              </div>
            </button>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-[100dvh] md:min-h-screen bg-background">
      <header data-tauri-drag-region="true" className="relative h-16 border-b border-white/5 flex items-center px-8 justify-between pt-4 select-none cursor-default">
        {/* Mobile centered logo */}
        <div className="flex md:hidden absolute inset-0 items-center justify-center pointer-events-none">
          <Zap size={24} className="text-accent" />
        </div>

        {/* Desktop left */}
        <div className="hidden md:flex items-center gap-3">
          <motion.button
            type="button"
            onClick={toggleSidebar}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="text-white/40 hover:text-white transition-colors"
          >
            <Zap size={20} />
          </motion.button>
          <h2 className="text-sm font-medium text-foreground/80">{header.title}</h2>
          <button type="button" onClick={toggleSettingsModal} className="text-white/40 hover:text-white transition-colors">
            <MoreVertical size={20} />
          </button>
        </div>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-3">
          <span className="text-muted text-xs mr-4">
            Press {typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac') ? 'Cmd+K' : 'Ctrl+K'}
          </span>
          {header.action}
        </div>
      </header>
      <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
        {renderView()}
      </main>
    </div>
  );
}
