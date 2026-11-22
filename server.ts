import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import express, { type NextFunction, type Request, type Response } from 'express';
import {
  UPLOADS_DIR,
  createDatabase,
  createTransaction,
  deleteTransaction,
  ensureDataDirectories,
  exportDatabaseBackup,
  getAccountSettings,
  getRiskParameters,
  getSiteContent,
  getTransactionById,
  listAuditLogs,
  listPublicRedactedTransactions,
  listTransactions,
  restoreDatabaseBackup,
  updateAccountSettings,
  updateRiskParameters,
  updateSiteContent,
  updateTransaction,
  writeAuditLog,
  type BackupPayload,
} from './server/db.ts';
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  attemptPinLogin,
  changeOwnerPin,
  getAuthStatus,
  parseCookieHeader,
  revokeSessionToken,
  setupInitialPin,
  verifySessionToken,
} from './server/auth.ts';
import type {
  AccountSettings,
  RiskParameters,
  SiteContent,
  TradeTransaction,
  TradingDirection,
  TradingMethodology,
  TradingOutcome,
  TradingSession,
} from './src/types/trading.ts';
import {
  calculateGrossPnl,
  calculateNetPnl,
  calculateRiskRewardRatio,
  computePerformanceSummary,
  computePublicPortfolioSummary,
  deriveTradeOutcome,
  parseCsvToTrades,
  serializeTradesToCsv,
} from './src/utils/tradingEngine.ts';

dotenv.config();
ensureDataDirectories();

const db = createDatabase();
const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));

// Simple sliding-window rate limiter for auth endpoints
const authRateBuckets = new Map<string, number[]>();
function checkAuthRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60_000;
  const maxRequests = 20;
  const timestamps = (authRateBuckets.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (timestamps.length >= maxRequests) {
    authRateBuckets.set(ip, timestamps);
    return false;
  }
  timestamps.push(now);
  authRateBuckets.set(ip, timestamps);
  return true;
}

function getClientIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) {
    return fwd.split(',')[0].trim();
  }
  return req.ip || '127.0.0.1';
}

function extractSessionToken(req: Request): string | null {
  const cookies = parseCookieHeader(req.headers.cookie);
  if (cookies[SESSION_COOKIE_NAME]) {
    return cookies[SESSION_COOKIE_NAME];
  }
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
}

function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    partitioned: true,
    path: '/',
    maxAge: SESSION_TTL_MS,
  });
}

function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    partitioned: true,
    path: '/',
  });
}

function verifyCsrfOrigin(req: Request): boolean {
  if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
    return true;
  }
  const origin = req.headers.origin;
  if (!origin) return true;
  const expectedHost = (req.headers['x-forwarded-host'] as string) || req.headers.host || '';
  try {
    const parsed = new URL(origin);
    return parsed.host === expectedHost;
  } catch {
    return false;
  }
}

function requireOwnerAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractSessionToken(req);
  if (!token || !verifySessionToken(db, token)) {
    res.status(401).json({ error: 'Owner authentication required.' });
    return;
  }
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && !verifyCsrfOrigin(req)) {
    res.status(403).json({ error: 'Invalid request origin.' });
    return;
  }
  next();
}

const VALID_DIRECTIONS = new Set<TradingDirection>(['BUY', 'SELL']);
const VALID_SESSIONS = new Set<TradingSession>(['Asian', 'London', 'New York', 'Overlap']);
const VALID_METHODOLOGIES = new Set<TradingMethodology>([
  'SNR',
  'SND',
  'Price Action',
  'ICT',
  'SMC',
  'ALCHEMIST',
]);
const VALID_OUTCOMES = new Set<TradingOutcome>(['WIN', 'LOSS', 'BREAKEVEN']);

