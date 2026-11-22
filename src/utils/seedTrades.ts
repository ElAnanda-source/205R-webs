import type {
  AccountSettings,
  RiskParameters,
  SiteContent,
  TradeTransaction,
  TradingDirection,
  TradingMethodology,
  TradingSession,
} from '../types/trading';
import {
  calculateGrossPnl,
  calculateNetPnl,
  calculateRiskRewardRatio,
  deriveTradeOutcome,
  getInstrumentSpec,
  isWeekendDate,
  roundCurrency,
} from './tradingEngine.ts';

export const DEFAULT_ACCOUNT_SETTINGS: AccountSettings = {
  startingBalance: 1500.0,
  deposits: 0,
  withdrawals: 0,
  confirmedEndingBalance: 6687.09,
  reportedWinRatePct: 65,
  currency: 'USD',
  unrealizedPnl: 0,
  brokerConnected: false,
  accountLabel: '205R Primary Trading Account',
};

export const DEFAULT_RISK_PARAMETERS: RiskParameters = {
  dailyLossLimitPct: 2.0,
  maxRiskPerTradePct: 1.0,
  maxDrawdownLimitPct: 8.0,
  minRrRatio: 2.0,
  maxConcurrentTrades: 2,
  positionSizingModel:
    'Dynamic fractional sizing (0.02 - 0.15 lots scaled proportionally as balance compounds from $1,500.00 to $6,687.09) normalized by structural stop distance.',
  stopLossManagementRule:
    'Hard structural stop loss placed beyond invalidation swing or liquidity sweep extreme prior to execution. Never widened after entry.',
  takeProfitManagementRule:
    'Scaled partials at opposing liquidity pools (1:2R minimum baseline), trailing remaining exposure behind confirmed structural shifts.',
  capitalPreservationRule:
    'Execution halts for the remainder of the session if daily realized drawdown reaches -2.0% or after two consecutive full-stop losses.',
  tradeManagementRule:
    'Move stop to breakeven only after internal structure break or 1.2R displacement confirmation; avoid premature tightening during normal pullback noise.',
};

