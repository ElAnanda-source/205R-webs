import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateGrossPnl,
  calculateNetPnl,
  calculateRiskRewardRatio,
  computePerformanceSummary,
  computePublicPortfolioSummary,
  parseCsvToTrades,
  redactTradeForPublic,
  serializeTradesToCsv,
  isWeekendDate,
} from './tradingEngine';
import { DEFAULT_ACCOUNT_SETTINGS, generateHistoricalDraftTrades } from './seedTrades';
import type { TradeTransaction } from '../types/trading';

test('XAUUSD and NQ Futures use distinct contract specifications', () => {
  // XAUUSD: 1.00 lot = 100 oz -> +10.00 move = +$1,000
  const xauPnl = calculateGrossPnl({
    instrument: 'XAUUSD',
    direction: 'BUY',
    entryPrice: 2700.0,
    exitPrice: 2710.0,
    lotSize: 1.0,
  });
  assert.equal(xauPnl, 1000);

  // NQ Futures: 1 contract = $20/point -> +10.00 points = +$200
  const nqPnl = calculateGrossPnl({
    instrument: 'NQ Futures',
    direction: 'BUY',
    entryPrice: 21000.0,
    exitPrice: 21010.0,
    lotSize: 1.0,
  });
  assert.equal(nqPnl, 200);

  // SELL direction reverses delta
  const xauSellPnl = calculateGrossPnl({
    instrument: 'XAUUSD',
    direction: 'SELL',
    entryPrice: 2710.0,
    exitPrice: 2700.0,
    lotSize: 0.5,
  });
  assert.equal(xauSellPnl, 500);
});

test('Net P&L and Risk-to-Reward ratio calculations are accurate', () => {
  const net = calculateNetPnl(1000, 7, -3);
  assert.equal(net, 990);

  const rr = calculateRiskRewardRatio({
    direction: 'BUY',
    entryPrice: 2700,
    exitPrice: 2720,
    stopLoss: 2690,
  });
  assert.equal(rr, 2);

  const losingRr = calculateRiskRewardRatio({
    direction: 'SELL',
    entryPrice: 21000,
    exitPrice: 21025,
    stopLoss: 21025,
  });
  assert.equal(losingRr, -1);
});

test('Automatic Equity Engine tracks $1,500 starting capital, deposits/withdrawals, drawdown, and verified win rate', () => {
  const trades: TradeTransaction[] = [
    {
      id: 1,
      tradeId: 'T-1',
      tradeDate: '2026-01-05',
      tradeTime: '09:30',
      session: 'New York',
      instrument: 'XAUUSD',
      direction: 'BUY',
      entryPrice: 2700,
      exitPrice: 2720,
      stopLoss: 2690,
      takeProfit: 2720,
      lotSize: 1,
      grossPnl: 2000,
      commission: 7,
      swap: 0,
      netPnl: 1993,
      riskRewardRatio: 2,
      methodology: 'ALCHEMIST',
      outcome: 'WIN',
      screenshotUrl: null,
      notes: 'Win',
      isVerified: true,
      isPublished: true,
    },
    {
      id: 2,
      tradeId: 'T-2',
      tradeDate: '2026-01-12',
      tradeTime: '14:00',
      session: 'New York',
      instrument: 'NQ Futures',
      direction: 'SELL',
      entryPrice: 21200,
      exitPrice: 21250,
      stopLoss: 21250,
      takeProfit: 21100,
      lotSize: 1,
      grossPnl: -1000,
      commission: 4.2,
      swap: 0,
      netPnl: -1004.2,
      riskRewardRatio: -1,
      methodology: 'SMC',
      outcome: 'LOSS',
      screenshotUrl: null,
      notes: 'Loss',
      isVerified: true,
      isPublished: true,
    },
  ];

  const summary = computePerformanceSummary(trades, DEFAULT_ACCOUNT_SETTINGS, '2026-01-12');
  // 1500 + 1993 - 1004.2 = 2488.8
  assert.equal(summary.startingBalance, 1500);
  assert.equal(summary.accountBalance, 2488.8);
  assert.equal(summary.equity, 2488.8);
  assert.equal(summary.totalTrades, 2);
  assert.equal(summary.winningTrades, 1);
  assert.equal(summary.losingTrades, 1);
  // Verified trades present -> switches from 65% reported WR to actual verified WR (50%)
  assert.equal(summary.isWinRateOwnerReported, false);
  assert.equal(summary.winRate, 50);
  assert.equal(summary.maxDrawdownAbs, 1004.2);
  // Variance from confirmed $6,687.09 benchmark is flagged explicitly
  assert.equal(summary.isReconciled, false);
  assert.equal(summary.reconciliationDifference, -4198.29);
  // 1 initial anchor + 2 actual trades = 3 points (no artificial interpolation for empty days)
  assert.equal(summary.equityCurve.length, 3);
  assert.equal(summary.dailyPnl, -1004.2);
  assert.equal(summary.monthlyPnl, 988.8);

  // Deposits and withdrawals formula: Ending = Starting + Deposits - Withdrawals + Realized Net Trading P&L
  const withCashFlow = computePerformanceSummary(
    trades,
    { ...DEFAULT_ACCOUNT_SETTINGS, deposits: 500, withdrawals: 200, confirmedEndingBalance: null },
    '2026-01-12'
  );
  assert.equal(withCashFlow.accountBalance, 2788.8);
  assert.equal(withCashFlow.isReconciled, true);
});

