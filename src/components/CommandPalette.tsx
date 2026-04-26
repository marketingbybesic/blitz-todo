import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, LayoutList, Calendar, Layers, Brain, Box, Zap, X } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';

type Action = {
  id: string;
  label: string;
  shortcut?: string;
  icon: React.ElementType;
  action: () => void;
};

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const setCurrentView = useTaskStore((state) => state.setCurrentView);
  const toggleCaptureModal = useTaskStore((state) => state.toggleCaptureModal);
  const toggleBlitzMode = useTaskStore((state) => state.toggleBlitzMode);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const actions: Action[] = [
    { id: 'today', label: 'Go to Today', icon: Calendar, action: () => { setCurrentView('today'); onClose(); } },
    { id: 'timeline', label: 'Go to Timeline', icon: LayoutList, action: () => { setCurrentView('timeline'); onClose(); } },
    { id: 'zones', label: 'Go to Zones', icon: Layers, action: () => { setCurrentView('zones'); onClose(); } },
    { id: 'dump', label: 'Go to Brain Dump', icon: Brain, action: () => { setCurrentView('dump'); onClose(); } },
    { id: 'vault', label: 'Go to The Vault', icon: Box, action: () => { setCurrentView('vault'); onClose(); } },
    { id: 'create', label: 'Create Task', icon: Zap, action: () => { toggleCaptureModal(); onClose(); } },
    { id: 'burst', label: 'Toggle Burst Mode', icon: Zap, action: () => { toggleBlitzMode(); onClose(); } },
  ];

  const filtered = query.trim()
    ? actions.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()))
    : actions;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[20vh]"
          onClick={() => onClose()}
        >
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="bg-background/80 backdrop-blur-2xl border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
              <Search size={16} className="text-muted" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-white/30"
              />
              <button
                type="button"
                onClick={() => onClose()}
                className="text-white/30 hover:text-white/60 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="max-h-[50vh] overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <div className="px-5 py-8 text-center text-xs text-white/30">
                  No commands found
                </div>
              ) : (
                filtered.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.action}
                    className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <item.icon size={14} className="text-accent/60" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.shortcut && (
                      <span className="text-[10px] text-white/20 font-mono">{item.shortcut}</span>
                    )}
                  </button>
                ))
              )}
            </div>

            <div className="px-5 py-2.5 border-t border-white/5 flex items-center gap-3 text-[10px] text-white/20">
              <span className="px-1.5 py-0.5 rounded bg-white/5 font-mono">Enter</span>
              <span>to select</span>
              <span className="px-1.5 py-0.5 rounded bg-white/5 font-mono">Esc</span>
              <span>to close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
