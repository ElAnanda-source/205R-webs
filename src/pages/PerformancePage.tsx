import {
  DrawdownChart,
  EquityCurveChart,
  MonthlyPerformanceChart,
  TradingCalendar,
} from '../components/Charts';
import { PrivacyPanel } from '../components/PrivacyPanel';
import type {
  AccountSettings,
  PerformanceSummary,
  PublicPortfolioSummary,
  PublicTradeRecord,
  TradeTransaction,
} from '../types/trading';
import { formatCurrency, formatPct } from '../utils/formatters';

interface PerformancePageProps {
  authenticated: boolean;
  performance: PerformanceSummary | null;
  account: AccountSettings | null;
  transactions: PublicTradeRecord[];
  publicSummary: PublicPortfolioSummary;
  onNavigateLogin: () => void;
}

export function PerformancePage({
  authenticated,
  performance,
  account,
  transactions,
  publicSummary,
  onNavigateLogin,
}: PerformancePageProps) {
  if (!authenticated || !performance || !account) {
    const winRatio =
      publicSummary.totalTrades > 0
        ? (publicSummary.winningTrades / publicSummary.totalTrades) * 100
        : 0;
    const lossRatio =
      publicSummary.totalTrades > 0
        ? (publicSummary.losingTrades / publicSummary.totalTrades) * 100
        : 0;
    const beRatio =
      publicSummary.totalTrades > 0
        ? (publicSummary.breakevenTrades / publicSummary.totalTrades) * 100
        : 0;

    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16 space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#8194A9]/18 pb-6">
          <div className="min-w-0">
            <p className="font-michroma text-[10px] tracking-[0.2em] text-[#00E5FF]">
              PORTFOLIO TELEMETRY
            </p>
            <h1 className="cyber-page-h1 mt-2 text-[#EAF7FF]">
              PERFORMANCE OVERVIEW
            </h1>
            <p className="font-inter mt-2 text-xs sm:text-sm text-[#8194A9]">
              Public non-monetary execution structure · {publicSummary.tradingStart} – {publicSummary.historicalCutoff}
            </p>
          </div>

          <div className="cyber-glass rounded-xl px-4 py-2.5 text-xs text-[#EAF7FF]">
            <span className="font-michroma text-[#00E5FF] tabular-nums">
              {Math.round(publicSummary.displayedWinRate)}% WIN RATE
            </span>
            <span className="mx-2 text-[#8194A9]">·</span>
            <span className="font-michroma text-[#8194A9] tabular-nums">
              {publicSummary.verifiedTrades > 0 ? 'VERIFIED' : 'OWNER-REPORTED'}
            </span>
          </div>
        </header>

        <PrivacyPanel onNavigateLogin={onNavigateLogin} />

        {/* Non-financial Execution Metrics permitted for public visitors */}
        <section
          aria-label="Public Execution Metrics"
          className="cyber-glass grid grid-cols-2 gap-6 rounded-2xl p-5 sm:p-6 md:grid-cols-4"
        >
          <div className="border-l border-[#00E5FF]/35 pl-3.5">
            <span className="font-inter block text-xs text-[#8194A9]">Recorded Trades</span>
            <span className="neon-metric font-michroma tabular-nums mt-2 block text-lg sm:text-xl text-[#EAF7FF]">
              {publicSummary.totalTrades}
            </span>
            <span className="font-inter mt-1 block text-[10px] text-[#8194A9]">
              {publicSummary.verifiedTrades} Verified · {publicSummary.draftTrades} Draft
            </span>
          </div>

          <div className="border-l border-[#00E5FF]/50 pl-3.5">
            <span className="font-inter block text-xs text-[#8194A9]">Historical Win Rate</span>
            <span className="neon-metric font-michroma tabular-nums mt-2 block text-base sm:text-xl text-[#00E5FF]">
              {Math.round(publicSummary.displayedWinRate)}% WIN RATE
            </span>
            <span className="font-inter mt-1 block text-[10px] text-[#8194A9]">
              {publicSummary.isWinRateOwnerReported ? 'Owner-reported figure' : 'Verified live calculation'}
            </span>
          </div>

          <div className="border-l border-[#168BFF]/40 pl-3.5">
            <span className="font-inter block text-xs text-[#8194A9]">Average Risk-to-Reward</span>
            <span className="neon-metric font-michroma tabular-nums mt-2 block text-lg sm:text-xl text-[#EAF7FF]">
              {publicSummary.averageRR.toFixed(2)}R
            </span>
            <span className="font-inter mt-1 block text-[10px] text-[#8194A9]">
              Structured invalidation ratio
            </span>
          </div>

          <div className="border-l border-[#168BFF]/40 pl-3.5">
            <span className="font-inter block text-xs text-[#8194A9]">Manual Entry Window</span>
            <span className="neon-metric font-michroma tabular-nums mt-2 block text-xs sm:text-sm text-[#EAF7FF]/85">
              Nov 23 – Dec 31, 2026
            </span>
            <span className="font-inter mt-1 block text-[10px] text-[#8194A9]">
              {publicSummary.manualPeriodTrades} manual entries logged
            </span>
          </div>
        </section>

        {/* Non-monetary Outcome & Pillar Distributions */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="cyber-glass rounded-2xl p-5 sm:p-6">
            <h3 className="font-michroma text-xs sm:text-sm tracking-[0.12em] text-[#EAF7FF]">
              DATASET OUTCOME COUNTS
            </h3>
            <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-[#020305]">
              <div style={{ width: `${winRatio}%` }} className="bg-emerald-400" />
              <div style={{ width: `${beRatio}%` }} className="bg-[#8194A9]" />
              <div style={{ width: `${lossRatio}%` }} className="bg-rose-400" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
              <div>
                <span className="font-inter block text-[#8194A9]">Winning</span>
                <span className="font-michroma tabular-nums mt-1 block text-sm text-emerald-400">
                  {publicSummary.winningTrades}
                </span>
              </div>
              <div>
                <span className="font-inter block text-[#8194A9]">Breakeven</span>
                <span className="font-michroma tabular-nums mt-1 block text-sm text-[#EAF7FF]/80">
                  {publicSummary.breakevenTrades}
                </span>
              </div>
              <div>
                <span className="font-inter block text-[#8194A9]">Losing</span>
                <span className="font-michroma tabular-nums mt-1 block text-sm text-rose-400">
                  {publicSummary.losingTrades}
                </span>
              </div>
            </div>
          </div>

          <div className="cyber-glass rounded-2xl p-5 sm:p-6">
            <h3 className="font-michroma text-xs sm:text-sm tracking-[0.12em] text-[#EAF7FF]">
              METHODOLOGY COVERAGE (TRADE COUNTS)
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 text-xs">
              {publicSummary.methodologyDistribution.map((row) => (
                <div
                  key={row.name}
                  className="cyber-surface-dark rounded-xl p-3"
                >
                  <span className="font-michroma block text-[10px] sm:text-[11px] text-[#00E5FF]">
                    {row.name}
                  </span>
                  <span className="font-inter tabular-nums mt-1 block text-xs sm:text-sm text-[#EAF7FF]">
                    {row.trades} setups
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const winRatio =
    performance.totalTrades > 0
      ? (performance.winningTrades / performance.totalTrades) * 100
      : 0;
  const lossRatio =
    performance.totalTrades > 0
      ? (performance.losingTrades / performance.totalTrades) * 100
      : 0;
  const beRatio =
    performance.totalTrades > 0
      ? (performance.breakevenTrades / performance.totalTrades) * 100
      : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16 space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#8194A9]/18 pb-6">
        <div className="min-w-0">
          <p className="font-michroma text-[10px] tracking-[0.2em] text-[#00E5FF]">
            AUTHENTICATED OWNER TELEMETRY
          </p>
          <h1 className="cyber-page-h1 mt-2 text-[#EAF7FF]">
            PERFORMANCE DASHBOARD
          </h1>
          <p className="font-inter mt-2 text-xs sm:text-sm text-[#8194A9]">
            {account.accountLabel} · Historical Cutoff: Nov 20, 2026
          </p>
        </div>

        <div className="cyber-glass rounded-xl px-4 py-2.5 text-xs text-[#EAF7FF]">
          <span className="font-michroma text-[#00E5FF] tabular-nums">
            {performance.verifiedTrades} VERIFIED
          </span>
          <span className="mx-2 text-[#8194A9]">·</span>
          <span className="font-michroma text-[#8194A9] tabular-nums">
            {performance.draftTrades} DRAFT RECONSTRUCTED
          </span>
        </div>
      </header>

      {/* Transparent Record & Financial Reconciliation Notice */}
      <div
        className={`rounded-2xl border px-4 sm:px-5 py-3.5 text-xs leading-relaxed ${
          performance.isReconciled
            ? 'border-[#168BFF]/25 bg-[#05080D] text-[#EAF7FF]/85'
            : 'border-amber-400/50 bg-amber-950/25 text-amber-200'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-inter">
            <span className="font-michroma text-[11px] text-[#00E5FF]">ACCOUNTING RECONCILIATION:</span>{' '}
            Starting {formatCurrency(performance.startingBalance, account.currency)} + Deposits{' '}
            {formatCurrency(performance.deposits, account.currency)} - Withdrawals{' '}
            {formatCurrency(performance.withdrawals, account.currency)} + Realized Net P&amp;L{' '}
            {formatCurrency(performance.realizedTradingPnl, account.currency, true)} ={' '}
            <span className="font-semibold text-[#EAF7FF]">
              {formatCurrency(performance.accountBalance, account.currency)}
            </span>
          </span>
          {performance.confirmedEndingBalance !== null && (
            <span
              className={`font-michroma text-[10px] tracking-[0.1em] ${
                performance.isReconciled ? 'text-emerald-400' : 'text-amber-300'
              }`}
            >
              {performance.isReconciled
                ? `RECONCILED TO ${formatCurrency(performance.confirmedEndingBalance, account.currency)}`
                : `VARIANCE FLAGGED: ${formatCurrency(performance.reconciliationDifference, account.currency, true)}`}
            </span>
          )}
        </div>
        <p className="font-inter mt-1.5 text-[11px] text-[#8194A9]">
          Reconstructed historical entries (Jan 1, 2025 – Nov 20, 2026) are marked as Draft until verified by the owner against live broker statements.
          {!account.brokerConnected &&
            ` Broker feed offline; Equity = Account Balance (${formatCurrency(performance.accountBalance, account.currency)}) + Unrealized P&L (${formatCurrency(performance.unrealizedPnl, account.currency, true)}).`}
        </p>
      </div>

      {/* Primary KPI Strip */}
      <section
        aria-label="Account KPIs"
        className="cyber-glass-signature grid grid-cols-2 gap-5 rounded-2xl p-5 sm:p-6 md:grid-cols-4"
      >
        <div className="border-l border-[#00E5FF]/45 pl-3.5">
          <span className="font-inter block text-xs text-[#8194A9]">Current Account Balance</span>
          <span className="neon-metric font-michroma tabular-nums mt-2 block text-base sm:text-xl text-[#EAF7FF]">
            {formatCurrency(performance.accountBalance, account.currency)}
          </span>
          <span className="font-inter mt-1 block text-[10px] text-[#8194A9]">
            Start: {formatCurrency(performance.startingBalance, account.currency)}
          </span>
        </div>

        <div className="border-l border-emerald-400/50 pl-3.5">
          <span className="font-inter block text-xs text-[#8194A9]">Net Account Growth</span>
          <span
            className={`neon-metric font-michroma tabular-nums mt-2 block text-base sm:text-xl ${
              performance.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatCurrency(performance.netProfit, account.currency, true)}
          </span>
          <span className="font-inter mt-1 block text-[10px] text-[#00E5FF]">
            Cumulative: {performance.cumulativeGrowthPct >= 0 ? '+' : ''}
            {formatPct(performance.cumulativeGrowthPct)}
          </span>
        </div>

        <div className="border-l border-[#00E5FF]/55 pl-3.5">
          <span className="font-inter block text-xs text-[#8194A9]">Historical Win Rate</span>
          <span className="neon-metric font-michroma tabular-nums mt-2 block text-base sm:text-xl text-[#00E5FF]">
            {performance.isWinRateOwnerReported
              ? `${Math.round(performance.winRate)}% WIN RATE`
              : formatPct(performance.winRate)}
          </span>
          <span className="font-inter mt-1 block text-[10px] text-[#8194A9]">
            {performance.isWinRateOwnerReported
              ? `Owner-reported (Draft ratio: ${performance.actualWinRate.toFixed(1)}%)`
              : 'Computed from verified records'}
          </span>
        </div>

        <div className="border-l border-rose-400/50 pl-3.5">
          <span className="font-inter block text-xs text-[#8194A9]">Maximum Drawdown</span>
          <span className="neon-metric font-michroma tabular-nums mt-2 block text-base sm:text-xl text-rose-400">
            -{formatPct(performance.maxDrawdownPct)}
          </span>
          <span className="font-inter mt-1 block text-[10px] text-[#8194A9]">
            {formatCurrency(performance.maxDrawdownAbs, account.currency)} · RF {performance.recoveryFactor.toFixed(2)}
          </span>
        </div>
      </section>

      {/* Secondary Metrics */}
      <section aria-label="Execution Metrics" className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
        <div className="cyber-surface-dark rounded-xl p-4">
          <span className="font-inter block text-[11px] text-[#8194A9]">Total Trades</span>
          <span className="neon-metric font-michroma tabular-nums mt-1.5 block text-sm sm:text-base text-[#EAF7FF]">
            {performance.totalTrades}
          </span>
        </div>
        <div className="cyber-surface-dark rounded-xl p-4">
          <span className="font-inter block text-[11px] text-[#8194A9]">Equity</span>
          <span className="neon-metric font-michroma tabular-nums mt-1.5 block text-sm sm:text-base text-[#00E5FF]">
            {formatCurrency(performance.equity, account.currency)}
          </span>
        </div>
        <div className="cyber-surface-dark rounded-xl p-4">
          <span className="font-inter block text-[11px] text-[#8194A9]">Profit Factor</span>
          <span className="neon-metric font-michroma tabular-nums mt-1.5 block text-sm sm:text-base text-[#EAF7FF]">
            {performance.profitFactor.toFixed(2)}
          </span>
        </div>
        <div className="cyber-surface-dark rounded-xl p-4">
          <span className="font-inter block text-[11px] text-[#8194A9]">Average R:R</span>
          <span className="neon-metric font-michroma tabular-nums mt-1.5 block text-sm sm:text-base text-[#00E5FF]">
            {performance.averageRR.toFixed(2)}R
          </span>
        </div>
        <div className="cyber-surface-dark rounded-xl p-4">
          <span className="font-inter block text-[11px] text-[#8194A9]">Gross Profit</span>
          <span className="neon-metric font-michroma tabular-nums mt-1.5 block text-sm sm:text-base text-emerald-400">
            {formatCurrency(performance.grossProfit, account.currency)}
          </span>
        </div>
        <div className="cyber-surface-dark rounded-xl p-4">
          <span className="font-inter block text-[11px] text-[#8194A9]">Gross Loss</span>
          <span className="neon-metric font-michroma tabular-nums mt-1.5 block text-sm sm:text-base text-rose-400">
            -{formatCurrency(performance.grossLoss, account.currency)}
          </span>
        </div>
      </section>

      <EquityCurveChart
        points={performance.equityCurve}
        transactions={transactions as TradeTransaction[]}
        startingBalance={account.startingBalance}
        deposits={account.deposits}
        withdrawals={account.withdrawals}
        currency={account.currency}
      />

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-7">
          <MonthlyPerformanceChart series={performance.monthlySeries} currency={account.currency} />
        </div>
        <div className="min-w-0 flex flex-col justify-between gap-6 lg:col-span-5">
          <div className="cyber-glass rounded-2xl p-5 sm:p-6">
            <h3 className="font-michroma text-xs sm:text-sm tracking-[0.12em] text-[#EAF7FF]">
              OUTCOME DISTRIBUTION
            </h3>
            <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-[#020305]">
              <div
                style={{ width: `${winRatio}%` }}
                className="bg-emerald-400"
                title={`Wins: ${performance.winningTrades}`}
              />
              <div
                style={{ width: `${beRatio}%` }}
                className="bg-[#8194A9]"
                title={`Breakeven: ${performance.breakevenTrades}`}
              />
              <div
                style={{ width: `${lossRatio}%` }}
                className="bg-rose-400"
                title={`Losses: ${performance.losingTrades}`}
              />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3 text-xs">
              <div>
                <span className="font-inter block text-[#8194A9]">Winning</span>
                <span className="font-michroma tabular-nums mt-1 block text-xs sm:text-sm text-emerald-400">
                  {performance.winningTrades} ({winRatio.toFixed(1)}%)
                </span>
              </div>
              <div>
                <span className="font-inter block text-[#8194A9]">Breakeven</span>
                <span className="font-michroma tabular-nums mt-1 block text-xs sm:text-sm text-[#EAF7FF]/80">
                  {performance.breakevenTrades} ({beRatio.toFixed(1)}%)
                </span>
              </div>
              <div>
                <span className="font-inter block text-[#8194A9]">Losing</span>
                <span className="font-michroma tabular-nums mt-1 block text-xs sm:text-sm text-rose-400">
                  {performance.losingTrades} ({lossRatio.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          <div className="cyber-glass rounded-2xl p-5 sm:p-6">
            <h3 className="font-michroma text-xs sm:text-sm tracking-[0.12em] text-[#EAF7FF]">
              ANNUAL PERFORMANCE
            </h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#8194A9]/18 text-[#8194A9]">
                    <th className="py-2 font-medium">Year</th>
                    <th className="py-2 text-right font-medium">Trades</th>
                    <th className="py-2 text-right font-medium">W / L</th>
                    <th className="py-2 text-right font-medium">Net P&amp;L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8194A9]/12">
                  {performance.annualSeries.map((yr) => (
                    <tr key={yr.key}>
                      <td className="font-michroma tabular-nums py-2.5 text-[#EAF7FF]">
                        {yr.label}
                      </td>
                      <td className="font-mono tabular-nums py-2.5 text-right text-[#EAF7FF]/80">
                        {yr.trades}
                      </td>
                      <td className="font-mono tabular-nums py-2.5 text-right text-[#8194A9]">
                        {yr.wins} / {yr.losses}
                      </td>
                      <td
                        className={`font-mono tabular-nums py-2.5 text-right font-medium ${
                          yr.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {formatCurrency(yr.netPnl, account.currency, true)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <DrawdownChart points={performance.equityCurve} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="cyber-glass rounded-2xl p-5 sm:p-6 min-w-0">
          <h3 className="font-michroma text-xs sm:text-sm tracking-[0.12em] text-[#EAF7FF]">
            INSTRUMENT PERFORMANCE
          </h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#8194A9]/18 text-[#8194A9]">
                  <th className="py-2 pr-2 font-medium">Market</th>
                  <th className="py-2 px-2 text-right font-medium">Trades</th>
                  <th className="py-2 px-2 text-right font-medium">Win Rate</th>
                  <th className="py-2 px-2 text-right font-medium">PF</th>
                  <th className="py-2 pl-2 text-right font-medium">Net P&amp;L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#8194A9]/12">
                {performance.instrumentPerformance.map((row) => (
                  <tr key={row.name}>
                    <td className="font-michroma py-2.5 pr-2 text-[11px] text-[#EAF7FF]">{row.name}</td>
                    <td className="font-mono tabular-nums py-2.5 px-2 text-right text-[#EAF7FF]/80">
                      {row.trades}
                    </td>
                    <td className="font-mono tabular-nums py-2.5 px-2 text-right text-[#00E5FF]">
                      {row.winRate.toFixed(1)}%
                    </td>
                    <td className="font-mono tabular-nums py-2.5 px-2 text-right text-[#EAF7FF]/80">
                      {row.profitFactor.toFixed(2)}
                    </td>
                    <td
                      className={`font-mono tabular-nums py-2.5 pl-2 text-right font-medium ${
                        row.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {formatCurrency(row.netPnl, account.currency, true)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="cyber-glass rounded-2xl p-5 sm:p-6 min-w-0">
          <h3 className="font-michroma text-xs sm:text-sm tracking-[0.12em] text-[#EAF7FF]">
            METHODOLOGY PERFORMANCE
          </h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#8194A9]/18 text-[#8194A9]">
                  <th className="py-2 pr-2 font-medium">Pillar</th>
                  <th className="py-2 px-2 text-right font-medium">Trades</th>
                  <th className="py-2 px-2 text-right font-medium">Win Rate</th>
                  <th className="py-2 px-2 text-right font-medium">PF</th>
                  <th className="py-2 pl-2 text-right font-medium">Net P&amp;L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#8194A9]/12">
                {performance.methodologyPerformance.map((row) => (
                  <tr key={row.name}>
                    <td className="font-michroma py-2.5 pr-2 text-[11px] text-[#EAF7FF]">{row.name}</td>
                    <td className="font-mono tabular-nums py-2.5 px-2 text-right text-[#EAF7FF]/80">
                      {row.trades}
                    </td>
                    <td className="font-mono tabular-nums py-2.5 px-2 text-right text-[#00E5FF]">
                      {row.winRate.toFixed(1)}%
                    </td>
                    <td className="font-mono tabular-nums py-2.5 px-2 text-right text-[#EAF7FF]/80">
                      {row.profitFactor.toFixed(2)}
                    </td>
                    <td
                      className={`font-mono tabular-nums py-2.5 pl-2 text-right font-medium ${
                        row.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {formatCurrency(row.netPnl, account.currency, true)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <TradingCalendar calendarDays={performance.calendarDays} currency={account.currency} />
    </div>
  );
}
