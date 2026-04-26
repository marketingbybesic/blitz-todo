import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Palette, Layout, KeyRound, ChevronLeft } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';

export function SettingsModal() {
  const isOpen = useSettingsStore((state) => state.isSettingsOpen);
  const toggleSettingsModal = useSettingsStore((state) => state.toggleSettingsModal);
  const accentColor = useSettingsStore((state) => state.accentColor);
  const setAccentColor = useSettingsStore((state) => state.setAccentColor);
  const applyAccentColor = useSettingsStore((state) => state.applyAccentColor);
  const fabAlignment = useSettingsStore((state) => state.fabAlignment);
  const setFabAlignment = useSettingsStore((state) => state.setFabAlignment);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        toggleSettingsModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggleSettingsModal]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setAccentColor(color);
    applyAccentColor(color);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[20vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              toggleSettingsModal();
            }
          }}
        >
          <motion.div
            className="w-full max-w-lg bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <button
                type="button"
                onClick={toggleSettingsModal}
                className="flex items-center gap-1 text-xs text-muted hover:text-white transition-colors md:hidden"
              >
                <ChevronLeft size={16} />
                Back
              </button>
              <h3 className="text-sm font-semibold text-foreground tracking-wide">Settings</h3>
              <button
                type="button"
                onClick={toggleSettingsModal}
                className="hidden md:block p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-[#1c1c1e] border border-white/5 flex items-center justify-center">
                  <Palette size={14} className="text-muted" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-white/80 block mb-1.5">Accent Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={handleColorChange}
                      className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                    />
                    <span className="text-xs text-muted font-mono">{accentColor}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-[#1c1c1e] border border-white/5 flex items-center justify-center">
                  <Layout size={14} className="text-muted" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-white/80 block mb-1.5">FAB Alignment</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFabAlignment('left')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${
                        fabAlignment === 'left'
                          ? 'bg-[#a855f7]/20 text-[#a855f7] border-[#a855f7]/30'
                          : 'bg-[#1c1c1e] text-muted border-white/5 hover:text-white/60'
                      }`}
                    >
                      Left
                    </button>
                    <button
                      type="button"
                      onClick={() => setFabAlignment('right')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${
                        fabAlignment === 'right'
                          ? 'bg-[#a855f7]/20 text-[#a855f7] border-[#a855f7]/30'
                          : 'bg-[#1c1c1e] text-muted border-white/5 hover:text-white/60'
                      }`}
                    >
                      Right
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-[#1c1c1e] border border-white/5 flex items-center justify-center">
                  <KeyRound size={14} className="text-muted" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-white/80 block mb-1.5">API Key</label>
                  <input
                    type="password"
                    placeholder="Enter your API key..."
                    className="w-full bg-[#1c1c1e] border border-white/5 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-white/20 focus:outline-none focus:border-[#a855f7]/30 transition-colors"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
