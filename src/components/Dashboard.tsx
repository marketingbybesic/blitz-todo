import { Zap, PanelLeft, Sparkles, MoreVertical } from 'lucide-react';
import { TodayView } from './views/TodayView';
import { TimelineView } from './views/TimelineView';
import { BrainDumpView } from './views/BrainDumpView';
import { ZonesView } from './views/ZonesView';
import { Typewriter, shortcut } from './Typewriter';
import { useTaskStore } from '../store/useTaskStore';
import { useSettingsStore } from '../store/useSettingsStore';

export function Dashboard() {
  const toggleSidebar = useTaskStore((state) => state.toggleSidebar);
  const currentView = useTaskStore((state) => state.currentView);
  const toggleBrainDumpSort = useTaskStore((state) => state.toggleBrainDumpSort);
  const toggleBlitzMode = useTaskStore((state) => state.toggleBlitzMode);
  const toggleCaptureModal = useTaskStore((state) => state.toggleCaptureModal);
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
              className="bg-accent text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:scale-105 transition-transform flex items-center gap-1.5"
            >
              <Zap size={14} />
              Burst Mode
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
              className="px-4 py-1.5 text-xs font-semibold tracking-wide rounded-full bg-[#a855f7]/80 backdrop-blur-md border border-white/20 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:bg-[#a855f7] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] transition-all duration-300 flex items-center gap-1.5"
            >
              <Sparkles size={14} />
              Auto-Sort
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
        return (
          <div className="max-w-3xl mx-auto pt-12 px-8">
            <h1 className="text-2xl font-bold tracking-tight mb-8">The Vault</h1>
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
    <div className="flex-1 flex flex-col min-h-[100dvh] md:min-h-screen bg-[#000000]">
      <header data-tauri-drag-region="true" className="h-16 border-b border-white/5 flex items-center px-8 justify-between pt-4 select-none cursor-default">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleSidebar}
            className="hidden md:flex text-white/50 hover:text-white transition-colors"
          >
            <PanelLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-foreground/80">{header.title}</h2>
            <button
              type="button"
              onClick={toggleSettingsModal}
              className="text-white/40 hover:text-white transition-colors"
            >
              <MoreVertical size={18} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-muted text-xs">Press {shortcut}</span>
          {header.action}
        </div>
      </header>
      <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
        {renderView()}
      </main>
    </div>
  );
}
