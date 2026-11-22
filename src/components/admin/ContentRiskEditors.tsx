import { useEffect, useState } from 'react';
import type {
  AccountSettings,
  RiskParameters,
  SiteContent,
} from '../../types/trading';
import { api } from '../../utils/api';
import { formatCurrency } from '../../utils/formatters';

interface AccountEditorProps {
  account: AccountSettings;
  onSaved: () => Promise<void>;
}

const inputCls =
  'mt-1 h-10 w-full rounded-lg border border-[#8194A9]/22 bg-[#020305] px-3 text-xs text-[#EAF7FF] focus:border-[#00E5FF] focus:outline-none';
const textCls =
  'mt-1 w-full rounded-lg border border-[#8194A9]/22 bg-[#020305] p-2.5 text-xs text-[#EAF7FF] focus:border-[#00E5FF] focus:outline-none';

export function AccountEditor({ account, onSaved }: AccountEditorProps) {
  const [form, setForm] = useState<AccountSettings>(account);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setForm(account);
  }, [account]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.updateAccount(form);
      await onSaved();
      setMessage('Account & reconciliation settings updated.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  const baseCapital = (form.startingBalance || 0) + (form.deposits || 0) - (form.withdrawals || 0);

  return (
    <form
      onSubmit={handleSave}
      className="cyber-glass rounded-2xl p-5 sm:p-6 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#8194A9]/15 pb-3">
        <h2 className="font-michroma text-xs sm:text-sm tracking-[0.12em] text-[#EAF7FF]">
          ACCOUNT, CASH FLOW &amp; RECONCILIATION SETTINGS
        </h2>
        <span className="font-mono text-[11px] text-[#00E5FF]">
          Base Capital: {formatCurrency(baseCapital, form.currency)}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="acc-label" className="block text-xs text-[#EAF7FF]/85">
            Account Label
          </label>
          <input
            id="acc-label"
            type="text"
            value={form.accountLabel}
            onChange={(e) => setForm({ ...form, accountLabel: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="acc-currency" className="block text-xs text-[#EAF7FF]/85">
            Account Currency
          </label>
          <input
            id="acc-currency"
            type="text"
            maxLength={6}
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="acc-start" className="block text-xs text-[#EAF7FF]/85">
            Starting Balance
          </label>
          <input
            id="acc-start"
            type="number"
            step="0.01"
            min="0"
            value={form.startingBalance}
            onChange={(e) =>
              setForm({ ...form, startingBalance: Number(e.target.value) || 0 })
            }
            className={`font-mono ${inputCls}`}
          />
        </div>
        <div>
          <label htmlFor="acc-confirmed" className="block text-xs text-[#EAF7FF]/85">
            Confirmed Historical Balance Benchmark (blank = none)
          </label>
          <input
            id="acc-confirmed"
            type="number"
            step="0.01"
            value={form.confirmedEndingBalance ?? ''}
            onChange={(e) => {
              const raw = e.target.value.trim();
              setForm({
                ...form,
                confirmedEndingBalance: raw === '' ? null : Number(raw),
              });
            }}
            placeholder="e.g. 6687.09"
            className={`font-mono ${inputCls}`}
          />
        </div>
        <div>
          <label htmlFor="acc-deposits" className="block text-xs text-[#EAF7FF]/85">
            Total Deposits
          </label>
          <input
            id="acc-deposits"
            type="number"
            step="0.01"
            min="0"
            value={form.deposits}
            onChange={(e) =>
              setForm({ ...form, deposits: Math.max(0, Number(e.target.value) || 0) })
            }
            className={`font-mono ${inputCls}`}
          />
        </div>
        <div>
          <label htmlFor="acc-withdrawals" className="block text-xs text-[#EAF7FF]/85">
            Total Withdrawals
          </label>
          <input
            id="acc-withdrawals"
            type="number"
            step="0.01"
            min="0"
            value={form.withdrawals}
            onChange={(e) =>
              setForm({ ...form, withdrawals: Math.max(0, Number(e.target.value) || 0) })
            }
            className={`font-mono ${inputCls}`}
          />
        </div>
        <div>
          <label htmlFor="acc-winrate" className="block text-xs text-[#EAF7FF]/85">
            Owner-Reported Win Rate % (used until verified trades exist)
          </label>
          <input
            id="acc-winrate"
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={form.reportedWinRatePct ?? ''}
            onChange={(e) => {
              const raw = e.target.value.trim();
              setForm({
                ...form,
                reportedWinRatePct: raw === '' ? null : Math.min(100, Math.max(0, Number(raw))),
              });
            }}
            placeholder="e.g. 65"
            className={`font-mono ${inputCls}`}
          />
        </div>
        <div>
          <label htmlFor="acc-unrealized" className="block text-xs text-[#EAF7FF]/85">
            Open Unrealized P&amp;L (if tracking open trades)
          </label>
          <input
            id="acc-unrealized"
            type="number"
            step="0.01"
            value={form.unrealizedPnl}
            onChange={(e) =>
              setForm({ ...form, unrealizedPnl: Number(e.target.value) || 0 })
            }
            className={`font-mono ${inputCls}`}
          />
        </div>
      </div>

      <p className="rounded-lg border border-[#8194A9]/15 bg-[#020305]/80 px-3 py-2 text-[11px] text-[#8194A9]">
        Formula: <span className="font-mono text-[#EAF7FF]/85">Ending Balance = Starting Balance + Deposits - Withdrawals + Realized Net Trading P&amp;L</span>. Deposits and withdrawals are explicitly tracked and never fabricated to hide P&amp;L discrepancies.
      </p>

      <label className="inline-flex items-center gap-2 text-xs text-[#EAF7FF]/85">
        <input
          type="checkbox"
          checked={form.brokerConnected}
          onChange={(e) => setForm({ ...form, brokerConnected: e.target.checked })}
          className="h-4 w-4 accent-[#00E5FF]"
        />
        Live Broker Account Verified / Connected
      </label>

      {message && <p className="text-xs text-[#00E5FF]">{message}</p>}

      <div>
        <button
          type="submit"
          disabled={saving}
          className="font-michroma rounded-lg border border-[#00E5FF]/75 bg-[#00E5FF]/15 px-5 py-2.5 text-xs tracking-[0.12em] text-[#EAF7FF] hover:bg-[#00E5FF] hover:text-[#020305]"
        >
          {saving ? 'SAVING...' : 'SAVE ACCOUNT SETTINGS'}
        </button>
      </div>
    </form>
  );
}

interface RiskEditorProps {
  riskParameters: RiskParameters;
  onSaved: () => Promise<void>;
}

export function RiskEditor({ riskParameters, onSaved }: RiskEditorProps) {
  const [form, setForm] = useState<RiskParameters>(riskParameters);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.updateRisk(form);
      await onSaved();
      setMessage('Risk parameters saved.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSave}
      className="cyber-glass rounded-2xl p-5 sm:p-6 space-y-4"
    >
      <h2 className="font-michroma text-xs sm:text-sm tracking-[0.12em] text-[#EAF7FF] border-b border-[#8194A9]/15 pb-3">
        RISK MANAGEMENT PARAMETERS
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label htmlFor="rk-daily" className="block text-xs text-[#EAF7FF]/85">
            Daily Loss Limit (%)
          </label>
          <input
            id="rk-daily"
            type="number"
            step="0.1"
            value={form.dailyLossLimitPct}
            onChange={(e) =>
              setForm({ ...form, dailyLossLimitPct: Number(e.target.value) || 0 })
            }
            className={`font-mono ${inputCls}`}
          />
        </div>
        <div>
          <label htmlFor="rk-trade" className="block text-xs text-[#EAF7FF]/85">
            Max Risk / Trade (%)
          </label>
          <input
            id="rk-trade"
            type="number"
            step="0.05"
            value={form.maxRiskPerTradePct}
            onChange={(e) =>
              setForm({ ...form, maxRiskPerTradePct: Number(e.target.value) || 0 })
            }
            className={`font-mono ${inputCls}`}
          />
        </div>
        <div>
          <label htmlFor="rk-dd" className="block text-xs text-[#EAF7FF]/85">
            Max Drawdown (%)
          </label>
          <input
            id="rk-dd"
            type="number"
            step="0.5"
            value={form.maxDrawdownLimitPct}
            onChange={(e) =>
              setForm({ ...form, maxDrawdownLimitPct: Number(e.target.value) || 0 })
            }
            className={`font-mono ${inputCls}`}
          />
        </div>
        <div>
          <label htmlFor="rk-rr" className="block text-xs text-[#EAF7FF]/85">
            Min R:R Ratio
          </label>
          <input
            id="rk-rr"
            type="number"
            step="0.1"
            value={form.minRrRatio}
            onChange={(e) =>
              setForm({ ...form, minRrRatio: Number(e.target.value) || 0 })
            }
            className={`font-mono ${inputCls}`}
          />
        </div>
        <div>
          <label htmlFor="rk-concurrent" className="block text-xs text-[#EAF7FF]/85">
            Max Concurrent
          </label>
          <input
            id="rk-concurrent"
            type="number"
            min="1"
            value={form.maxConcurrentTrades}
            onChange={(e) =>
              setForm({ ...form, maxConcurrentTrades: Number(e.target.value) || 1 })
            }
            className={`font-mono ${inputCls}`}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="rk-pos" className="block text-xs text-[#EAF7FF]/85">
            Position Sizing Model
          </label>
          <textarea
            id="rk-pos"
            rows={2}
            value={form.positionSizingModel}
            onChange={(e) => setForm({ ...form, positionSizingModel: e.target.value })}
            className={textCls}
          />
        </div>
        <div>
          <label htmlFor="rk-sl" className="block text-xs text-[#EAF7FF]/85">
            Stop Loss Management
          </label>
          <textarea
            id="rk-sl"
            rows={2}
            value={form.stopLossManagementRule}
            onChange={(e) => setForm({ ...form, stopLossManagementRule: e.target.value })}
            className={textCls}
          />
        </div>
        <div>
          <label htmlFor="rk-tp" className="block text-xs text-[#EAF7FF]/85">
            Take Profit Management
          </label>
          <textarea
            id="rk-tp"
            rows={2}
            value={form.takeProfitManagementRule}
            onChange={(e) => setForm({ ...form, takeProfitManagementRule: e.target.value })}
            className={textCls}
          />
        </div>
        <div>
          <label htmlFor="rk-cap" className="block text-xs text-[#EAF7FF]/85">
            Capital Preservation Rule
          </label>
          <textarea
            id="rk-cap"
            rows={2}
            value={form.capitalPreservationRule}
            onChange={(e) => setForm({ ...form, capitalPreservationRule: e.target.value })}
            className={textCls}
          />
        </div>
      </div>

      <div>
        <label htmlFor="rk-tm" className="block text-xs text-[#EAF7FF]/85">
          Trade Management Rule
        </label>
        <textarea
          id="rk-tm"
          rows={2}
          value={form.tradeManagementRule}
          onChange={(e) => setForm({ ...form, tradeManagementRule: e.target.value })}
          className={textCls}
        />
      </div>

      {message && <p className="text-xs text-[#00E5FF]">{message}</p>}

      <button
        type="submit"
        disabled={saving}
        className="font-michroma rounded-lg border border-[#00E5FF]/75 bg-[#00E5FF]/15 px-5 py-2.5 text-xs tracking-[0.12em] text-[#EAF7FF] hover:bg-[#00E5FF] hover:text-[#020305]"
      >
        {saving ? 'SAVING...' : 'SAVE RISK PARAMETERS'}
      </button>
    </form>
  );
}

interface ContentEditorProps {
  siteContent: SiteContent;
  onSaved: () => Promise<void>;
}

export function ContentEditor({ siteContent, onSaved }: ContentEditorProps) {
  const [form, setForm] = useState<SiteContent>(siteContent);
  const [socialText, setSocialText] = useState(
    siteContent.socialLinks.map((s) => `${s.label} | ${s.url}`).join('\n')
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const parsedSocial = socialText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, url] = line.split('|').map((p) => p.trim());
        return { label: label || 'Link', url: url || '#' };
      })
      .filter((s) => /^https?:\/\//i.test(s.url));

    try {
      await api.updateContent({ ...form, socialLinks: parsedSocial });
      await onSaved();
      setMessage('Website brand content, methodologies, and settings updated.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSave}
      className="cyber-glass rounded-2xl p-5 sm:p-6 space-y-5"
    >
      <h2 className="font-michroma text-xs sm:text-sm tracking-[0.12em] text-[#EAF7FF] border-b border-[#8194A9]/15 pb-3">
        BRAND, METHODOLOGIES &amp; WEBSITE SETTINGS
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ct-hero" className="block text-xs text-[#EAF7FF]/85">
            Hero Headline (use newline for split)
          </label>
          <textarea
            id="ct-hero"
            rows={2}
            value={form.heroHeadline}
            onChange={(e) => setForm({ ...form, heroHeadline: e.target.value })}
            className={textCls}
          />
        </div>
        <div>
          <label htmlFor="ct-sub" className="block text-xs text-[#EAF7FF]/85">
            Hero Subheadline
          </label>
          <textarea
            id="ct-sub"
            rows={2}
            value={form.heroSubheadline}
            onChange={(e) => setForm({ ...form, heroSubheadline: e.target.value })}
            className={textCls}
          />
        </div>
      </div>

      <div>
        <label htmlFor="ct-about" className="block text-xs text-[#EAF7FF]/85">
          About 205R Brand Description
        </label>
        <textarea
          id="ct-about"
          rows={3}
          value={form.aboutSummary}
          onChange={(e) => setForm({ ...form, aboutSummary: e.target.value })}
          className={textCls}
        />
      </div>

      <div className="space-y-3 border-t border-[#8194A9]/15 pt-4">
        <h3 className="font-michroma text-xs tracking-[0.1em] text-[#00E5FF]">
          METHODOLOGY DESCRIPTIONS (INCLUDING ALCHEMIST)
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          {form.methodologies.map((m, idx) => (
            <div key={m.id} className="cyber-surface-dark rounded-xl p-3 space-y-2">
              <span className="font-michroma text-[11px] text-[#EAF7FF]">
                {m.number} — {m.name}
              </span>
              <textarea
                rows={2}
                aria-label={`${m.name} description`}
                value={m.description}
                onChange={(e) => {
                  const next = [...form.methodologies];
                  next[idx] = { ...m, description: e.target.value };
                  setForm({ ...form, methodologies: next });
                }}
                className="w-full rounded-lg border border-[#8194A9]/22 bg-[#020305] p-2 text-xs text-[#EAF7FF]/85 focus:border-[#00E5FF] focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 border-t border-[#8194A9]/15 pt-4">
        <div>
          <label htmlFor="ct-email" className="block text-xs text-[#EAF7FF]/85">
            Contact Email
          </label>
          <input
            id="ct-email"
            type="email"
            value={form.contactEmail}
            onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="ct-social" className="block text-xs text-[#EAF7FF]/85">
            Social Links (one per line: Label | https://...)
          </label>
          <textarea
            id="ct-social"
            rows={2}
            value={socialText}
            onChange={(e) => setSocialText(e.target.value)}
            placeholder="X / Twitter | https://x.com/..."
            className={textCls}
          />
        </div>
      </div>

      <div>
        <label htmlFor="ct-disc" className="block text-xs text-[#EAF7FF]/85">
          Risk Disclaimer
        </label>
        <textarea
          id="ct-disc"
          rows={2}
          value={form.disclaimer}
          onChange={(e) => setForm({ ...form, disclaimer: e.target.value })}
          className={textCls}
        />
      </div>

      {message && <p className="text-xs text-[#00E5FF]">{message}</p>}

      <button
        type="submit"
        disabled={saving}
        className="font-michroma rounded-lg border border-[#00E5FF]/75 bg-[#00E5FF]/15 px-5 py-2.5 text-xs tracking-[0.12em] text-[#EAF7FF] hover:bg-[#00E5FF] hover:text-[#020305]"
      >
        {saving ? 'SAVING...' : 'SAVE BRAND & SETTINGS'}
      </button>
    </form>
  );
}
