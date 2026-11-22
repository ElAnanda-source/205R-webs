import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createDatabase } from './db.ts';
import {
  attemptPinLogin,
  getAuthStatus,
  resetLockoutAsServerAdmin,
  setupInitialPin,
  verifySessionToken,
} from './auth.ts';

test('Owner PIN authentication enforces 3-attempt server-side lockout', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), '205r-auth-test-'));
  const dbPath = path.join(tempDir, 'test.db');

  try {
    const db = createDatabase(dbPath);
    const setupRes = setupInitialPin(db, '205205', '127.0.0.1');
    assert.equal(setupRes.ok, true);
    if (setupRes.ok) {
      assert.equal(verifySessionToken(db, setupRes.token), true);
    }

    // Attempt 1 (wrong)
    const r1 = attemptPinLogin(db, '111111', '127.0.0.1');
    assert.equal(r1.ok, false);
    if (!r1.ok) {
      assert.equal(r1.status, 401);
      assert.equal(r1.attemptsRemaining, 2);
      assert.equal(r1.isLocked, false);
    }

    // Attempt 2 (wrong)
    const r2 = attemptPinLogin(db, '222222', '127.0.0.1');
    assert.equal(r2.ok, false);
    if (!r2.ok) {
      assert.equal(r2.status, 401);
      assert.equal(r2.attemptsRemaining, 1);
      assert.equal(r2.isLocked, false);
    }

    // Attempt 3 (wrong) -> immediate lock
    const r3 = attemptPinLogin(db, '333333', '127.0.0.1');
    assert.equal(r3.ok, false);
    if (!r3.ok) {
      assert.equal(r3.status, 423);
      assert.equal(r3.attemptsRemaining, 0);
      assert.equal(r3.isLocked, true);
    }
    db.close();

    // Re-open DB (simulating page reload / new tab / server restart): lock MUST persist!
    const db2 = createDatabase(dbPath);
    const statusAfterReload = getAuthStatus(db2, null);
    assert.equal(statusAfterReload.isLocked, true);
    assert.equal(statusAfterReload.attemptsRemaining, 0);

    // 4th attempt even with CORRECT PIN must be rejected!
    const r4 = attemptPinLogin(db2, '205205', '127.0.0.1');
    assert.equal(r4.ok, false);
    if (!r4.ok) {
      assert.equal(r4.status, 423);
      assert.equal(r4.isLocked, true);
    }

    // Manual server-side administrator reset unlocks it
    resetLockoutAsServerAdmin(db2);
    const r5 = attemptPinLogin(db2, '205205', '127.0.0.1');
    assert.equal(r5.ok, true);
    db2.close();
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