test('Official 205R historical dataset reconciles $1,500.00 -> $6,687.09 (+$5,187.09 / +345.81%) with 65% reported win rate', () => {
  const draftTrades = generateHistoricalDraftTrades();
  assert.ok(draftTrades.length > 80, 'Expected substantial historical dataset');

  for (const t of draftTrades) {
    assert.ok(t.tradeDate >= '2025-01-01', `Trade before 2025-01-01: ${t.tradeDate}`);
    assert.ok(t.tradeDate <= '2026-11-20', `Trade after 2026-11-20: ${t.tradeDate}`);
    assert.equal(isWeekendDate(t.tradeDate), false, `Weekend trade found: ${t.tradeDate}`);
    assert.notEqual(t.tradeDate, '2026-11-21');
    assert.notEqual(t.tradeDate, '2026-11-22');
    assert.equal(t.isVerified, false, 'Generated historical records must be unverified drafts');
  }

  const manualPeriodTrades = draftTrades.filter((t) => t.tradeDate >= '2026-11-23');
  assert.equal(manualPeriodTrades.length, 0, 'Manual entry period Nov 23 - Dec 31, 2026 must start empty');

  const fullSummary = computePerformanceSummary(draftTrades, DEFAULT_ACCOUNT_SETTINGS, '2026-11-20');
  assert.equal(fullSummary.startingBalance, 1500);
  assert.equal(fullSummary.deposits, 0);
  assert.equal(fullSummary.withdrawals, 0);
  assert.equal(fullSummary.netProfit, 5187.09);
  assert.equal(fullSummary.accountBalance, 6687.09);
  assert.equal(fullSummary.cumulativeGrowthPct, 345.81);
  assert.equal(fullSummary.reconciliationDifference, 0);
  assert.equal(fullSummary.isReconciled, true);
  assert.equal(fullSummary.winRate, 65);
  assert.equal(fullSummary.isWinRateOwnerReported, true);
  assert.equal(fullSummary.equityCurve[0].balance, 1500);
  assert.equal(fullSummary.equityCurve[fullSummary.equityCurve.length - 1].balance, 6687.09);
});

test('Public financial redaction strips sensitive account and dollar fields', () => {
  const draftTrades = generateHistoricalDraftTrades();
  const redacted = redactTradeForPublic(draftTrades[0]);
  assert.equal(redacted.financialsRedacted, true);
  assert.equal(redacted.lotSize, null);
  assert.equal(redacted.grossPnl, null);
  assert.equal(redacted.commission, null);
  assert.equal(redacted.swap, null);
  assert.equal(redacted.netPnl, null);
  assert.equal(redacted.tradeId, draftTrades[0].tradeId);
  assert.equal(redacted.instrument, draftTrades[0].instrument);

  const publicSummary = computePublicPortfolioSummary(draftTrades, DEFAULT_ACCOUNT_SETTINGS);
  assert.equal(publicSummary.displayedWinRate, 65);
  assert.equal(publicSummary.isWinRateOwnerReported, true);
  assert.equal(publicSummary.manualPeriodTrades, 0);
  assert.equal(publicSummary.totalTrades, draftTrades.length);
});

test('CSV export and import round-trips trade records accurately', () => {
  const sample = generateHistoricalDraftTrades().slice(0, 5);
  const csv = serializeTradesToCsv(sample);
  const parsed = parseCsvToTrades(csv);
  assert.equal(parsed.errors.length, 0);
  assert.equal(parsed.trades.length, 5);
  assert.equal(parsed.trades[0].tradeId, sample[0].tradeId);
  assert.equal(parsed.trades[0].netPnl, sample[0].netPnl);
  assert.equal(parsed.trades[0].methodology, sample[0].methodology);
});
