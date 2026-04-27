import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ArrowUpRight, Zap, Feather, TrendingUp, Minus, TrendingDown } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';

type EnergyLevel = 'deep-work' | 'light-work';
type Impact = 'high' | 'medium' | 'low';

export function QuickCapture() {
  const isOpen = useTaskStore((state) => state.isCaptureOpen);
  const toggleCaptureModal = useTaskStore((state) => state.toggleCaptureModal);
  const query = useTaskStore((state) => state.quickCaptureQuery);
  const setQuery = useTaskStore((state) => state.setQuickCaptureQuery);
  const selectedZoneId = useTaskStore((state) => state.quickCaptureSelectedZoneId);
  const setSelectedZoneId = useTaskStore((state) => state.setQuickCaptureSelectedZoneId);
  const zones = useTaskStore((state) => state.zones);
  const addTask = useTaskStore((state) => state.addTask);

  const [energy, setEnergy] = useState<EnergyLevel>('light-work');
  const [impact, setImpact] = useState<Impact>('medium');

  const close = useCallback(() => {
    if (isOpen) toggleCaptureModal();
    setQuery('');
    setSelectedZoneId(null);
    setEnergy('light-work');
    setImpact('medium');
  }, [isOpen, toggleCaptureModal, setQuery, setSelectedZoneId]);

  const handleSubmit = useCallback(async () => {
    const title = query.trim();
    if (!title) return;

    // Parse hashtags for zone matching
    const hashtagRegex = /#([\w-]+)/g;
    const hashtags: string[] = [];
    let match: RegExpExecArray | null;
    let cleanTitle = title;
    while ((match = hashtagRegex.exec(title)) !== null) {
      hashtags.push(match[1].toLowerCase());
    }
    cleanTitle = cleanTitle.replace(hashtagRegex, '').trim();
    if (!cleanTitle) return;

    let zoneId: string | undefined = selectedZoneId || undefined;
    const currentZones = useTaskStore.getState().zones;
    if (hashtags.length > 0 && !zoneId) {
      for (const tag of hashtags) {
        const matched = currentZones.find(
          (z) => z.name.toLowerCase().replace(/\s+/g, '-') === tag || z.name.toLowerCase().replace(/\s+/g, '') === tag
        );
        if (matched) { zoneId = matched.id; break; }
      }
    }

    await addTask({
      title: cleanTitle,
      energyLevel: energy,
      estimatedMinutes: energy === 'deep-work' ? 45 : 15,
      isTarget: false,
      status: 'todo',
      impact,
      dueDate: undefined,
      content: undefined,
      zoneId,
      startDate: undefined,
      checklist: [],
    });

    close();
  }, [query, selectedZoneId, energy, impact, addTask, close]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggleCaptureModal();
      } else if (e.key === 'Escape' && isOpen) {
        close();
      } else if (e.key === 'Enter' && isOpen) {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close, handleSubmit, toggleCaptureModal]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-2xl flex flex-col items-center pt-[25vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <div className="relative max-w-lg w-[92%] mx-auto">
            {/* Close button */}
            <button
              type="button"
              onClick={close}
              className="absolute -top-10 right-0 p-1.5 text-white/30 hover:text-white/70 transition-colors rounded-lg hover:bg-white/5"
            >
              <X size={16} />
            </button>

            {/* Main card */}
            <div className="bg-black border border-white/[0.08] rounded-2xl p-4 shadow-[0_40px_80px_rgba(0,0,0,0.9)]">

              {/* Input */}
              <input
                autoFocus
                type="text"
                placeholder="What needs to get done?"
                className="text-foreground text-lg font-medium placeholder:text-white/20 focus:outline-none bg-transparent w-full mb-4"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />

              {/* Zone picker chips */}
              {zones.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <button
                    type="button"
                    onClick={() => setSelectedZoneId(null)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      !selectedZoneId
                        ? 'bg-accent text-white'
                        : 'bg-white/[0.05] text-white/40 hover:text-white/70 border border-white/[0.06]'
                    }`}
                  >
                    No Zone
                  </button>
                  {zones.map((zone) => (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => setSelectedZoneId(zone.id === selectedZoneId ? null : zone.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                        selectedZoneId === zone.id
                          ? 'bg-accent text-white'
                          : 'bg-white/[0.05] text-white/40 hover:text-white/70 border border-white/[0.06]'
                      }`}
                    >
                      {zone.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-white/[0.05] mb-3" />

              {/* Energy toggle */}
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-[10px] font-semibold text-white/25 uppercase tracking-widest w-16">Energy</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEnergy('deep-work')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      energy === 'deep-work'
                        ? 'bg-accent/20 text-accent border border-accent/30'
                        : 'bg-white/[0.04] text-white/40 hover:text-white/70 border border-white/[0.06]'
                    }`}
                  >
                    <Zap size={11} />
                    Deep Work
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnergy('light-work')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      energy === 'light-work'
                        ? 'bg-accent/20 text-accent border border-accent/30'
                        : 'bg-white/[0.04] text-white/40 hover:text-white/70 border border-white/[0.06]'
                    }`}
                  >
                    <Feather size={11} />
                    Light Work
                  </button>
                </div>
              </div>

              {/* Impact toggle */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-semibold text-white/25 uppercase tracking-widest w-16">Impact</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setImpact('high')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      impact === 'high'
                        ? 'bg-accent/20 text-accent border border-accent/30'
                        : 'bg-white/[0.04] text-white/40 hover:text-white/70 border border-white/[0.06]'
                    }`}
                  >
                    <TrendingUp size={11} />
                    High
                  </button>
                  <button
                    type="button"
                    onClick={() => setImpact('medium')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      impact === 'medium'
                        ? 'bg-accent/20 text-accent border border-accent/30'
                        : 'bg-white/[0.04] text-white/40 hover:text-white/70 border border-white/[0.06]'
                    }`}
                  >
                    <Minus size={11} />
                    Medium
                  </button>
                  <button
                    type="button"
                    onClick={() => setImpact('low')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      impact === 'low'
                        ? 'bg-accent/20 text-accent border border-accent/30'
                        : 'bg-white/[0.04] text-white/40 hover:text-white/70 border border-white/[0.06]'
                    }`}
                  >
                    <TrendingDown size={11} />
                    Low
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/20 font-mono">↵ to capture</span>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!query.trim()}
                  className="flex items-center gap-1.5 bg-accent text-background px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ArrowUpRight size={14} />
                  Capture
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
