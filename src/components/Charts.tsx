import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type {
  CalendarDaySummary,
  EquityPoint,
  PeriodPnlBucket,
  TradeTransaction,
} from '../types/trading';
import { formatCurrency, formatPct } from '../utils/formatters';
import { formatInstrumentGroup, roundCurrency, roundRatio, sortTradesChronologically } from '../utils/tradingEngine';

interface EquityCurveChartProps {
  points: EquityPoint[];
  transactions?: TradeTransaction[];
  startingBalance?: number;
  deposits?: number;
  withdrawals?: number;
  currency: string;
}

const MONTH_OPTIONS = [
  ['ALL', 'All Months'],
  ['01', 'Jan'],
  ['02', 'Feb'],
  ['03', 'Mar'],
  ['04', 'Apr'],
  ['05', 'May'],
  ['06', 'Jun'],
  ['07', 'Jul'],
  ['08', 'Aug'],
  ['09', 'Sep'],
  ['10', 'Oct'],
  ['11', 'Nov'],
  ['12', 'Dec'],
] as const;

export function EquityCurveChart({
  points,
  transactions = [],
  startingBalance = 1500,
  deposits = 0,
  withdrawals = 0,
  currency,
}: EquityCurveChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [yearFilter, setYearFilter] = useState<'ALL' | '2025' | '2026'>('ALL');
  const [monthFilter, setMonthFilter] = useState<string>('ALL');
  const [instrumentFilter, setInstrumentFilter] = useState<string>('ALL');
  const [methodologyFilter, setMethodologyFilter] = useState<string>('ALL');

  const isSubsetByCategory = instrumentFilter !== 'ALL' || methodologyFilter !== 'ALL';
  const hasAnyFilter =
    yearFilter !== 'ALL' ||
    monthFilter !== 'ALL' ||
    instrumentFilter !== 'ALL' ||
    methodologyFilter !== 'ALL';

  const { filtered, filteredNetPnl, filteredCount } = useMemo(() => {
    if (!hasAnyFilter || transactions.length === 0) {
      return {
        filtered: points,
        filteredNetPnl:
          points.length > 1
            ? roundCurrency(points[points.length - 1].balance - points[0].balance)
            : 0,
        filteredCount: Math.max(0, points.length - 1),
      };
    }

    const ordered = sortTradesChronologically(transactions);
    const baseCapital = roundCurrency(startingBalance + deposits - withdrawals);

    const matchesTime = (t: TradeTransaction) => {
      if (yearFilter !== 'ALL' && !t.tradeDate.startsWith(yearFilter)) return false;
      if (monthFilter !== 'ALL' && t.tradeDate.slice(5, 7) !== monthFilter) return false;
      return true;
    };

    const matchesCategory = (t: TradeTransaction) => {
      if (instrumentFilter !== 'ALL') {
        const group = formatInstrumentGroup(t.instrument);
        if (instrumentFilter === 'Forex') {
          if (group !== 'Forex') return false;
        } else if (t.instrument !== instrumentFilter) {
          return false;
        }
      }
      if (methodologyFilter !== 'ALL' && t.methodology !== methodologyFilter) return false;
      return true;
    };

    let anchorBalance = baseCapital;
    if (!isSubsetByCategory) {
      for (const t of ordered) {
        if (matchesTime(t)) break;
        anchorBalance = roundCurrency(anchorBalance + t.netPnl);
      }
    } else {
      anchorBalance = 0;
    }

    const matchingTrades = ordered.filter((t) => matchesTime(t) && matchesCategory(t));
    let running = anchorBalance;
    let peak = anchorBalance;
    let subNet = 0;

    const result: EquityPoint[] = [
      {
        date: matchingTrades.length > 0 ? matchingTrades[0].tradeDate : '2025-01-01',
        label: isSubsetByCategory ? 'Filter Baseline' : 'Period Opening Balance',
        tradeId: null,
        balance: running,
        equity: running,
        drawdownAbs: 0,
        drawdownPct: 0,
        tradeNetPnl: 0,
        instrument: null,
        methodology: null,
      },
    ];

    for (const t of matchingTrades) {
      running = roundCurrency(running + t.netPnl);
      subNet = roundCurrency(subNet + t.netPnl);
      if (running > peak) peak = running;
      const ddAbs = roundCurrency(Math.max(0, peak - running));
      const ddPct = peak > 0 ? roundRatio((ddAbs / peak) * 100) : 0;

      result.push({
        date: t.tradeDate,
        label: `${t.tradeDate} · ${t.instrument}`,
        tradeId: t.tradeId,
        balance: running,
        equity: running,
        drawdownAbs: ddAbs,
        drawdownPct: ddPct,
        tradeNetPnl: t.netPnl,
        instrument: t.instrument,
        methodology: t.methodology,
      });
    }

    return {
      filtered: result,
      filteredNetPnl: subNet,
      filteredCount: matchingTrades.length,
    };
  }, [
    points,
    transactions,
    startingBalance,
    deposits,
    withdrawals,
    hasAnyFilter,
    isSubsetByCategory,
    yearFilter,
    monthFilter,
    instrumentFilter,
    methodologyFilter,
  ]);

  const width = 920;
  const height = 290;
  const pad = { top: 24, right: 24, bottom: 32, left: 72 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const balances = filtered.map((p) => p.balance);
  const minVal = balances.length > 0 ? Math.min(...balances) : 0;
  const maxVal = balances.length > 0 ? Math.max(...balances) : 100;
  const range = Math.max(maxVal - minVal, 50);
  const yMin = minVal - range * 0.08;
  const yMax = maxVal + range * 0.08;

  const xAt = (idx: number) =>
    filtered.length <= 1 ? pad.left : pad.left + (idx / (filtered.length - 1)) * plotW;
  const yAt = (val: number) =>
    pad.top + plotH - ((val - yMin) / (yMax - yMin || 1)) * plotH;

  const linePath = filtered
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${xAt(idx).toFixed(1)} ${yAt(p.balance).toFixed(1)}`)
    .join(' ');

  const areaPath =
    filtered.length > 1
      ? `${linePath} L ${xAt(filtered.length - 1).toFixed(1)} ${(pad.top + plotH).toFixed(1)} L ${xAt(0).toFixed(1)} ${(pad.top + plotH).toFixed(1)} Z`
      : '';

  const activePoint =
    hoverIdx !== null && filtered[hoverIdx]
      ? filtered[hoverIdx]
      : filtered[filtered.length - 1];
  const activeIdx = hoverIdx !== null && filtered[hoverIdx] ? hoverIdx : filtered.length - 1;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => yMin + (yMax - yMin) * t);

  return (
    <div className="cyber-glass rounded-2xl p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-michroma text-xs sm:text-sm tracking-[0.12em] text-[#EAF7FF]">
            HISTORICAL EQUITY CURVE
          </h3>
          <p className="font-inter mt-1 text-xs text-[#8194A9]">
            {isSubsetByCategory
              ? `Filtered cumulative net P&L across ${filteredCount} matching trades (${formatCurrency(filteredNetPnl, currency, true)})`
              : `Calculated chronologically from realized net P&L (${filteredCount} trades · ${formatCurrency(filteredNetPnl, currency, true)})`}
          </p>
        </div>

        <div className="flex w-full sm:w-auto flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-[#8194A9]/20 bg-[#020305] p-1">
            {(['ALL', '2025', '2026'] as const).map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => {
                  setYearFilter(yr);
                  setHoverIdx(null);
                }}
                className={`font-michroma rounded px-2.5 py-1.5 text-[10px] tracking-[0.1em] transition-colors whitespace-nowrap shrink-0 ${
                  yearFilter === yr
                    ? 'bg-[#0D1723] text-[#00E5FF] border border-[#00E5FF]/35'
                    : 'text-[#8194A9] hover:text-[#EAF7FF]'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>

          <select
            aria-label="Filter equity curve by month"
            value={monthFilter}
            onChange={(e) => {
              setMonthFilter(e.target.value);
              setHoverIdx(null);
            }}
            className="h-9 min-w-0 rounded-lg border border-[#8194A9]/20 bg-[#020305] px-2.5 text-[11px] text-[#EAF7FF] focus:border-[#00E5FF] focus:outline-none"
          >
            {MONTH_OPTIONS.map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter equity curve by instrument"
            value={instrumentFilter}
            onChange={(e) => {
              setInstrumentFilter(e.target.value);
              setHoverIdx(null);
            }}
            className="h-9 min-w-0 rounded-lg border border-[#8194A9]/20 bg-[#020305] px-2.5 text-[11px] text-[#EAF7FF] focus:border-[#00E5FF] focus:outline-none"
          >
            <option value="ALL">All Instruments</option>
            <option value="XAUUSD">XAUUSD</option>
            <option value="NQ Futures">NQ Futures</option>
            <option value="Forex">Forex Pairs</option>
          </select>

          <select
            aria-label="Filter equity curve by methodology"
            value={methodologyFilter}
            onChange={(e) => {
              setMethodologyFilter(e.target.value);
              setHoverIdx(null);
            }}
            className="h-9 min-w-0 rounded-lg border border-[#8194A9]/20 bg-[#020305] px-2.5 text-[11px] text-[#EAF7FF] focus:border-[#00E5FF] focus:outline-none"
          >
            <option value="ALL">All Methodologies</option>
            <option value="SNR">SNR</option>
            <option value="SND">SND</option>
            <option value="Price Action">Price Action</option>
            <option value="ICT">ICT</option>
            <option value="SMC">SMC</option>
            <option value="ALCHEMIST">ALCHEMIST</option>
          </select>

          {hasAnyFilter && (
            <button
              type="button"
              onClick={() => {
                setYearFilter('ALL');
                setMonthFilter('ALL');
                setInstrumentFilter('ALL');
                setMethodologyFilter('ALL');
                setHoverIdx(null);
              }}
              className="font-michroma text-[10px] tracking-[0.1em] text-[#00E5FF] hover:underline px-1.5"
            >
              RESET
            </button>
          )}
        </div>
      </div>

      {activePoint && (
        <div className="mb-4 grid grid-cols-2 gap-3 border-y border-[#8194A9]/15 py-3 sm:grid-cols-4">
          <div>
            <span className="font-inter block text-[11px] text-[#8194A9]">Selected Point</span>
            <span className="neon-metric font-michroma tabular-nums text-xs text-[#EAF7FF]">
              {activePoint.date}
            </span>
          </div>
          <div>
            <span className="font-inter block text-[11px] text-[#8194A9]">
              {isSubsetByCategory ? 'Cumulative P&L' : 'Account Balance'}
            </span>
            <span className="neon-metric font-michroma tabular-nums text-xs text-[#00E5FF]">
              {formatCurrency(activePoint.balance, currency, isSubsetByCategory)}
            </span>
          </div>
          <div>
            <span className="font-inter block text-[11px] text-[#8194A9]">Trade Net P&amp;L</span>
            <span
              className={`neon-metric font-michroma tabular-nums text-xs ${
                activePoint.tradeNetPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(activePoint.tradeNetPnl, currency, true)}
            </span>
          </div>
          <div>
            <span className="font-inter block text-[11px] text-[#8194A9]">Drawdown</span>
            <span className="neon-metric font-michroma tabular-nums text-xs text-[#EAF7FF]/85">
              {formatPct(activePoint.drawdownPct)}
            </span>
          </div>
        </div>
      )}

      <div className="w-full overflow-hidden rounded-xl bg-[#020305]/80 p-2 sm:p-3 border border-[#8194A9]/10">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full select-none"
          role="img"
          aria-label="Account Equity Curve Chart"
          onMouseLeave={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id="equityAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {yTicks.map((val, i) => {
            const y = yAt(val);
            return (
              <g key={i}>
                <line
                  x1={pad.left}
                  y1={y}
                  x2={width - pad.right}
                  y2={y}
                  stroke="#168BFF"
                  strokeOpacity="0.16"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={pad.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="#8194A9"
                  fontSize="10"
                  fontFamily="Michroma, sans-serif"
                >
                  {Math.round(val).toLocaleString('en-US')}
                </text>
              </g>
            );
          })}

          {areaPath && <path d={areaPath} fill="url(#equityAreaGrad)" />}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#00E5FF"
              strokeWidth="2.1"
              strokeLinejoin="round"
              strokeLinecap="round"
              className="neon-chart-line"
            />
          )}

          {filtered.length > 0 && (
            <g>
              <line
                x1={xAt(activeIdx)}
                y1={pad.top}
                x2={xAt(activeIdx)}
                y2={pad.top + plotH}
                stroke="#168BFF"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <circle
                cx={xAt(activeIdx)}
                cy={yAt(filtered[activeIdx].balance)}
                r="4.5"
                fill="#020305"
                stroke="#00E5FF"
                strokeWidth="2"
              />
            </g>
          )}

          {filtered.length > 1 && (
            <>
              <text
                x={pad.left}
                y={height - 8}
                fill="#8194A9"
                fontSize="10"
                fontFamily="Michroma, sans-serif"
              >
                {filtered[0].date}
              </text>
              <text
                x={pad.left + plotW / 2}
                y={height - 8}
                textAnchor="middle"
                fill="#8194A9"
                fontSize="10"
                fontFamily="Michroma, sans-serif"
              >
                {filtered[Math.floor(filtered.length / 2)].date}
              </text>
              <text
                x={width - pad.right}
                y={height - 8}
                textAnchor="end"
                fill="#8194A9"
                fontSize="10"
                fontFamily="Michroma, sans-serif"
              >
                {filtered[filtered.length - 1].date}
              </text>
            </>
          )}

          {filtered.map((_, idx) => {
            const sliceW = plotW / Math.max(filtered.length, 1);
            return (
              <rect
                key={idx}
                x={xAt(idx) - sliceW / 2}
                y={pad.top}
                width={Math.max(sliceW, 4)}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setHoverIdx(idx)}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}

interface MonthlyPerformanceChartProps {
  series: PeriodPnlBucket[];
  currency: string;
}

export function MonthlyPerformanceChart({ series, currency }: MonthlyPerformanceChartProps) {
  const [hovered, setHovered] = useState<PeriodPnlBucket | null>(null);

  const width = 920;
  const height = 240;
  const pad = { top: 20, right: 16, bottom: 36, left: 68 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const maxAbs = Math.max(...series.map((s) => Math.abs(s.netPnl)), 500);
  const zeroY = pad.top + plotH / 2;

  return (
    <div className="cyber-glass rounded-2xl p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-michroma text-xs sm:text-sm tracking-[0.12em] text-[#EAF7FF]">
            MONTHLY NET PERFORMANCE
          </h3>
          <p className="font-inter mt-1 text-xs text-[#8194A9]">
            Realized monthly P&amp;L distribution across recorded sessions
          </p>
        </div>
        {hovered && (
          <div className="text-right">
            <span className="font-michroma tabular-nums text-xs text-[#EAF7FF]">
              {hovered.label}
            </span>
            <span className="mx-2 text-[#8194A9]">·</span>
            <span
              className={`font-michroma tabular-nums text-xs ${
                hovered.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(hovered.netPnl, currency, true)}
            </span>
            <span className="font-inter ml-2 text-xs text-[#8194A9]">({hovered.trades} trades)</span>
          </div>
        )}
      </div>

      {series.length === 0 ? (
        <p className="font-inter py-12 text-center text-sm text-[#8194A9]">
          No closed monthly transactions recorded yet.
        </p>
      ) : (
        <div className="rounded-xl bg-[#020305]/80 p-2 sm:p-3 border border-[#8194A9]/10">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-auto w-full select-none"
            role="img"
            aria-label="Monthly Net P&L Bar Chart"
            onMouseLeave={() => setHovered(null)}
          >
            <line
              x1={pad.left}
              y1={zeroY}
              x2={width - pad.right}
              y2={zeroY}
              stroke="#168BFF"
              strokeWidth="1"
              strokeOpacity="0.45"
            />
            <text
              x={pad.left - 8}
              y={pad.top + 8}
              textAnchor="end"
              fill="#8194A9"
              fontSize="10"
              fontFamily="Michroma, sans-serif"
            >
              +{Math.round(maxAbs).toLocaleString('en-US')}
            </text>
            <text
              x={pad.left - 8}
              y={zeroY + 4}
              textAnchor="end"
              fill="#8194A9"
              fontSize="10"
              fontFamily="Michroma, sans-serif"
            >
              0
            </text>
            <text
              x={pad.left - 8}
              y={pad.top + plotH}
              textAnchor="end"
              fill="#8194A9"
              fontSize="10"
              fontFamily="Michroma, sans-serif"
            >
              -{Math.round(maxAbs).toLocaleString('en-US')}
            </text>

            {series.map((bucket, i) => {
              const slotW = plotW / series.length;
              const barW = Math.max(Math.min(slotW * 0.65, 30), 6);
              const x = pad.left + i * slotW + (slotW - barW) / 2;
              const barH = (Math.abs(bucket.netPnl) / maxAbs) * (plotH / 2 - 6);
              const y = bucket.netPnl >= 0 ? zeroY - barH : zeroY;
              const isActive = hovered?.key === bucket.key;

              return (
                <g key={bucket.key} onMouseEnter={() => setHovered(bucket)}>
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={Math.max(barH, 2)}
                    rx="2"
                    fill={bucket.netPnl >= 0 ? '#00E5FF' : '#F43F5E'}
                    fillOpacity={isActive ? 0.95 : 0.72}
                  />
                  {(series.length <= 14 || i % 2 === 0) && (
                    <text
                      x={x + barW / 2}
                      y={height - 10}
                      textAnchor="middle"
                      fill="#8194A9"
                      fontSize="9"
                      fontFamily="Michroma, sans-serif"
                    >
                      {bucket.key.slice(2)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
}

interface DrawdownChartProps {
  points: EquityPoint[];
}

export function DrawdownChart({ points }: DrawdownChartProps) {
  const width = 920;
  const height = 180;
  const pad = { top: 18, right: 20, bottom: 26, left: 56 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const maxDd = Math.max(...points.map((p) => p.drawdownPct), 2);
  const xAt = (idx: number) =>
    points.length <= 1 ? pad.left : pad.left + (idx / (points.length - 1)) * plotW;
  const yAt = (dd: number) => pad.top + (dd / maxDd) * plotH;

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(p.drawdownPct).toFixed(1)}`)
    .join(' ');
  const areaPath =
    points.length > 1
      ? `${linePath} L ${xAt(points.length - 1).toFixed(1)} ${pad.top} L ${xAt(0).toFixed(1)} ${pad.top} Z`
      : '';

  return (
    <div className="cyber-glass rounded-2xl p-4 sm:p-6">
      <div className="mb-3">
        <h3 className="font-michroma text-xs sm:text-sm tracking-[0.12em] text-[#EAF7FF]">
          UNDERWATER DRAWDOWN PROFILE
        </h3>
        <p className="font-inter mt-1 text-xs text-[#8194A9]">
          Peak-to-valley capital retracement percentage
        </p>
      </div>
      <div className="rounded-xl bg-[#020305]/80 p-2 sm:p-3 border border-[#8194A9]/10">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full select-none"
          role="img"
          aria-label="Drawdown Chart"
        >
          <line
            x1={pad.left}
            y1={pad.top}
            x2={width - pad.right}
            y2={pad.top}
            stroke="#168BFF"
            strokeOpacity="0.25"
            strokeWidth="1"
          />
          <line
            x1={pad.left}
            y1={pad.top + plotH}
            x2={width - pad.right}
            y2={pad.top + plotH}
            stroke="#168BFF"
            strokeOpacity="0.2"
            strokeDasharray="3 3"
            strokeWidth="1"
          />
          <text
            x={pad.left - 8}
            y={pad.top + 4}
            textAnchor="end"
            fill="#8194A9"
            fontSize="10"
            fontFamily="Michroma, sans-serif"
          >
            0.0%
          </text>
          <text
            x={pad.left - 8}
            y={pad.top + plotH + 4}
            textAnchor="end"
            fill="#8194A9"
            fontSize="10"
            fontFamily="Michroma, sans-serif"
          >
            -{maxDd.toFixed(1)}%
          </text>
          {areaPath && <path d={areaPath} fill="#F43F5E" fillOpacity="0.18" />}
          {linePath && <path d={linePath} fill="none" stroke="#F43F5E" strokeWidth="1.6" />}
        </svg>
      </div>
    </div>
  );
}

interface TradingCalendarProps {
  calendarDays: Record<string, CalendarDaySummary>;
  currency: string;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function TradingCalendar({ calendarDays, currency }: TradingCalendarProps) {
  const [year, setYear] = useState<number>(2026);
  const [month, setMonth] = useState<number>(10);

  const monthLabel = new Date(Date.UTC(year, month, 1)).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const shiftMonth = (delta: number) => {
    const next = new Date(Date.UTC(year, month + delta, 1));
    const y = next.getUTCFullYear();
    if (y < 2025 || y > 2026) return;
    setYear(y);
    setMonth(next.getUTCMonth());
  };

  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const firstDayUtc = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const leadingBlanks = (firstDayUtc + 6) % 7;

  const cells: ({ day: number; dateStr: string; isWeekend: boolean } | null)[] = [];
  for (let i = 0; i < leadingBlanks; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const utcDay = new Date(Date.UTC(year, month, d)).getUTCDay();
    cells.push({ day: d, dateStr, isWeekend: utcDay === 0 || utcDay === 6 });
  }

  return (
    <div className="cyber-glass rounded-2xl p-3.5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-michroma text-xs sm:text-sm tracking-[0.12em] text-[#EAF7FF]">
            TRADING CALENDAR
          </h3>
          <p className="font-inter mt-1 text-xs text-[#8194A9]">
            Daily realized P&amp;L · Nov 21–22 weekend closed · Nov 23–Dec 31 manual entry period
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#8194A9]/20 bg-[#020305] text-[#EAF7FF] hover:border-[#00E5FF] hover:text-[#00E5FF]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-michroma min-w-32 sm:min-w-40 text-center text-[11px] sm:text-xs tracking-[0.08em] text-[#EAF7FF]">
            {monthLabel.toUpperCase()}
          </span>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#8194A9]/20 bg-[#020305] text-[#EAF7FF] hover:border-[#00E5FF] hover:text-[#00E5FF]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center text-[10px] sm:text-[11px] font-medium text-[#8194A9]">
        {WEEKDAYS.map((w) => (
          <div key={w} className="font-inter py-1.5 truncate">
            {w}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1 sm:gap-1.5">
        {cells.map((cell, idx) => {
          if (!cell) {
            return <div key={`blank-${idx}`} className="min-h-12 sm:min-h-16 rounded-md bg-[#020305]/40" />;
          }
          const summary = calendarDays[cell.dateStr];
          const isManualPeriod = cell.dateStr >= '2026-11-23' && cell.dateStr <= '2026-12-31';

          let cellStyle = 'border-[#8194A9]/15 bg-[#020305]/70 text-[#8194A9]';
          if (cell.isWeekend) {
            cellStyle = 'border-[#8194A9]/10 bg-[#020305]/35 text-[#8194A9]/45';
          } else if (summary) {
            cellStyle =
              summary.netPnl > 0
                ? 'border-emerald-500/40 bg-emerald-950/30 text-[#EAF7FF]'
                : summary.netPnl < 0
                  ? 'border-rose-500/40 bg-rose-950/30 text-[#EAF7FF]'
                  : 'border-[#168BFF]/45 bg-[#090F18] text-[#EAF7FF]';
          } else if (isManualPeriod) {
            cellStyle = 'border-[#00E5FF]/25 bg-[#020305]/90 text-[#EAF7FF]/80';
          }

          return (
            <div
              key={cell.dateStr}
              className={`flex min-h-12 sm:min-h-16 min-w-0 flex-col justify-between rounded-md border p-1 sm:p-2 ${cellStyle}`}
            >
              <div className="flex items-center justify-between text-[9px] sm:text-[10px]">
                <span className="tabular-nums font-medium">{cell.day}</span>
                {summary && (
                  <span className="hidden sm:inline tabular-nums text-[9px] text-[#8194A9]">
                    {summary.trades}T
                  </span>
                )}
              </div>
              {summary ? (
                <div
                  className={`tabular-nums truncate text-[9px] sm:text-[11px] font-semibold ${
                    summary.netPnl > 0
                      ? 'text-emerald-400'
                      : summary.netPnl < 0
                        ? 'text-rose-400'
                        : 'text-[#EAF7FF]'
                  }`}
                >
                  {formatCurrency(summary.netPnl, currency, true)}
                </div>
              ) : (
                <div className="truncate text-[8px] sm:text-[9px] text-[#8194A9]/60">
                  {cell.isWeekend ? 'Cls' : isManualPeriod ? 'Man' : '—'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
