import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const slides = [
  { id: 1, heading: 'BLITZ.',         sub: 'Execute at the speed of thought.', glow: true },
  { id: 2, heading: 'Quick Capture',  sub: 'Press ⌘K anywhere to capture a task in under 2 seconds.' },
  { id: 3, heading: 'Burst Mode',     sub: 'Enter a distraction-free execution tunnel. One task. Full focus.' },
  { id: 4, heading: 'Zones',          sub: 'Organise work by project and context. No more scattered lists.' },
  { id: 5, heading: 'You\'re ready.', sub: 'Your brain is free. Let\'s build something.' },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  if (localStorage.getItem('blitz-onboarded')) return null;

  const [index, setIndex] = useState(0);
  const [dir, setDir]     = useState(1);
  const isLast = index === slides.length - 1;
  const slide  = slides[index];

  const advance = () => {
    if (isLast) { localStorage.setItem('blitz-onboarded', 'true'); onComplete(); return; }
    setDir(1); setIndex(i => i + 1);
  };
  const skip = () => { localStorage.setItem('blitz-onboarded', 'true'); onComplete(); };

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      {/* Slide area */}
      <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden px-8">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={slide.id}
            initial={{ x: '60%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-60%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-6 text-center px-8"
          >
            {slide.glow && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 50%, color-mix(in srgb, var(--accent) 18%, transparent), transparent)' }}
              />
            )}
            <img
              src="/blitz-logo.png"
              alt="Blitz"
              className="relative h-16 w-auto object-contain mb-2"
              style={{ filter: slide.glow ? 'drop-shadow(0 0 24px color-mix(in srgb, var(--accent) 60%, transparent))' : 'opacity(0.7)' }}
            />
            <h1 className={`relative text-4xl font-black tracking-tight text-foreground ${slide.glow ? 'drop-shadow-[0_0_32px_color-mix(in_srgb,var(--accent)_60%,transparent)]' : ''}`}>
              {slide.heading}
            </h1>
            <p className="relative text-base text-muted max-w-sm leading-relaxed">{slide.sub}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center gap-2 pb-6">
        {slides.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === index ? 20 : 6,
              height: 6,
              background: i === index
                ? 'var(--accent)'
                : 'color-mix(in srgb, var(--foreground) 15%, transparent)',
            }}
          />
        ))}
      </div>

      {/* Bottom nav — Skip always left, Next/Start always right, same row always */}
      <div className="flex items-center justify-between w-full max-w-sm px-8 pb-10 gap-4">
        <button
          type="button"
          onClick={skip}
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          Skip
        </button>
        <button
          type="button"
          onClick={advance}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-accent text-background hover:opacity-90 active:scale-95 transition-all"
        >
          {isLast ? 'Start' : 'Next'}
          <ChevronRight size={15} />
        </button>
      </div>
    </motion.div>
  );
}
