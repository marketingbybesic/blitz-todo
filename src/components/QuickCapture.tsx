import { useCallback, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ArrowUpRight } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';

export function QuickCapture() {
  const isOpen = useTaskStore((state) => state.isCaptureOpen);
  const toggleCaptureModal = useTaskStore((state) => state.toggleCaptureModal);
  const query = useTaskStore((state) => state.quickCaptureQuery);
  const setQuery = useTaskStore((state) => state.setQuickCaptureQuery);
  const selectedZoneId = useTaskStore((state) => state.quickCaptureSelectedZoneId);
  const setSelectedZoneId = useTaskStore((state) => state.setQuickCaptureSelectedZoneId);
  const submitQuickCapture = useTaskStore((state) => state.submitQuickCapture);
  const zones = useTaskStore((state) => state.zones);

  const close = useCallback(() => {
    if (isOpen) toggleCaptureModal();
    setQuery('');
    setSelectedZoneId(null);
  }, [isOpen, toggleCaptureModal, setQuery, setSelectedZoneId]);

  const handleSubmit = useCallback(async () => {
    await submitQuickCapture();
  }, [submitQuickCapture]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggleCaptureModal();
      } else if (e.key === 'Escape' && isOpen) {
        close();
      } else if (e.key === 'Enter' && isOpen && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close, handleSubmit]);

  const suggestedZones = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return zones.filter((z) => q.startsWith(z.name.toLowerCase()));
  }, [query, zones]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-2xl flex flex-col items-center pt-[20vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="relative max-w-2xl w-[90%] mx-auto">
            <button
              type="button"
              onClick={close}
              className="absolute -top-12 right-0 p-2 text-white/40 hover:text-white/80 transition-colors rounded-lg hover:bg-white/5"
            >
              <X size={20} />
            </button>

            <div className="bg-card/50 border border-white/10 rounded-2xl p-6 shadow-2xl">
              <textarea
                autoFocus
                placeholder="What needs to get done?"
                className="text-foreground text-2xl font-medium placeholder:text-white/20 focus:outline-none min-h-[200px] resize-none bg-transparent w-full"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />

              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!query.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowUpRight size={16} />
                  Capture
                </button>
              </div>
            </div>

            {(suggestedZones.length > 0 || selectedZoneId) && (
              <div className="mt-3 flex items-center gap-2 text-sm text-white/40">
                <span className="text-white/30 text-xs uppercase tracking-wider">Zone</span>
                {selectedZoneId ? (
                  <span className="text-accent font-medium">
                    {zones.find((z) => z.id === selectedZoneId)?.name}
                  </span>
                ) : (
                  suggestedZones.map((zone) => (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => setSelectedZoneId(zone.id)}
                      className="px-2 py-0.5 rounded-md text-xs bg-white/5 text-white/50 hover:text-white/80 transition-colors"
                    >
                      {zone.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
