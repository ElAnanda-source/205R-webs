import type { TradingMethodology } from '../types/trading';

export function MethodologyDiagram({ id }: { id: TradingMethodology }) {
  if (id === 'ALCHEMIST') {
    return (
      <div className="relative h-36 w-full overflow-hidden rounded-xl border border-[#00E5FF]/35 bg-[#020305]">
        <img
          src="/src/assets/images/blackout_alchemist_sigil_1795325910311.jpg"
          alt="ALCHEMIST 205R Proprietary Signature Methodology"
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020305] via-[#020305]/20 to-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-36 w-full items-center justify-center rounded-xl border border-[#168BFF]/18 bg-[#020305]/95 p-3 shadow-inner">
      <svg viewBox="0 0 240 100" className="h-full w-full" aria-hidden="true">
        {id === 'SNR' && (
          <g>
            <line x1="16" y1="26" x2="224" y2="26" stroke="#00E5FF" strokeWidth="1.5" strokeDasharray="4 3" />
            <line x1="16" y1="74" x2="224" y2="74" stroke="#168BFF" strokeWidth="1.5" />
            <polyline
              points="20,70 52,32 82,66 118,28 152,72 192,30 220,42"
              fill="none"
              stroke="#EAF7FF"
              strokeWidth="1.6"
            />
            <circle cx="52" cy="30" r="3.2" fill="#00E5FF" />
            <circle cx="118" cy="27" r="3.2" fill="#00E5FF" />
            <circle cx="152" cy="73" r="3.2" fill="#00E5FF" />
          </g>
        )}
        {id === 'SND' && (
          <g>
            <rect x="24" y="62" width="180" height="20" fill="#168BFF" fillOpacity="0.16" stroke="#168BFF" strokeWidth="1" />
            <rect x="108" y="16" width="96" height="16" fill="#00E5FF" fillOpacity="0.14" stroke="#00E5FF" strokeWidth="1" />
            <polyline
              points="24,42 50,70 84,68 122,22 152,72 195,28"
              fill="none"
              stroke="#EAF7FF"
              strokeWidth="1.6"
            />
            <circle cx="152" cy="72" r="3.5" fill="#00E5FF" />
          </g>
        )}
        {id === 'Price Action' && (
          <g>
            {[
              { x: 36, o: 68, c: 54, h: 48, l: 74, up: true },
              { x: 64, o: 54, c: 42, h: 36, l: 58, up: true },
              { x: 92, o: 42, c: 50, h: 38, l: 56, up: false },
              { x: 120, o: 50, c: 34, h: 28, l: 54, up: true },
              { x: 148, o: 34, c: 22, h: 16, l: 38, up: true },
              { x: 176, o: 22, c: 30, h: 18, l: 35, up: false },
              { x: 204, o: 30, c: 16, h: 12, l: 34, up: true },
            ].map((bar, idx) => {
              const top = Math.min(bar.o, bar.c);
              const h = Math.max(Math.abs(bar.o - bar.c), 3);
              return (
                <g key={idx}>
                  <line x1={bar.x} y1={bar.h} x2={bar.x} y2={bar.l} stroke={bar.up ? '#00E5FF' : '#8194A9'} strokeWidth="1.2" />
                  <rect
                    x={bar.x - 5}
                    y={top}
                    width="10"
                    height={h}
                    fill={bar.up ? '#00E5FF' : '#090F18'}
                    stroke={bar.up ? '#00E5FF' : '#8194A9'}
                    strokeWidth="1"
                  />
                </g>
              );
            })}
          </g>
        )}
        {id === 'ICT' && (
          <g>
            <line x1="20" y1="30" x2="170" y2="30" stroke="#8194A9" strokeDasharray="3 3" strokeWidth="1" />
            <rect x="135" y="42" width="76" height="14" fill="#00E5FF" fillOpacity="0.14" stroke="#00E5FF" strokeWidth="0.9" />
            <polyline
              points="24,68 62,32 95,48 128,18 158,64 185,48 216,84"
              fill="none"
              stroke="#EAF7FF"
              strokeWidth="1.6"
            />
            <circle cx="128" cy="18" r="3.5" fill="#00E5FF" />
          </g>
        )}
        {id === 'SMC' && (
          <g>
            <rect x="30" y="64" width="160" height="18" fill="#168BFF" fillOpacity="0.16" stroke="#168BFF" strokeWidth="1" />
            <line x1="90" y1="40" x2="180" y2="40" stroke="#00E5FF" strokeDasharray="3 2" strokeWidth="1" />
            <polyline
              points="28,74 62,40 94,54 128,18 156,68 206,20"
              fill="none"
              stroke="#EAF7FF"
              strokeWidth="1.6"
            />
            <circle cx="156" cy="68" r="3.5" fill="#00E5FF" />
          </g>
        )}
      </svg>
    </div>
  );
}

const ENGINE_MODULES = [
  {
    step: '01',
    title: 'Multi-Timeframe Market Analysis',
    role: 'Higher-timeframe bias & directional context across Weekly, Daily, and 4H charts.',
  },
  {
    step: '02',
    title: 'Support & Resistance Mapping',
    role: 'Key structural inflection points and historical flip levels framing execution boundaries.',
  },
  {
    step: '03',
    title: 'Smart Money Concepts',
    role: 'Market structure transitions (BOS / CHoCH) and premium-to-discount equilibrium mapping.',
  },
  {
    step: '04',
    title: 'Liquidity Sweep Detection',
    role: 'Identification of engineered stop runs above equal highs or below structural lows.',
  },
  {
    step: '05',
    title: 'Order Block Identification',
    role: 'Refinement of institutional sponsorship candles preceding impulsive displacement.',
  },
  {
    step: '06',
    title: 'Fair Value Gap Analysis',
    role: 'Imbalance and inefficiency zones used for precision pullback re-entry calibration.',
  },
  {
    step: '07',
    title: 'Candle-Close Confirmation',
    role: 'Strict execution gate requiring lower-timeframe candle closure before order commitment.',
  },
  {
    step: '08',
    title: 'Risk Management Framework',
    role: 'Fractional position sizing, hard structural invalidation, and daily drawdown protection.',
  },
];

export function MultiTimeframeEngineDiagram() {
  return (
    <div className="cyber-glass rounded-2xl p-5 sm:p-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-[#8194A9]/15 pb-6">
        <div className="min-w-0">
          <p className="font-michroma text-[10px] tracking-[0.2em] text-[#00E5FF]">
            SYSTEM ARCHITECTURE
          </p>
          <h2 className="cyber-h2 mt-2 text-[#EAF7FF]">
            205R MULTI TIME FRAME ENGINE V2.0
          </h2>
        </div>
        <p className="font-inter max-w-md text-xs leading-relaxed text-[#8194A9]">
          Structured analytical decision pipeline. All entries remain discretionary and manually executed by the trader under documented risk constraints—no automated execution or guaranteed profitability is implied.
        </p>
      </div>

      {/* Connected 8-stage asymmetric obsidian pipeline */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {ENGINE_MODULES.map((mod) => (
          <div
            key={mod.step}
            className="cyber-surface-dark cyber-interactive flex flex-col justify-between rounded-xl p-4"
          >
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-michroma tabular-nums text-[#00E5FF]">{mod.step}</span>
                <span className="h-px flex-1 mx-3 bg-gradient-to-r from-[#00E5FF]/40 to-transparent" />
              </div>
              <h3 className="font-michroma mt-3 text-xs leading-relaxed tracking-[0.06em] text-[#EAF7FF]">
                {mod.title}
              </h3>
              <p className="font-inter mt-2 text-xs leading-relaxed text-[#8194A9]">{mod.role}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline Signal Flow Strip */}
      <div className="mt-6 border-t border-[#168BFF]/20 pt-5">
        <div className="flex flex-col items-start justify-between gap-3 text-xs text-[#EAF7FF]/85 lg:flex-row lg:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-michroma text-[#00E5FF]">HTF BIAS</span>
            <span className="font-inter text-[#8194A9]">(W1 / D1 / H4)</span>
          </div>
          <span className="hidden text-[#168BFF] lg:inline">&rarr;</span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-michroma text-[#EAF7FF]">LIQUIDITY &amp; ZONES</span>
            <span className="font-inter text-[#8194A9]">(SNR / OB / FVG)</span>
          </div>
          <span className="hidden text-[#168BFF] lg:inline">&rarr;</span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-michroma text-[#EAF7FF]">CONFIRMATION</span>
            <span className="font-inter text-[#8194A9]">(M15 / M5 Candle Close)</span>
          </div>
          <span className="hidden text-[#168BFF] lg:inline">&rarr;</span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-michroma text-[#00E5FF]">RISK GATE</span>
            <span className="font-inter text-[#8194A9]">(Sizing &amp; Hard SL)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
