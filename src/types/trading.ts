export type TradingDirection = 'BUY' | 'SELL';

export type TradingOutcome = 'WIN' | 'LOSS' | 'BREAKEVEN';

export type TradingMethodology =
  | 'SNR'
  | 'SND'
  | 'Price Action'
  | 'ICT'
  | 'SMC'
  | 'ALCHEMIST';

export type TradingSession = 'Asian' | 'London' | 'New York' | 'Overlap';

export type SupportedInstrument =
  | 'XAUUSD'
  | 'NQ Futures'
  | 'EURUSD'
  | 'GBPUSD'
  | 'USDJPY'
  | 'AUDUSD'
  | 'USDCAD'
  | 'GBPJPY';

export interface TradeTransaction {
  id: number;
  tradeId: string;
  tradeDate: string; // YYYY-MM-DD
  tradeTime: string; // HH:MM
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
  screenshotUrl: string | null;
  notes: string;
  isVerified: boolean;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AccountSettings {
  startingBalance: number;
  deposits: number;
  withdrawals: number;
  confirmedEndingBalance: number | null;
  reportedWinRatePct: number | null;
  currency: string;
  unrealizedPnl: number;
  brokerConnected: boolean;
  accountLabel: string;
  updatedAt?: string;
}

export interface RiskParameters {
  dailyLossLimitPct: number;
  maxRiskPerTradePct: number;
  maxDrawdownLimitPct: number;
  minRrRatio: number;
  maxConcurrentTrades: number;
  positionSizingModel: string;
  stopLossManagementRule: string;
  takeProfitManagementRule: string;
  capitalPreservationRule: string;
  tradeManagementRule: string;
  updatedAt?: string;
}

export interface TimelineMilestone {
  year: string;
  title: string;
  summary: string;
}

export interface MethodologyContent {
  id: TradingMethodology;
  number: string;
  name: string;
  subtitle: string;
  description: string;
  focusPoints: string[];
  isSignature?: boolean;
}

export interface MarketCoverageItem {
  id: string;
  symbol: string;
  title: string;
  tier: string;
  summary: string;
  focusPoints: string[];
  contractSpec: string;
}

export interface SiteContent {
  heroHeadline: string;
  heroSubheadline: string;
  aboutSummary: string;
  philosophyStatement: string;
  corePrinciples: string[];
  timeline: TimelineMilestone[];
  methodologies: MethodologyContent[];
  markets: MarketCoverageItem[];
  contactEmail: string;
  contactLocation: string;
  socialLinks: {
    label: string;
    url: string;
  }[];
  disclaimer: string;
}

export interface EquityPoint {
  date: string;
  label: string;
  tradeId: string | null;
  balance: number;
  equity: number;
  drawdownAbs: number;
  drawdownPct: number;
  tradeNetPnl: number;
  instrument: string | null;
  methodology: TradingMethodology | null;
}

export interface PeriodPnlBucket {
  key: string;
  label: string;
  netPnl: number;
  grossProfit: number;
  grossLoss: number;
  trades: number;
  wins: number;
  losses: number;
  breakeven: number;
}

export interface CategoryPerformance {
  name: string;
  trades: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number;
  netPnl: number;
  grossProfit: number;
  grossLoss: number;
  profitFactor: number;
}

export interface CalendarDaySummary {
  date: string;
  trades: number;
  wins: number;
  losses: number;
  breakeven: number;
  netPnl: number;
}

export interface PerformanceSummary {
  startingBalance: number;
  deposits: number;
  withdrawals: number;
  accountBalance: number;
  equity: number;
  unrealizedPnl: number;
  brokerConnected: boolean;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  verifiedTrades: number;
  draftTrades: number;
  winRate: number;
  actualWinRate: number;
  reportedWinRatePct: number | null;
  isWinRateOwnerReported: boolean;
  grossProfit: number;
  grossLoss: number;
  netProfit: number;
  realizedTradingPnl: number;
  cumulativeGrowthPct: number;
  confirmedEndingBalance: number | null;
  reconciliationDifference: number;
  isReconciled: boolean;
  totalCommissions: number;
  totalSwaps: number;
  profitFactor: number;
  averageRR: number;
  maxDrawdownAbs: number;
  maxDrawdownPct: number;
  recoveryFactor: number;
  dailyPnl: number;
  weeklyPnl: number;
  monthlyPnl: number;
  annualPnl: number;
  equityCurve: EquityPoint[];
  monthlySeries: PeriodPnlBucket[];
  annualSeries: PeriodPnlBucket[];
  instrumentPerformance: CategoryPerformance[];
  methodologyPerformance: CategoryPerformance[];
  calendarDays: Record<string, CalendarDaySummary>;
}

export interface PublicTradeRecord {
  id: number;
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
  lotSize: number | null;
  grossPnl: number | null;
  commission: number | null;
  swap: number | null;
  netPnl: number | null;
  riskRewardRatio: number;
  methodology: TradingMethodology;
  outcome: TradingOutcome;
  screenshotUrl: string | null;
  notes: string;
  isVerified: boolean;
  isPublished: boolean;
  financialsRedacted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PublicCategoryDistribution {
  name: string;
  trades: number;
  wins: number;
  losses: number;
  breakeven: number;
}

export interface PublicPortfolioSummary {
  tradingStart: string;
  historicalCutoff: string;
  manualPeriodStart: string;
  manualPeriodEnd: string;
  manualPeriodTrades: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  verifiedTrades: number;
  draftTrades: number;
  displayedWinRate: number;
  reportedWinRatePct: number | null;
  isWinRateOwnerReported: boolean;
  averageRR: number;
  instrumentDistribution: PublicCategoryDistribution[];
  methodologyDistribution: PublicCategoryDistribution[];
}

export interface AuditLogEntry {
  id: number;
  eventType: string;
  actor: string;
  details: string;
  ip: string;
  createdAt: string;
}

export interface AuthStatus {
  authenticated: boolean;
  requiresSetup: boolean;
  envPinConfigured: boolean;
  isLocked: boolean;
  failedAttempts: number;
  maxAttempts: number;
  attemptsRemaining: number;
}
