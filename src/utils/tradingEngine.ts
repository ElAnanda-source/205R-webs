import type {
  AccountSettings,
  CalendarDaySummary,
  CategoryPerformance,
  EquityPoint,
  PerformanceSummary,
  PeriodPnlBucket,
  PublicCategoryDistribution,
  PublicPortfolioSummary,
  PublicTradeRecord,
  TradeTransaction,
  TradingDirection,
  TradingMethodology,
  TradingOutcome,
  TradingSession,
} from '../types/trading';

export interface InstrumentSpec {
  symbol: string;
  category: 'Commodities' | 'Index Futures' | 'Forex';
  contractSize: number;
  pointLabel: string;
  decimals: number;
  defaultCommissionPerLot: number;
  quoteCurrency: 'USD' | 'JPY' | 'CAD';
}

export const INSTRUMENT_SPECS: Record<string, InstrumentSpec> = {
  XAUUSD: {
    symbol: 'XAUUSD',
    category: 'Commodities',
    contractSize: 100, // 100 troy oz per 1.00 standard lot
    pointLabel: '1.00 oz move = $100 / lot',
    decimals: 2,
    defaultCommissionPerLot: 7.0,
    quoteCurrency: 'USD',
  },
  'NQ Futures': {
    symbol: 'NQ Futures',
    category: 'Index Futures',
    contractSize: 20, // $20 per index point per 1 contract
    pointLabel: '1.00 pt = $20 / contract',
    decimals: 2,
    defaultCommissionPerLot: 4.2,
    quoteCurrency: 'USD',
  },
  EURUSD: {
    symbol: 'EURUSD',
    category: 'Forex',
    contractSize: 100000,
    pointLabel: '1 pip (0.0001) = $10 / lot',
    decimals: 5,
    defaultCommissionPerLot: 7.0,
    quoteCurrency: 'USD',
  },
  GBPUSD: {
    symbol: 'GBPUSD',
    category: 'Forex',
    contractSize: 100000,
    pointLabel: '1 pip (0.0001) = $10 / lot',
    decimals: 5,
    defaultCommissionPerLot: 7.0,
    quoteCurrency: 'USD',
  },
  AUDUSD: {
    symbol: 'AUDUSD',
    category: 'Forex',
    contractSize: 100000,
    pointLabel: '1 pip (0.0001) = $10 / lot',
    decimals: 5,
    defaultCommissionPerLot: 7.0,
    quoteCurrency: 'USD',
  },
  USDJPY: {
    symbol: 'USDJPY',
    category: 'Forex',
    contractSize: 100000,
    pointLabel: '1 pip (0.01) converted at exit',
    decimals: 3,
    defaultCommissionPerLot: 7.0,
    quoteCurrency: 'JPY',
  },
  USDCAD: {
    symbol: 'USDCAD',
    category: 'Forex',
    contractSize: 100000,
    pointLabel: '1 pip (0.0001) converted at exit',
    decimals: 5,
    defaultCommissionPerLot: 7.0,
    quoteCurrency: 'CAD',
  },
  GBPJPY: {
    symbol: 'GBPJPY',
    category: 'Forex',
    contractSize: 100000,
    pointLabel: '1 pip (0.01) converted via JPY',
    decimals: 3,
    defaultCommissionPerLot: 7.0,
    quoteCurrency: 'JPY',
  },
};

