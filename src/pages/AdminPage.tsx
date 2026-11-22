import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Database,
  Download,
  Edit3,
  FileSpreadsheet,
  KeyRound,
  LogOut,
  Plus,
  ScrollText,
  Settings,
  Shield,
  Sliders,
  Trash2,
  Upload,
} from 'lucide-react';
import { AccountEditor, ContentEditor, RiskEditor } from '../components/admin/ContentRiskEditors';
import { TradeFormModal } from '../components/admin/TradeFormModal';
import type { AdminOverviewPayload } from '../utils/api';
import { api } from '../utils/api';
import type { AuthStatus, TradeTransaction } from '../types/trading';
import { formatCurrency, formatPct, formatRR } from '../utils/formatters';

interface AdminPageProps {
  authStatus: AuthStatus;
  onRefreshPublic: () => Promise<void>;
  onLogout: () => Promise<void>;
}

type AdminTab =
  | 'transactions'
  | 'account'
  | 'risk'
  | 'content'
  | 'backup'
  | 'audit'
  | 'security';

export function AdminPage({ authStatus, onRefreshPublic, onLogout }: AdminPageProps) {
  const [tab, setTab] = useState<AdminTab>('transactions');
  const [overview, setOverview] = useState<AdminOverviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editingTrade, setEditingTrade] = useState<TradeTransaction | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<TradeTransaction | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [replaceCsvOnImport, setReplaceCsvOnImport] = useState(false);

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinMsg, setPinMsg] = useState<string | null>(null);

  const loadOverview = async () => {
    setError(null);
    try {
      const data = await api.getAdminOverview();
      setOverview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load admin workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const refreshAll = async () => {
    await Promise.all([loadOverview(), onRefreshPublic()]);
  };

  const filteredTrades = useMemo(() => {
    if (!overview) return [];
    const q = search.trim().toLowerCase();
    return [...overview.transactions]
      .sort((a, b) => `${b.tradeDate} ${b.tradeTime}`.localeCompare(`${a.tradeDate} ${a.tradeTime}`))
      .filter((t) => {
        if (!q) return true;
        return `${t.tradeId} ${t.instrument} ${t.methodology} ${t.tradeDate} ${t.notes}`
          .toLowerCase()
          .includes(q);
      });
  }, [overview, search]);

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.deleteTransaction(confirmDelete.id);
      setConfirmDelete(null);
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    }
  };

  const handleToggleVerify = async (t: TradeTransaction) => {
    try {
      await api.updateTransaction(t.id, { ...t, isVerified: !t.isVerified });
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update verification state.');
    }
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus(null);
    try {
      const text = await file.text();
      const res = await api.importCsv(text, replaceCsvOnImport);
      setImportStatus(`Imported ${res.importedCount} transactions successfully.`);
      await refreshAll();
    } catch (err) {
      setImportStatus(err instanceof Error ? err.message : 'CSV import failed.');
    } finally {
      e.target.value = '';
    }
  };

  const handleBackupRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus(null);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await api.restoreBackup(json);
      setImportStatus(`Backup restored (${res.restoredCount} transactions).`);
      await refreshAll();
    } catch (err) {
      setImportStatus(err instanceof Error ? err.message : 'Backup restore failed.');
    } finally {
      e.target.value = '';
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinMsg(null);
    try {
      await api.changePin(currentPin, newPin);
      setCurrentPin('');
      setNewPin('');
      setPinMsg('Owner PIN updated successfully.');
      await loadOverview();
    } catch (err) {
      setPinMsg(err instanceof Error ? err.message : 'PIN update failed.');
    }
  };

  const navTabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'transactions', label: 'Journal CRUD', icon: <FileSpreadsheet className="h-4 w-4" /> },
    { id: 'account', label: 'Account & Equity', icon: <Database className="h-4 w-4" /> },
    { id: 'risk', label: 'Risk Params', icon: <Sliders className="h-4 w-4" /> },
    { id: 'content', label: 'Brand & Content', icon: <Settings className="h-4 w-4" /> },
    { id: 'backup', label: 'CSV & Backups', icon: <Download className="h-4 w-4" /> },
    { id: 'audit', label: 'Audit Logs', icon: <ScrollText className="h-4 w-4" /> },
    { id: 'security', label: 'PIN Security', icon: <KeyRound className="h-4 w-4" /> },
  ];

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center font-inter text-sm text-[#8194A9]">
        Loading 205R Owner Terminal...
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-sm text-rose-400">{error || 'Unable to load workspace.'}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Admin Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#8194A9]/18 pb-5">
        <div className="flex items-start gap-3 min-w-0">
          <Shield className="mt-1 h-5 w-5 shrink-0 text-[#00E5FF]" aria-hidden="true" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="cyber-page-h1 !text-base sm:!text-xl text-[#EAF7FF]">
                205R OWNER ADMINISTRATION
              </h1>
              {overview.performance.confirmedEndingBalance !== null && (
                <span
                  className={`font-michroma text-[10px] tracking-[0.1em] ${
                    overview.performance.isReconciled ? 'text-emerald-400' : 'text-amber-300'
                  }`}
                >
                  {overview.performance.isReconciled
                    ? '· RECONCILED'
                    : `· VARIANCE ${formatCurrency(
                        overview.performance.reconciliationDifference,
                        overview.account.currency,
                        true
                      )}`}
                </span>
              )}
            </div>
            <p className="font-inter mt-1 text-xs text-[#8194A9] break-words">
              Start: {formatCurrency(overview.performance.startingBalance, overview.account.currency)} ·
              Balance: {formatCurrency(overview.performance.accountBalance, overview.account.currency)} ·
              Net Growth:{' '}
              <span className={overview.performance.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {formatCurrency(overview.performance.netProfit, overview.account.currency, true)} (
                {formatPct(overview.performance.cumulativeGrowthPct, true)})
              </span>{' '}
              · {Math.round(overview.performance.winRate)}% WIN RATE · {overview.transactions.length} Records
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="font-michroma inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#8194A9]/25 bg-[#05080D] px-4 py-2 text-[11px] tracking-[0.1em] text-[#EAF7FF] hover:border-rose-400/60 hover:text-rose-300"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          LOGOUT
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-5 rounded-xl border border-rose-500/50 bg-rose-950/30 px-4 py-3 text-xs text-rose-300">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <aside className="min-w-0 lg:col-span-3">
          <nav
            aria-label="Admin Sections"
            className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0"
          >
            {navTabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`font-michroma flex min-h-11 items-center gap-2.5 rounded-xl border px-3.5 py-2 text-[11px] tracking-[0.08em] transition-all whitespace-nowrap shrink-0 ${
                  tab === item.id
                    ? 'border-[#00E5FF]/65 bg-[#090F18] text-[#00E5FF] shadow-[0_0_20px_-8px_rgba(0,229,255,0.45)]'
                    : 'border-[#8194A9]/18 bg-[#05080D] text-[#8194A9] hover:border-[#168BFF]/45 hover:text-[#EAF7FF]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 lg:col-span-9 space-y-6">
          {tab === 'transactions' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter trades by ID, date, instrument..."
                  aria-label="Filter admin trades"
                  className="h-10 w-full rounded-lg border border-[#8194A9]/22 bg-[#020305] px-3 text-xs text-[#EAF7FF] focus:border-[#00E5FF] focus:outline-none sm:max-w-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="font-michroma inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#00E5FF]/75 bg-[#00E5FF]/14 px-4 py-2 text-xs tracking-[0.1em] text-[#EAF7FF] hover:bg-[#00E5FF] hover:text-[#020305] whitespace-nowrap shrink-0"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  ADD TRADE
                </button>
              </div>

              <div className="cyber-glass hidden overflow-x-auto rounded-2xl md:block">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#8194A9]/18 bg-[#020305]/90 text-[#8194A9]">
                      <th className="px-3 py-3 font-medium">Date</th>
                      <th className="px-3 py-3 font-medium">ID / Instrument</th>
                      <th className="px-3 py-3 font-medium">Method</th>
                      <th className="px-3 py-3 text-right font-medium">R:R</th>
                      <th className="px-3 py-3 text-right font-medium">Net P&amp;L</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8194A9]/12 font-inter">
                    {filteredTrades.map((t) => (
                      <tr key={t.id} className="hover:bg-[#0D1723]/65">
                        <td className="font-mono tabular-nums px-3 py-2.5 text-[#EAF7FF]/85">
                          {t.tradeDate}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="font-michroma text-[11px] text-[#EAF7FF]">
                            {t.instrument} · {t.direction}
                          </div>
                          <div className="font-mono text-[10px] text-[#8194A9]">{t.tradeId}</div>
                        </td>
                        <td className="px-3 py-2.5 text-[#EAF7FF]/85">{t.methodology}</td>
                        <td className="font-mono tabular-nums px-3 py-2.5 text-right text-[#00E5FF]">
                          {formatRR(t.riskRewardRatio)}
                        </td>
                        <td
                          className={`font-mono tabular-nums px-3 py-2.5 text-right font-semibold ${
                            t.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {formatCurrency(t.netPnl, overview.account.currency, true)}
                        </td>
                        <td className="px-3 py-2.5">
                          <button
                            type="button"
                            onClick={() => handleToggleVerify(t)}
                            className={`inline-flex items-center gap-1 text-[11px] ${
                              t.isVerified ? 'text-[#00E5FF]' : 'text-[#8194A9] hover:text-[#EAF7FF]'
                            }`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                            {t.isVerified ? 'Verified' : 'Mark Verified'}
                          </button>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingTrade(t)}
                              aria-label={`Edit ${t.tradeId}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#8194A9]/22 bg-[#020305] text-[#EAF7FF] hover:border-[#00E5FF] hover:text-[#00E5FF]"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(t)}
                              aria-label={`Delete ${t.tradeId}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#8194A9]/22 bg-[#020305] text-rose-400 hover:border-rose-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 md:hidden">
                {filteredTrades.map((t) => (
                  <div
                    key={t.id}
                    className="cyber-glass rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-michroma text-xs text-[#EAF7FF]">
                          {t.instrument} · {t.direction}
                        </span>
                        <p className="mt-1 font-mono text-[11px] text-[#8194A9] truncate">
                          {t.tradeDate} · {t.tradeId}
                        </p>
                      </div>
                      <span
                        className={`font-michroma tabular-nums text-sm shrink-0 ${
                          t.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {formatCurrency(t.netPnl, overview.account.currency, true)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-[#8194A9]/15 pt-3">
                      <button
                        type="button"
                        onClick={() => handleToggleVerify(t)}
                        className="text-xs text-[#00E5FF]"
                      >
                        {t.isVerified ? 'Verified' : 'Verify Record'}
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingTrade(t)}
                          className="min-h-9 rounded-lg border border-[#8194A9]/25 bg-[#020305] px-3 py-1.5 text-xs text-[#EAF7FF]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(t)}
                          className="min-h-9 rounded-lg border border-rose-500/40 bg-[#020305] px-3 py-1.5 text-xs text-rose-400"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'account' && (
            <AccountEditor account={overview.account} onSaved={refreshAll} />
          )}

          {tab === 'risk' && (
            <RiskEditor riskParameters={overview.riskParameters} onSaved={refreshAll} />
          )}

          {tab === 'content' && (
            <ContentEditor siteContent={overview.siteContent} onSaved={refreshAll} />
          )}

          {tab === 'backup' && (
            <div className="space-y-6">
              <div className="cyber-glass rounded-2xl p-6 space-y-4">
                <h2 className="font-michroma text-sm tracking-[0.12em] text-[#EAF7FF]">
                  CSV TRADING HISTORY IMPORT &amp; EXPORT
                </h2>
                <div className="flex flex-wrap items-center gap-4">
                  <a
                    href="/api/admin/transactions/export-csv"
                    className="font-michroma inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#00E5FF]/75 bg-[#00E5FF]/14 px-4 py-2 text-xs tracking-[0.1em] text-[#EAF7FF] hover:bg-[#00E5FF] hover:text-[#020305]"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    EXPORT CSV
                  </a>
                  <label className="font-michroma inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-[#168BFF]/40 bg-[#020305] px-4 py-2 text-xs tracking-[0.1em] text-[#00E5FF] hover:border-[#00E5FF]">
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    IMPORT CSV
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleCsvUpload}
                      className="sr-only"
                    />
                  </label>
                </div>
                <label className="inline-flex items-center gap-2 font-inter text-xs text-[#8194A9]">
                  <input
                    type="checkbox"
                    checked={replaceCsvOnImport}
                    onChange={(e) => setReplaceCsvOnImport(e.target.checked)}
                    className="h-4 w-4 accent-[#00E5FF]"
                  />
                  Replace all existing transactions on CSV import (useful when migrating verified broker statements)
                </label>
              </div>

              <div className="cyber-glass rounded-2xl p-6 space-y-4">
                <h2 className="font-michroma text-sm tracking-[0.12em] text-[#EAF7FF]">
                  FULL DATABASE BACKUP &amp; RESTORE (JSON)
                </h2>
                <p className="font-inter text-xs leading-relaxed text-[#8194A9]">
                  Downloads or restores all transactions, account settings, risk parameters, and website content atomically.
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <a
                    href="/api/admin/backup"
                    className="font-michroma inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#00E5FF]/75 bg-[#00E5FF]/14 px-4 py-2 text-xs tracking-[0.1em] text-[#EAF7FF] hover:bg-[#00E5FF] hover:text-[#020305]"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    DOWNLOAD BACKUP JSON
                  </a>
                  <label className="font-michroma inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-[#168BFF]/40 bg-[#020305] px-4 py-2 text-xs tracking-[0.1em] text-[#EAF7FF] hover:border-[#00E5FF]">
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    RESTORE BACKUP JSON
                    <input
                      type="file"
                      accept="application/json,.json"
                      onChange={handleBackupRestore}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>

              {importStatus && (
                <p className="text-xs font-medium text-[#00E5FF]">{importStatus}</p>
              )}
            </div>
          )}

          {tab === 'audit' && (
            <div className="cyber-glass rounded-2xl p-6">
              <h2 className="font-michroma mb-4 text-sm tracking-[0.12em] text-[#EAF7FF]">
                SECURITY &amp; MUTATION AUDIT LOG
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#8194A9]/18 text-[#8194A9]">
                      <th className="py-2 pr-3 font-medium">Timestamp</th>
                      <th className="py-2 pr-3 font-medium">Event</th>
                      <th className="py-2 pr-3 font-medium">Actor</th>
                      <th className="py-2 font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8194A9]/12 font-inter">
                    {overview.auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="font-mono tabular-nums py-2.5 pr-3 text-[11px] text-[#8194A9]">
                          {log.createdAt}
                        </td>
                        <td className="font-michroma py-2.5 pr-3 text-[10px] text-[#00E5FF]">
                          {log.eventType}
                        </td>
                        <td className="py-2.5 pr-3 text-[#EAF7FF]/80">{log.actor}</td>
                        <td className="py-2.5 text-[#EAF7FF]">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'security' && (
            <div className="cyber-glass rounded-2xl p-6 space-y-4">
              <h2 className="font-michroma text-sm tracking-[0.12em] text-[#EAF7FF]">
                OWNER PIN SECURITY
              </h2>
              {authStatus.envPinConfigured ? (
                <p className="font-inter text-xs leading-relaxed text-[#EAF7FF]/85">
                  Owner PIN is currently managed via the server-side <code className="font-mono text-[#00E5FF]">OWNER_PIN</code> environment variable. Update the secret in server environment configuration to rotate the PIN.
                </p>
              ) : (
                <form onSubmit={handleChangePin} className="max-w-sm space-y-3">
                  <div>
                    <label htmlFor="sec-cur-pin" className="block text-xs text-[#EAF7FF]/85">
                      Current PIN
                    </label>
                    <input
                      id="sec-cur-pin"
                      type="password"
                      inputMode="numeric"
                      required
                      value={currentPin}
                      onChange={(e) => setCurrentPin(e.target.value.replace(/[^0-9]/g, ''))}
                      className="font-mono mt-1 h-10 w-full rounded-lg border border-[#8194A9]/22 bg-[#020305] px-3 text-xs text-[#EAF7FF] focus:border-[#00E5FF] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="sec-new-pin" className="block text-xs text-[#EAF7FF]/85">
                      New Numeric PIN (4–16 digits)
                    </label>
                    <input
                      id="sec-new-pin"
                      type="password"
                      inputMode="numeric"
                      required
                      minLength={4}
                      maxLength={16}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                      className="font-mono mt-1 h-10 w-full rounded-lg border border-[#8194A9]/22 bg-[#020305] px-3 text-xs text-[#EAF7FF] focus:border-[#00E5FF] focus:outline-none"
                    />
                  </div>
                  {pinMsg && <p className="text-xs text-[#00E5FF]">{pinMsg}</p>}
                  <button
                    type="submit"
                    className="font-michroma rounded-lg border border-[#00E5FF]/75 bg-[#00E5FF]/15 px-4 py-2.5 text-xs tracking-[0.1em] text-[#EAF7FF] hover:bg-[#00E5FF] hover:text-[#020305]"
                  >
                    UPDATE OWNER PIN
                  </button>
                </form>
              )}
            </div>
          )}
        </section>
      </div>

      {showAddModal && (
        <TradeFormModal
          initialTrade={null}
          onClose={() => setShowAddModal(false)}
          onSaved={refreshAll}
        />
      )}
      {editingTrade && (
        <TradeFormModal
          initialTrade={editingTrade}
          onClose={() => setEditingTrade(null)}
          onSaved={refreshAll}
        />
      )}

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#020305]/88 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
        >
          <div className="cyber-glass w-full max-w-md rounded-2xl border border-rose-500/50 p-6">
            <h2
              id="confirm-delete-title"
              className="font-michroma text-sm tracking-[0.1em] text-[#EAF7FF]"
            >
              CONFIRM TRANSACTION DELETION
            </h2>
            <p className="font-inter mt-3 text-xs leading-relaxed text-[#8194A9]">
              Delete <span className="font-mono text-[#EAF7FF]">{confirmDelete.tradeId}</span> ({confirmDelete.instrument} on {confirmDelete.tradeDate})? Account balance and equity curve will recalculate immediately.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg border border-[#8194A9]/25 px-4 py-2 text-xs text-[#8194A9] hover:text-[#EAF7FF]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="font-michroma rounded-lg border border-rose-500 bg-rose-500/20 px-4 py-2 text-xs tracking-[0.08em] text-rose-200 hover:bg-rose-500 hover:text-white"
              >
                DELETE TRADE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
