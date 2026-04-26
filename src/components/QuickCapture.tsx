import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart, Brain, Zap, Target } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';

export function QuickCapture() {
  const isOpen = useTaskStore((state) => state.isCaptureOpen);
  const toggleCaptureModal = useTaskStore((state) => state.toggleCaptureModal);
  const [title, setTitle] = useState('');
  const [energyLevel, setEnergyLevel] = useState<'light-work' | 'deep-work'>('light-work');
  const [estimatedMinutes, setEstimatedMinutes] = useState(15);
  const [isTarget, setIsTarget] = useState(false);
  const [impact, setImpact] = useState<'low' | 'medium' | 'high'>('medium');
  const addTask = useTaskStore((state) => state.addTask);

  const close = useCallback(() => {
    if (isOpen) toggleCaptureModal();
    setTitle('');
    setEnergyLevel('light-work');
    setEstimatedMinutes(15);
    setIsTarget(false);
    setImpact('medium');
  }, [isOpen, toggleCaptureModal]);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) return;
    await addTask({
      title: title.trim(),
      energyLevel,
      estimatedMinutes,
      isTarget,
      status: 'todo',
      impact,
      dueDate: undefined,
      content: undefined,
      zoneId: undefined,
      startDate: undefined,
    });
    close();
  }, [title, energyLevel, estimatedMinutes, isTarget, impact, addTask, close]);

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
              if (isOpen) toggleCaptureModal();
            }
          }}
        >
          <motion.div
            className="w-full max-w-2xl bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
          >
            <input
              type="text"
              autoFocus
              placeholder="What needs to get done?"
              className="text-2xl bg-transparent text-white placeholder:text-white/20 p-6 w-full focus:outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div className="flex items-center justify-between bg-[#1c1c1e] px-6 py-3 border-t border-white/5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEnergyLevel(energyLevel === 'deep-work' ? 'light-work' : 'deep-work')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                    energyLevel === 'deep-work'
                      ? 'bg-[#a855f7]/20 text-[#a855f7] shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                      : 'text-muted hover:text-white/60'
                  }`}
                >
                  {energyLevel === 'deep-work' ? <Brain size={12} /> : <Zap size={12} />}
                  {energyLevel === 'deep-work' ? 'Deep Work' : 'Quick Win'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsTarget((prev) => !prev)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                    isTarget
                      ? 'bg-[#a855f7]/20 text-[#a855f7] shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                      : 'text-muted hover:text-white/60'
                  }`}
                >
                  <Target size={12} />
                  Make Target
                </button>

                <button
                  type="button"
                  onClick={() => setImpact((prev) => (prev === 'high' ? 'low' : prev === 'low' ? 'medium' : 'high'))}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                    impact === 'high'
                      ? 'bg-[#a855f7]/20 text-[#a855f7] shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                      : 'text-muted hover:text-white/60'
                  }`}
                >
                  <BarChart size={12} />
                  {impact === 'high' ? 'High' : impact === 'medium' ? 'Medium' : 'Low'}
                </button>

                <button
                  type="button"
                  onClick={() => setEstimatedMinutes((prev) => Math.min(480, prev + 15))}
                  className="px-2.5 py-1 rounded-md text-xs font-medium text-muted hover:text-white/60 transition-all"
                >
                  +{estimatedMinutes}m
                </button>
              </div>

              <span className="text-xs text-muted/60">Press Enter to save</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
