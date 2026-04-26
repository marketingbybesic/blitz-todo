import { Zap, Sparkles, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import Logo from '/blitz-logo.svg';
import { TodayView } from './views/TodayView';
import { TimelineView } from './views/TimelineView';
import { BrainDumpView } from './views/BrainDumpView';
import { ZonesView } from './views/ZonesView';
import { VaultView } from './views/VaultView';
import { KanbanView } from './views/KanbanView';
import { Typewriter, shortcut } from './Typewriter';
import { useTaskStore } from '../store/useTaskStore';
import { useSettingsStore } from '../store/useSettingsStore';

export function Dashboard() {
  const currentView = useTaskStore((state) => state.currentView);
  const isSidebarOpen = useTaskStore((state) => state.isSidebarOpen);
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
              className="px-3 py-1 text-[11px] font-bold rounded-full bg-accent text-white flex items-center gap-1 hover:shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_50%,transparent)] transition-shadow duration-300"
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
      case 'kanban':
        return {
          title: 'Kanban',
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
      case 'kanban':
        return <KanbanView />;
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
    <div className={`flex-1 flex flex-col h-screen overflow-hidden bg-background transition-[padding-left] duration-300 ${isSidebarOpen ? 'md:pl-64' : ''}`}>
      <header data-tauri-drag-region="true" className="relative h-16 border-b border-white/5 flex items-center px-8 justify-between pt-4 select-none cursor-default">
        {/* Desktop left */}
        <div className="hidden md:flex items-center">
          <img src={Logo} alt="Blitz" className="h-7 w-7" />
        </div>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-3">
          <button
            type="button"
            onClick={toggleCaptureModal}
            className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1 text-xs text-muted hover:bg-white/10 hover:text-white/80 transition-colors"
          >
            <Search size={12} />
            <span className="hidden lg:inline">
              {typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac') ? 'Cmd+K' : 'Ctrl+K'}
            </span>
          </button>
          {header.action && (
            <div className="ml-1">
              {header.action}
            </div>
          )}
        </div>
      </header>
      <main className="flex-1 overflow-y-auto pb-24 md:pb-8 pt-8 md:pt-0">
        {renderView()}
      </main>
    </div>
  );
}
