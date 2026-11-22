import { useState } from 'react';
import { Delete, Lock, ShieldAlert } from 'lucide-react';
import type { AuthStatus } from '../types/trading';
import { api } from '../utils/api';

interface LoginPageProps {
  authStatus: AuthStatus;
  onAuthSuccess: () => Promise<void>;
  onRefreshStatus: () => Promise<void>;
}

export function LoginPage({
  authStatus,
  onAuthSuccess,
  onRefreshStatus,
}: LoginPageProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const appendDigit = (digit: string) => {
    if (authStatus.isLocked || submitting) return;
    setError(null);
    if (pin.length < 12) {
      setPin((prev) => prev + digit);
    }
  };

  const backspace = () => {
    if (submitting) return;
    setPin((prev) => prev.slice(0, -1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authStatus.isLocked || submitting) return;

    setError(null);
    setSubmitting(true);
    try {
      if (authStatus.requiresSetup) {
        if (pin !== confirmPin) {
          setError('PIN confirmation does not match.');
          setSubmitting(false);
          return;
        }
        await api.setupPin(pin);
      } else {
        await api.loginWithPin(pin);
      }
      setPin('');
      setConfirmPin('');
      await onAuthSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed.';
      setError(msg);
      setPin('');
      await onRefreshStatus();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-md items-center px-4 py-12">
      <div className="cyber-glass-signature w-full rounded-2xl p-6 sm:p-8">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#00E5FF]/45 bg-[#020305] text-[#00E5FF] shadow-[0_0_24px_-4px_rgba(0,229,255,0.45)]">
            {authStatus.isLocked ? (
              <ShieldAlert className="h-5 w-5 text-rose-400" aria-hidden="true" />
            ) : (
              <Lock className="h-5 w-5" aria-hidden="true" />
            )}
          </div>
          <h1 className="font-michroma mt-4 text-base sm:text-lg tracking-[0.14em] text-[#EAF7FF]">
            {authStatus.requiresSetup ? 'INITIALIZE OWNER PIN' : '205R OWNER ACCESS'}
          </h1>
          <p className="font-inter mt-2 text-xs leading-relaxed text-[#8194A9]">
            {authStatus.isLocked
              ? 'Terminal locked after 3 failed PIN attempts. A server-side administrator reset is required.'
              : authStatus.requiresSetup
                ? 'First-run setup: configure a numeric PIN (4–16 digits) to secure private administration.'
                : 'PIN-only authentication. Maximum 3 attempts permitted before terminal lockout.'}
          </p>
        </div>

        {authStatus.isLocked ? (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-rose-500/50 bg-rose-950/30 p-4 text-center"
          >
            <p className="font-michroma text-xs tracking-[0.1em] text-rose-300">
              LOGIN LOCKED
            </p>
            <p className="font-inter mt-2 text-xs leading-relaxed text-rose-200/80">
              Failed attempts: {authStatus.failedAttempts} / {authStatus.maxAttempts}. No public unlock or recovery interface is available.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="owner-pin-input"
                className="font-inter block text-xs font-medium text-[#EAF7FF]/85"
              >
                {authStatus.requiresSetup ? 'New Owner PIN (digits only)' : 'Owner PIN'}
              </label>
              <input
                id="owner-pin-input"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={pin}
                onChange={(e) => {
                  setError(null);
                  setPin(e.target.value.replace(/[^0-9]/g, ''));
                }}
                placeholder="Enter PIN"
                required
                minLength={4}
                maxLength={16}
                className="font-mono mt-1.5 h-11 w-full rounded-lg border border-[#8194A9]/25 bg-[#020305] px-4 text-center text-base tracking-[0.35em] text-[#EAF7FF] placeholder:tracking-normal placeholder:text-xs placeholder:text-[#8194A9] focus:border-[#00E5FF] focus:outline-none"
              />
            </div>

            {authStatus.requiresSetup && (
              <div>
                <label
                  htmlFor="owner-pin-confirm"
                  className="font-inter block text-xs font-medium text-[#EAF7FF]/85"
                >
                  Confirm Owner PIN
                </label>
                <input
                  id="owner-pin-confirm"
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  value={confirmPin}
                  onChange={(e) => {
                    setError(null);
                    setConfirmPin(e.target.value.replace(/[^0-9]/g, ''));
                  }}
                  placeholder="Re-enter PIN"
                  required
                  minLength={4}
                  maxLength={16}
                  className="font-mono mt-1.5 h-11 w-full rounded-lg border border-[#8194A9]/25 bg-[#020305] px-4 text-center text-base tracking-[0.35em] text-[#EAF7FF] placeholder:tracking-normal placeholder:text-xs placeholder:text-[#8194A9] focus:border-[#00E5FF] focus:outline-none"
                />
              </div>
            )}

            {/* Touch-friendly numeric keypad */}
            {!authStatus.requiresSetup && (
              <div className="grid grid-cols-3 gap-2.5" aria-label="Numeric PIN Keypad">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => appendDigit(digit)}
                    className="font-michroma flex h-12 items-center justify-center rounded-lg border border-[#8194A9]/22 bg-[#020305] text-sm text-[#EAF7FF] transition-colors hover:border-[#00E5FF] hover:text-[#00E5FF]"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPin('')}
                  className="font-michroma flex h-12 items-center justify-center rounded-lg border border-[#8194A9]/22 bg-[#05080D] text-[10px] tracking-[0.1em] text-[#8194A9] hover:text-[#EAF7FF]"
                >
                  CLR
                </button>
                <button
                  type="button"
                  onClick={() => appendDigit('0')}
                  className="font-michroma flex h-12 items-center justify-center rounded-lg border border-[#8194A9]/22 bg-[#020305] text-sm text-[#EAF7FF] transition-colors hover:border-[#00E5FF] hover:text-[#00E5FF]"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={backspace}
                  aria-label="Delete last PIN digit"
                  className="flex h-12 items-center justify-center rounded-lg border border-[#8194A9]/22 bg-[#05080D] text-[#8194A9] hover:text-[#EAF7FF]"
                >
                  <Delete className="h-4 w-4" />
                </button>
              </div>
            )}

            {error && (
              <p role="alert" className="text-center text-xs text-rose-400">
                {error}
              </p>
            )}

            {!authStatus.requiresSetup && authStatus.failedAttempts > 0 && (
              <p className="text-center font-mono text-[11px] text-amber-300">
                Failed attempts: {authStatus.failedAttempts} / {authStatus.maxAttempts} ({authStatus.attemptsRemaining} remaining)
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || pin.length < 4}
              className="font-michroma flex min-h-11 w-full items-center justify-center rounded-lg border border-[#00E5FF]/80 bg-[#00E5FF]/15 px-4 py-2.5 text-xs tracking-[0.14em] text-[#EAF7FF] transition-all hover:bg-[#00E5FF] hover:text-[#020305] disabled:opacity-50"
            >
              {submitting
                ? 'AUTHENTICATING...'
                : authStatus.requiresSetup
                  ? 'SET PIN & ENTER'
                  : 'UNLOCK TERMINAL'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
