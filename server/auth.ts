import crypto from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { AuthStatus } from '../src/types/trading.ts';
import { writeAuditLog } from './db.ts';

export const MAX_PIN_ATTEMPTS = 3;
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
export const SESSION_COOKIE_NAME = 'r205_session';

interface AuthStateRow {
  id: number;
  pin_hash: string | null;
  pin_salt: string | null;
  failed_attempts: number;
  is_locked: number;
  locked_at: string | null;
}

function getAuthRow(db: DatabaseSync): AuthStateRow {
  return db.prepare('SELECT * FROM auth_state WHERE id = 1').get() as unknown as AuthStateRow;
}

export function getEnvOwnerPin(): string {
  return (process.env.OWNER_PIN ?? '').trim();
}

export function hashPinWithSalt(pin: string, salt: string): string {
  return crypto.scryptSync(pin, salt, 64).toString('hex');
}

function verifySecretEquals(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

export function validatePinFormat(pin: string): string | null {
  const trimmed = pin.trim();
  if (trimmed.length < 4 || trimmed.length > 16) {
    return 'PIN must be between 4 and 16 characters.';
  }
  if (!/^[0-9]+$/.test(trimmed)) {
    return 'PIN must contain numeric digits only.';
  }
  return null;
}

export function getAuthStatus(db: DatabaseSync, sessionToken: string | null): AuthStatus {
  const row = getAuthRow(db);
  const envPin = getEnvOwnerPin();
  const envPinConfigured = envPin.length > 0;
  const dbPinConfigured = Boolean(row.pin_hash && row.pin_salt);
  const requiresSetup = !envPinConfigured && !dbPinConfigured;
  const isLocked = row.is_locked === 1;
  const failedAttempts = row.failed_attempts;
  const attemptsRemaining = isLocked ? 0 : Math.max(0, MAX_PIN_ATTEMPTS - failedAttempts);
  const authenticated = Boolean(sessionToken && verifySessionToken(db, sessionToken));

  return {
    authenticated,
    requiresSetup,
    envPinConfigured,
    isLocked,
    failedAttempts,
    maxAttempts: MAX_PIN_ATTEMPTS,
    attemptsRemaining,
  };
}

export function setupInitialPin(
  db: DatabaseSync,
  pin: string,
  ip = '',
  userAgent = ''
): { ok: true; token: string } | { ok: false; status: number; error: string } {
  if (getEnvOwnerPin().length > 0) {
    return {
      ok: false,
      status: 403,
      error: 'Owner PIN is managed by server environment configuration.',
    };
  }

  const row = getAuthRow(db);
  if (row.pin_hash && row.pin_salt) {
    return {
      ok: false,
      status: 403,
      error: 'Owner PIN has already been initialized.',
    };
  }

  const validationError = validatePinFormat(pin);
  if (validationError) {
    return { ok: false, status: 400, error: validationError };
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPinWithSalt(pin.trim(), salt);

  const info = db
    .prepare(
      `UPDATE auth_state
       SET pin_hash = ?, pin_salt = ?, failed_attempts = 0, is_locked = 0, locked_at = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = 1 AND pin_hash IS NULL`
    )
    .run(hash, salt);

  if (info.changes === 0) {
    return { ok: false, status: 403, error: 'Owner PIN has already been initialized.' };
  }

  const token = createSessionToken(db, ip, userAgent);
  writeAuditLog(db, {
    eventType: 'PIN_INITIALIZED',
    actor: 'owner',
    details: 'Owner PIN configured during first-run claim.',
    ip,
  });

  return { ok: true, token };
}

export function verifyConfiguredPin(db: DatabaseSync, candidatePin: string): boolean {
  const envPin = getEnvOwnerPin();
  if (envPin.length > 0) {
    return verifySecretEquals(candidatePin.trim(), envPin);
  }
  const row = getAuthRow(db);
  if (!row.pin_hash || !row.pin_salt) {
    return false;
  }
  const candidateHash = hashPinWithSalt(candidatePin.trim(), row.pin_salt);
  const bufA = Buffer.from(candidateHash, 'hex');
  const bufB = Buffer.from(row.pin_hash, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export type PinLoginResult =
  | {
      ok: true;
      token: string;
    }
  | {
      ok: false;
      status: number;
      error: string;
      isLocked: boolean;
      failedAttempts: number;
      attemptsRemaining: number;
    };

export function attemptPinLogin(
  db: DatabaseSync,
  pin: string,
  ip = '',
  userAgent = ''
): PinLoginResult {
  const row = getAuthRow(db);

  // Strict server-side lockout check: never allow a 4th attempt
  if (row.is_locked === 1 || row.failed_attempts >= MAX_PIN_ATTEMPTS) {
    if (row.is_locked !== 1) {
      db.prepare(
        'UPDATE auth_state SET is_locked = 1, locked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = 1'
      ).run();
    }
    writeAuditLog(db, {
      eventType: 'LOGIN_BLOCKED_LOCKED',
      actor: 'anonymous',
      details: 'Login attempt rejected because owner terminal is locked.',
      ip,
    });
    return {
      ok: false,
      status: 423,
      error:
        'Owner login is locked after 3 failed PIN attempts. A manual server-side administrator reset is required.',
      isLocked: true,
      failedAttempts: row.failed_attempts,
      attemptsRemaining: 0,
    };
  }

  const envPin = getEnvOwnerPin();
  if (envPin.length === 0 && (!row.pin_hash || !row.pin_salt)) {
    return {
      ok: false,
      status: 400,
      error: 'Owner PIN has not been initialized yet.',
      isLocked: false,
      failedAttempts: row.failed_attempts,
      attemptsRemaining: MAX_PIN_ATTEMPTS - row.failed_attempts,
    };
  }

  if (typeof pin !== 'string' || pin.trim().length === 0) {
    return {
      ok: false,
      status: 400,
      error: 'PIN is required.',
      isLocked: false,
      failedAttempts: row.failed_attempts,
      attemptsRemaining: MAX_PIN_ATTEMPTS - row.failed_attempts,
    };
  }

  const isValid = verifyConfiguredPin(db, pin);

  if (!isValid) {
    const nextFailed = row.failed_attempts + 1;
    const nowLocked = nextFailed >= MAX_PIN_ATTEMPTS;

    db.prepare(
      `UPDATE auth_state
       SET failed_attempts = ?, is_locked = ?, locked_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE locked_at END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = 1`
    ).run(nextFailed, nowLocked ? 1 : 0, nowLocked ? 1 : 0);

    writeAuditLog(db, {
      eventType: nowLocked ? 'LOGIN_LOCKED' : 'LOGIN_FAILED',
      actor: 'anonymous',
      details: nowLocked
        ? `Failed PIN attempt ${nextFailed}/${MAX_PIN_ATTEMPTS}. Owner login locked.`
        : `Failed PIN attempt ${nextFailed}/${MAX_PIN_ATTEMPTS}.`,
      ip,
    });

    if (nowLocked) {
      return {
        ok: false,
        status: 423,
        error:
          'Maximum 3 PIN attempts exceeded. Owner login is now locked until a server-side administrator resets it.',
        isLocked: true,
        failedAttempts: nextFailed,
        attemptsRemaining: 0,
      };
    }

    return {
      ok: false,
      status: 401,
      error: `Invalid PIN. ${MAX_PIN_ATTEMPTS - nextFailed} attempt${MAX_PIN_ATTEMPTS - nextFailed === 1 ? '' : 's'} remaining.`,
      isLocked: false,
      failedAttempts: nextFailed,
      attemptsRemaining: MAX_PIN_ATTEMPTS - nextFailed,
    };
  }

  // Successful login resets failure counter and issues session token
  db.prepare(
    'UPDATE auth_state SET failed_attempts = 0, updated_at = CURRENT_TIMESTAMP WHERE id = 1'
  ).run();

  const token = createSessionToken(db, ip, userAgent);
  writeAuditLog(db, {
    eventType: 'LOGIN_SUCCESS',
    actor: 'owner',
    details: 'Owner authenticated via PIN.',
    ip,
  });

  return { ok: true, token };
}

export function changeOwnerPin(
  db: DatabaseSync,
  currentPin: string,
  newPin: string,
  ip = ''
): { ok: true } | { ok: false; status: number; error: string } {
  if (getEnvOwnerPin().length > 0) {
    return {
      ok: false,
      status: 400,
      error: 'PIN is managed via the OWNER_PIN server environment variable and cannot be modified from the UI.',
    };
  }

  if (!verifyConfiguredPin(db, currentPin)) {
    return { ok: false, status: 401, error: 'Current PIN is incorrect.' };
  }

  const validationError = validatePinFormat(newPin);
  if (validationError) {
    return { ok: false, status: 400, error: validationError };
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPinWithSalt(newPin.trim(), salt);

  db.prepare(
    'UPDATE auth_state SET pin_hash = ?, pin_salt = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1'
  ).run(hash, salt);

  writeAuditLog(db, {
    eventType: 'PIN_CHANGED',
    actor: 'owner',
    details: 'Owner PIN updated.',
    ip,
  });

  return { ok: true };
}

export function createSessionToken(db: DatabaseSync, ip = '', userAgent = ''): string {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = Date.now() + SESSION_TTL_MS;

  // Purge expired sessions
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
  db.prepare(
    'INSERT INTO sessions (token_hash, expires_at, ip, user_agent) VALUES (?, ?, ?, ?)'
  ).run(tokenHash, expiresAt, ip, userAgent.slice(0, 200));

  return token;
}

export function verifySessionToken(db: DatabaseSync, token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const row = db
    .prepare('SELECT expires_at FROM sessions WHERE token_hash = ?')
    .get(tokenHash) as { expires_at: number } | undefined;

  if (!row) return false;
  if (row.expires_at < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
    return false;
  }
  return true;
}

export function revokeSessionToken(db: DatabaseSync, token: string | null): void {
  if (!token) return;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
}

export function resetLockoutAsServerAdmin(db: DatabaseSync): void {
  db.prepare(
    'UPDATE auth_state SET failed_attempts = 0, is_locked = 0, locked_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = 1'
  ).run();
  writeAuditLog(db, {
    eventType: 'ADMIN_LOCK_RESET',
    actor: 'server_admin',
    details: 'Owner login lockout manually reset by server-side administrator.',
    ip: '127.0.0.1',
  });
}

export function parseCookieHeader(cookieHeader: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = decodeURIComponent(part.slice(idx + 1).trim());
    if (key) result[key] = val;
  }
  return result;
}
