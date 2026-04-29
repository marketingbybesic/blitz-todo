import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Zap, Command, Layers, Rocket } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const slides = [
  {
    id: 1,
    icon: null, // Uses logo
    heading: 'BLITZ.',
    sub: 'Execute at the speed of thought.',
    accent: true,
    hint: null,
  },
  {
    id: 2,
    icon: Command,
    heading: 'Instant Capture',
    sub: 'Hit ⌘K (or Ctrl+K) anywhere to capture a task in under 2 seconds. Type naturally — AI fills in the details.',
    accent: false,
    hint: '⌘K  or  Ctrl+K',
  },
  {
    id: 3,
    icon: Zap,
    heading: 'Burst Mode',
    sub: 'A floating focus tunnel. Quick wins first, complexity builds as momentum grows. Dopamine-stacked.',
    accent: false,
    hint: 'Quick wins → Complex tasks',
  },
  {
    id: 4,
    icon: Layers,
    heading: 'Zones',
    sub: 'Group tasks by context. Work, Life, Health — everything has a place. Switch contexts without losing flow.',
    accent: false,
    hint: 'Context-based focus',
  },
  {
    id: 5,
    icon: Rocket,
    heading: 'Your brain is free.',
    sub: "Blitz holds the tasks. You hold the focus. Let's build something.",
    accent: true,
    hint: null,
  },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [index, setIndex] = useState(0);
  const [dir, setDir]     = useState(1);
  const isLast = index === slides.length - 1;
  const slide  = slides[index];

  const advance = () => {
    if (isLast) { localStorage.setItem('blitz-onboarded', 'true'); onComplete(); return; }
    setDir(1); setIndex(i => i + 1);
  };
  const back = () => {
    if (index === 0) return;
    setDir(-1); setIndex(i => i - 1);
  };
  const skip = () => { localStorage.setItem('blitz-onboarded', 'true'); onComplete(); };

  return (
    <motion.div
      className="fixed inset-0 z-[100] onboarding-bg-animated flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      {/* Ambient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute rounded-full onboarding-glow-pulse"
          style={{
            width: 400, height: 400,
            left: '50%', top: '40%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 70%)',
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 200, height: 200,
            right: '10%', top: '20%',
            background: 'radial-gradient(circle, color-mix(in srgb, var(--accent) 6%, transparent) 0%, transparent 70%)',
          }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 150, height: 150,
            left: '8%', bottom: '25%',
            background: 'radial-gradient(circle, color-mix(in srgb, var(--accent) 5%, transparent) 0%, transparent 70%)',
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.4, 0.15], y: [0, 15, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
      </div>

      {/* Slide area */}
      <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden px-8">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={slide.id}
            custom={dir}
            initial={{ x: dir > 0 ? '60%' : '-60%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: dir > 0 ? '-60%' : '60%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-center px-8"
          >
            {/* Icon or logo */}
            {slide.icon ? (
              <motion.div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
                  boxShadow: '0 0 40px color-mix(in srgb, var(--accent) 20%, transparent)',
                }}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 280 }}
              >
                <slide.icon size={28} className="text-accent" />
              </motion.div>
            ) : (
              <motion.img
                src="/blitz-logo.svg"
                alt="Blitz"
                className="onboarding-logo-float h-20 w-auto object-contain"
                style={{ filter: 'drop-shadow(0 0 32px color-mix(in srgb, var(--accent) 70%, transparent))' }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              />
            )}

            <motion.h1
              className="text-3xl font-black tracking-tight text-foreground"
              style={slide.accent ? { filter: 'drop-shadow(0 0 20px color-mix(in srgb, var(--accent) 50%, transparent))' } : {}}
              initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              {slide.heading}
            </motion.h1>

            <motion.p
              className="text-sm text-muted max-w-xs leading-relaxed"
              initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {slide.sub}
            </motion.p>

            {slide.hint && (
              <motion.div
                className="px-3 py-1.5 rounded-lg border text-xs font-mono text-muted/60"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}
                initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                {slide.hint}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center gap-2 pb-6">
        {slides.map((_, i) => (
          <motion.button
            key={i}
            type="button"
            onClick={() => { setDir(i > index ? 1 : -1); setIndex(i); }}
            className="rounded-full transition-all duration-300 cursor-pointer"
            animate={{
              width: i === index ? 24 : 6,
              height: 6,
              backgroundColor: i === index ? 'var(--accent)' : 'rgba(255,255,255,0.15)',
            }}
          />
        ))}
      </div>

      {/* Bottom nav */}
      <div className="flex items-center justify-between w-full max-w-sm px-8 pb-10 gap-4">
        <button
          type="button"
          onClick={index === 0 ? skip : back}
          className="text-sm text-muted/50 hover:text-foreground transition-colors"
        >
          {index === 0 ? 'Skip' : 'Back'}
        </button>
        <motion.button
          type="button"
          onClick={advance}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-accent text-black hover:opacity-90 active:scale-95 transition-all"
          whileTap={{ scale: 0.96 }}
          style={{ boxShadow: '0 0 20px color-mix(in srgb, var(--accent) 40%, transparent)' }}
        >
          {isLast ? "Let's go" : 'Next'}
          <ChevronRight size={15} />
        </motion.button>
      </div>
    </motion.div>
  );
}
