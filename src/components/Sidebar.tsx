import { List, Calendar, Inbox, Layers, Archive, LayoutGrid, Settings, PanelLeftClose } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '../store/useTaskStore';
import { useSettingsStore } from '../store/useSettingsStore';

const navItems = [
  { icon: Calendar,     label: 'Today',      viewId: 'today' as const },
  { icon: List,         label: 'Timeline',   viewId: 'timeline' as const },
  { icon: LayoutGrid,   label: 'Kanban',     viewId: 'kanban' as const },
  { icon: Inbox,        label: 'Brain Dump', viewId: 'dump' as const },
  { icon: Layers,       label: 'Zones',      viewId: 'zones' as const },
  { icon: Archive,      label: 'The Vault',  viewId: 'vault' as const },
];

export function Sidebar() {
  const isSidebarOpen     = useTaskStore(s => s.isSidebarOpen);
  const toggleSidebar     = useTaskStore(s => s.toggleSidebar);
  const currentView       = useTaskStore(s => s.currentView);
  const setCurrentView    = useTaskStore(s => s.setCurrentView);
  const toggleSettingsModal = useSettingsStore(s => s.toggleSettingsModal);

  return (
    <AnimatePresence initial={false}>
      {isSidebarOpen && (
        <motion.aside
          key="sidebar"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 220, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="hidden md:flex flex-col flex-shrink-0 h-screen bg-card border-r border-border overflow-hidden"
          style={{ minWidth: 0 }}
        >
          {/* Logo + collapse button */}
          <div
            data-tauri-drag-region="true"
            className="flex items-center justify-between px-4 pt-8 pb-6 select-none"
          >
            <div className="flex items-center gap-2.5">
              <img
                src="/blitz-logo.png"
                alt="Blitz"
                className="h-7 w-auto object-contain"
                style={{ filter: 'drop-shadow(0 0 8px color-mix(in srgb, var(--accent) 50%, transparent))' }}
              />
              <span className="text-sm font-bold tracking-widest text-foreground/80 uppercase">
                Blitz
              </span>
            </div>
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-background transition-colors"
              title="Collapse sidebar"
            >
              <PanelLeftClose size={15} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="relative flex flex-col gap-0.5 px-3 flex-1">
            {navItems.map(({ icon: Icon, label, viewId }) => {
              const active = currentView === viewId;
              return (
                <button
                  key={viewId}
                  type="button"
                  onClick={() => setCurrentView(viewId)}
                  className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full text-left ${
                    active
                      ? 'bg-accent/10 text-accent'
                      : 'text-muted hover:text-foreground hover:bg-background/60'
                  }`}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>

          {/* Settings */}
          <div className="px-3 pb-6">
            <div className="h-px bg-border mb-3" />
            <button
              type="button"
              onClick={toggleSettingsModal}
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-background/60 transition-all duration-200"
            >
              <Settings size={16} />
              <span>Settings</span>
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
