import type { SiteContent } from '../types/trading';

interface AboutPageProps {
  siteContent: SiteContent;
  onNavigate: (path: string) => void;
}

const FOCUS_AREAS = [
  'Technical market analysis',
  'Multi-timeframe analysis',
  'Market structure',
  'Liquidity analysis',
  'Systematic execution',
  'Risk management',
  'Performance documentation',
];

export function AboutPage({ siteContent, onNavigate }: AboutPageProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <header className="max-w-3xl border-b border-[#8194A9]/18 pb-8">
        <p className="font-michroma text-[10px] tracking-[0.2em] text-[#00E5FF]">
          INDEPENDENT TRADING INITIATIVE
        </p>
        <h1 className="cyber-page-h1 mt-3 text-[#EAF7FF]">
          ABOUT 205R
        </h1>
        <p className="font-inter mt-4 text-sm sm:text-base leading-relaxed text-[#8194A9]">
          {siteContent.aboutSummary}
        </p>
      </header>

      {/* Editorial Two-Column Philosophy & Focus Architecture */}
      <section className="mt-12 grid gap-8 lg:grid-cols-12">
        <div className="cyber-glass rounded-2xl p-6 sm:p-8 lg:col-span-7">
          <h2 className="cyber-h2 text-[#EAF7FF]">CORE PRINCIPLES</h2>
          <p className="font-inter mt-2 text-sm leading-relaxed text-[#8194A9]">
            {siteContent.philosophyStatement}
          </p>
          <ul className="mt-6 divide-y divide-[#8194A9]/12 border-t border-[#8194A9]/15">
            {siteContent.corePrinciples.map((principle, idx) => (
              <li key={idx} className="flex items-baseline gap-4 py-3.5 text-sm text-[#EAF7FF]">
                <span className="font-michroma tabular-nums text-xs text-[#00E5FF]">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span className="font-inter">{principle}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="cyber-surface-dark flex flex-col justify-between rounded-2xl p-6 sm:p-8 lg:col-span-5">
          <div>
            <h2 className="cyber-h2 text-[#EAF7FF]">OPERATIONAL FOCUS</h2>
            <p className="font-inter mt-2 text-sm leading-relaxed text-[#8194A9]">
              205R operates as an independent quantitative and price-delivery research ledger built around measurable execution discipline.
            </p>
            <ul className="mt-6 space-y-2.5 border-t border-[#8194A9]/15 pt-5">
              {FOCUS_AREAS.map((area) => (
                <li
                  key={area}
                  className="flex items-center gap-3 font-inter text-xs sm:text-sm text-[#EAF7FF]/85"
                >
                  <span className="h-1 w-3 shrink-0 bg-[#00E5FF]/65" aria-hidden="true" />
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-[#8194A9]/15">
            <button
              type="button"
              onClick={() => onNavigate('/system')}
              className="font-michroma inline-flex min-h-11 w-full sm:w-auto items-center justify-center rounded-lg border border-[#00E5FF]/70 bg-[#00E5FF]/12 px-5 py-2.5 text-xs tracking-[0.12em] text-[#EAF7FF] transition-all hover:bg-[#00E5FF] hover:text-[#020305]"
            >
              INSPECT TRADING SYSTEM
            </button>
          </div>
        </div>
      </section>

      {/* Chronology Timeline */}
      <section className="mt-16">
        <div className="mb-8">
          <p className="font-michroma text-[10px] tracking-[0.2em] text-[#00E5FF]">CHRONOLOGY</p>
          <h2 className="cyber-h2 mt-2 text-[#EAF7FF]">DEVELOPMENT TIMELINE</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {siteContent.timeline.map((milestone) => (
            <article
              key={`${milestone.year}-${milestone.title}`}
              className="cyber-glass cyber-interactive rounded-2xl p-6"
            >
              <div className="flex flex-wrap items-center gap-3 border-b border-[#8194A9]/15 pb-3.5">
                <span className="font-michroma tabular-nums text-lg text-[#00E5FF] neon-metric">
                  {milestone.year}
                </span>
                <span className="text-[#168BFF]">/</span>
                <h3 className="font-michroma text-xs sm:text-sm tracking-[0.1em] text-[#EAF7FF]">
                  {milestone.title}
                </h3>
              </div>
              <p className="font-inter mt-4 text-sm leading-relaxed text-[#8194A9]">
                {milestone.summary}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
