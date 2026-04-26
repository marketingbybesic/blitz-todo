import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface OnboardingProps {
  onComplete: () => void;
}

const slides = [
  {
    id: 1,
    heading: 'BLITZ.',
    subheading: 'Execute at the speed of thought.',
    glow: true,
  },
  {
    id: 2,
    heading: 'Quick Capture',
    subheading: 'Press ⌘K anywhere to capture a task in under 2 seconds',
    glow: false,
  },
  {
    id: 3,
    heading: 'Burst Mode',
    subheading: 'Hit Burst Mode to enter a distraction-free execution tunnel',
    glow: false,
  },
  {
    id: 4,
    heading: 'Zones',
    subheading: 'Organize work into Zones — your projects, your contexts',
    glow: false,
  },
  {
    id: 5,
    heading: 'Ready.',
    subheading: 'Your brain is free. Let\'s build something.',
    glow: false,
    isLast: true,
  },
];

const slideVariants = {
  enter: { x: '100%', opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: '-100%', opacity: 0 },
};

export function Onboarding({ onComplete }: OnboardingProps) {
  if (localStorage.getItem('blitz-onboarded')) return null;

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const slide = slides[index];
  const isLast = index === slides.length - 1;

  const advance = () => {
    if (isLast) {
      localStorage.setItem('blitz-onboarded', 'true');
      onComplete();
      return;
    }
    setDirection(1);
    setIndex((i) => i + 1);
  };

  const skip = () => {
    localStorage.setItem('blitz-onboarded', 'true');
    onComplete();
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Slide content */}
      <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={slide.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center gap-6"
          >
            {slide.glow && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(ellipse 60% 40% at 50% 50%, color-mix(in srgb, var(--accent) 18%, transparent), transparent)',
                }}
              />
            )}
            <h1
              className={`relative text-5xl font-black tracking-tight text-foreground ${
                slide.glow ? 'drop-shadow-[0_0_32px_color-mix(in_srgb,var(--accent)_60%,transparent)]' : ''
              }`}
            >
              {slide.heading}
            </h1>
            <p className="relative text-lg text-muted max-w-md leading-relaxed">
              {slide.subheading}
            </p>
            {slide.isLast && (
              <motion.button
                type="button"
                onClick={advance}
                className="relative mt-4 px-8 py-3 rounded-xl font-semibold text-sm bg-accent text-background hover:opacity-90 transition-opacity"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Start
              </motion.button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center gap-2 pb-8">
        {slides.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === index ? 20 : 6,
              height: 6,
              background:
                i === index
                  ? 'var(--accent)'
                  : 'color-mix(in srgb, var(--foreground) 20%, transparent)',
            }}
          />
        ))}
      </div>

      {/* Nav buttons */}
      <div className="flex items-center justify-between w-full max-w-sm px-8 pb-10">
        <button
          type="button"
          onClick={skip}
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          Skip
        </button>
        {!isLast && (
          <button
            type="button"
            onClick={advance}
            className="px-6 py-2 rounded-lg text-sm font-medium bg-card border border-border text-foreground hover:border-accent/50 hover:text-accent transition-all"
          >
            Next
          </button>
        )}
      </div>
    </motion.div>
  );
}
