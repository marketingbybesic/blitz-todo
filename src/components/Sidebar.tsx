import { List, Calendar, Inbox, Layers, Archive, PanelLeftClose } from 'lucide-react';
import { BlitzLogo } from './BlitzLogo';
import { useTaskStore } from '../store/useTaskStore';

const navItems = [
  { icon: Calendar, label: 'Today', viewId: 'today' as const },
  { icon: List, label: 'Timeline', viewId: 'timeline' as const },
  { icon: Inbox, label: 'Brain Dump', viewId: 'dump' as const },
  { icon: Layers, label: 'Zones', viewId: 'zones' as const },
  { icon: Archive, label: 'The Vault', viewId: 'vault' as const },
];

export function Sidebar() {
  const isSidebarOpen = useTaskStore((state) => state.isSidebarOpen);
  const currentView = useTaskStore((state) => state.currentView);
  const setCurrentView = useTaskStore((state) => state.setCurrentView);
  const toggleSidebar = useTaskStore((state) => state.toggleSidebar);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 min-h-[100dvh] md:h-screen bg-[#09090b] hidden md:flex flex-col text-[13px] transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
        !isSidebarOpen ? '-translate-x-full md:w-0 md:opacity-0 md:overflow-hidden' : ''
      }`}
    >
      <div data-tauri-drag-region="true" className="pt-12 pb-6 px-4 select-none">
        <button
          type="button"
          onClick={toggleSidebar}
          className="group relative cursor-pointer flex items-center h-7"
        >
          <div className="flex items-center gap-2 transition-opacity duration-200 group-hover:opacity-0">
            <BlitzLogo className="w-5 h-5" />
            <span className="text-lg font-bold tracking-tight text-foreground/90">
              BLITZ
            </span>
          </div>
          <PanelLeftClose
            size={20}
            className="text-accent absolute left-0 transition-opacity duration-200 opacity-0 group-hover:opacity-100"
          />
        </button>
      </div>
      <nav className="flex flex-col gap-1.5 px-3">
        {navItems.map((item) => (
          <a
            key={item.viewId}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setCurrentView(item.viewId);
            }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 ${
              currentView === item.viewId
                ? 'bg-accent/10 text-accent drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                : 'text-muted hover:text-foreground transition-colors duration-200'
            }`}
          >
            <item.icon size={18} />
            <span className="font-medium">{item.label}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}