function normalizeTradePayload(
  body: Record<string, unknown>,
  fallbackId?: string
): { ok: true; data: Omit<TradeTransaction, 'id' | 'createdAt' | 'updatedAt'> } | { ok: false; error: string } {
  const tradeDate = String(body.tradeDate ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tradeDate)) {
    return { ok: false, error: 'Valid tradeDate (YYYY-MM-DD) is required.' };
  }
  const tradeTime = String(body.tradeTime ?? '12:00').trim();
  if (!/^\d{2}:\d{2}$/.test(tradeTime)) {
    return { ok: false, error: 'Valid tradeTime (HH:MM) is required.' };
  }
  const instrument = String(body.instrument ?? '').trim();
  if (!instrument) {
    return { ok: false, error: 'Instrument is required.' };
  }
  const direction = String(body.direction ?? 'BUY').toUpperCase() as TradingDirection;
  if (!VALID_DIRECTIONS.has(direction)) {
    return { ok: false, error: 'Direction must be BUY or SELL.' };
  }
  const session = (String(body.session ?? 'New York').trim()) as TradingSession;
  if (!VALID_SESSIONS.has(session)) {
    return { ok: false, error: 'Invalid trading session.' };
  }
  const methodology = (String(body.methodology ?? 'Price Action').trim()) as TradingMethodology;
  if (!VALID_METHODOLOGIES.has(methodology)) {
    return { ok: false, error: 'Invalid trading methodology.' };
  }

  const entryPrice = Number(body.entryPrice);
  const exitPrice = Number(body.exitPrice);
  const stopLoss = Number(body.stopLoss);
  const takeProfit = Number(body.takeProfit);
  const lotSize = Number(body.lotSize);
  const commission = Number(body.commission ?? 0);
  const swap = Number(body.swap ?? 0);

  if (
    !Number.isFinite(entryPrice) ||
    !Number.isFinite(exitPrice) ||
    !Number.isFinite(stopLoss) ||
    !Number.isFinite(takeProfit) ||
    !Number.isFinite(lotSize) ||
    lotSize <= 0 ||
    !Number.isFinite(commission) ||
    !Number.isFinite(swap)
  ) {
    return { ok: false, error: 'Numeric price, lotSize, commission, and swap values are required.' };
  }

  const grossPnl =
    body.grossPnl !== undefined && body.grossPnl !== '' && Number.isFinite(Number(body.grossPnl))
      ? Number(body.grossPnl)
      : calculateGrossPnl({ instrument, direction, entryPrice, exitPrice, lotSize });

  const netPnl =
    body.netPnl !== undefined && body.netPnl !== '' && Number.isFinite(Number(body.netPnl))
      ? Number(body.netPnl)
      : calculateNetPnl(grossPnl, commission, swap);

  const riskRewardRatio =
    body.riskRewardRatio !== undefined &&
    body.riskRewardRatio !== '' &&
    Number.isFinite(Number(body.riskRewardRatio))
      ? Number(body.riskRewardRatio)
      : calculateRiskRewardRatio({ direction, entryPrice, exitPrice, stopLoss });

  const outcomeRaw = String(body.outcome ?? '').toUpperCase() as TradingOutcome;
  const outcome = VALID_OUTCOMES.has(outcomeRaw) ? outcomeRaw : deriveTradeOutcome(netPnl);

  const rawTradeId = String(body.tradeId ?? '').trim();
  const tradeId =
    rawTradeId ||
    fallbackId ||
    `205R-${tradeDate.replace(/-/g, '')}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

  let screenshotUrl: string | null = null;
  if (typeof body.screenshotUrl === 'string' && body.screenshotUrl.trim().length > 0) {
    const candidate = body.screenshotUrl.trim();
    if (candidate.startsWith('/api/uploads/')) {
      screenshotUrl = candidate;
    }
  }

  return {
    ok: true,
    data: {
      tradeId,
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
      screenshotUrl,
      notes: String(body.notes ?? '').slice(0, 4000),
      isVerified: Boolean(body.isVerified),
      isPublished: body.isPublished === undefined ? true : Boolean(body.isPublished),
    },
  };
}

// ---------- PUBLIC READ-ONLY ROUTES ----------

app.get('/api/portfolio', (req, res) => {
  const token = extractSessionToken(req);
  const isOwner = Boolean(token && verifySessionToken(db, token));
  const account = getAccountSettings(db);
  const riskParameters = getRiskParameters(db);
  const siteContent = getSiteContent(db);

  if (!isOwner) {
    // Server-side enforcement: visitors only receive row/column-redacted non-financial metadata
    const publicTrades = listPublicRedactedTransactions(db);
    const publicSummary = computePublicPortfolioSummary(publicTrades, account);
    res.json({
      authenticated: false,
      currency: account.currency,
      transactions: publicTrades,
      account: null,
      riskParameters,
      siteContent,
      performance: null,
      publicSummary,
    });
    return;
  }

  const transactions = listTransactions(db, { publishedOnly: true });
  const performance = computePerformanceSummary(transactions, account);
  const publicSummary = computePublicPortfolioSummary(transactions, account);

  res.json({
    authenticated: true,
    currency: account.currency,
    transactions,
    account,
    riskParameters,
    siteContent,
    performance,
    publicSummary,
  });
});

app.get('/api/uploads/:filename', (req, res) => {
  const rawName = path.basename(req.params.filename || '');
  if (!rawName || !/^[a-zA-Z0-9._-]+$/.test(rawName)) {
    res.status(400).json({ error: 'Invalid file name.' });
    return;
  }
  const resolved = path.resolve(UPLOADS_DIR, rawName);
  if (!resolved.startsWith(UPLOADS_DIR + path.sep)) {
    res.status(403).json({ error: 'Access denied.' });
    return;
  }
  if (!fs.existsSync(resolved)) {
    res.status(404).json({ error: 'Image not found.' });
    return;
  }
  res.sendFile(resolved);
});

// ---------- AUTHENTICATION ROUTES (PIN ONLY) ----------

app.get('/api/auth/status', (req, res) => {
  const token = extractSessionToken(req);
  res.json(getAuthStatus(db, token));
});

app.post('/api/auth/setup', (req, res) => {
  const ip = getClientIp(req);
  if (!checkAuthRateLimit(ip)) {
    res.status(429).json({ error: 'Too many requests. Wait before retrying.' });
    return;
  }
  const pin = String(req.body?.pin ?? '');
  const result = setupInitialPin(db, pin, ip, String(req.headers['user-agent'] ?? ''));
  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return;
  }
  setSessionCookie(res, result.token);
  res.status(201).json({
    authenticated: true,
    status: getAuthStatus(db, result.token),
  });
});

app.post('/api/auth/login', (req, res) => {
  const ip = getClientIp(req);
  if (!checkAuthRateLimit(ip)) {
    res.status(429).json({ error: 'Too many authentication attempts. Please wait.' });
    return;
  }
  const pin = String(req.body?.pin ?? '');
  const result = attemptPinLogin(db, pin, ip, String(req.headers['user-agent'] ?? ''));
  if (!result.ok) {
    res.status(result.status).json({
      error: result.error,
      isLocked: result.isLocked,
      failedAttempts: result.failedAttempts,
      attemptsRemaining: result.attemptsRemaining,
    });
    return;
  }
  setSessionCookie(res, result.token);
  res.json({
    authenticated: true,
    status: getAuthStatus(db, result.token),
  });
});

app.post('/api/auth/logout', (req, res) => {
  const token = extractSessionToken(req);
  if (token) {
    revokeSessionToken(db, token);
    writeAuditLog(db, {
      eventType: 'LOGOUT',
      actor: 'owner',
      details: 'Owner session terminated.',
      ip: getClientIp(req),
    });
  }
  clearSessionCookie(res);
  res.json({ authenticated: false });
});

// ---------- PROTECTED OWNER ADMIN ROUTES ----------

app.get('/api/admin/overview', requireOwnerAuth, (_req, res) => {
  const transactions = listTransactions(db, { publishedOnly: false });
  const account = getAccountSettings(db);
  const riskParameters = getRiskParameters(db);
  const siteContent = getSiteContent(db);
  const performance = computePerformanceSummary(transactions, account);
  const auditLogs = listAuditLogs(db, 200);

  res.json({
    transactions,
    account,
    riskParameters,
    siteContent,
    performance,
    auditLogs,
  });
});

app.post('/api/admin/transactions', requireOwnerAuth, (req, res) => {
  const normalized = normalizeTradePayload(req.body ?? {});
  if (!normalized.ok) {
    res.status(400).json({ error: normalized.error });
    return;
  }
  try {
    const created = createTransaction(db, normalized.data);
    writeAuditLog(db, {
      eventType: 'TRANSACTION_CREATED',
      actor: 'owner',
      details: `Created ${created.tradeId} (${created.instrument} ${created.direction}, Net P&L: ${created.netPnl})`,
      ip: getClientIp(req),
    });
    res.status(201).json({ transaction: created });
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : 'Unable to create transaction.',
    });
  }
});

app.put('/api/admin/transactions/:id', requireOwnerAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid transaction ID.' });
    return;
  }
  const existing = getTransactionById(db, id);
  if (!existing) {
    res.status(404).json({ error: 'Transaction not found.' });
    return;
  }

  const normalized = normalizeTradePayload(req.body ?? {}, existing.tradeId);
  if (!normalized.ok) {
    res.status(400).json({ error: normalized.error });
    return;
  }

  try {
    const updated = updateTransaction(db, id, normalized.data);
    if (!updated) {
      res.status(404).json({ error: 'Transaction not found.' });
      return;
    }
    writeAuditLog(db, {
      eventType: 'TRANSACTION_UPDATED',
      actor: 'owner',
      details: `Updated ${updated.tradeId} (${updated.instrument}, Net P&L: ${updated.netPnl}, Verified: ${updated.isVerified})`,
      ip: getClientIp(req),
    });
    res.json({ transaction: updated });
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : 'Unable to update transaction.',
    });
  }
});

app.delete('/api/admin/transactions/:id', requireOwnerAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid transaction ID.' });
    return;
  }
  const existing = getTransactionById(db, id);
  if (!existing) {
    res.status(404).json({ error: 'Transaction not found.' });
    return;
  }
  const deleted = deleteTransaction(db, id);
  if (!deleted) {
    res.status(404).json({ error: 'Transaction not found.' });
    return;
  }
  writeAuditLog(db, {
    eventType: 'TRANSACTION_DELETED',
    actor: 'owner',
    details: `Deleted ${existing.tradeId} (${existing.instrument} on ${existing.tradeDate})`,
    ip: getClientIp(req),
  });
  res.json({ deleted: true, id });
});

app.post('/api/admin/transactions/import-csv', requireOwnerAuth, (req, res) => {
  const csvText = String(req.body?.csvText ?? '');
  const replaceExisting = Boolean(req.body?.replaceExisting);
  if (!csvText.trim()) {
    res.status(400).json({ error: 'CSV content is empty.' });
    return;
  }

  const parsed = parseCsvToTrades(csvText);
  if (parsed.errors.length > 0 && parsed.trades.length === 0) {
    res.status(400).json({ error: parsed.errors[0], errors: parsed.errors });
    return;
  }

  let importedCount = 0;
  db.exec('BEGIN IMMEDIATE;');
  try {
    if (replaceExisting) {
      db.exec('DELETE FROM transactions;');
    }
    for (const item of parsed.trades) {
      createTransaction(db, {
        ...item,
        tradeId: replaceExisting
          ? item.tradeId
          : `${item.tradeId}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
        screenshotUrl: null,
        isPublished: true,
      });
      importedCount += 1;
    }
    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    res.status(400).json({
      error: err instanceof Error ? err.message : 'CSV import failed.',
    });
    return;
  }

  writeAuditLog(db, {
    eventType: 'CSV_IMPORTED',
    actor: 'owner',
    details: `Imported ${importedCount} transactions via CSV (replaceExisting=${replaceExisting}).`,
    ip: getClientIp(req),
  });

  res.json({ importedCount, warnings: parsed.errors });
});