export const DEFAULT_SITE_CONTENT: SiteContent = {
  heroHeadline: 'TRADE WITH PRECISION.\nEXECUTE WITH DISCIPLINE.',
  heroSubheadline:
    '205R is an independent trading initiative built around systematic market analysis, structured execution, and disciplined risk management.',
  aboutSummary:
    '205R is an independent trading and market research operation dedicated to structured price delivery across gold, index futures, and major currency markets. Rather than pursuing short-term prediction or high-frequency noise, every execution follows multi-timeframe structural mapping, defined invalidation, and documented post-session review.',
  philosophyStatement:
    'Precision over prediction. Process over emotion. Risk management over impulsive decisions. Consistency over short-term excitement.',
  corePrinciples: [
    'Precision over prediction.',
    'Process over emotion.',
    'Risk management over impulsive decisions.',
    'Consistency over short-term excitement.',
    'Data-driven trading.',
    'Continuous improvement.',
  ],
  timeline: [
    {
      year: '2025',
      title: 'FOUNDATION',
      summary:
        'Commenced trading operations in January 2025 with $1,500.00 initial capital, establishing the 205R market taxonomy, strict fractional risk framework, and structured journaling across XAUUSD, NASDAQ NQ Futures, and Forex.',
    },
    {
      year: '2026',
      title: 'DEVELOPMENT & REFINEMENT',
      summary:
        'Deployed the 205R Multi Time Frame Engine V2.0 and Six Pillars framework, compounding account balance to $6,687.09 (+345.81%) through the November 20, 2026 historical cutoff ahead of live manual recordkeeping.',
    },
  ],
  methodologies: [
    {
      id: 'SNR',
      number: '01',
      name: 'SNR',
      subtitle: 'Support & Resistance',
      description:
        'Structural horizontal and dynamic inflection levels anchored on high-timeframe weekly, daily, and 4-hour reaction points where institutional order flow historically shifts.',
      focusPoints: [
        'Weekly & Daily Key Levels',
        'Flip Zones (S/R Reclaim)',
        'Multi-Touch Structural Respect',
      ],
    },
    {
      id: 'SND',
      number: '02',
      name: 'SND',
      subtitle: 'Supply & Demand',
      description:
        'Imbalance origin zones marking aggressive institutional accumulation and distribution before impulsive expansion moves away from equilibrium.',
      focusPoints: [
        'Fresh Rally-Base-Drop & Drop-Base-Rally',
        'Proximal & Distal Boundaries',
        'Zone Mitigation Tracking',
      ],
    },
    {
      id: 'Price Action',
      number: '03',
      name: 'PRICE ACTION',
      subtitle: 'Candlestick & Market Structure',
      description:
        'Pure price behavior analysis evaluating candlestick closes, momentum expansion, compression wedges, and higher-high / lower-low structural transitions without lagging indicators.',
      focusPoints: [
        'Candle-Close Confirmation',
        'Break of Structure (BOS)',
        'Volatility Contraction & Expansion',
      ],
    },
    {
      id: 'ICT',
      number: '04',
      name: 'ICT',
      subtitle: 'Inner Circle Trader Concepts',
      description:
        'Time-and-price delivery methodology centered on session killzones, engineered buy-side and sell-side liquidity sweeps, and displacement back into fair value.',
      focusPoints: [
        'London & NY Killzone Timing',
        'Liquidity Sweeps & Turtle Soups',
        'Institutional Price Delivery',
      ],
    },
    {
      id: 'SMC',
      number: '05',
      name: 'SMC',
      subtitle: 'Smart Money Concepts',
      description:
        'Order flow architecture combining Change of Character (CHoCH), refined Order Blocks, and Fair Value Gaps (FVG) to align lower-timeframe entries with higher-timeframe bias.',
      focusPoints: [
        'Order Block Refinement',
        'Fair Value Gap (FVG) Imbalances',
        'Premium / Discount Equilibrium',
      ],
    },
    {
      id: 'ALCHEMIST',
      number: '06',
      name: 'ALCHEMIST',
      subtitle: '205R Proprietary Signature Methodology',
      description:
        'The signature analytical synthesis developed within 205R. Proprietary execution rules and calibration thresholds remain private to the owner unless explicitly published here.',
      focusPoints: [
        '205R Signature Framework',
        'Cross-Pillar Confluence Synthesis',
        'Owner-Curated Private Protocol',
      ],
      isSignature: true,
    },
  ],
  markets: [
    {
      id: 'xauusd',
      symbol: 'XAUUSD — GOLD',
      title: 'Primary Trading Instrument',
      tier: 'Primary Market',
      summary:
        'Spot Gold serves as the primary vehicle for 205R liquidity-driven setups during London and New York overlaps, offering clean structural swings and deep session liquidity.',
      focusPoints: [
        'Gold market structure',
        'Liquidity sweeps',
        'Intraday volatility',
        'Price action',
        'Precision execution',
      ],
      contractSpec: '1.00 Standard Lot = 100 Troy Oz ($100 / $1.00 move)',
    },
    {
      id: 'nq',
      symbol: 'NASDAQ — NQ FUTURES',
      title: 'Secondary Trading Instrument',
      tier: 'Secondary Market',
      summary:
        'E-mini / Micro Nasdaq-100 Futures traded around the New York cash equity open, capturing high-beta momentum expansion and clean algorithmic draw-on-liquidity.',
      focusPoints: [
        'Momentum expansion',
        'Market structure',
        'Liquidity delivery',
        'Session-based opportunities',
      ],
      contractSpec: '1.00 Standard = $20.00 / pt (0.10 Micro MNQ = $2.00 / pt)',
    },
    {
      id: 'forex',
      symbol: 'FOREX',
      title: 'Additional Market Coverage',
      tier: 'Currency Coverage',
      summary:
        'Major G10 currency pairs (EURUSD, GBPUSD, USDJPY) analyzed for macro dollar correlation, higher-timeframe structural alignment, and disciplined cross-session execution.',
      focusPoints: [
        'Currency market structure',
        'Price action',
        'Multi-timeframe analysis',
        'Risk management',
      ],
      contractSpec: '1.00 Standard Lot = 100,000 Base Currency Units',
    },
  ],
  contactEmail: 'paeltzy@gmail.com',
  contactLocation: 'Independent Trading Operations',
  socialLinks: [],
  disclaimer:
    'Trading financial instruments including Gold (XAUUSD), Index Futures (NQ), and Foreign Exchange carries a high level of risk and may not be suitable for all participants. Past or simulated historical performance is not indicative of future results. Records marked as Draft Historical are reconstructed research entries prepared from historical account parameters and do not constitute verified live-account broker executions.',
};

