import { List, Calendar, Inbox, Layers, Archive, LayoutGrid } from 'lucide-react';
import { motion } from 'framer-motion';
import { BlitzLogo } from './BlitzLogo';
import { useTaskStore } from '../store/useTaskStore';

const navItems = [
  { icon: Calendar, label: 'Today', viewId: 'today' as const },
  { icon: List, label: 'Timeline', viewId: 'timeline' as const },
  { icon: LayoutGrid, label: 'Kanban', viewId: 'kanban' as const },
  { icon: Inbox, label: 'Brain Dump', viewId: 'dump' as const },
  { icon: Layers, label: 'Zones', viewId: 'zones' as const },
  { icon: Archive, label: 'The Vault', viewId: 'vault' as const },
];

export function Sidebar() {
  const isSidebarOpen = useTaskStore((state) => state.isSidebarOpen);
  const currentView = useTaskStore((state) => state.currentView);
  const setCurrentView = useTaskStore((state) => state.setCurrentView);

  return (
    <motion.aside
      initial={false}
      animate={{
        width: isSidebarOpen ? 256 : 0,
        opacity: isSidebarOpen ? 1 : 0,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed inset-y-0 left-0 z-40 min-h-[100dvh] md:h-screen bg-card hidden md:flex flex-col text-[13px] overflow-hidden"
    >
      <div data-tauri-drag-region="true" className="pt-12 pb-6 px-4 select-none">
        <div className="flex items-center gap-2">
          <BlitzLogo className="w-5 h-5" />
          <span className="text-lg font-bold tracking-tight text-foreground/90">
            BLITZ
          </span>
        </div>
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
                ? 'bg-accent/10 text-accent drop-shadow-[0_0_8px_var(--accent)]'
                : 'text-muted hover:text-foreground transition-colors duration-200'
            }`}
          >
            <item.icon size={18} />
            <span className="font-medium">{item.label}</span>
          </a>
        ))}
      </nav>
    </motion.aside>
  );
}
