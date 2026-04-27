import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Palette, Layout, Moon, Check, Save } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';

const ACCENT_PRESETS = [
  { label: 'Purple', color: '#a855f7' },
  { label: 'Blue',   color: '#3b82f6' },
  { label: 'Cyan',   color: '#06b6d4' },
  { label: 'Green',  color: '#22c55e' },
  { label: 'Orange', color: '#f97316' },
  { label: 'Pink',   color: '#ec4899' },
];

export function SettingsModal() {
  const isOpen        = useSettingsStore(s => s.isSettingsOpen);
  const toggleModal   = useSettingsStore(s => s.toggleSettingsModal);
  const accentColor   = useSettingsStore(s => s.accentColor);
  const setAccentColor = useSettingsStore(s => s.setAccentColor);
  const applyAccentColor = useSettingsStore(s => s.applyAccentColor);
  const fabAlignment  = useSettingsStore(s => s.fabAlignment);
  const setFabAlignment = useSettingsStore(s => s.setFabAlignment);
  const theme         = useSettingsStore(s => s.theme);
  const setTheme      = useSettingsStore(s => s.setTheme);

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) toggleModal(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, toggleModal]);

  // Auto-save: every change persists via Zustand persist
  // Show "saved" indicator briefly after any change
  const handleChange = (fn: () => void) => {
    fn(); setSaved(true); setTimeout(() => setSaved(false), 1500);
  };

  const handleAccent = (color: string) => {
    handleChange(() => { setAccentColor(color); applyAccentColor(color); });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-xl flex items-start justify-center pt-[18vh]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={e => { if (e.target === e.currentTarget) toggleModal(); }}
        >
          <motion.div
            className="w-full max-w-md bg-black border border-white/[0.08] rounded-2xl shadow-[0_40px_80px_rgba(0,0,0,0.9)] overflow-hidden"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <h3 className="text-sm font-bold tracking-tight">Preferences</h3>
                <AnimatePresence>
                  {saved && (
                    <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-1 text-[10px] text-green-400 font-medium">
                      <Check size={10} /> Saved
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button type="button" onClick={toggleModal}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-white/[0.05] transition-colors">
                <X size={14} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-6">
              {/* Theme */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Moon size={13} className="text-muted" />
                  <span className="text-xs font-semibold text-foreground/80">Theme</span>
                </div>
                <div className="flex gap-2">
                  {(['dark','midnight','light'] as const).map(t => (
                    <button key={t} type="button"
                      onClick={() => handleChange(() => setTheme(t))}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all border ${
                        theme === t
                          ? 'bg-accent/15 text-accent border-accent/30 shadow-[0_0_12px_color-mix(in_srgb,var(--accent)_15%,transparent)]'
                          : 'bg-white/[0.04] text-muted border-transparent hover:border-white/10 hover:text-foreground'
                      }`}>{t}</button>
                  ))}
                </div>
              </div>

              {/* Accent color */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Palette size={13} className="text-muted" />
                  <span className="text-xs font-semibold text-foreground/80">Accent Color</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {ACCENT_PRESETS.map(p => (
                    <button key={p.color} type="button" onClick={() => handleAccent(p.color)}
                      title={p.label}
                      className="w-7 h-7 rounded-full transition-all border-2 flex items-center justify-center"
                      style={{ background: p.color, borderColor: accentColor === p.color ? p.color : 'transparent',
                               boxShadow: accentColor === p.color ? `0 0 10px ${p.color}60` : 'none' }}>
                      {accentColor === p.color && <Check size={12} color="#fff" strokeWidth={3} />}
                    </button>
                  ))}
                  <input type="color" value={accentColor} title="Custom color"
                    onChange={e => handleAccent(e.target.value)}
                    className="w-7 h-7 rounded-full cursor-pointer border-0 bg-transparent p-0 overflow-hidden" />
                </div>
              </div>

              {/* FAB alignment */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Layout size={13} className="text-muted" />
                  <span className="text-xs font-semibold text-foreground/80">Quick Add Button</span>
                </div>
                <div className="flex gap-2">
                  {(['left','right'] as const).map(a => (
                    <button key={a} type="button"
                      onClick={() => handleChange(() => setFabAlignment(a))}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all border ${
                        fabAlignment === a
                          ? 'bg-accent/15 text-accent border-accent/30'
                          : 'bg-white/[0.04] text-muted border-transparent hover:border-white/10 hover:text-foreground'
                      }`}>{a}</button>
                  ))}
                </div>
              </div>

              {/* Auto-save note */}
              <div className="flex items-center gap-1.5 text-[10px] text-muted/40">
                <Save size={9} />
                All changes save automatically
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
