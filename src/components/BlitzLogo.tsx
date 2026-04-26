export function BlitzLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="accentGrad" x1="0" y1="50" x2="100" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="fgGrad" x1="0" y1="100" x2="50" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--foreground)" />
          <stop offset="100%" stopColor="var(--muted)" />
        </linearGradient>
      </defs>
      {/* Top Accent Bolt */}
      <polygon points="20,55 70,10 45,45 80,45" fill="url(#accentGrad)" />
      {/* Bottom Foreground Bolt */}
      <polygon points="45,55 80,55 30,95 55,55" fill="url(#fgGrad)" />
    </svg>
  );
}
