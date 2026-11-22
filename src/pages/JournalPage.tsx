import { useMemo, useState } from 'react';
import { ArrowUpDown, Eye, Lock, Search } from 'lucide-react';
import { TradeDetailModal } from '../components/TradeDetailModal';
import type { PublicTradeRecord } from '../types/trading';
import { formatCurrency, formatPrice, formatRR } from '../utils/formatters';
import { formatInstrumentGroup } from '../utils/tradingEngine';

interface JournalPageProps {
  authenticated: boolean;
  transactions: PublicTradeRecord[];
  currency: string;
  onNavigateLogin: () => void;
}

type SortKey = 'date' | 'netPnl' | 'rr';

export function JournalPage({
  authenticated,
  transactions,
  currency,
  onNavigateLogin,
}: JournalPageProps) {
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [monthFilter, setMonthFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [instrumentFilter, setInstrumentFilter] = useState('ALL');
  const [methodologyFilter, setMethodologyFilter] = useState('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState<'ALL' | 'WIN' | 'LOSS' | 'BREAKEVEN'>('ALL');
  const [sortBy, setSortBy] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [selectedTrade, setSelectedTrade] = useState<PublicTradeRecord | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = transactions.filter((t) => {
      if (yearFilter !== 'ALL' && !t.tradeDate.startsWith(yearFilter)) return false;
      if (monthFilter !== 'ALL' && t.tradeDate.slice(5, 7) !== monthFilter) return false;
      if (dateFilter && t.tradeDate !== dateFilter) return false;
      if (instrumentFilter !== 'ALL') {
        const group = formatInstrumentGroup(t.instrument);
        if (instrumentFilter === 'Forex') {
          if (group !== 'Forex') return false;
        } else if (t.instrument !== instrumentFilter) {
          return false;
        }
      }
      if (methodologyFilter !== 'ALL' && t.methodology !== methodologyFilter) return false;
      if (outcomeFilter !== 'ALL' && t.outcome !== outcomeFilter) return false;

      if (q) {
        const hay = `${t.tradeId} ${t.instrument} ${t.methodology} ${t.session} ${t.notes}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') {
        cmp = `${a.tradeDate} ${a.tradeTime}`.localeCompare(`${b.tradeDate} ${b.tradeTime}`);
        if (cmp === 0) cmp = a.id - b.id;
      } else if (sortBy === 'netPnl' && authenticated) {
        cmp = (a.netPnl ?? 0) - (b.netPnl ?? 0);
      } else {
        cmp = a.riskRewardRatio - b.riskRewardRatio;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return list;
  }, [
    transactions,
    search,
    yearFilter,
    monthFilter,
    dateFilter,
    instrumentFilter,
    methodologyFilter,
    outcomeFilter,
    sortBy,
    sortDir,
    authenticated,
  ]);

  const manualPeriodCount = useMemo(
    () =>
      transactions.filter(
        (t) => t.tradeDate >= '2026-11-23' && t.tradeDate <= '2026-12-31'
      ).length,
    [transactions]
  );

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(key);
      setSortDir('desc');
    }
  };

  const selectClass =
    'h-10 w-full min-w-0 rounded-lg border border-[#8194A9]/22 bg-[#020305] px-3 text-xs text-[#EAF7FF] focus:border-[#00E5FF] focus:outline-none';

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#8194A9]/18 pb-6">
        <div className="min-w-0">
          <p className="font-michroma text-[10px] tracking-[0.2em] text-[#00E5FF]">
            HISTORICAL EXECUTION LEDGER
          </p>
          <h1 className="cyber-page-h1 mt-2 text-[#EAF7FF]">
            TRADING JOURNAL
          </h1>
          <p className="font-inter mt-2 text-xs sm:text-sm text-[#8194A9]">
            Historical dataset: Jan 1, 2025 – Nov 20, 2026 · Manual entry period (Nov 23 – Dec 31, 2026): {manualPeriodCount} trades.
          </p>
        </div>

        <div className="font-michroma tabular-nums text-[11px] sm:text-xs text-[#8194A9]">
          SHOWING {filtered.length} OF {transactions.length} RECORDS
        </div>
      </header>

      {!authenticated && (
        <div className="cyber-glass flex flex-col gap-3 rounded-xl px-4 py-3.5 text-xs text-[#EAF7FF]/85 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start sm:items-center gap-2.5 min-w-0">
            <Lock className="mt-0.5 sm:mt-0 h-4 w-4 shrink-0 text-[#00E5FF]" aria-hidden="true" />
            <span className="font-inter">
              <span className="font-michroma text-[11px] text-[#00E5FF]">OWNER FINANCIAL PRIVACY ACTIVE:</span>{' '}
              Dollar P&amp;L, lot sizing, commissions, and swaps are withheld server-side until owner PIN sign-in.
            </span>
          </div>
          <button
            type="button"
            onClick={onNavigateLogin}
            className="font-michroma self-start sm:self-auto min-h-10 rounded-lg border border-[#00E5FF]/75 bg-[#00E5FF]/12 px-3.5 py-2 text-[10px] tracking-[0.1em] text-[#EAF7FF] hover:bg-[#00E5FF] hover:text-[#020305] whitespace-nowrap shrink-0"
          >
            UNLOCK FINANCIALS
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <section
        aria-label="Journal Filters"
        className="cyber-glass rounded-2xl p-4 sm:p-5 space-y-4"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="relative lg:col-span-2">
            <label htmlFor="journal-search" className="sr-only">
              Search transactions
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8194A9]"
              aria-hidden="true"
            />
            <input
              id="journal-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, instrument, notes..."
              className="h-10 w-full rounded-lg border border-[#8194A9]/22 bg-[#020305] pl-9 pr-3 text-xs text-[#EAF7FF] placeholder-[#8194A9] focus:border-[#00E5FF] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="filter-year" className="sr-only">
              Filter by year
            </label>
            <select
              id="filter-year"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className={selectClass}
            >
              <option value="ALL">All Years</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-month" className="sr-only">
              Filter by month
            </label>
            <select
              id="filter-month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className={selectClass}
            >
              <option value="ALL">All Months</option>
              {[
                ['01', 'January'],
                ['02', 'February'],
                ['03', 'March'],
                ['04', 'April'],
                ['05', 'May'],
                ['06', 'June'],
                ['07', 'July'],
                ['08', 'August'],
                ['09', 'September'],
                ['10', 'October'],
                ['11', 'November'],
                ['12', 'December'],
              ].map(([m, label]) => (
                <option key={m} value={m}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-instrument" className="sr-only">
              Filter by instrument
            </label>
            <select
              id="filter-instrument"
              value={instrumentFilter}
              onChange={(e) => setInstrumentFilter(e.target.value)}
              className={selectClass}
            >
              <option value="ALL">All Instruments</option>
              <option value="XAUUSD">XAUUSD</option>
              <option value="NQ Futures">NQ Futures</option>
              <option value="Forex">Forex Pairs</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-methodology" className="sr-only">
              Filter by methodology
            </label>
            <select
              id="filter-methodology"
              value={methodologyFilter}
              onChange={(e) => setMethodologyFilter(e.target.value)}
              className={selectClass}
            >
              <option value="ALL">All Methodologies</option>
              <option value="SNR">SNR</option>
              <option value="SND">SND</option>
              <option value="Price Action">Price Action</option>
              <option value="ICT">ICT</option>
              <option value="SMC">SMC</option>
              <option value="ALCHEMIST">ALCHEMIST</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#8194A9]/15 pt-3">
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[#8194A9]/20 bg-[#020305] p-1">
            {(['ALL', 'WIN', 'LOSS', 'BREAKEVEN'] as const).map((out) => (
              <button
                key={out}
                type="button"
                onClick={() => setOutcomeFilter(out)}
                className={`font-michroma rounded px-2.5 sm:px-3 py-1.5 text-[10px] tracking-[0.1em] transition-colors whitespace-nowrap shrink-0 ${
                  outcomeFilter === out
                    ? 'bg-[#0D1723] text-[#00E5FF] border border-[#00E5FF]/35'
                    : 'text-[#8194A9] hover:text-[#EAF7FF]'
                }`}
              >
                {out}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="filter-date" className="font-inter text-xs text-[#8194A9]">
                Exact Date:
              </label>
              <input
                id="filter-date"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-9 rounded-lg border border-[#8194A9]/22 bg-[#020305] px-2.5 text-xs text-[#EAF7FF] focus:border-[#00E5FF] focus:outline-none"
              />
            </div>

            {(search ||
              yearFilter !== 'ALL' ||
              monthFilter !== 'ALL' ||
              dateFilter ||
              instrumentFilter !== 'ALL' ||
              methodologyFilter !== 'ALL' ||
              outcomeFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setYearFilter('ALL');
                  setMonthFilter('ALL');
                  setDateFilter('');
                  setInstrumentFilter('ALL');
                  setMethodologyFilter('ALL');
                  setOutcomeFilter('ALL');
                }}
                className="font-michroma text-[10px] tracking-[0.1em] text-[#00E5FF] hover:underline"
              >
                CLEAR FILTERS
              </button>
            )}
          </div>
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="cyber-glass rounded-2xl p-12 text-center">
          <p className="font-michroma text-sm text-[#EAF7FF]">
            NO TRANSACTIONS MATCH CURRENT FILTERS
          </p>
          <p className="font-inter mt-2 text-xs text-[#8194A9]">
            {dateFilter >= '2026-11-23'
              ? 'November 23 – December 31, 2026 is the Manual Entry Period and contains zero automatically generated trades.'
              : 'Adjust your filters or date range to inspect historical records.'}
          </p>
        </div>
      ) : (
        <>
          <div className="cyber-glass hidden overflow-x-auto rounded-2xl lg:block">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#8194A9]/18 bg-[#020305]/90 text-[#8194A9]">
                  <th className="px-2.5 py-3.5 font-medium">
                    <button
                      type="button"
                      onClick={() => toggleSort('date')}
                      className="inline-flex items-center gap-1 hover:text-[#EAF7FF]"
                    >
                      Date / Time
                      <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </th>
                  <th className="px-2.5 py-3.5 font-medium">Trade ID</th>
                  <th className="px-2.5 py-3.5 font-medium">Instrument</th>
                  <th className="px-2.5 py-3.5 font-medium">Side</th>
                  <th className="px-2.5 py-3.5 font-medium">Methodology</th>
                  <th className="px-2.5 py-3.5 text-right font-medium">Size</th>
                  <th className="px-2.5 py-3.5 text-right font-medium">Entry / Exit</th>
                  <th className="px-2.5 py-3.5 text-right font-medium">
                    <button
                      type="button"
                      onClick={() => toggleSort('rr')}
                      className="inline-flex items-center gap-1 hover:text-[#EAF7FF]"
                    >
                      R:R
                      <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </th>
                  <th className="px-2.5 py-3.5 text-right font-medium">
                    {authenticated ? (
                      <button
                        type="button"
                        onClick={() => toggleSort('netPnl')}
                        className="inline-flex items-center gap-1 hover:text-[#EAF7FF]"
                      >
                        Net P&amp;L
                        <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                      </button>
                    ) : (
                      <span>Net P&amp;L</span>
                    )}
                  </th>
                  <th className="px-2.5 py-3.5 font-medium">Status</th>
                  <th className="px-2.5 py-3.5 text-right font-medium">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#8194A9]/12 font-inter">
                {filtered.map((t) => {
                  const redacted = t.financialsRedacted || t.netPnl === null;
                  return (
                    <tr
                      key={t.id}
                      className="transition-colors hover:bg-[#0D1723]/65"
                    >
                      <td className="font-mono tabular-nums whitespace-nowrap px-2.5 py-3 text-[#EAF7FF]/85">
                        <div>{t.tradeDate}</div>
                        <div className="text-[10px] text-[#8194A9]">
                          {t.tradeTime} · {t.session}
                        </div>
                      </td>
                      <td className="font-mono whitespace-nowrap px-2.5 py-3 text-[#EAF7FF]">{t.tradeId}</td>
                      <td className="font-michroma px-2.5 py-3 text-[11px] text-[#EAF7FF]">
                        {t.instrument}
                      </td>
                      <td className="px-2.5 py-3">
                        <span
                          className={`font-michroma text-[10px] ${
                            t.direction === 'BUY' ? 'text-[#00E5FF]' : 'text-[#EAF7FF]/80'
                          }`}
                        >
                          {t.direction}
                        </span>
                      </td>
                      <td className="px-2.5 py-3 text-[#EAF7FF]/85">{t.methodology}</td>
                      <td className="font-mono tabular-nums px-2.5 py-3 text-right text-[#EAF7FF]/80">
                        {t.lotSize !== null ? t.lotSize.toFixed(2) : 'Private'}
                      </td>
                      <td className="font-mono tabular-nums px-2.5 py-3 text-right text-[#8194A9]">
                        <div>{formatPrice(t.entryPrice, t.instrument)}</div>
                        <div className="text-[#EAF7FF]/85">{formatPrice(t.exitPrice, t.instrument)}</div>
                      </td>
                      <td className="font-mono tabular-nums px-2.5 py-3 text-right text-[#00E5FF] neon-metric">
                        {formatRR(t.riskRewardRatio)}
                      </td>
                      <td
                        className={`font-mono tabular-nums px-2.5 py-3 text-right neon-metric ${
                          redacted
                            ? 'text-[#8194A9]'
                            : (t.netPnl ?? 0) > 0
                              ? 'text-emerald-400'
                              : (t.netPnl ?? 0) < 0
                                ? 'text-rose-400'
                                : 'text-[#EAF7FF]/80'
                        }`}
                      >
                        {redacted ? 'Private' : formatCurrency(t.netPnl ?? 0, currency, true)}
                      </td>
                      <td className="px-2.5 py-3 text-[11px]">
                        <span className={t.isVerified ? 'text-[#00E5FF]' : 'text-[#8194A9]'}>
                          {t.outcome} · {t.isVerified ? 'Verified' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-2.5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedTrade(t)}
                          aria-label={`Inspect trade ${t.tradeId}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#8194A9]/22 bg-[#020305] text-[#EAF7FF] hover:border-[#00E5FF] hover:text-[#00E5FF]"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="space-y-3 lg:hidden">
            {filtered.map((t) => {
              const redacted = t.financialsRedacted || t.netPnl === null;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTrade(t)}
                  className="cyber-glass cyber-interactive w-full rounded-2xl p-4 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="font-michroma text-xs text-[#EAF7FF]">
                        {t.instrument} · {t.direction}
                      </span>
                      <p className="mt-1 font-mono text-[11px] text-[#8194A9] truncate">
                        {t.tradeDate} · {t.tradeTime} · {t.methodology}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`font-michroma tabular-nums text-sm ${
                          redacted
                            ? 'text-[#8194A9]'
                            : (t.netPnl ?? 0) > 0
                              ? 'text-emerald-400'
                              : (t.netPnl ?? 0) < 0
                                ? 'text-rose-400'
                                : 'text-[#EAF7FF]/80'
                        }`}
                      >
                        {redacted ? 'Private' : formatCurrency(t.netPnl ?? 0, currency, true)}
                      </span>
                      <p className="mt-0.5 font-mono text-[11px] text-[#00E5FF]">
                        {formatRR(t.riskRewardRatio)} · {t.outcome}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-[#8194A9]/15 pt-2.5 text-[11px] text-[#8194A9]">
                    <span>{t.tradeId}</span>
                    <span>{t.isVerified ? 'Verified Live' : 'Draft Historical'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      <TradeDetailModal
        trade={selectedTrade}
        currency={currency}
        onClose={() => setSelectedTrade(null)}
      />
    </div>
  );
}
