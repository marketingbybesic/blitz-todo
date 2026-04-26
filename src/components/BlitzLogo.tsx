export function BlitzLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="purpleGrad" x1="0" y1="50" x2="100" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#d8b4fe" />
          <stop offset="100%" stopColor="#7e22ce" />
        </linearGradient>
        <linearGradient id="greyGrad" x1="0" y1="100" x2="50" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
      </defs>
      {/* Top Purple Bolt */}
      <polygon points="20,55 70,10 45,45 80,45" fill="url(#purpleGrad)" />
      {/* Bottom Grey Bolt */}
      <polygon points="45,55 80,55 30,95 55,55" fill="url(#greyGrad)" />
    </svg>
  );
}
