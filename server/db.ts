import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type {
  AccountSettings,
  AuditLogEntry,
  PublicTradeRecord,
  RiskParameters,
  SiteContent,
  TradeTransaction,
  TradingDirection,
  TradingMethodology,
  TradingOutcome,
  TradingSession,
} from '../src/types/trading.ts';
import {
  DEFAULT_ACCOUNT_SETTINGS,
  DEFAULT_RISK_PARAMETERS,
  DEFAULT_SITE_CONTENT,
  generateHistoricalDraftTrades,
} from '../src/utils/seedTrades.ts';

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(process.cwd(), 'data');
export const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');

export function ensureDataDirectories(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export function createDatabase(dbPath?: string): DatabaseSync {
  const targetPath = dbPath ?? path.resolve(DATA_DIR, '205r.db');
  if (targetPath !== ':memory:') {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  }
  const db = new DatabaseSync(targetPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  initializeSchema(db);
  seedDefaultsIfEmpty(db);
  return db;
}

function initializeSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS auth_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      pin_hash TEXT,
      pin_salt TEXT,
      failed_attempts INTEGER NOT NULL DEFAULT 0,
      is_locked INTEGER NOT NULL DEFAULT 0,
      locked_at TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expires_at INTEGER NOT NULL,
      ip TEXT NOT NULL DEFAULT '',
      user_agent TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trade_id TEXT NOT NULL UNIQUE,
      trade_date TEXT NOT NULL,
      trade_time TEXT NOT NULL,
      session TEXT NOT NULL,
      instrument TEXT NOT NULL,
      direction TEXT NOT NULL,
      entry_price REAL NOT NULL,
      exit_price REAL NOT NULL,
      stop_loss REAL NOT NULL,
      take_profit REAL NOT NULL,
      lot_size REAL NOT NULL,
      gross_pnl REAL NOT NULL,
      commission REAL NOT NULL DEFAULT 0,
      swap REAL NOT NULL DEFAULT 0,
      net_pnl REAL NOT NULL,
      risk_reward_ratio REAL NOT NULL DEFAULT 0,
      methodology TEXT NOT NULL,
      outcome TEXT NOT NULL,
      screenshot_url TEXT,
      notes TEXT NOT NULL DEFAULT '',
      is_verified INTEGER NOT NULL DEFAULT 0,
      is_published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS account_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      starting_balance REAL NOT NULL DEFAULT 1500,
      deposits REAL NOT NULL DEFAULT 0,
      withdrawals REAL NOT NULL DEFAULT 0,
      confirmed_ending_balance REAL DEFAULT 6687.09,
      reported_win_rate_pct REAL DEFAULT 65,
      currency TEXT NOT NULL DEFAULT 'USD',
      unrealized_pnl REAL NOT NULL DEFAULT 0,
      broker_connected INTEGER NOT NULL DEFAULT 0,
      account_label TEXT NOT NULL DEFAULT '205R Primary Trading Account',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS risk_parameters (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      daily_loss_limit_pct REAL NOT NULL,
      max_risk_per_trade_pct REAL NOT NULL,
      max_drawdown_limit_pct REAL NOT NULL,
      min_rr_ratio REAL NOT NULL,
      max_concurrent_trades INTEGER NOT NULL,
      position_sizing_model TEXT NOT NULL,
      stop_loss_management_rule TEXT NOT NULL,
      take_profit_management_rule TEXT NOT NULL,
      capital_preservation_rule TEXT NOT NULL,
      trade_management_rule TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS site_content (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      actor TEXT NOT NULL,
      details TEXT NOT NULL,
      ip TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS system_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  // Safe schema migration for existing SQLite databases
  const cols = db.prepare('PRAGMA table_info(account_settings)').all() as { name: string }[];
  const colNames = new Set(cols.map((c) => c.name));
  if (!colNames.has('deposits')) {
    db.exec('ALTER TABLE account_settings ADD COLUMN deposits REAL NOT NULL DEFAULT 0;');
  }
  if (!colNames.has('withdrawals')) {
    db.exec('ALTER TABLE account_settings ADD COLUMN withdrawals REAL NOT NULL DEFAULT 0;');
  }
  if (!colNames.has('confirmed_ending_balance')) {
    db.exec('ALTER TABLE account_settings ADD COLUMN confirmed_ending_balance REAL DEFAULT 6687.09;');
  }
  if (!colNames.has('reported_win_rate_pct')) {
    db.exec('ALTER TABLE account_settings ADD COLUMN reported_win_rate_pct REAL DEFAULT 65;');
  }
}

function seedDefaultsIfEmpty(db: DatabaseSync): void {
  const authRow = db.prepare('SELECT id FROM auth_state WHERE id = 1').get();
  if (!authRow) {
    db.prepare('INSERT INTO auth_state (id, failed_attempts, is_locked) VALUES (1, 0, 0)').run();
  }

  const accRow = db.prepare('SELECT id FROM account_settings WHERE id = 1').get();
  if (!accRow) {
    db.prepare(
      `INSERT INTO account_settings (
        id, starting_balance, deposits, withdrawals, confirmed_ending_balance,
        reported_win_rate_pct, currency, unrealized_pnl, broker_connected, account_label
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      DEFAULT_ACCOUNT_SETTINGS.startingBalance,
      DEFAULT_ACCOUNT_SETTINGS.deposits,
      DEFAULT_ACCOUNT_SETTINGS.withdrawals,
      DEFAULT_ACCOUNT_SETTINGS.confirmedEndingBalance,
      DEFAULT_ACCOUNT_SETTINGS.reportedWinRatePct,
      DEFAULT_ACCOUNT_SETTINGS.currency,
      DEFAULT_ACCOUNT_SETTINGS.unrealizedPnl,
      DEFAULT_ACCOUNT_SETTINGS.brokerConnected ? 1 : 0,
      DEFAULT_ACCOUNT_SETTINGS.accountLabel
    );
  }

  const riskRow = db.prepare('SELECT id FROM risk_parameters WHERE id = 1').get();
  if (!riskRow) {
    db.prepare(
      `INSERT INTO risk_parameters (
        id, daily_loss_limit_pct, max_risk_per_trade_pct, max_drawdown_limit_pct,
        min_rr_ratio, max_concurrent_trades, position_sizing_model,
        stop_loss_management_rule, take_profit_management_rule,
        capital_preservation_rule, trade_management_rule
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      DEFAULT_RISK_PARAMETERS.dailyLossLimitPct,
      DEFAULT_RISK_PARAMETERS.maxRiskPerTradePct,
      DEFAULT_RISK_PARAMETERS.maxDrawdownLimitPct,
      DEFAULT_RISK_PARAMETERS.minRrRatio,
      DEFAULT_RISK_PARAMETERS.maxConcurrentTrades,
      DEFAULT_RISK_PARAMETERS.positionSizingModel,
      DEFAULT_RISK_PARAMETERS.stopLossManagementRule,
      DEFAULT_RISK_PARAMETERS.takeProfitManagementRule,
      DEFAULT_RISK_PARAMETERS.capitalPreservationRule,
      DEFAULT_RISK_PARAMETERS.tradeManagementRule
    );
  }

  const contentRow = db.prepare("SELECT value_json FROM site_content WHERE key = 'main'").get() as
    | { value_json: string }
    | undefined;
  if (!contentRow) {
    db.prepare("INSERT INTO site_content (key, value_json) VALUES ('main', ?)").run(
      JSON.stringify(DEFAULT_SITE_CONTENT)
    );
  } else {
    try {
      const parsed = JSON.parse(contentRow.value_json);
      if (parsed && parsed.contactEmail === 'desk@205r-research.internal') {
        parsed.contactEmail = 'paeltzy@gmail.com';
        db.prepare("UPDATE site_content SET value_json = ? WHERE key = 'main'").run(
          JSON.stringify(parsed)
        );
      }
    } catch {
      // Preserve existing JSON if unparseable
    }
  }

  const seededV2 = db.prepare("SELECT value FROM system_meta WHERE key = 'initial_seed_v2'").get() as
    | { value: string }
    | undefined;

  if (!seededV2) {
    const existingCount = (
      db.prepare('SELECT COUNT(*) as cnt FROM transactions').get() as { cnt: number }
    ).cnt;
    const manualOrVerifiedCount = (
      db
        .prepare("SELECT COUNT(*) as cnt FROM transactions WHERE is_verified = 1 OR trade_date >= '2026-11-23'")
        .get() as { cnt: number }
    ).cnt;

    if (existingCount === 0 || manualOrVerifiedCount === 0) {
      const trades = generateHistoricalDraftTrades();
      const insertStmt = db.prepare(`
        INSERT INTO transactions (
          trade_id, trade_date, trade_time, session, instrument, direction,
          entry_price, exit_price, stop_loss, take_profit, lot_size,
          gross_pnl, commission, swap, net_pnl, risk_reward_ratio,
          methodology, outcome, screenshot_url, notes, is_verified, is_published
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      db.exec('BEGIN IMMEDIATE;');
      try {
        db.exec('DELETE FROM transactions;');
        for (const t of trades) {
          insertStmt.run(
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
            t.screenshotUrl,
            t.notes,
            t.isVerified ? 1 : 0,
            t.isPublished ? 1 : 0
          );
        }
        updateAccountSettings(db, DEFAULT_ACCOUNT_SETTINGS);
        updateRiskParameters(db, DEFAULT_RISK_PARAMETERS);
        updateSiteContent(db, DEFAULT_SITE_CONTENT);
        db.prepare(
          "INSERT OR REPLACE INTO system_meta (key, value) VALUES ('initial_seed_v2', 'done')"
        ).run();
        db.exec('COMMIT;');
      } catch (err) {
        db.exec('ROLLBACK;');
        throw err;
      }
    } else {
      db.prepare("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('initial_seed_v2', 'done')").run();
    }
  }
}

interface RawTradeRow {
  id: number;
  trade_id: string;
  trade_date: string;
  trade_time: string;
  session: string;
  instrument: string;
  direction: string;
  entry_price: number;
  exit_price: number;
  stop_loss: number;
  take_profit: number;
  lot_size: number;
  gross_pnl: number;
  commission: number;
  swap: number;
  net_pnl: number;
  risk_reward_ratio: number;
  methodology: string;
  outcome: string;
  screenshot_url: string | null;
  notes: string;
  is_verified: number;
  is_published: number;
  created_at: string;
  updated_at: string;
}

function mapTradeRow(row: RawTradeRow): TradeTransaction {
  return {
    id: row.id,
    tradeId: row.trade_id,
    tradeDate: row.trade_date,
    tradeTime: row.trade_time,
    session: row.session as TradingSession,
    instrument: row.instrument,
    direction: row.direction as TradingDirection,
    entryPrice: row.entry_price,
    exitPrice: row.exit_price,
    stopLoss: row.stop_loss,
    takeProfit: row.take_profit,
    lotSize: row.lot_size,
    grossPnl: row.gross_pnl,
    commission: row.commission,
    swap: row.swap,
    netPnl: row.net_pnl,
    riskRewardRatio: row.risk_reward_ratio,
    methodology: row.methodology as TradingMethodology,
    outcome: row.outcome as TradingOutcome,
    screenshotUrl: row.screenshot_url,
    notes: row.notes,
    isVerified: row.is_verified === 1,
    isPublished: row.is_published === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listTransactions(db: DatabaseSync, options?: { publishedOnly?: boolean }): TradeTransaction[] {
  const sql = options?.publishedOnly
    ? 'SELECT * FROM transactions WHERE is_published = 1 ORDER BY trade_date ASC, trade_time ASC, id ASC'
    : 'SELECT * FROM transactions ORDER BY trade_date ASC, trade_time ASC, id ASC';
  const rows = db.prepare(sql).all() as unknown as RawTradeRow[];
  return rows.map(mapTradeRow);
}

/**
 * Server-side row/column projection for unauthenticated visitors:
 * strictly selects non-financial columns and omits lot_size, gross_pnl, commission, swap, net_pnl.
 */
export function listPublicRedactedTransactions(db: DatabaseSync): PublicTradeRecord[] {
  const rows = db
    .prepare(
      `SELECT id, trade_id, trade_date, trade_time, session, instrument, direction,
              entry_price, exit_price, stop_loss, take_profit, risk_reward_ratio,
              methodology, outcome, screenshot_url, notes, is_verified, is_published,
              created_at, updated_at
       FROM transactions
       WHERE is_published = 1
       ORDER BY trade_date ASC, trade_time ASC, id ASC`
    )
    .all() as unknown as {
    id: number;
    trade_id: string;
    trade_date: string;
    trade_time: string;
    session: string;
    instrument: string;
    direction: string;
    entry_price: number;
    exit_price: number;
    stop_loss: number;
    take_profit: number;
    risk_reward_ratio: number;
    methodology: string;
    outcome: string;
    screenshot_url: string | null;
    notes: string;
    is_verified: number;
    is_published: number;
    created_at: string;
    updated_at: string;
  }[];

  return rows.map((row) => ({
    id: row.id,
    tradeId: row.trade_id,
    tradeDate: row.trade_date,
    tradeTime: row.trade_time,
    session: row.session as TradingSession,
    instrument: row.instrument,
    direction: row.direction as TradingDirection,
    entryPrice: row.entry_price,
    exitPrice: row.exit_price,
    stopLoss: row.stop_loss,
    takeProfit: row.take_profit,
    lotSize: null,
    grossPnl: null,
    commission: null,
    swap: null,
    netPnl: null,
    riskRewardRatio: row.risk_reward_ratio,
    methodology: row.methodology as TradingMethodology,
    outcome: row.outcome as TradingOutcome,
    screenshotUrl: row.screenshot_url,
    notes: row.notes,
    isVerified: row.is_verified === 1,
    isPublished: row.is_published === 1,
    financialsRedacted: true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export function getTransactionById(db: DatabaseSync, id: number): TradeTransaction | null {
  const row = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as unknown as RawTradeRow | undefined;
  return row ? mapTradeRow(row) : null;
}

export function createTransaction(
  db: DatabaseSync,
  input: Omit<TradeTransaction, 'id' | 'createdAt' | 'updatedAt'>
): TradeTransaction {
  const info = db
    .prepare(
      `INSERT INTO transactions (
        trade_id, trade_date, trade_time, session, instrument, direction,
        entry_price, exit_price, stop_loss, take_profit, lot_size,
        gross_pnl, commission, swap, net_pnl, risk_reward_ratio,
        methodology, outcome, screenshot_url, notes, is_verified, is_published
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.tradeId,
      input.tradeDate,
      input.tradeTime,
      input.session,
      input.instrument,
      input.direction,
      input.entryPrice,
      input.exitPrice,
      input.stopLoss,
      input.takeProfit,
      input.lotSize,
      input.grossPnl,
      input.commission,
      input.swap,
      input.netPnl,
      input.riskRewardRatio,
      input.methodology,
      input.outcome,
      input.screenshotUrl,
      input.notes,
      input.isVerified ? 1 : 0,
      input.isPublished ? 1 : 0
    );

  const created = getTransactionById(db, Number(info.lastInsertRowid));
  if (!created) {
    throw new Error('Failed to retrieve newly created transaction.');
  }
  return created;
}

export function updateTransaction(
  db: DatabaseSync,
  id: number,
  input: Omit<TradeTransaction, 'id' | 'createdAt' | 'updatedAt'>
): TradeTransaction | null {
  const info = db
    .prepare(
      `UPDATE transactions SET
        trade_id = ?, trade_date = ?, trade_time = ?, session = ?, instrument = ?, direction = ?,
        entry_price = ?, exit_price = ?, stop_loss = ?, take_profit = ?, lot_size = ?,
        gross_pnl = ?, commission = ?, swap = ?, net_pnl = ?, risk_reward_ratio = ?,
        methodology = ?, outcome = ?, screenshot_url = ?, notes = ?,
        is_verified = ?, is_published = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .run(
      input.tradeId,
      input.tradeDate,
      input.tradeTime,
      input.session,
      input.instrument,
      input.direction,
      input.entryPrice,
      input.exitPrice,
      input.stopLoss,
      input.takeProfit,
      input.lotSize,
      input.grossPnl,
      input.commission,
      input.swap,
      input.netPnl,
      input.riskRewardRatio,
      input.methodology,
      input.outcome,
      input.screenshotUrl,
      input.notes,
      input.isVerified ? 1 : 0,
      input.isPublished ? 1 : 0,
      id
    );

  if (info.changes === 0) return null;
  return getTransactionById(db, id);
}

export function deleteTransaction(db: DatabaseSync, id: number): boolean {
  const info = db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
  return info.changes > 0;
}

export function getAccountSettings(db: DatabaseSync): AccountSettings {
  const row = db.prepare('SELECT * FROM account_settings WHERE id = 1').get() as {
    starting_balance: number;
    deposits: number;
    withdrawals: number;
    confirmed_ending_balance: number | null;
    reported_win_rate_pct: number | null;
    currency: string;
    unrealized_pnl: number;
    broker_connected: number;
    account_label: string;
    updated_at: string;
  };
  return {
    startingBalance: row.starting_balance,
    deposits: row.deposits ?? 0,
    withdrawals: row.withdrawals ?? 0,
    confirmedEndingBalance: row.confirmed_ending_balance ?? null,
    reportedWinRatePct: row.reported_win_rate_pct ?? null,
    currency: row.currency,
    unrealizedPnl: row.unrealized_pnl,
    brokerConnected: row.broker_connected === 1,
    accountLabel: row.account_label,
    updatedAt: row.updated_at,
  };
}

export function updateAccountSettings(db: DatabaseSync, next: AccountSettings): AccountSettings {
  db.prepare(
    `UPDATE account_settings SET
      starting_balance = ?, deposits = ?, withdrawals = ?,
      confirmed_ending_balance = ?, reported_win_rate_pct = ?,
      currency = ?, unrealized_pnl = ?,
      broker_connected = ?, account_label = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = 1`
  ).run(
    next.startingBalance,
    next.deposits ?? 0,
    next.withdrawals ?? 0,
    next.confirmedEndingBalance ?? null,
    next.reportedWinRatePct ?? null,
    next.currency,
    next.unrealizedPnl,
    next.brokerConnected ? 1 : 0,
    next.accountLabel
  );
  return getAccountSettings(db);
}

export function getRiskParameters(db: DatabaseSync): RiskParameters {
  const row = db.prepare('SELECT * FROM risk_parameters WHERE id = 1').get() as {
    daily_loss_limit_pct: number;
    max_risk_per_trade_pct: number;
    max_drawdown_limit_pct: number;
    min_rr_ratio: number;
    max_concurrent_trades: number;
    position_sizing_model: string;
    stop_loss_management_rule: string;
    take_profit_management_rule: string;
    capital_preservation_rule: string;
    trade_management_rule: string;
    updated_at: string;
  };
  return {
    dailyLossLimitPct: row.daily_loss_limit_pct,
    maxRiskPerTradePct: row.max_risk_per_trade_pct,
    maxDrawdownLimitPct: row.max_drawdown_limit_pct,
    minRrRatio: row.min_rr_ratio,
    maxConcurrentTrades: row.max_concurrent_trades,
    positionSizingModel: row.position_sizing_model,
    stopLossManagementRule: row.stop_loss_management_rule,
    takeProfitManagementRule: row.take_profit_management_rule,
    capitalPreservationRule: row.capital_preservation_rule,
    tradeManagementRule: row.trade_management_rule,
    updatedAt: row.updated_at,
  };
}

export function updateRiskParameters(db: DatabaseSync, next: RiskParameters): RiskParameters {
  db.prepare(
    `UPDATE risk_parameters SET
      daily_loss_limit_pct = ?, max_risk_per_trade_pct = ?, max_drawdown_limit_pct = ?,
      min_rr_ratio = ?, max_concurrent_trades = ?, position_sizing_model = ?,
      stop_loss_management_rule = ?, take_profit_management_rule = ?,
      capital_preservation_rule = ?, trade_management_rule = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = 1`
  ).run(
    next.dailyLossLimitPct,
    next.maxRiskPerTradePct,
    next.maxDrawdownLimitPct,
    next.minRrRatio,
    next.maxConcurrentTrades,
    next.positionSizingModel,
    next.stopLossManagementRule,
    next.takeProfitManagementRule,
    next.capitalPreservationRule,
    next.tradeManagementRule
  );
  return getRiskParameters(db);
}

export function getSiteContent(db: DatabaseSync): SiteContent {
  const row = db.prepare("SELECT value_json FROM site_content WHERE key = 'main'").get() as
    | { value_json: string }
    | undefined;
  if (!row) return DEFAULT_SITE_CONTENT;
  try {
    return { ...DEFAULT_SITE_CONTENT, ...JSON.parse(row.value_json) };
  } catch {
    return DEFAULT_SITE_CONTENT;
  }
}

export function updateSiteContent(db: DatabaseSync, next: SiteContent): SiteContent {
  db.prepare(
    `INSERT INTO site_content (key, value_json, updated_at) VALUES ('main', ?, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = CURRENT_TIMESTAMP`
  ).run(JSON.stringify(next));
  return getSiteContent(db);
}

export function writeAuditLog(
  db: DatabaseSync,
  entry: { eventType: string; actor: string; details: string; ip?: string }
): void {
  db.prepare(
    'INSERT INTO audit_logs (event_type, actor, details, ip) VALUES (?, ?, ?, ?)'
  ).run(entry.eventType, entry.actor, entry.details, entry.ip ?? '');
}

export function listAuditLogs(db: DatabaseSync, limit = 150): AuditLogEntry[] {
  const rows = db
    .prepare('SELECT id, event_type, actor, details, ip, created_at FROM audit_logs ORDER BY id DESC LIMIT ?')
    .all(limit) as unknown as {
    id: number;
    event_type: string;
    actor: string;
    details: string;
    ip: string;
    created_at: string;
  }[];
  return rows.map((r) => ({
    id: r.id,
    eventType: r.event_type,
    actor: r.actor,
    details: r.details,
    ip: r.ip,
    createdAt: r.created_at,
  }));
}

export interface BackupPayload {
  version: string;
  exportedAt: string;
  accountSettings: AccountSettings;
  riskParameters: RiskParameters;
  siteContent: SiteContent;
  transactions: TradeTransaction[];
}

export function exportDatabaseBackup(db: DatabaseSync): BackupPayload {
  return {
    version: '205R-backup-v1',
    exportedAt: new Date().toISOString(),
    accountSettings: getAccountSettings(db),
    riskParameters: getRiskParameters(db),
    siteContent: getSiteContent(db),
    transactions: listTransactions(db, { publishedOnly: false }),
  };
}

export function restoreDatabaseBackup(db: DatabaseSync, backup: BackupPayload): number {
  const insertStmt = db.prepare(`
    INSERT INTO transactions (
      trade_id, trade_date, trade_time, session, instrument, direction,
      entry_price, exit_price, stop_loss, take_profit, lot_size,
      gross_pnl, commission, swap, net_pnl, risk_reward_ratio,
      methodology, outcome, screenshot_url, notes, is_verified, is_published
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.exec('BEGIN IMMEDIATE;');
  try {
    db.exec('DELETE FROM transactions;');
    for (const t of backup.transactions) {
      insertStmt.run(
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
        t.screenshotUrl ?? null,
        t.notes ?? '',
        t.isVerified ? 1 : 0,
        t.isPublished === false ? 0 : 1
      );
    }
    updateAccountSettings(db, backup.accountSettings);
    updateRiskParameters(db, backup.riskParameters);
    updateSiteContent(db, backup.siteContent);
    db.exec('COMMIT;');
    return backup.transactions.length;
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}
