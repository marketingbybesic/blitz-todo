import { Zap, Sparkles, PanelLeftOpen, Settings } from 'lucide-react';
import { TodayView }    from './views/TodayView';
import { TimelineView } from './views/TimelineView';
import { BrainDumpView } from './views/BrainDumpView';
import { ZonesView }    from './views/ZonesView';
import { VaultView }    from './views/VaultView';
import { KanbanView }   from './views/KanbanView';
import { useTaskStore } from '../store/useTaskStore';
import { useSettingsStore } from '../store/useSettingsStore';

export function Dashboard() {
  const currentView        = useTaskStore(s => s.currentView);
  const isSidebarOpen      = useTaskStore(s => s.isSidebarOpen);
  const toggleSidebar      = useTaskStore(s => s.toggleSidebar);
  const toggleBrainDumpSort = useTaskStore(s => s.toggleBrainDumpSort);
  const toggleBlitzMode    = useTaskStore(s => s.toggleBlitzMode);
  const toggleSettingsModal = useSettingsStore(s => s.toggleSettingsModal);

  const headerConfig: Record<string, { title: string; action?: React.ReactNode }> = {
    today:    { title: 'Today', action: (
      <button type="button" onClick={toggleBlitzMode}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-full bg-accent text-background hover:opacity-90 transition-opacity">
        <Zap size={11} /> Burst
      </button>
    )},
    timeline: { title: 'Timeline' },
    kanban:   { title: 'Kanban' },
    dump:     { title: 'Brain Dump', action: (
      <button type="button" onClick={toggleBrainDumpSort}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-full bg-accent text-background hover:opacity-90 transition-opacity">
        <Sparkles size={11} /> Sort
      </button>
    )},
    zones:    { title: 'Zones' },
    vault:    { title: 'The Vault' },
  };

  const { title, action } = headerConfig[currentView] ?? { title: 'Today' };

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
      {/* Top bar */}
      <header
        data-tauri-drag-region="true"
        className="flex items-center gap-3 px-4 h-14 border-b border-border flex-shrink-0 bg-background select-none"
      >
        {/* Show expand button only when sidebar is hidden */}
        {!isSidebarOpen && (
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-card transition-colors flex-shrink-0"
            title="Expand sidebar"
          >
            <PanelLeftOpen size={16} />
          </button>
        )}

        <h1 className="text-sm font-semibold text-foreground flex-1" data-tauri-drag-region="true">
          {title}
        </h1>

        {action && <div className="flex-shrink-0">{action}</div>}

        {/* Settings icon only visible when sidebar is hidden (sidebar has it when open) */}
        {!isSidebarOpen && (
          <button
            type="button"
            onClick={toggleSettingsModal}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-card transition-colors flex-shrink-0"
          >
            <Settings size={16} />
          </button>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {renderView()}
      </main>
    </div>
  );
}
