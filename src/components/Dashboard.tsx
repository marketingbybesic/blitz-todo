import { Zap, Sparkles, PanelLeftOpen, Settings, Calendar, Sunrise, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { TodayView }    from './views/TodayView';
import { TimelineView } from './views/TimelineView';
import { BrainDumpView } from './views/BrainDumpView';
import { ZonesView }    from './views/ZonesView';
import { VaultView }    from './views/VaultView';
import { KanbanView }   from './views/KanbanView';
import { useTaskStore } from '../store/useTaskStore';
import { useSettingsStore } from '../store/useSettingsStore';

// Per-view action button that's always visible in desktop header
function ViewAction() {
  const currentView   = useTaskStore(s => s.currentView);
  const toggleBlitz   = useTaskStore(s => s.toggleBlitzMode);
  const toggleDump    = useTaskStore(s => s.toggleBrainDumpSort);
  const openWizard    = useTaskStore(s => s.openSchedulingWizard);

  switch (currentView) {
    case 'today':
    case 'zones':
    case 'kanban':
      return (
        <button type="button" onClick={toggleBlitz}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-accent/15 text-accent border border-accent/25 hover:bg-accent/25 transition-all shadow-[0_0_12px_color-mix(in_srgb,var(--accent)_20%,transparent)] backdrop-blur-sm">
          <Zap size={12} /> Burst Mode
        </button>
      );
    case 'timeline':
      return (
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={openWizard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-card/80 text-muted border border-border hover:text-foreground hover:border-border/80 transition-all backdrop-blur-sm">
            <Calendar size={12} /> Schedule Wizard
          </button>
        </div>
      );
    case 'dump':
      return (
        <button type="button" onClick={toggleDump}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-card/80 text-muted border border-border hover:text-foreground transition-all backdrop-blur-sm">
          <ArrowUpDown size={12} /> Sort by Priority
        </button>
      );
    default:
      return null;
  }
}

export function Dashboard() {
  const currentView   = useTaskStore(s => s.currentView);
  const isSidebarOpen = useTaskStore(s => s.isSidebarOpen);
  const toggleSidebar = useTaskStore(s => s.toggleSidebar);
  const toggleSettingsModal = useSettingsStore(s => s.toggleSettingsModal);

  const VIEW_TITLES: Record<string, string> = {
    today: 'Today', timeline: 'Timeline', kanban: 'Kanban',
    dump: 'Brain Dump', zones: 'Zones', vault: 'The Vault',
  };

  const renderView = () => {
    switch (currentView) {
      case 'today':    return <TodayView />;
      case 'timeline': return <TimelineView />;
      case 'dump':     return <BrainDumpView />;
      case 'zones':    return <ZonesView />;
      case 'vault':    return <VaultView />;
      case 'kanban':   return <KanbanView />;
      default:         return <TodayView />;
    }
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden min-w-0">
      {/* Topbar */}
      <header
        data-tauri-drag-region="true"
        className="flex items-center gap-3 px-4 h-12 border-b border-border/60 flex-shrink-0 bg-background/90 backdrop-blur-xl select-none"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        {!isSidebarOpen && (
          <button type="button" onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-card transition-colors flex-shrink-0"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <PanelLeftOpen size={15} />
          </button>
        )}

        <span className="text-sm font-semibold text-foreground flex-1" data-tauri-drag-region="true">
          {VIEW_TITLES[currentView] ?? 'Blitz'}
        </span>

        {/* Always-visible action button */}
        <div style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <ViewAction />
        </div>

        {!isSidebarOpen && (
          <button type="button" onClick={toggleSettingsModal}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-card transition-colors flex-shrink-0"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <Settings size={15} />
          </button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto overscroll-none">
        {renderView()}
      </main>
    </div>
  );
}
