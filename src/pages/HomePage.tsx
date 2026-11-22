import { ArrowRight } from 'lucide-react';
import { CyberRainCanvas } from '../components/CyberRainCanvas';
import { MethodologyDiagram } from '../components/MethodologyVisuals';
import { PrivacyPanel } from '../components/PrivacyPanel';
import type {
  PerformanceSummary,
  PublicPortfolioSummary,
  SiteContent,
} from '../types/trading';
import { formatCurrency, formatPct } from '../utils/formatters';

interface HomePageProps {
  authenticated: boolean;
  siteContent: SiteContent;
  performance: PerformanceSummary | null;
  publicSummary: PublicPortfolioSummary;
  currency: string;
  onNavigate: (path: string) => void;
}

export function HomePage({
  authenticated,
  siteContent,
  performance,
  publicSummary,
  currency,
  onNavigate,
}: HomePageProps) {
  const headlineLines = siteContent.heroHeadline.split('\n');
  const winRateDisplay = `${Math.round(publicSummary.displayedWinRate)}% WIN RATE`;

  return (
    <div className="bg-[#020305]">
      {/* Hero Section: Obsidian Midnight Storm & Electric Rain */}
      <section className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden border-b border-[#168BFF]/15 bg-[#020305]">
        <img
          src="/src/assets/images/blackout_cyber_skyline_1795325911052.jpg"
          alt="Obsidian midnight financial skyline in cyber storm"
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover opacity-42"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#020305]/82 via-[#020305]/52 to-[#020305]"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(22,139,255,0.12),transparent_55%)]"
          aria-hidden="true"
        />
        <CyberRainCanvas intensity="hero" className="absolute inset-0 h-full w-full" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="min-w-0 lg:col-span-7 xl:col-span-8 space-y-6">
              <div className="flex flex-wrap items-center gap-2.5 text-[11px] sm:text-xs tracking-[0.18em] text-[#8194A9]">
                <span className="font-michroma text-[#00E5FF]">205R</span>
                <span aria-hidden="true" className="text-[#168BFF]">·</span>
                <span className="font-michroma text-[#EAF7FF]/80">
                  INDEPENDENT TRADING &amp; MARKET RESEARCH
                </span>
              </div>

              <h1 className="cyber-hero-h1 text-[#EAF7FF] text-balance">
                {headlineLines.map((line, i) => (
                  <span key={i} className="block">
                    {line}
                  </span>
                ))}
              </h1>

              <p className="font-inter max-w-2xl text-sm leading-relaxed text-[#8194A9] sm:text-base lg:text-lg">
                &ldquo;{siteContent.heroSubheadline}&rdquo;
              </p>

              {/* Instrument Identifiers */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 font-michroma text-[10px] sm:text-[11px] tracking-[0.16em] text-[#8194A9]">
                <span className="text-[#00E5FF]">XAUUSD</span>
                <span aria-hidden="true" className="text-[#168BFF]">/</span>
                <span className="text-[#EAF7FF]">NASDAQ NQ</span>
                <span aria-hidden="true" className="text-[#168BFF]">/</span>
                <span className="text-[#8194A9]">FOREX MARKETS</span>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-3">
                <button
                  type="button"
                  onClick={() => onNavigate('/performance')}
                  className="font-michroma inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#00E5FF]/80 bg-[#00E5FF]/14 px-5 sm:px-6 py-3 text-[11px] sm:text-xs tracking-[0.12em] text-[#EAF7FF] transition-all hover:bg-[#00E5FF] hover:text-[#020305] shadow-[0_0_28px_-8px_rgba(0,229,255,0.5)] whitespace-nowrap"
                >
                  EXPLORE PORTFOLIO
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/methodology')}
                  className="font-michroma inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#8194A9]/28 bg-[#05080D]/90 px-5 sm:px-6 py-3 text-[11px] sm:text-xs tracking-[0.12em] text-[#EAF7FF]/85 transition-all hover:border-[#00E5FF]/60 hover:text-[#00E5FF] whitespace-nowrap"
                >
                  TRADING METHODOLOGY
                </button>
              </div>
            </div>

            {/* Asymmetric Elevated Glass Snapshot OR Owner Privacy Gate */}
            <div className="min-w-0 lg:col-span-5 xl:col-span-4">
              {authenticated && performance ? (
                <div className="cyber-glass-signature cyber-float rounded-2xl p-5 sm:p-6">
                  <div className="cyber-hairline-top -mx-5 sm:-mx-6 -mt-5 sm:-mt-6 mb-4 opacity-80" aria-hidden="true" />
                  <div className="flex items-center justify-between gap-2 border-b border-[#8194A9]/15 pb-3">
                    <span className="font-michroma text-[11px] tracking-[0.12em] text-[#EAF7FF]">
                      205R LEDGER SNAPSHOT
                    </span>
                    <span className="font-inter text-[10px] text-[#00E5FF] whitespace-nowrap shrink-0">
                      {performance.verifiedTrades > 0 ? 'Verified Live' : 'Draft Historical'}
                    </span>
                  </div>

                  <div className="my-5 rounded-xl bg-[#020305]/80 p-2.5 border border-[#8194A9]/10">
                    <svg viewBox="0 0 320 96" className="h-24 w-full" aria-hidden="true">
                      <line x1="0" y1="22" x2="320" y2="22" stroke="#168BFF" strokeOpacity="0.18" strokeDasharray="3 3" />
                      <line x1="0" y1="68" x2="320" y2="68" stroke="#168BFF" strokeOpacity="0.18" strokeDasharray="3 3" />
                      <polyline
                        points="8,76 42,60 66,68 106,36 138,48 178,24 214,34 258,16 312,20"
                        fill="none"
                        stroke="#00E5FF"
                        strokeWidth="1.9"
                        className="neon-chart-line"
                      />
                      <circle cx="178" cy="24" r="3" fill="#00E5FF" />
                      <circle cx="258" cy="16" r="3" fill="#EAF7FF" />
                    </svg>
                  </div>

                  <dl className="grid grid-cols-2 gap-4 border-t border-[#8194A9]/15 pt-4">
                    <div>
                      <dt className="font-inter text-[11px] text-[#8194A9]">Balance</dt>
                      <dd className="neon-metric font-michroma tabular-nums mt-1 text-sm text-[#EAF7FF]">
                        {formatCurrency(performance.accountBalance, currency)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-inter text-[11px] text-[#8194A9]">Net Growth</dt>
                      <dd
                        className={`neon-metric font-michroma tabular-nums mt-1 text-sm ${
                          performance.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {formatCurrency(performance.netProfit, currency, true)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-inter text-[11px] text-[#8194A9]">Cumulative</dt>
                      <dd className="neon-metric font-michroma tabular-nums mt-1 text-sm text-[#00E5FF]">
                        +{formatPct(performance.cumulativeGrowthPct)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-inter text-[11px] text-[#8194A9]">Max Drawdown</dt>
                      <dd className="neon-metric font-michroma tabular-nums mt-1 text-sm text-[#EAF7FF]/85">
                        -{formatPct(performance.maxDrawdownPct)}
                      </dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <PrivacyPanel compact onNavigateLogin={() => onNavigate('/login')} />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Unboxed Architectural Telemetry Strip */}
      <section className="border-b border-[#168BFF]/15 bg-[#05080D]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-9 sm:px-6 md:grid-cols-4 md:gap-8 lg:px-8">
          <div className="border-l border-[#00E5FF]/35 pl-4">
            <span className="font-inter block text-xs text-[#8194A9]">Recorded Positions</span>
            <span className="neon-metric font-michroma tabular-nums mt-1.5 block text-lg sm:text-xl text-[#EAF7FF]">
              {publicSummary.totalTrades}
            </span>
          </div>
          <div className="border-l border-[#00E5FF]/35 pl-4">
            <span className="font-inter block text-xs text-[#8194A9]">
              {publicSummary.isWinRateOwnerReported ? 'Historical Record' : 'Verified Accuracy'}
            </span>
            <span className="neon-metric font-michroma tabular-nums mt-1.5 block text-base sm:text-xl text-[#00E5FF]">
              {winRateDisplay}
            </span>
          </div>
          <div className="border-l border-[#168BFF]/35 pl-4">
            <span className="font-inter block text-xs text-[#8194A9]">Average R:R</span>
            <span className="neon-metric font-michroma tabular-nums mt-1.5 block text-lg sm:text-xl text-[#EAF7FF]">
              {publicSummary.averageRR.toFixed(2)}R
            </span>
          </div>
          <div className="border-l border-[#168BFF]/35 pl-4">
            <span className="font-inter block text-xs text-[#8194A9]">Historical Cutoff</span>
            <span className="neon-metric font-michroma tabular-nums mt-1.5 block text-xs sm:text-base text-[#EAF7FF]/85">
              Jan 2025 – Nov 20, 2026
            </span>
          </div>
        </div>
      </section>

      {/* Six Pillars Showcase */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="font-michroma text-[10px] tracking-[0.2em] text-[#00E5FF]">
              UNIFIED TRADING FRAMEWORK
            </p>
            <h2 className="cyber-h2 mt-2 text-[#EAF7FF]">
              THE SIX PILLARS OF 205R
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/methodology')}
            className="font-michroma inline-flex min-h-10 items-center gap-2 text-[11px] sm:text-xs tracking-[0.12em] text-[#00E5FF] hover:text-[#EAF7FF]"
          >
            VIEW ALL METHODOLOGIES
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {siteContent.methodologies.map((pillar) => (
            <button
              key={pillar.id}
              type="button"
              onClick={() => onNavigate('/methodology')}
              className={`group text-left rounded-2xl p-5 cyber-interactive ${
                pillar.isSignature ? 'cyber-glass-signature' : 'cyber-glass'
              }`}
            >
              <MethodologyDiagram id={pillar.id} />
              <div className="mt-4 flex items-center justify-between gap-2">
                <span className="font-michroma text-xs tracking-[0.12em] text-[#00E5FF]">
                  {pillar.number} — {pillar.name}
                </span>
                {pillar.isSignature && (
                  <span className="font-michroma text-[10px] tracking-[0.12em] text-[#EAF7FF]">
                    SIGNATURE
                  </span>
                )}
              </div>
              <p className="font-inter mt-1.5 text-xs font-medium text-[#EAF7FF]/90">
                {pillar.subtitle}
              </p>
              <p className="font-inter mt-2 line-clamp-2 text-xs leading-relaxed text-[#8194A9]">
                {pillar.description}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Market Coverage & Architectural Desk Split */}
      <section className="border-t border-[#168BFF]/15 bg-[#05080D]/80">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid items-stretch gap-8 lg:grid-cols-12">
            <div className="relative min-h-72 overflow-hidden rounded-2xl border border-[#168BFF]/22 bg-[#020305] lg:col-span-5">
              <img
                src="/src/assets/images/blackout_trading_sanctum_1795325911249.jpg"
                alt="205R minimalist blackout trading sanctum overlooking midnight city"
                loading="lazy"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020305] via-[#020305]/30 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5">
                <p className="font-michroma text-xs tracking-[0.16em] text-[#00E5FF]">
                  PRIMARY MARKET COVERAGE
                </p>
                <p className="font-inter mt-1.5 text-xs leading-relaxed text-[#EAF7FF]/80">
                  Live market feeds remain offline until an authorized real-time data provider is connected.
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-between divide-y divide-[#8194A9]/15 lg:col-span-7">
              {siteContent.markets.map((market) => (
                <div
                  key={market.id}
                  className="py-5 first:pt-0 last:pb-0 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-michroma text-sm sm:text-base tracking-[0.1em] text-[#EAF7FF]">
                      {market.symbol}
                    </h3>
                    <span className="font-michroma text-[10px] tracking-[0.12em] text-[#00E5FF]">
                      {market.tier.toUpperCase()}
                    </span>
                  </div>
                  <p className="font-inter mt-2 text-xs sm:text-sm leading-relaxed text-[#8194A9]">
                    {market.summary}
                  </p>
                  <p className="mt-2 font-mono text-[11px] text-[#EAF7FF]/80">
                    {market.contractSpec}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