app.get('/api/admin/transactions/export-csv', requireOwnerAuth, (_req, res) => {
  const trades = listTransactions(db, { publishedOnly: false });
  const csv = serializeTradesToCsv(trades);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="205r-trading-journal.csv"');
  res.send(csv);
});

app.post('/api/admin/uploads', requireOwnerAuth, (req, res) => {
  const mimeType = String(req.body?.mimeType ?? '').toLowerCase();
  const dataBase64 = String(req.body?.dataBase64 ?? '');
  const allowedMimes: Record<string, string> = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/webp': '.webp',
  };
  const ext = allowedMimes[mimeType];
  if (!ext) {
    res.status(400).json({ error: 'Only PNG, JPEG, and WebP images are permitted.' });
    return;
  }

  const base64Body = dataBase64.includes(',') ? dataBase64.split(',')[1] : dataBase64;
  const buffer = Buffer.from(base64Body, 'base64');
  if (buffer.length === 0 || buffer.length > 5 * 1024 * 1024) {
    res.status(400).json({ error: 'Screenshot file must be non-empty and under 5 MB.' });
    return;
  }

  const fileName = `trade-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
  const targetPath = path.resolve(UPLOADS_DIR, fileName);
  if (!targetPath.startsWith(UPLOADS_DIR + path.sep)) {
    res.status(403).json({ error: 'Invalid upload destination.' });
    return;
  }

  fs.writeFileSync(targetPath, buffer);
  writeAuditLog(db, {
    eventType: 'SCREENSHOT_UPLOADED',
    actor: 'owner',
    details: `Uploaded chart screenshot ${fileName} (${buffer.length} bytes).`,
    ip: getClientIp(req),
  });

  res.status(201).json({ url: `/api/uploads/${fileName}`, filename: fileName });
});

app.delete('/api/admin/uploads/:filename', requireOwnerAuth, (req, res) => {
  const rawName = path.basename(req.params.filename || '');
  if (!rawName || !/^[a-zA-Z0-9._-]+$/.test(rawName)) {
    res.status(400).json({ error: 'Invalid filename.' });
    return;
  }
  const targetPath = path.resolve(UPLOADS_DIR, rawName);
  if (!targetPath.startsWith(UPLOADS_DIR + path.sep)) {
    res.status(403).json({ error: 'Access denied.' });
    return;
  }
  if (fs.existsSync(targetPath)) {
    fs.unlinkSync(targetPath);
  }
  db.prepare('UPDATE transactions SET screenshot_url = NULL WHERE screenshot_url = ?').run(
    `/api/uploads/${rawName}`
  );
  writeAuditLog(db, {
    eventType: 'SCREENSHOT_DELETED',
    actor: 'owner',
    details: `Deleted screenshot ${rawName}.`,
    ip: getClientIp(req),
  });
  res.json({ deleted: true });
});

app.put('/api/admin/account', requireOwnerAuth, (req, res) => {
  const current = getAccountSettings(db);
  const startingBalance = Number(req.body?.startingBalance);
  const deposits = Number(req.body?.deposits ?? current.deposits ?? 0);
  const withdrawals = Number(req.body?.withdrawals ?? current.withdrawals ?? 0);
  const unrealizedPnl = Number(req.body?.unrealizedPnl ?? current.unrealizedPnl);

  const rawConfirmed = req.body?.confirmedEndingBalance;
  const confirmedEndingBalance =
    rawConfirmed === null || rawConfirmed === ''
      ? null
      : Number.isFinite(Number(rawConfirmed))
        ? Number(rawConfirmed)
        : current.confirmedEndingBalance;

  const rawWinRate = req.body?.reportedWinRatePct;
  const reportedWinRatePct =
    rawWinRate === null || rawWinRate === ''
      ? null
      : Number.isFinite(Number(rawWinRate))
        ? Math.min(100, Math.max(0, Number(rawWinRate)))
        : current.reportedWinRatePct;

  if (
    !Number.isFinite(startingBalance) ||
    startingBalance < 0 ||
    !Number.isFinite(deposits) ||
    deposits < 0 ||
    !Number.isFinite(withdrawals) ||
    withdrawals < 0
  ) {
    res.status(400).json({ error: 'Valid non-negative startingBalance, deposits, and withdrawals are required.' });
    return;
  }

  const next: AccountSettings = {
    startingBalance,
    deposits,
    withdrawals,
    confirmedEndingBalance,
    reportedWinRatePct,
    currency: String(req.body?.currency ?? current.currency).trim().toUpperCase().slice(0, 8) || 'USD',
    unrealizedPnl: Number.isFinite(unrealizedPnl) ? unrealizedPnl : 0,
    brokerConnected: Boolean(req.body?.brokerConnected),
    accountLabel: String(req.body?.accountLabel ?? current.accountLabel).trim().slice(0, 120),
  };
  const updated = updateAccountSettings(db, next);
  writeAuditLog(db, {
    eventType: 'ACCOUNT_UPDATED',
    actor: 'owner',
    details: `Updated account (Start: ${updated.startingBalance}, Deposits: ${updated.deposits}, Withdrawals: ${updated.withdrawals}, Reported WR: ${updated.reportedWinRatePct ?? 'auto'}%).`,
    ip: getClientIp(req),
  });
  res.json({ account: updated });
});

app.put('/api/admin/risk', requireOwnerAuth, (req, res) => {
  const b = req.body ?? {};
  const next: RiskParameters = {
    dailyLossLimitPct: Number(b.dailyLossLimitPct),
    maxRiskPerTradePct: Number(b.maxRiskPerTradePct),
    maxDrawdownLimitPct: Number(b.maxDrawdownLimitPct),
    minRrRatio: Number(b.minRrRatio),
    maxConcurrentTrades: Math.max(1, Math.round(Number(b.maxConcurrentTrades))),
    positionSizingModel: String(b.positionSizingModel ?? '').trim(),
    stopLossManagementRule: String(b.stopLossManagementRule ?? '').trim(),
    takeProfitManagementRule: String(b.takeProfitManagementRule ?? '').trim(),
    capitalPreservationRule: String(b.capitalPreservationRule ?? '').trim(),
    tradeManagementRule: String(b.tradeManagementRule ?? '').trim(),
  };

  if (
    !Number.isFinite(next.dailyLossLimitPct) ||
    !Number.isFinite(next.maxRiskPerTradePct) ||
    !Number.isFinite(next.maxDrawdownLimitPct) ||
    !Number.isFinite(next.minRrRatio) ||
    !Number.isFinite(next.maxConcurrentTrades)
  ) {
    res.status(400).json({ error: 'All numeric risk parameters must be valid numbers.' });
    return;
  }

  const updated = updateRiskParameters(db, next);
  writeAuditLog(db, {
    eventType: 'RISK_UPDATED',
    actor: 'owner',
    details: `Risk parameters updated (Daily Limit ${updated.dailyLossLimitPct}%, Max Risk ${updated.maxRiskPerTradePct}%).`,
    ip: getClientIp(req),
  });
  res.json({ riskParameters: updated });
});

app.put('/api/admin/content', requireOwnerAuth, (req, res) => {
  const current = getSiteContent(db);
  const b = req.body ?? {};
  const next: SiteContent = {
    heroHeadline: String(b.heroHeadline ?? current.heroHeadline),
    heroSubheadline: String(b.heroSubheadline ?? current.heroSubheadline),
    aboutSummary: String(b.aboutSummary ?? current.aboutSummary),
    philosophyStatement: String(b.philosophyStatement ?? current.philosophyStatement),
    corePrinciples: Array.isArray(b.corePrinciples)
      ? b.corePrinciples.map((x: unknown) => String(x)).filter(Boolean)
      : current.corePrinciples,
    timeline: Array.isArray(b.timeline) ? b.timeline : current.timeline,
    methodologies: Array.isArray(b.methodologies) ? b.methodologies : current.methodologies,
    markets: Array.isArray(b.markets) ? b.markets : current.markets,
    contactEmail: String(b.contactEmail ?? current.contactEmail),
    contactLocation: String(b.contactLocation ?? current.contactLocation),
    socialLinks: Array.isArray(b.socialLinks) ? b.socialLinks : current.socialLinks,
    disclaimer: String(b.disclaimer ?? current.disclaimer),
  };

  const updated = updateSiteContent(db, next);
  writeAuditLog(db, {
    eventType: 'CONTENT_UPDATED',
    actor: 'owner',
    details: 'Site brand content, methodologies, or settings updated.',
    ip: getClientIp(req),
  });
  res.json({ siteContent: updated });
});

app.put('/api/admin/pin', requireOwnerAuth, (req, res) => {
  const currentPin = String(req.body?.currentPin ?? '');
  const newPin = String(req.body?.newPin ?? '');
  const result = changeOwnerPin(db, currentPin, newPin, getClientIp(req));
  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return;
  }
  res.json({ updated: true });
});

app.get('/api/admin/backup', requireOwnerAuth, (req, res) => {
  const payload = exportDatabaseBackup(db);
  writeAuditLog(db, {
    eventType: 'BACKUP_EXPORTED',
    actor: 'owner',
    details: `Exported JSON database backup (${payload.transactions.length} transactions).`,
    ip: getClientIp(req),
  });
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="205r-backup.json"');
  res.send(JSON.stringify(payload, null, 2));
});

app.post('/api/admin/restore', requireOwnerAuth, (req, res) => {
  const backup = req.body as BackupPayload | undefined;
  if (
    !backup ||
    !Array.isArray(backup.transactions) ||
    !backup.accountSettings ||
    !backup.riskParameters ||
    !backup.siteContent
  ) {
    res.status(400).json({ error: 'Invalid 205R backup JSON payload.' });
    return;
  }
  try {
    const restoredCount = restoreDatabaseBackup(db, backup);
    writeAuditLog(db, {
      eventType: 'BACKUP_RESTORED',
      actor: 'owner',
      details: `Restored backup containing ${restoredCount} transactions.`,
      ip: getClientIp(req),
    });
    res.json({ restoredCount });
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : 'Backup restore failed.',
    });
  }
});

app.get('/api/admin/audit-logs', requireOwnerAuth, (_req, res) => {
  res.json({ auditLogs: listAuditLogs(db, 200) });
});

// ---------- VITE / STATIC FRONTEND SERVING ----------

async function startServer() {
  const port = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[205R] Midnight Cyber Terminal server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