export function getInstrumentSpec(instrument: string): InstrumentSpec {
  const normalized = instrument.trim();
  if (INSTRUMENT_SPECS[normalized]) {
    return INSTRUMENT_SPECS[normalized];
  }
  const upper = normalized.toUpperCase();
  if (upper.includes('XAU')) return INSTRUMENT_SPECS.XAUUSD;
  if (upper.includes('NQ')) return INSTRUMENT_SPECS['NQ Futures'];
  if (upper.includes('JPY')) {
    return {
      symbol: normalized,
      category: 'Forex',
      contractSize: 100000,
      pointLabel: '1 pip (0.01) JPY pair',
      decimals: 3,
      defaultCommissionPerLot: 7.0,
      quoteCurrency: 'JPY',
    };
  }
  return {
    symbol: normalized,
    category: 'Forex',
    contractSize: 100000,
    pointLabel: '100,000 units / lot',
    decimals: 5,
    defaultCommissionPerLot: 7.0,
    quoteCurrency: 'USD',
  };
}

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function roundRatio(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateGrossPnl(params: {
  instrument: string;
  direction: TradingDirection;
  entryPrice: number;
  exitPrice: number;
  lotSize: number;
  jpyUsdReferenceRate?: number;
}): number {
  const { instrument, direction, entryPrice, exitPrice, lotSize, jpyUsdReferenceRate = 152.5 } = params;
  if (!Number.isFinite(entryPrice) || !Number.isFinite(exitPrice) || !Number.isFinite(lotSize) || lotSize <= 0) {
    return 0;
  }

  const spec = getInstrumentSpec(instrument);
  const dirMultiplier = direction === 'BUY' ? 1 : -1;
  const priceDelta = (exitPrice - entryPrice) * dirMultiplier;
  const rawQuotePnl = priceDelta * lotSize * spec.contractSize;

  if (spec.quoteCurrency === 'USD') {
    return roundCurrency(rawQuotePnl);
  }
  if (spec.quoteCurrency === 'JPY') {
    const divisor = spec.symbol === 'USDJPY' && exitPrice > 0 ? exitPrice : jpyUsdReferenceRate;
    return roundCurrency(rawQuotePnl / divisor);
  }
  if (spec.quoteCurrency === 'CAD') {
    const divisor = exitPrice > 0 ? exitPrice : 1.38;
    return roundCurrency(rawQuotePnl / divisor);
  }
  return roundCurrency(rawQuotePnl);
}

export function calculateNetPnl(grossPnl: number, commission: number, swap: number): number {
  return roundCurrency(grossPnl - Math.abs(commission) + swap);
}

export function calculateRiskRewardRatio(params: {
  direction: TradingDirection;
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
}): number {
  const { direction, entryPrice, exitPrice, stopLoss } = params;
  const riskDistance = Math.abs(entryPrice - stopLoss);
  if (!Number.isFinite(riskDistance) || riskDistance <= 0) {
    return 0;
  }
  const dirMultiplier = direction === 'BUY' ? 1 : -1;
  const realizedMove = (exitPrice - entryPrice) * dirMultiplier;
  return roundRatio(realizedMove / riskDistance);
}

export function deriveTradeOutcome(netPnl: number, breakevenBuffer = 5): TradingOutcome {
  if (Math.abs(netPnl) <= breakevenBuffer) {
    return 'BREAKEVEN';
  }
  return netPnl > 0 ? 'WIN' : 'LOSS';
}

export function sortTradesChronologically<T extends Pick<TradeTransaction, 'tradeDate' | 'tradeTime' | 'id'>>(
  trades: T[]
): T[] {
  return [...trades].sort((a, b) => {
    const dateCmp = a.tradeDate.localeCompare(b.tradeDate);
    if (dateCmp !== 0) return dateCmp;
    const timeCmp = a.tradeTime.localeCompare(b.tradeTime);
    if (timeCmp !== 0) return timeCmp;
    return a.id - b.id;
  });
}

function getIsoWeekKey(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function formatInstrumentGroup(instrument: string): string {
  const spec = getInstrumentSpec(instrument);
  if (spec.category === 'Forex') return 'Forex';
  return spec.symbol;
}

export function computePerformanceSummary(
  trades: TradeTransaction[],
  account: AccountSettings,
  referenceDateStr?: string
): PerformanceSummary {
  const ordered = sortTradesChronologically(trades);
  const startingBalance = Number.isFinite(account.startingBalance) ? account.startingBalance : 1500;
  const deposits = Number.isFinite(account.deposits) ? account.deposits : 0;
  const withdrawals = Number.isFinite(account.withdrawals) ? account.withdrawals : 0;
  const unrealizedPnl = account.brokerConnected ? account.unrealizedPnl : account.unrealizedPnl || 0;

  // Accounting anchor: Starting Balance + Deposits - Withdrawals
  const baseCapital = roundCurrency(startingBalance + deposits - withdrawals);
  let runningBalance = baseCapital;
  let peakBalance = baseCapital;
  let maxDrawdownAbs = 0;
  let maxDrawdownPct = 0;

  const equityCurve: EquityPoint[] = [
    {
      date: ordered.length > 0 ? ordered[0].tradeDate : '2025-01-01',
      label: 'Initial Capital',
      tradeId: null,
      balance: roundCurrency(baseCapital),
      equity: roundCurrency(baseCapital),
      drawdownAbs: 0,
      drawdownPct: 0,
      tradeNetPnl: 0,
      instrument: null,
      methodology: null,
    },
  ];

  let winningTrades = 0;
  let losingTrades = 0;
  let breakevenTrades = 0;
  let verifiedTrades = 0;
  let draftTrades = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let totalCommissions = 0;
  let totalSwaps = 0;
  let realizedTradingPnl = 0;
  let rrSum = 0;

  const monthlyMap = new Map<string, PeriodPnlBucket>();
  const annualMap = new Map<string, PeriodPnlBucket>();
  const instrumentMap = new Map<string, CategoryPerformance>();
  const methodologyMap = new Map<string, CategoryPerformance>();
  const calendarDays: Record<string, CalendarDaySummary> = {};

  for (const t of ordered) {
    realizedTradingPnl = roundCurrency(realizedTradingPnl + t.netPnl);
    runningBalance = roundCurrency(runningBalance + t.netPnl);
    if (runningBalance > peakBalance) {
      peakBalance = runningBalance;
    }
    const ddAbs = roundCurrency(Math.max(0, peakBalance - runningBalance));
    const ddPct = peakBalance > 0 ? roundRatio((ddAbs / peakBalance) * 100) : 0;
    if (ddAbs > maxDrawdownAbs) maxDrawdownAbs = ddAbs;
    if (ddPct > maxDrawdownPct) maxDrawdownPct = ddPct;

    equityCurve.push({
      date: t.tradeDate,
      label: `${t.tradeDate} · ${t.instrument}`,
      tradeId: t.tradeId,
      balance: runningBalance,
      equity: runningBalance,
      drawdownAbs: ddAbs,
      drawdownPct: ddPct,
      tradeNetPnl: t.netPnl,
      instrument: t.instrument,
      methodology: t.methodology,
    });

    if (t.outcome === 'WIN') winningTrades += 1;
    else if (t.outcome === 'LOSS') losingTrades += 1;
    else breakevenTrades += 1;

    if (t.isVerified) verifiedTrades += 1;
    else draftTrades += 1;

    if (t.netPnl > 0) grossProfit = roundCurrency(grossProfit + t.netPnl);
    if (t.netPnl < 0) grossLoss = roundCurrency(grossLoss + Math.abs(t.netPnl));

    totalCommissions = roundCurrency(totalCommissions + t.commission);
    totalSwaps = roundCurrency(totalSwaps + t.swap);
    rrSum += t.riskRewardRatio;

    const monthKey = t.tradeDate.slice(0, 7);
    const yearKey = t.tradeDate.slice(0, 4);

    const updateBucket = (map: Map<string, PeriodPnlBucket>, key: string, label: string) => {
      const existing = map.get(key) ?? {
        key,
        label,
        netPnl: 0,
        grossProfit: 0,
        grossLoss: 0,
        trades: 0,
        wins: 0,
        losses: 0,
        breakeven: 0,
      };
      existing.netPnl = roundCurrency(existing.netPnl + t.netPnl);
      if (t.netPnl > 0) existing.grossProfit = roundCurrency(existing.grossProfit + t.netPnl);
      if (t.netPnl < 0) existing.grossLoss = roundCurrency(existing.grossLoss + Math.abs(t.netPnl));
      existing.trades += 1;
      if (t.outcome === 'WIN') existing.wins += 1;
      else if (t.outcome === 'LOSS') existing.losses += 1;
      else existing.breakeven += 1;
      map.set(key, existing);
    };

    updateBucket(monthlyMap, monthKey, monthKey);
    updateBucket(annualMap, yearKey, yearKey);

    const updateCategory = (map: Map<string, CategoryPerformance>, key: string) => {
      const existing = map.get(key) ?? {
        name: key,
        trades: 0,
        wins: 0,
        losses: 0,
        breakeven: 0,
        winRate: 0,
        netPnl: 0,
        grossProfit: 0,
        grossLoss: 0,
        profitFactor: 0,
      };
      existing.trades += 1;
      if (t.outcome === 'WIN') existing.wins += 1;
      else if (t.outcome === 'LOSS') existing.losses += 1;
      else existing.breakeven += 1;
      existing.netPnl = roundCurrency(existing.netPnl + t.netPnl);
      if (t.netPnl > 0) existing.grossProfit = roundCurrency(existing.grossProfit + t.netPnl);
      if (t.netPnl < 0) existing.grossLoss = roundCurrency(existing.grossLoss + Math.abs(t.netPnl));
      existing.winRate = existing.trades > 0 ? roundRatio((existing.wins / existing.trades) * 100) : 0;
      existing.profitFactor =
        existing.grossLoss > 0
          ? roundRatio(existing.grossProfit / existing.grossLoss)
          : existing.grossProfit > 0
            ? existing.grossProfit
            : 0;
      map.set(key, existing);
    };

    updateCategory(instrumentMap, formatInstrumentGroup(t.instrument));
    updateCategory(methodologyMap, t.methodology);

    const cal = calendarDays[t.tradeDate] ?? {
      date: t.tradeDate,
      trades: 0,
      wins: 0,
      losses: 0,
      breakeven: 0,
      netPnl: 0,
    };
    cal.trades += 1;
    if (t.outcome === 'WIN') cal.wins += 1;
    else if (t.outcome === 'LOSS') cal.losses += 1;
    else cal.breakeven += 1;
    cal.netPnl = roundCurrency(cal.netPnl + t.netPnl);
    calendarDays[t.tradeDate] = cal;
  }

  // Ending Balance = Starting Balance + Deposits - Withdrawals + Realized Net Trading P&L
  const finalBalance = roundCurrency(startingBalance + deposits - withdrawals + realizedTradingPnl);
  const finalEquity = roundCurrency(finalBalance + unrealizedPnl);
  if (equityCurve.length > 0) {
    equityCurve[equityCurve.length - 1].equity = finalEquity;
  }

  const totalTrades = ordered.length;
  const netProfit = realizedTradingPnl;
  const cumulativeGrowthPct =
    startingBalance > 0 ? roundRatio((realizedTradingPnl / startingBalance) * 100) : 0;

  // When verified records are available, compute actual win rate directly from verified records
  const verifiedList = ordered.filter((t) => t.isVerified);
  const verifiedWins = verifiedList.filter((t) => t.outcome === 'WIN').length;
  const actualWinRate =
    verifiedList.length > 0
      ? roundRatio((verifiedWins / verifiedList.length) * 100)
      : totalTrades > 0
        ? roundRatio((winningTrades / totalTrades) * 100)
        : 0;

  const reportedWinRatePct =
    typeof account.reportedWinRatePct === 'number' && Number.isFinite(account.reportedWinRatePct)
      ? roundRatio(account.reportedWinRatePct)
      : null;
  const isWinRateOwnerReported = verifiedTrades === 0 && reportedWinRatePct !== null;
  const winRate = isWinRateOwnerReported ? (reportedWinRatePct as number) : actualWinRate;

  const confirmedEndingBalance =
    typeof account.confirmedEndingBalance === 'number' && Number.isFinite(account.confirmedEndingBalance)
      ? roundCurrency(account.confirmedEndingBalance)
      : null;
  const reconciliationDifference =
    confirmedEndingBalance !== null ? roundCurrency(finalBalance - confirmedEndingBalance) : 0;
  const isReconciled =
    confirmedEndingBalance !== null ? Math.abs(reconciliationDifference) < 0.01 : true;

  const profitFactor =
    grossLoss > 0 ? roundRatio(grossProfit / grossLoss) : grossProfit > 0 ? roundRatio(grossProfit) : 0;
  const averageRR = totalTrades > 0 ? roundRatio(rrSum / totalTrades) : 0;
  const recoveryFactor = maxDrawdownAbs > 0 ? roundRatio(netProfit / maxDrawdownAbs) : netProfit > 0 ? 1 : 0;

  const refDate =
    referenceDateStr ||
    (ordered.length > 0 ? ordered[ordered.length - 1].tradeDate : new Date().toISOString().slice(0, 10));
  const refWeek = getIsoWeekKey(refDate);
  const refMonth = refDate.slice(0, 7);
  const refYear = refDate.slice(0, 4);

  let dailyPnl = 0;
  let weeklyPnl = 0;
  let monthlyPnl = 0;
  let annualPnl = 0;

  for (const t of ordered) {
    if (t.tradeDate === refDate) dailyPnl = roundCurrency(dailyPnl + t.netPnl);
    if (getIsoWeekKey(t.tradeDate) === refWeek) weeklyPnl = roundCurrency(weeklyPnl + t.netPnl);
    if (t.tradeDate.slice(0, 7) === refMonth) monthlyPnl = roundCurrency(monthlyPnl + t.netPnl);
    if (t.tradeDate.slice(0, 4) === refYear) annualPnl = roundCurrency(annualPnl + t.netPnl);
  }

  return {
    startingBalance: roundCurrency(startingBalance),
    deposits: roundCurrency(deposits),
    withdrawals: roundCurrency(withdrawals),
    accountBalance: finalBalance,
    equity: finalEquity,
    unrealizedPnl: roundCurrency(unrealizedPnl),
    brokerConnected: account.brokerConnected,
    totalTrades,
    winningTrades,
    losingTrades,
    breakevenTrades,
    verifiedTrades,
    draftTrades,
    winRate,
    actualWinRate,
    reportedWinRatePct,
    isWinRateOwnerReported,
    grossProfit,
    grossLoss,
    netProfit,
    realizedTradingPnl,
    cumulativeGrowthPct,
    confirmedEndingBalance,
    reconciliationDifference,
    isReconciled,
    totalCommissions,
    totalSwaps,
    profitFactor,
    averageRR,
    maxDrawdownAbs,
    maxDrawdownPct,
    recoveryFactor,
    dailyPnl,
    weeklyPnl,
    monthlyPnl,
    annualPnl,
    equityCurve,
    monthlySeries: Array.from(monthlyMap.values()).sort((a, b) => a.key.localeCompare(b.key)),
    annualSeries: Array.from(annualMap.values()).sort((a, b) => a.key.localeCompare(b.key)),
    instrumentPerformance: Array.from(instrumentMap.values()).sort((a, b) => b.netPnl - a.netPnl),
    methodologyPerformance: Array.from(methodologyMap.values()).sort((a, b) => b.netPnl - a.netPnl),
    calendarDays,
  };
}

export function redactTradeForPublic(trade: TradeTransaction): PublicTradeRecord {
  return {
    id: trade.id,
    tradeId: trade.tradeId,
    tradeDate: trade.tradeDate,
    tradeTime: trade.tradeTime,
    session: trade.session,
    instrument: trade.instrument,
    direction: trade.direction,
    entryPrice: trade.entryPrice,
    exitPrice: trade.exitPrice,
    stopLoss: trade.stopLoss,
    takeProfit: trade.takeProfit,
    lotSize: null,
    grossPnl: null,
    commission: null,
    swap: null,
    netPnl: null,
    riskRewardRatio: trade.riskRewardRatio,
    methodology: trade.methodology,
    outcome: trade.outcome,
    screenshotUrl: trade.screenshotUrl,
    notes: trade.notes,
    isVerified: trade.isVerified,
    isPublished: trade.isPublished,
    financialsRedacted: true,
    createdAt: trade.createdAt,
    updatedAt: trade.updatedAt,
  };
}

export function computePublicPortfolioSummary(
  trades: Pick<
    TradeTransaction,
    'outcome' | 'isVerified' | 'tradeDate' | 'riskRewardRatio' | 'instrument' | 'methodology'
  >[],
  account: Pick<AccountSettings, 'reportedWinRatePct'>
): PublicPortfolioSummary {
  let winningTrades = 0;
  let losingTrades = 0;
  let breakevenTrades = 0;
  let verifiedTrades = 0;
  let draftTrades = 0;
  let manualPeriodTrades = 0;
  let rrSum = 0;
  let verifiedWins = 0;

  const instMap = new Map<string, PublicCategoryDistribution>();
  const methMap = new Map<string, PublicCategoryDistribution>();

  const bump = (map: Map<string, PublicCategoryDistribution>, name: string, outcome: TradingOutcome) => {
    const cur = map.get(name) ?? { name, trades: 0, wins: 0, losses: 0, breakeven: 0 };
    cur.trades += 1;
    if (outcome === 'WIN') cur.wins += 1;
    else if (outcome === 'LOSS') cur.losses += 1;
    else cur.breakeven += 1;
    map.set(name, cur);
  };

  for (const t of trades) {
    if (t.outcome === 'WIN') winningTrades += 1;
    else if (t.outcome === 'LOSS') losingTrades += 1;
    else breakevenTrades += 1;

    if (t.isVerified) {
      verifiedTrades += 1;
      if (t.outcome === 'WIN') verifiedWins += 1;
    } else {
      draftTrades += 1;
    }

    if (t.tradeDate >= '2026-11-23' && t.tradeDate <= '2026-12-31') {
      manualPeriodTrades += 1;
    }
    rrSum += t.riskRewardRatio;

    bump(instMap, formatInstrumentGroup(t.instrument), t.outcome);
    bump(methMap, t.methodology, t.outcome);
  }

  const totalTrades = trades.length;
  const reportedWinRatePct =
    typeof account.reportedWinRatePct === 'number' && Number.isFinite(account.reportedWinRatePct)
      ? roundRatio(account.reportedWinRatePct)
      : null;
  const isWinRateOwnerReported = verifiedTrades === 0 && reportedWinRatePct !== null;
  const actualWinRate =
    verifiedTrades > 0
      ? roundRatio((verifiedWins / verifiedTrades) * 100)
      : totalTrades > 0
        ? roundRatio((winningTrades / totalTrades) * 100)
        : 0;

  return {
    tradingStart: '2025-01-01',
    historicalCutoff: '2026-11-20',
    manualPeriodStart: '2026-11-23',
    manualPeriodEnd: '2026-12-31',
    manualPeriodTrades,
    totalTrades,
    winningTrades,
    losingTrades,
    breakevenTrades,
    verifiedTrades,
    draftTrades,
    displayedWinRate: isWinRateOwnerReported ? (reportedWinRatePct as number) : actualWinRate,
    reportedWinRatePct,
    isWinRateOwnerReported,
    averageRR: totalTrades > 0 ? roundRatio(rrSum / totalTrades) : 0,
    instrumentDistribution: Array.from(instMap.values()).sort((a, b) => b.trades - a.trades),
    methodologyDistribution: Array.from(methMap.values()).sort((a, b) => b.trades - a.trades),
  };
}

const CSV_HEADERS = [
  'tradeId',
  'tradeDate',
  'tradeTime',
  'session',
  'instrument',
  'direction',
  'entryPrice',
  'exitPrice',
  'stopLoss',
  'takeProfit',
  'lotSize',
  'grossPnl',
  'commission',
  'swap',
  'netPnl',
  'riskRewardRatio',
  'methodology',
  'outcome',
  'notes',
  'isVerified',
] as const;

function escapeCsvCell(value: unknown): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function serializeTradesToCsv(trades: TradeTransaction[]): string {
  const rows = [CSV_HEADERS.join(',')];
  for (const t of sortTradesChronologically(trades)) {
    rows.push(
      [
        t.tradeId,
        t.tradeDate,
        t.tradeTime,
        t.session,
        t.instrument,
        t.direction,
        t.entryPrice,
        t.exitPrice,
        t.stopLoss,
        t.takeProfit,
        t.lotSize,
        t.grossPnl,
        t.commission,
        t.swap,
        t.netPnl,
        t.riskRewardRatio,
        t.methodology,
        t.outcome,
        t.notes,
        t.isVerified ? 'true' : 'false',
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  }
  return rows.join('\n');
}

function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const ch = csvText[i];
    const next = csvText[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\r' && next === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      i += 1;
    } else if (ch === '\n' || ch === '\r') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

const VALID_METHODOLOGIES = new Set<TradingMethodology>([
  'SNR',
  'SND',
  'Price Action',
  'ICT',
  'SMC',
  'ALCHEMIST',
]);

const VALID_SESSIONS = new Set<TradingSession>(['Asian', 'London', 'New York', 'Overlap']);

export interface ParsedCsvTradeInput {
  tradeId: string;
  tradeDate: string;
  tradeTime: string;
  session: TradingSession;
  instrument: string;
  direction: TradingDirection;
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  grossPnl: number;
  commission: number;
  swap: number;
  netPnl: number;
  riskRewardRatio: number;
  methodology: TradingMethodology;
  outcome: TradingOutcome;
  notes: string;
  isVerified: boolean;
}

export function parseCsvToTrades(csvText: string): {
  trades: ParsedCsvTradeInput[];
  errors: string[];
} {
  const rows = parseCsvRows(csvText);
  if (rows.length < 2) {
    return { trades: [], errors: ['CSV file must contain a header row and at least one trade row.'] };
  }

  const header = rows[0].map((h) => h.trim());
  const indexOf = (name: string) => header.findIndex((h) => h.toLowerCase() === name.toLowerCase());

  const requiredCols = ['tradeDate', 'instrument', 'direction', 'entryPrice', 'exitPrice', 'lotSize'];
  for (const col of requiredCols) {
    if (indexOf(col) === -1) {
      return { trades: [], errors: [`Missing required CSV column: ${col}`] };
    }
  }

  const trades: ParsedCsvTradeInput[] = [];
  const errors: string[] = [];

  for (let r = 1; r < rows.length; r += 1) {
    const cols = rows[r];
    const get = (name: string) => {
      const idx = indexOf(name);
      return idx >= 0 && idx < cols.length ? cols[idx].trim() : '';
    };

    const tradeDate = get('tradeDate');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tradeDate)) {
      errors.push(`Row ${r + 1}: invalid tradeDate "${tradeDate}" (expected YYYY-MM-DD).`);
      continue;
    }

    const tradeTime = get('tradeTime') || '12:00';
    const instrument = get('instrument');
    const dirRaw = get('direction').toUpperCase();
    const direction: TradingDirection = dirRaw === 'SELL' ? 'SELL' : 'BUY';

    const entryPrice = Number(get('entryPrice'));
    const exitPrice = Number(get('exitPrice'));
    const stopLoss = Number(get('stopLoss') || entryPrice);
    const takeProfit = Number(get('takeProfit') || exitPrice);
    const lotSize = Number(get('lotSize'));

    if (!Number.isFinite(entryPrice) || !Number.isFinite(exitPrice) || !Number.isFinite(lotSize) || lotSize <= 0) {
      errors.push(`Row ${r + 1}: invalid numeric price or lotSize.`);
      continue;
    }

    const rawGross = get('grossPnl');
    const grossPnl =
      rawGross !== '' && Number.isFinite(Number(rawGross))
        ? roundCurrency(Number(rawGross))
        : calculateGrossPnl({ instrument, direction, entryPrice, exitPrice, lotSize });

    const commission = Number.isFinite(Number(get('commission'))) ? Number(get('commission')) : 0;
    const swap = Number.isFinite(Number(get('swap'))) ? Number(get('swap')) : 0;
    const rawNet = get('netPnl');
    const netPnl =
      rawNet !== '' && Number.isFinite(Number(rawNet))
        ? roundCurrency(Number(rawNet))
        : calculateNetPnl(grossPnl, commission, swap);

    const rawRR = get('riskRewardRatio');
    const riskRewardRatio =
      rawRR !== '' && Number.isFinite(Number(rawRR))
        ? roundRatio(Number(rawRR))
        : calculateRiskRewardRatio({ direction, entryPrice, exitPrice, stopLoss });

    const sessionRaw = get('session') as TradingSession;
    const session: TradingSession = VALID_SESSIONS.has(sessionRaw) ? sessionRaw : 'New York';

    const methRaw = get('methodology') as TradingMethodology;
    const methodology: TradingMethodology = VALID_METHODOLOGIES.has(methRaw) ? methRaw : 'Price Action';

    const outRaw = get('outcome').toUpperCase() as TradingOutcome;
    const outcome: TradingOutcome =
      outRaw === 'WIN' || outRaw === 'LOSS' || outRaw === 'BREAKEVEN'
        ? outRaw
        : deriveTradeOutcome(netPnl);

    const isVerifiedRaw = get('isVerified').toLowerCase();
    const isVerified = isVerifiedRaw === 'true' || isVerifiedRaw === '1' || isVerifiedRaw === 'yes';

    trades.push({
      tradeId: get('tradeId') || `205R-${tradeDate.replace(/-/g, '')}-${String(r).padStart(3, '0')}`,
      tradeDate,
      tradeTime,
      session,
      instrument,
      direction,
      entryPrice,
      exitPrice,
      stopLoss,
      takeProfit,
      lotSize,
      grossPnl,
      commission,
      swap,
      netPnl,
      riskRewardRatio,
      methodology,
      outcome,
      notes: get('notes'),
      isVerified,
    });
  }

  return { trades, errors };
}

export function isWeekendDate(dateStr: string): boolean {
  const [y, m, d] = dateStr.split('-').map(Number);
  const utcDay = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return utcDay === 0 || utcDay === 6;
}
