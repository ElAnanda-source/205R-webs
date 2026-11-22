import { Lock, ShieldAlert } from 'lucide-react';

interface PrivacyPanelProps {
  compact?: boolean;
  onNavigateLogin: () => void;
}

export function PrivacyPanel({ compact = false, onNavigateLogin }: PrivacyPanelProps) {
  if (compact) {
    return (
      <div className="cyber-glass-signature cyber-float rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="cyber-hairline-top -mx-5 sm:-mx-6 -mt-5 sm:-mt-6 mb-4 opacity-80" aria-hidden="true" />
        <div className="flex items-center justify-between gap-2 border-b border-[#8194A9]/15 pb-3">
          <span className="font-michroma text-[11px] tracking-[0.14em] text-[#EAF7FF]">
            205R TELEMETRY LOCK
          </span>
          <span className="inline-flex items-center gap-1.5 font-michroma text-[10px] tracking-[0.1em] text-[#00E5FF] whitespace-nowrap shrink-0">
            <Lock className="h-3 w-3" aria-hidden="true" />
            OWNER PRIVATE
          </span>
        </div>

        <div className="space-y-2.5 py-1">
          <div className="flex items-start gap-2.5 font-inter text-xs text-[#EAF7FF]/90">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#00E5FF]" aria-hidden="true" />
            <span>Private financial figures require owner PIN verification.</span>
          </div>
          <p className="font-inter text-xs leading-relaxed text-[#8194A9]">
            Capital balances, equity curves, net P&amp;L, profit factor, and drawdown telemetry remain withheld server-side from public visitors.
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-3 border-t border-[#8194A9]/15 pt-4 text-[11px]">
          <div>
            <dt className="font-inter text-[#8194A9]">Account Balance</dt>
            <dd className="font-michroma mt-1 text-xs text-[#EAF7FF]/80">RESTRICTED</dd>
          </div>
          <div>
            <dt className="font-inter text-[#8194A9]">Net Growth &amp; Curve</dt>
            <dd className="font-michroma mt-1 text-xs text-[#EAF7FF]/80">RESTRICTED</dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={onNavigateLogin}
          className="font-michroma inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#00E5FF]/70 bg-[#00E5FF]/12 px-4 py-2.5 text-[11px] tracking-[0.12em] text-[#EAF7FF] transition-all hover:bg-[#00E5FF] hover:text-[#020305] shadow-[0_0_24px_-8px_rgba(0,229,255,0.45)]"
        >
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          UNLOCK OWNER FINANCIALS
        </button>
      </div>
    );
  }

  return (
    <section
      aria-label="Owner-Only Financial Privacy Notice"
      className="cyber-glass-signature rounded-2xl p-6 sm:p-8 space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#8194A9]/15 pb-5">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#00E5FF]/45 bg-[#020305]">
            <Lock className="h-5 w-5 text-[#00E5FF]" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="font-michroma text-[10px] tracking-[0.16em] text-[#00E5FF]">
              SERVER-ENFORCED ACCESS CONTROL
            </p>
            <h2 className="font-michroma mt-1 text-sm sm:text-lg tracking-[0.08em] text-[#EAF7FF]">
              OWNER-ONLY FINANCIAL PRIVACY
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onNavigateLogin}
          className="font-michroma inline-flex min-h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-[#00E5FF]/75 bg-[#00E5FF]/12 px-5 py-2.5 text-xs tracking-[0.12em] text-[#EAF7FF] transition-all hover:bg-[#00E5FF] hover:text-[#020305] whitespace-nowrap shrink-0"
        >
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          AUTHENTICATE OWNER PIN
        </button>
      </div>

      <p className="font-inter max-w-3xl text-xs sm:text-sm leading-relaxed text-[#EAF7FF]/85">
        205R enforces strict server-side authorization on all private account telemetry. Public visitors may inspect trading methodology, market coverage, risk framework, and non-monetary execution metadata, while all capital balances and dollar figures remain withheld until owner PIN authentication succeeds.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          'Starting & Current Balance',
          'Account Equity & Unrealized P&L',
          'Realized Net P&L & Growth',
          'Profit Factor & Max Drawdown',
          'Detailed Equity Curve',
          'Monthly & Annual Financials',
          'Daily P&L Calendar Values',
          'Position Sizing & Dollar Fees',
        ].map((item) => (
          <div
            key={item}
            className="flex items-center gap-2.5 rounded-lg border border-[#8194A9]/14 bg-[#020305]/80 px-3.5 py-3 font-inter text-xs text-[#8194A9]"
          >
            <Lock className="h-3.5 w-3.5 shrink-0 text-[#168BFF]" aria-hidden="true" />
            <span className="text-[#EAF7FF]/85">{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
