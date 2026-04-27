import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, LayoutList, Calendar, Layers, Brain, Box, Zap, X,
  LayoutGrid, Settings, Wand2, CheckCircle2, ChevronRight,
} from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';

type Action = {
  id: string;
  label: string;
  shortcut?: string;
  icon: React.ElementType;
  section: 'Navigation' | 'Actions' | 'Tasks';
  action: () => void;
};

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const setCurrentView = useTaskStore((state) => state.setCurrentView);
  const toggleCaptureModal = useTaskStore((state) => state.toggleCaptureModal);
  const toggleBlitzMode = useTaskStore((state) => state.toggleBlitzMode);
  const openSchedulingWizard = useTaskStore((state) => state.openSchedulingWizard);
  const setSelectedTaskId = useTaskStore((state) => state.setSelectedTaskId);
  const tasks = useTaskStore((state) => state.tasks);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const navActions: Action[] = [
    { id: 'today', label: 'Today', shortcut: '⌘1', icon: Calendar, section: 'Navigation', action: () => { setCurrentView('today'); onClose(); } },
    { id: 'timeline', label: 'Timeline', shortcut: '⌘2', icon: LayoutList, section: 'Navigation', action: () => { setCurrentView('timeline'); onClose(); } },
    { id: 'zones', label: 'Zones', shortcut: '⌘3', icon: Layers, section: 'Navigation', action: () => { setCurrentView('zones'); onClose(); } },
    { id: 'dump', label: 'Brain Dump', shortcut: '⌘4', icon: Brain, section: 'Navigation', action: () => { setCurrentView('dump'); onClose(); } },
    { id: 'kanban', label: 'Kanban', shortcut: '⌘5', icon: LayoutGrid, section: 'Navigation', action: () => { setCurrentView('kanban'); onClose(); } },
    { id: 'vault', label: 'The Vault', shortcut: '⌘6', icon: Box, section: 'Navigation', action: () => { setCurrentView('vault'); onClose(); } },
  ];

  const globalActions: Action[] = [
    { id: 'create', label: 'Create Task', shortcut: '⌘N', icon: Zap, section: 'Actions', action: () => { toggleCaptureModal(); onClose(); } },
    { id: 'burst', label: 'Toggle Burst Mode', icon: Zap, section: 'Actions', action: () => { toggleBlitzMode(); onClose(); } },
    { id: 'settings', label: 'Open Settings', icon: Settings, section: 'Actions', action: () => { /* settings panel */ onClose(); } },
    { id: 'wizard', label: 'Open Scheduling Wizard', icon: Wand2, section: 'Actions', action: () => { openSchedulingWizard(); onClose(); } },
  ];

  const taskActions: Action[] = tasks
    .filter((t) => t.status !== 'done')
    .map((t) => ({
      id: `task-${t.id}`,
      label: t.title,
      icon: CheckCircle2,
      section: 'Tasks' as const,
      action: () => { setSelectedTaskId(t.id); onClose(); },
    }));

  const allActions = [...navActions, ...globalActions, ...taskActions];

  const filtered = query.trim()
    ? allActions.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()))
    : allActions;

  const sections = ['Navigation', 'Actions', 'Tasks'] as const;

  const execute = useCallback((action: Action) => {
    action.action();
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = filtered[selectedIndex];
        if (item) execute(item);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, filtered, selectedIndex, execute, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-2xl flex items-start justify-center pt-[25vh]"
          onClick={() => onClose()}
        >
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="bg-black border border-white/[0.08] rounded-2xl w-full max-w-lg shadow-[0_40px_80px_rgba(0,0,0,0.9)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]">
              <Search size={15} className="text-white/30 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search commands or tasks..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-white/25"
              />
              <button
                type="button"
                onClick={() => onClose()}
                className="text-white/25 hover:text-white/60 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[55vh] overflow-y-auto py-1.5">
              {filtered.length === 0 ? (
                <div className="px-5 py-8 text-center text-xs text-white/25">
                  No results found
                </div>
              ) : (
                sections.map((section) => {
                  const sectionItems = filtered.filter((a) => a.section === section);
                  if (sectionItems.length === 0) return null;

                  const sectionStartIndex = filtered.findIndex((a) => a.section === section);

                  return (
                    <div key={section}>
                      {/* Section header */}
                      <div className="px-4 pt-3 pb-1">
                        <span className="text-[9px] font-semibold text-white/25 uppercase tracking-widest">
                          {section}
                        </span>
                      </div>

                      {sectionItems.map((item, sectionIdx) => {
                        const globalIdx = sectionStartIndex + sectionIdx;
                        const isSelected = globalIdx === selectedIndex;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            data-index={globalIdx}
                            onClick={() => execute(item)}
                            onMouseEnter={() => setSelectedIndex(globalIdx)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                              isSelected
                                ? 'bg-white/[0.07] text-white'
                                : 'text-white/55 hover:text-white/80'
                            }`}
                          >
                            <item.icon
                              size={13}
                              className={isSelected ? 'text-accent' : 'text-white/30'}
                            />
                            <span className="flex-1 text-left truncate">{item.label}</span>
                            {item.shortcut && (
                              <span className="text-[10px] text-white/20 font-mono shrink-0">
                                {item.shortcut}
                              </span>
                            )}
                            {isSelected && (
                              <ChevronRight size={12} className="text-white/20 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer hints */}
            <div className="px-4 py-2.5 border-t border-white/[0.05] flex items-center gap-3 text-[10px] text-white/20">
              <span className="px-1.5 py-0.5 rounded bg-white/[0.06] font-mono">↑↓</span>
              <span>navigate</span>
              <span className="px-1.5 py-0.5 rounded bg-white/[0.06] font-mono">↵</span>
              <span>select</span>
              <span className="px-1.5 py-0.5 rounded bg-white/[0.06] font-mono">Esc</span>
              <span>close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
