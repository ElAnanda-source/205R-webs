export type TransitionPhase = 'idle' | 'exiting' | 'entering';

interface PageTransitionOverlayProps {
  phase: TransitionPhase;
}

export function PageTransitionOverlay({ phase }: PageTransitionOverlayProps) {
  if (phase === 'idle') return null;

  return (
    <div
      aria-hidden="true"
      data-testid="page-transition-overlay"
      className={`pointer-events-none fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${
        phase === 'exiting' ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Pure obsidian blackout veil */}
      <div className="absolute inset-0 bg-[#020305]/94 backdrop-blur-[2px]" />

      {/* Electric cyan & lightning blue horizontal sweep beam */}
      <div className="cyber-transition-beam absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-[#00E5FF]/22 to-transparent">
        <div className="h-full w-px mx-auto bg-gradient-to-b from-transparent via-[#00E5FF]/85 to-transparent shadow-[0_0_28px_#00E5FF]" />
      </div>

      {/* Delicate digital scanline pass */}
      <div className="cyber-transition-scanline absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-transparent via-[#168BFF]/16 to-transparent" />
    </div>
  );
}
