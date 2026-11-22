import { createDatabase } from './db.ts';
import { resetLockoutAsServerAdmin } from './auth.ts';

const db = createDatabase();
resetLockoutAsServerAdmin(db);
db.close();
console.log('[205R] Owner PIN lockout has been reset by server administrator.');
