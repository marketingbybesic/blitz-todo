import { useState, useEffect } from 'react';

const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
export const shortcut = isMac ? 'Cmd+K' : 'Ctrl+K';

const PLACEHOLDERS = [
  'Draft the strategic brief...',
  'Schedule the dentist appointment...',
  'Pay the electric bill...',
];

const TYPING_SPEED = 80;
const PAUSE_DURATION = 2000;
const ERASE_SPEED = 40;

export function Typewriter() {
  const [text, setText] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'pausing' | 'erasing'>('typing');
  const [charIndex, setCharIndex] = useState(0);

  const currentPlaceholder = PLACEHOLDERS[placeholderIndex];

  useEffect(() => {
    if (phase === 'typing') {
      if (charIndex < currentPlaceholder.length) {
        const timeout = setTimeout(() => {
          setText(currentPlaceholder.slice(0, charIndex + 1));
          setCharIndex((prev) => prev + 1);
        }, TYPING_SPEED);
        return () => clearTimeout(timeout);
      } else {
        setPhase('pausing');
      }
    } else if (phase === 'pausing') {
      const timeout = setTimeout(() => {
        setPhase('erasing');
      }, PAUSE_DURATION);
      return () => clearTimeout(timeout);
    } else if (phase === 'erasing') {
      if (charIndex > 0) {
        const timeout = setTimeout(() => {
          setText(currentPlaceholder.slice(0, charIndex - 1));
          setCharIndex((prev) => prev - 1);
        }, ERASE_SPEED);
        return () => clearTimeout(timeout);
      } else {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        setPhase('typing');
      }
    }
  }, [phase, charIndex, currentPlaceholder]);

  return <span className="text-white/20 italic">{text}</span>;
}