// Deterministic PRNG (Mulberry32) so seed dataset is 100% reproducible and testable
function createRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates deterministic reconstructed draft historical transactions strictly within:
 * 2025-01-01 through 2026-11-20 (inclusive).
 * - Starting Balance: $1,500.00
 * - Reconciled Historical Net Trading P&L: +$5,187.09 -> Ending Balance: $6,687.09 (+345.81%)
 * - Zero weekend trades (Sat/Sun skipped, including 2026-11-21 and 2026-11-22).
 * - Zero trades from 2026-11-23 through 2026-12-31 (Manual Entry Period).
 * - All entries explicitly flagged isVerified = false (Reconstructed Draft Historical).
 */
export function generateHistoricalDraftTrades(): TradeTransaction[] {
  const TARGET_NET_GROWTH = 5187.09;
  const rng = createRng(20520261);
  const start = new Date(Date.UTC(2025, 0, 2)); // Thu Jan 2, 2025
  const loopEnd = new Date(Date.UTC(2026, 10, 18)); // Wed Nov 18, 2026 (Nov 19-20 close the historical cutoff)

  const methodologies: TradingMethodology[] = [
    'ALCHEMIST',
    'SMC',
    'ICT',
    'Price Action',
    'SND',
    'SNR',
  ];
  const sessions: TradingSession[] = ['London', 'New York', 'Overlap', 'Asian'];
  const instruments = ['XAUUSD', 'XAUUSD', 'NQ Futures', 'NQ Futures', 'EURUSD', 'GBPUSD', 'USDJPY'];

  const notesWins = [
    'Higher-timeframe sweep into 4H demand zone followed by crisp M5 displacement and candle-close entry.',
    'London open stop-hunt above Asian high; entered on FVG mitigation targeting opposing sell-side pool.',
    'NY cash open structural reclaim aligned with daily bias; scaled partial at 1:2R and trailed remainder.',
    'Clean multi-timeframe confluence across D1 resistance flip and H1 order block mitigation.',
    'Patient wait for candle-close confirmation below internal liquidity shelf before execution.',
  ];
  const notesLosses = [
    'Stopped on tight structural invalidation during macro volatility spike; respected hard stop.',
    'Early anticipation ahead of full H1 candle-close confirmation; logged for post-session review.',
    'False displacement trap inside mid-range equilibrium; daily loss protocol kept risk contained.',
  ];
  const notesBreakeven = [
    'Moved stop to breakeven at +1.2R prior to US session news; stopped flat with minimal friction.',
    'Momentum stalled at opposing H4 supply; scratched position near entry before range compression.',
  ];

  const trades: TradeTransaction[] = [];
  let seq = 1;
  let cumulativeNetPnl = 0;

  for (let d = new Date(start); d <= loopEnd; d.setUTCDate(d.getUTCDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10);
    if (isWeekendDate(dateStr)) {
      continue;
    }

    // ~31% of weekdays produce a trade (~150 trades across 2025-2026)
    if (rng() > 0.31) {
      continue;
    }

    const instrument = instruments[Math.floor(rng() * instruments.length)];
    const methodology = methodologies[Math.floor(rng() * methodologies.length)];
    const session =
      instrument === 'NQ Futures'
        ? rng() > 0.3
          ? 'New York'
          : 'Overlap'
        : sessions[Math.floor(rng() * sessions.length)];
    const direction: TradingDirection = rng() > 0.47 ? 'BUY' : 'SELL';

    // Varied outcomes aligned around ~65% historical win profile
    const outcomeRoll = rng();
    const targetOutcome = outcomeRoll < 0.65 ? 'WIN' : outcomeRoll < 0.94 ? 'LOSS' : 'BREAKEVEN';

    const spec = getInstrumentSpec(instrument);
    const daysSince2025 = Math.floor((d.getTime() - start.getTime()) / 86400000);
    const progress = Math.min(1, daysSince2025 / 688);
    // Compounding sizing multiplier as account grows from $1,500 toward $6,687
    const scaleFactor = 1 + progress * 1.45;

    let entryPrice = 2750;
    let riskDist = 8;
    let lotSize = 0.04;

    if (instrument === 'XAUUSD') {
      entryPrice = Number((2640 + progress * 340 + (rng() - 0.5) * 42).toFixed(2));
      riskDist = Number((7.0 + rng() * 5.0).toFixed(2));
      lotSize = Number(Math.max(0.02, Math.round((0.03 + rng() * 0.04) * scaleFactor * 100) / 100).toFixed(2));
    } else if (instrument === 'NQ Futures') {
      entryPrice = Number((20800 + progress * 2200 + (rng() - 0.5) * 320).toFixed(2));
      riskDist = Number((18 + rng() * 14).toFixed(2));
      // 0.10 = 1 MNQ micro ($2/pt), 0.20 = 2 MNQ ($4/pt)
      lotSize = progress > 0.48 && rng() > 0.45 ? 0.2 : 0.1;
    } else if (instrument === 'USDJPY') {
      entryPrice = Number((148.5 + (rng() - 0.5) * 7.5).toFixed(3));
      riskDist = Number((0.28 + rng() * 0.2).toFixed(3));
      lotSize = Number(Math.max(0.05, Math.round((0.06 + rng() * 0.06) * scaleFactor * 100) / 100).toFixed(2));
    } else if (instrument === 'GBPUSD') {
      entryPrice = Number((1.265 + (rng() - 0.5) * 0.045).toFixed(5));
      riskDist = Number((0.002 + rng() * 0.0014).toFixed(5));
      lotSize = Number(Math.max(0.05, Math.round((0.06 + rng() * 0.06) * scaleFactor * 100) / 100).toFixed(2));
    } else {
      entryPrice = Number((1.075 + (rng() - 0.5) * 0.04).toFixed(5));
      riskDist = Number((0.0018 + rng() * 0.0012).toFixed(5));
      lotSize = Number(Math.max(0.05, Math.round((0.06 + rng() * 0.06) * scaleFactor * 100) / 100).toFixed(2));
    }

    const dirMult = direction === 'BUY' ? 1 : -1;
    const stopLoss = Number((entryPrice - dirMult * riskDist).toFixed(spec.decimals));
    const plannedR = Number((1.8 + rng() * 1.1).toFixed(2));
    const takeProfit = Number((entryPrice + dirMult * riskDist * plannedR).toFixed(spec.decimals));

    let exitPrice = entryPrice;
    if (targetOutcome === 'WIN') {
      const realizedR = Number((1.05 + rng() * 1.15).toFixed(2));
      exitPrice = Number((entryPrice + dirMult * riskDist * realizedR).toFixed(spec.decimals));
    } else if (targetOutcome === 'LOSS') {
      const lossFactor = 0.92 + rng() * 0.14;
      exitPrice = Number((entryPrice - dirMult * riskDist * lossFactor).toFixed(spec.decimals));
    } else {
      const tinySlip = (rng() - 0.35) * riskDist * 0.04;
      exitPrice = Number((entryPrice + dirMult * tinySlip).toFixed(spec.decimals));
    }

    const grossPnl = calculateGrossPnl({
      instrument,
      direction,
      entryPrice,
      exitPrice,
      lotSize,
    });

    const commission = roundCurrency(spec.defaultCommissionPerLot * lotSize);
    const swap = rng() > 0.85 ? roundCurrency(-(0.25 + rng() * 0.9) * lotSize * 5) : 0;
    const netPnl = calculateNetPnl(grossPnl, commission, swap);
    const riskRewardRatio = calculateRiskRewardRatio({
      direction,
      entryPrice,
      exitPrice,
      stopLoss,
    });
    const outcome =
      targetOutcome === 'BREAKEVEN' && Math.abs(netPnl) <= 8
        ? 'BREAKEVEN'
        : deriveTradeOutcome(netPnl, 2.5);

    const hour =
      session === 'Asian'
        ? 2 + Math.floor(rng() * 4)
        : session === 'London'
          ? 8 + Math.floor(rng() * 3)
          : session === 'Overlap'
            ? 13 + Math.floor(rng() * 2)
            : 14 + Math.floor(rng() * 4);
    const minute = Math.floor(rng() * 12) * 5;
    const tradeTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

    const notePool =
      outcome === 'WIN' ? notesWins : outcome === 'LOSS' ? notesLosses : notesBreakeven;
    const notes = notePool[Math.floor(rng() * notePool.length)];

    cumulativeNetPnl = roundCurrency(cumulativeNetPnl + netPnl);

    trades.push({
      id: seq,
      tradeId: `205R-${dateStr.slice(2, 4)}${dateStr.slice(5, 7)}-${String(seq).padStart(3, '0')}`,
      tradeDate: dateStr,
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
      screenshotUrl: null,
      notes,
      isVerified: false, // Draft historical record until owner verifies against live broker statements
      isPublished: true,
    });

    seq += 1;
  }

  // Scale lot sizes cleanly across earlier entries if cumulativeNetPnl differs substantially from target,
  // preserving exact contract-spec calculations on every single entry, then close 2026-11-19 / 2026-11-20.
  const preCloseTarget = roundCurrency(TARGET_NET_GROWTH - 95.0);
  if (cumulativeNetPnl > 0) {
    const ratio = preCloseTarget / cumulativeNetPnl;
    cumulativeNetPnl = 0;
    for (const t of trades) {
      const scaledLot = Math.max(0.01, Math.round(t.lotSize * ratio * 100) / 100);
      const spec = getInstrumentSpec(t.instrument);
      const grossPnl = calculateGrossPnl({
        instrument: t.instrument,
        direction: t.direction,
        entryPrice: t.entryPrice,
        exitPrice: t.exitPrice,
        lotSize: scaledLot,
      });
      const commission = roundCurrency(spec.defaultCommissionPerLot * scaledLot);
      const swap = t.swap !== 0 ? roundCurrency(t.swap * ratio) : 0;
      const netPnl = calculateNetPnl(grossPnl, commission, swap);
      t.lotSize = scaledLot;
      t.grossPnl = grossPnl;
      t.commission = commission;
      t.swap = swap;
      t.netPnl = netPnl;
      t.outcome = t.outcome === 'BREAKEVEN' && Math.abs(netPnl) <= 8 ? 'BREAKEVEN' : deriveTradeOutcome(netPnl, 2.5);
      cumulativeNetPnl = roundCurrency(cumulativeNetPnl + netPnl);
    }
  }

  // Closing historical cutoff trades on 2026-11-19 and 2026-11-20 so total realized Net P&L = +$5,187.09 ($6,687.09 balance)
  const remainingTotal = roundCurrency(TARGET_NET_GROWTH - cumulativeNetPnl);

  // Split remainingTotal naturally across Thu 2026-11-19 (EURUSD 0.01 lot micro-precision) & Fri 2026-11-20 (XAUUSD 0.05 lot)
  // On 2026-11-20, XAUUSD 0.05 lot moves $0.05 per $0.01 price step; 2026-11-19 XAUUSD 0.01 lot settles any $0.01 remainder.
  const nov20TargetNet = roundCurrency(Math.floor((remainingTotal - 15) * 20) / 20);
  const nov19TargetNet = roundCurrency(remainingTotal - nov20TargetNet);

  // 2026-11-19 XAUUSD 0.01 lot ($1.00 per $1 move, $0.01 per $0.01 tick)
  const nov19Entry = 2962.4;
  const nov19Commission = 0.07;
  const nov19GrossNeeded = roundCurrency(nov19TargetNet + nov19Commission);
  const nov19Exit = Number((nov19Entry + nov19GrossNeeded).toFixed(2));
  const nov19Stop = Number((nov19Entry - 8.5).toFixed(2));
  const nov19Tp = Number((nov19Entry + 17.0).toFixed(2));
  const nov19Gross = calculateGrossPnl({
    instrument: 'XAUUSD',
    direction: 'BUY',
    entryPrice: nov19Entry,
    exitPrice: nov19Exit,
    lotSize: 0.01,
  });
  const nov19Net = calculateNetPnl(nov19Gross, nov19Commission, 0);

  trades.push({
    id: seq,
    tradeId: `205R-2611-${String(seq).padStart(3, '0')}`,
    tradeDate: '2026-11-19',
    tradeTime: '13:45',
    session: 'Overlap',
    instrument: 'XAUUSD',
    direction: 'BUY',
    entryPrice: nov19Entry,
    exitPrice: nov19Exit,
    stopLoss: nov19Stop,
    takeProfit: nov19Tp,
    lotSize: 0.01,
    grossPnl: nov19Gross,
    commission: nov19Commission,
    swap: 0,
    netPnl: nov19Net,
    riskRewardRatio: calculateRiskRewardRatio({
      direction: 'BUY',
      entryPrice: nov19Entry,
      exitPrice: nov19Exit,
      stopLoss: nov19Stop,
    }),
    methodology: 'SMC',
    outcome: deriveTradeOutcome(nov19Net, 2.5),
    screenshotUrl: null,
    notes: 'Reconstructed historical cutoff setup: London/NY overlap H1 demand mitigation with scaled micro exposure.',
    isVerified: false,
    isPublished: true,
  });
  seq += 1;

  // 2026-11-20 XAUUSD 0.05 lot ($5.00 per $1 move, $0.05 per $0.01 tick)
  const nov20FinalNeeded = roundCurrency(TARGET_NET_GROWTH - cumulativeNetPnl - nov19Net);
  const nov20Entry = 2978.2;
  const nov20Commission = 0.35;
  const nov20GrossNeeded = roundCurrency(nov20FinalNeeded + nov20Commission);
  const nov20PriceDelta = Number((nov20GrossNeeded / (0.05 * 100)).toFixed(2));
  const nov20Exit = Number((nov20Entry + nov20PriceDelta).toFixed(2));
  const nov20Stop = Number((nov20Entry - 7.8).toFixed(2));
  const nov20Tp = Number((nov20Entry + 16.5).toFixed(2));
  const nov20Gross = calculateGrossPnl({
    instrument: 'XAUUSD',
    direction: 'BUY',
    entryPrice: nov20Entry,
    exitPrice: nov20Exit,
    lotSize: 0.05,
  });
  const nov20Net = calculateNetPnl(nov20Gross, nov20Commission, 0);

  trades.push({
    id: seq,
    tradeId: `205R-2611-${String(seq).padStart(3, '0')}`,
    tradeDate: '2026-11-20',
    tradeTime: '14:20',
    session: 'New York',
    instrument: 'XAUUSD',
    direction: 'BUY',
    entryPrice: nov20Entry,
    exitPrice: nov20Exit,
    stopLoss: nov20Stop,
    takeProfit: nov20Tp,
    lotSize: 0.05,
    grossPnl: nov20Gross,
    commission: nov20Commission,
    swap: 0,
    netPnl: nov20Net,
    riskRewardRatio: calculateRiskRewardRatio({
      direction: 'BUY',
      entryPrice: nov20Entry,
      exitPrice: nov20Exit,
      stopLoss: nov20Stop,
    }),
    methodology: 'ALCHEMIST',
    outcome: deriveTradeOutcome(nov20Net, 2.5),
    screenshotUrl: null,
    notes: 'Historical cutoff session (Nov 20, 2026): NY displacement continuation prior to manual entry ledger transition.',
    isVerified: false,
    isPublished: true,
  });

  return trades;
}
