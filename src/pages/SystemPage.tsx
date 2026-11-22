import { MultiTimeframeEngineDiagram } from '../components/MethodologyVisuals';
import type { RiskParameters, SiteContent } from '../types/trading';

interface SystemPageProps {
  siteContent: SiteContent;
  riskParameters: RiskParameters;
}

export function SystemPage({ siteContent, riskParameters }: SystemPageProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16 space-y-16">
      <header className="max-w-3xl border-b border-[#8194A9]/18 pb-8">
        <p className="font-michroma text-[10px] tracking-[0.2em] text-[#00E5FF]">
          ANALYTICAL &amp; RISK INFRASTRUCTURE
        </p>
        <h1 className="cyber-page-h1 mt-3 text-[#EAF7FF]">
          TRADING SYSTEM &amp; RISK FRAMEWORK
        </h1>
        <p className="font-inter mt-4 text-sm sm:text-base leading-relaxed text-[#8194A9]">
          Every execution inside 205R passes through the Multi Time Frame Engine V2.0 analytical workflow and hard capital-preservation parameters prior to market commitment.
        </p>
      </header>

      {/* Engine Architecture */}
      <MultiTimeframeEngineDiagram />

      {/* Risk Management Section */}
      <section aria-labelledby="risk-heading" className="space-y-8">
        <div>
          <p className="font-michroma text-[10px] tracking-[0.2em] text-[#00E5FF]">
            CAPITAL PRESERVATION
          </p>
          <h2 id="risk-heading" className="cyber-h2 mt-2 text-[#EAF7FF]">
            RISK MANAGEMENT PARAMETERS
          </h2>
        </div>

        {/* Unboxed obsidian risk telemetry strip */}
        <div className="cyber-glass grid grid-cols-2 gap-6 rounded-2xl p-5 sm:p-6 md:grid-cols-5">
          <div className="border-l border-[#00E5FF]/40 pl-3.5">
            <span className="font-inter block text-xs text-[#8194A9]">Daily Loss Limit</span>
            <span className="neon-metric font-michroma tabular-nums mt-1.5 block text-lg sm:text-xl text-[#00E5FF]">
              -{riskParameters.dailyLossLimitPct.toFixed(2)}%
            </span>
          </div>
          <div className="border-l border-[#168BFF]/40 pl-3.5">
            <span className="font-inter block text-xs text-[#8194A9]">Max Risk / Trade</span>
            <span className="neon-metric font-michroma tabular-nums mt-1.5 block text-lg sm:text-xl text-[#EAF7FF]">
              {riskParameters.maxRiskPerTradePct.toFixed(2)}%
            </span>
          </div>
          <div className="border-l border-rose-500/45 pl-3.5">
            <span className="font-inter block text-xs text-[#8194A9]">Max Drawdown Cap</span>
            <span className="neon-metric font-michroma tabular-nums mt-1.5 block text-lg sm:text-xl text-rose-400">
              -{riskParameters.maxDrawdownLimitPct.toFixed(2)}%
            </span>
          </div>
          <div className="border-l border-[#00E5FF]/40 pl-3.5">
            <span className="font-inter block text-xs text-[#8194A9]">Minimum Target R:R</span>
            <span className="neon-metric font-michroma tabular-nums mt-1.5 block text-lg sm:text-xl text-[#00E5FF]">
              1 : {riskParameters.minRrRatio.toFixed(1)}
            </span>
          </div>
          <div className="col-span-2 border-l border-[#168BFF]/40 pl-3.5 md:col-span-1">
            <span className="font-inter block text-xs text-[#8194A9]">Concurrent Trades</span>
            <span className="neon-metric font-michroma tabular-nums mt-1.5 block text-lg sm:text-xl text-[#EAF7FF]">
              {riskParameters.maxConcurrentTrades} Max
            </span>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <div className="cyber-surface-dark rounded-2xl p-5 sm:p-6">
            <h3 className="font-michroma text-xs tracking-[0.12em] text-[#00E5FF]">
              POSITION SIZING
            </h3>
            <p className="font-inter mt-2.5 text-sm leading-relaxed text-[#8194A9]">
              {riskParameters.positionSizingModel}
            </p>
          </div>
          <div className="cyber-surface-dark rounded-2xl p-5 sm:p-6">
            <h3 className="font-michroma text-xs tracking-[0.12em] text-[#00E5FF]">
              STOP LOSS MANAGEMENT
            </h3>
            <p className="font-inter mt-2.5 text-sm leading-relaxed text-[#8194A9]">
              {riskParameters.stopLossManagementRule}
            </p>
          </div>
          <div className="cyber-surface-dark rounded-2xl p-5 sm:p-6">
            <h3 className="font-michroma text-xs tracking-[0.12em] text-[#00E5FF]">
              TAKE PROFIT MANAGEMENT
            </h3>
            <p className="font-inter mt-2.5 text-sm leading-relaxed text-[#8194A9]">
              {riskParameters.takeProfitManagementRule}
            </p>
          </div>
          <div className="cyber-surface-dark rounded-2xl p-5 sm:p-6">
            <h3 className="font-michroma text-xs tracking-[0.12em] text-[#00E5FF]">
              CAPITAL PRESERVATION
            </h3>
            <p className="font-inter mt-2.5 text-sm leading-relaxed text-[#8194A9]">
              {riskParameters.capitalPreservationRule}
            </p>
          </div>
          <div className="cyber-glass rounded-2xl p-5 sm:p-6 lg:col-span-2">
            <h3 className="font-michroma text-xs tracking-[0.12em] text-[#00E5FF]">
              TRADE MANAGEMENT &amp; RISK-TO-REWARD PROTOCOL
            </h3>
            <p className="font-inter mt-2.5 text-sm leading-relaxed text-[#EAF7FF]/85">
              {riskParameters.tradeManagementRule}
            </p>
          </div>
        </div>
      </section>

      {/* Market Coverage Section */}
      <section aria-labelledby="market-coverage-heading" className="space-y-6">
        <div>
          <p className="font-michroma text-[10px] tracking-[0.2em] text-[#00E5FF]">
            INSTRUMENT UNIVERSE
          </p>
          <h2 id="market-coverage-heading" className="cyber-h2 mt-2 text-[#EAF7FF]">
            MARKET COVERAGE
          </h2>
          <p className="font-inter mt-2 text-xs text-[#8194A9]">
            Contract specifications and structural focus areas. Live quotes are intentionally omitted when no external real-time market feed is connected.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {siteContent.markets.map((market) => (
            <article
              key={market.id}
              className="cyber-glass cyber-interactive flex flex-col justify-between rounded-2xl p-6"
            >
              <div>
                <p className="font-michroma text-[10px] tracking-[0.14em] text-[#00E5FF]">
                  {market.tier.toUpperCase()}
                </p>
                <h3 className="font-michroma mt-2 text-lg tracking-[0.08em] text-[#EAF7FF]">
                  {market.symbol}
                </h3>
                <p className="font-inter mt-1 text-xs font-medium text-[#EAF7FF]/85">{market.title}</p>
                <p className="font-inter mt-3 text-sm leading-relaxed text-[#8194A9]">{market.summary}</p>
                <ul className="mt-4 space-y-1.5 border-t border-[#8194A9]/15 pt-4 font-inter text-xs text-[#EAF7FF]/80">
                  {market.focusPoints.map((pt) => (
                    <li key={pt}>· {pt}</li>
                  ))}
                </ul>
              </div>
              <p className="mt-5 border-t border-[#8194A9]/15 pt-3 font-mono text-[11px] text-[#00E5FF]">
                {market.contractSpec}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
