import { useEffect, useState } from 'react';
import { Trash2, Upload, X } from 'lucide-react';
import type {
  TradeTransaction,
  TradingDirection,
  TradingMethodology,
  TradingOutcome,
  TradingSession,
} from '../../types/trading';
import { api } from '../../utils/api';
import {
  calculateGrossPnl,
  calculateNetPnl,
  calculateRiskRewardRatio,
  deriveTradeOutcome,
  getInstrumentSpec,
} from '../../utils/tradingEngine';

interface TradeFormModalProps {
  initialTrade: TradeTransaction | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

const INSTRUMENTS = [
  'XAUUSD',
  'NQ Futures',
  'EURUSD',
  'GBPUSD',
  'USDJPY',
  'AUDUSD',
  'USDCAD',
  'GBPJPY',
];

const METHODOLOGIES: TradingMethodology[] = [
  'ALCHEMIST',
  'SMC',
  'ICT',
  'Price Action',
  'SND',
  'SNR',
];

const SESSIONS: TradingSession[] = ['London', 'New York', 'Overlap', 'Asian'];

export function TradeFormModal({ initialTrade, onClose, onSaved }: TradeFormModalProps) {
  const isEditing = Boolean(initialTrade);
  const [tradeId, setTradeId] = useState(initialTrade?.tradeId ?? '');
  const [tradeDate, setTradeDate] = useState(
    initialTrade?.tradeDate ?? '2026-11-23'
  );
  const [tradeTime, setTradeTime] = useState(initialTrade?.tradeTime ?? '14:30');
  const [session, setSession] = useState<TradingSession>(
    initialTrade?.session ?? 'New York'
  );
  const [instrument, setInstrument] = useState(initialTrade?.instrument ?? 'XAUUSD');
  const [direction, setDirection] = useState<TradingDirection>(
    initialTrade?.direction ?? 'BUY'
  );
  const [entryPrice, setEntryPrice] = useState(
    String(initialTrade?.entryPrice ?? '2950.00')
  );
  const [exitPrice, setExitPrice] = useState(
    String(initialTrade?.exitPrice ?? '2970.00')
  );
  const [stopLoss, setStopLoss] = useState(
    String(initialTrade?.stopLoss ?? '2940.00')
  );
  const [takeProfit, setTakeProfit] = useState(
    String(initialTrade?.takeProfit ?? '2970.00')
  );
  const [lotSize, setLotSize] = useState(String(initialTrade?.lotSize ?? '0.50'));
  const [commission, setCommission] = useState(
    String(initialTrade?.commission ?? '3.50')
  );
  const [swap, setSwap] = useState(String(initialTrade?.swap ?? '0'));
  const [methodology, setMethodology] = useState<TradingMethodology>(
    initialTrade?.methodology ?? 'ALCHEMIST'
  );
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(
    initialTrade?.screenshotUrl ?? null
  );
  const [notes, setNotes] = useState(initialTrade?.notes ?? '');
  const [isVerified, setIsVerified] = useState(initialTrade?.isVerified ?? true);
  const [isPublished, setIsPublished] = useState(initialTrade?.isPublished ?? true);
  const [manualNetOverride, setManualNetOverride] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entryNum = Number(entryPrice) || 0;
  const exitNum = Number(exitPrice) || 0;
  const slNum = Number(stopLoss) || 0;
  const tpNum = Number(takeProfit) || 0;
  const lotNum = Number(lotSize) || 0;
  const commNum = Number(commission) || 0;
  const swapNum = Number(swap) || 0;

  const autoGross = calculateGrossPnl({
    instrument,
    direction,
    entryPrice: entryNum,
    exitPrice: exitNum,
    lotSize: lotNum,
  });
  const autoNet = calculateNetPnl(autoGross, commNum, swapNum);
  const effectiveNet =
    manualNetOverride.trim() !== '' && Number.isFinite(Number(manualNetOverride))
      ? Number(manualNetOverride)
      : autoNet;
  const autoRR = calculateRiskRewardRatio({
    direction,
    entryPrice: entryNum,
    exitPrice: exitNum,
    stopLoss: slNum,
  });
  const autoOutcome: TradingOutcome = deriveTradeOutcome(effectiveNet);
  const spec = getInstrumentSpec(instrument);

  useEffect(() => {
    if (!initialTrade) {
      setCommission(String((spec.defaultCommissionPerLot * (Number(lotSize) || 0)).toFixed(2)));
    }
  }, [instrument, initialTrade, lotSize, spec.defaultCommissionPerLot]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const dataBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Failed to read image file.'));
        reader.readAsDataURL(file);
      });
      const res = await api.uploadScreenshot(file.name, file.type, dataBase64);
      setScreenshotUrl(res.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Screenshot upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteScreenshot = async () => {
    if (!screenshotUrl) return;
    const filename = screenshotUrl.split('/').pop();
    if (filename) {
      try {
        await api.deleteScreenshot(filename);
      } catch {
        // Ignore if file already missing
      }
    }
    setScreenshotUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        tradeId: tradeId.trim() || undefined,
        tradeDate,
        tradeTime,
        session,
        instrument,
        direction,
        entryPrice: entryNum,
        exitPrice: exitNum,
        stopLoss: slNum,
        takeProfit: tpNum,
        lotSize: lotNum,
        grossPnl: autoGross,
        commission: commNum,
        swap: swapNum,
        netPnl: effectiveNet,
        riskRewardRatio: autoRR,
        methodology,
        outcome: autoOutcome,
        screenshotUrl,
        notes,
        isVerified,
        isPublished,
      };
      if (isEditing && initialTrade) {
        await api.updateTransaction(initialTrade.id, payload);
      } else {
        await api.createTransaction(payload);
      }
      await onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save transaction.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'mt-1 h-10 w-full rounded-lg border border-[#8194A9]/22 bg-[#020305] px-3 text-xs text-[#EAF7FF] focus:border-[#00E5FF] focus:outline-none';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#020305]/88 p-3 sm:p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trade-form-title"
    >
      <div className="cyber-glass-signature max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 border-b border-[#8194A9]/15 pb-4">
          <div className="min-w-0">
            <h2
              id="trade-form-title"
              className="font-michroma text-sm sm:text-base tracking-[0.1em] text-[#EAF7FF] truncate"
            >
              {isEditing ? `EDIT TRADE · ${initialTrade?.tradeId}` : 'ADD NEW TRADE'}
            </h2>
            <p className="font-inter mt-1 text-xs text-[#8194A9]">{spec.pointLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close trade form"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#8194A9]/25 bg-[#020305] text-[#EAF7FF] hover:border-[#00E5FF]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="tf-date" className="block text-xs text-[#EAF7FF]/85">
                Trading Date
              </label>
              <input
                id="tf-date"
                type="date"
                required
                value={tradeDate}
                onChange={(e) => setTradeDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="tf-time" className="block text-xs text-[#EAF7FF]/85">
                Trading Time
              </label>
              <input
                id="tf-time"
                type="time"
                required
                value={tradeTime}
                onChange={(e) => setTradeTime(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="tf-session" className="block text-xs text-[#EAF7FF]/85">
                Session
              </label>
              <select
                id="tf-session"
                value={session}
                onChange={(e) => setSession(e.target.value as TradingSession)}
                className={inputClass}
              >
                {SESSIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <label htmlFor="tf-instrument" className="block text-xs text-[#EAF7FF]/85">
                Instrument
              </label>
              <select
                id="tf-instrument"
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                className={inputClass}
              >
                {INSTRUMENTS.map((inst) => (
                  <option key={inst} value={inst}>
                    {inst}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="tf-direction" className="block text-xs text-[#EAF7FF]/85">
                Direction
              </label>
              <select
                id="tf-direction"
                value={direction}
                onChange={(e) => setDirection(e.target.value as TradingDirection)}
                className={inputClass}
              >
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </div>
            <div>
              <label htmlFor="tf-methodology" className="block text-xs text-[#EAF7FF]/85">
                Methodology
              </label>
              <select
                id="tf-methodology"
                value={methodology}
                onChange={(e) => setMethodology(e.target.value as TradingMethodology)}
                className={inputClass}
              >
                {METHODOLOGIES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="tf-id" className="block text-xs text-[#EAF7FF]/85">
                Trade ID (Optional)
              </label>
              <input
                id="tf-id"
                type="text"
                value={tradeId}
                onChange={(e) => setTradeId(e.target.value)}
                placeholder="Auto-generated"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
            <div>
              <label htmlFor="tf-entry" className="block text-xs text-[#EAF7FF]/85">
                Entry Price
              </label>
              <input
                id="tf-entry"
                type="number"
                step="any"
                required
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className={`font-mono ${inputClass}`}
              />
            </div>
            <div>
              <label htmlFor="tf-exit" className="block text-xs text-[#EAF7FF]/85">
                Exit Price
              </label>
              <input
                id="tf-exit"
                type="number"
                step="any"
                required
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                className={`font-mono ${inputClass}`}
              />
            </div>
            <div>
              <label htmlFor="tf-sl" className="block text-xs text-[#EAF7FF]/85">
                Stop Loss
              </label>
              <input
                id="tf-sl"
                type="number"
                step="any"
                required
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                className={`font-mono ${inputClass}`}
              />
            </div>
            <div>
              <label htmlFor="tf-tp" className="block text-xs text-[#EAF7FF]/85">
                Take Profit
              </label>
              <input
                id="tf-tp"
                type="number"
                step="any"
                required
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                className={`font-mono ${inputClass}`}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="tf-lots" className="block text-xs text-[#EAF7FF]/85">
                Lot / Contracts
              </label>
              <input
                id="tf-lots"
                type="number"
                step="any"
                min="0.01"
                required
                value={lotSize}
                onChange={(e) => setLotSize(e.target.value)}
                className={`font-mono ${inputClass}`}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="tf-comm" className="block text-xs text-[#EAF7FF]/85">
                Commission
              </label>
              <input
                id="tf-comm"
                type="number"
                step="any"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                className={`font-mono ${inputClass}`}
              />
            </div>
            <div>
              <label htmlFor="tf-swap" className="block text-xs text-[#EAF7FF]/85">
                Swap / Fees (+/-)
              </label>
              <input
                id="tf-swap"
                type="number"
                step="any"
                value={swap}
                onChange={(e) => setSwap(e.target.value)}
                className={`font-mono ${inputClass}`}
              />
            </div>
            <div>
              <label htmlFor="tf-net-override" className="block text-xs text-[#EAF7FF]/85">
                Net P&amp;L Override (Optional)
              </label>
              <input
                id="tf-net-override"
                type="number"
                step="any"
                value={manualNetOverride}
                onChange={(e) => setManualNetOverride(e.target.value)}
                placeholder={`Auto: ${autoNet.toFixed(2)}`}
                className={`font-mono ${inputClass}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-xl border border-[#8194A9]/15 bg-[#020305] p-3 text-xs sm:grid-cols-4">
            <div>
              <span className="block text-[11px] text-[#8194A9]">Calculated Gross</span>
              <span className="font-mono tabular-nums text-[#EAF7FF]/85">
                ${autoGross.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-[#8194A9]">Effective Net P&amp;L</span>
              <span
                className={`font-mono tabular-nums font-semibold ${
                  effectiveNet >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                ${effectiveNet.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-[#8194A9]">Realized R:R</span>
              <span className="font-mono tabular-nums text-[#00E5FF]">
                {autoRR.toFixed(2)}R
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-[#8194A9]">Outcome</span>
              <span className="font-michroma text-[#EAF7FF]">{autoOutcome}</span>
            </div>
          </div>

          <div>
            <label htmlFor="tf-notes" className="block text-xs text-[#EAF7FF]/85">
              Execution Notes
            </label>
            <textarea
              id="tf-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Confluence, session context, and management review..."
              className="mt-1 w-full rounded-lg border border-[#8194A9]/22 bg-[#020305] p-3 text-xs text-[#EAF7FF] focus:border-[#00E5FF] focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#8194A9]/15 bg-[#020305]/80 p-3">
            <div className="flex items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#168BFF]/40 bg-[#090F18] px-3 py-2 text-xs text-[#00E5FF] hover:border-[#00E5FF]">
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{uploading ? 'Uploading...' : 'Upload Chart Screenshot'}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </label>
              {screenshotUrl && (
                <button
                  type="button"
                  onClick={handleDeleteScreenshot}
                  className="inline-flex items-center gap-1 text-xs text-rose-400 hover:underline"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove Image
                </button>
              )}
            </div>
            {screenshotUrl && (
              <span className="font-mono text-[11px] text-emerald-400">
                Attached: {screenshotUrl.split('/').pop()}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-1">
            <label className="inline-flex items-center gap-2 text-xs text-[#EAF7FF]">
              <input
                type="checkbox"
                checked={isVerified}
                onChange={(e) => setIsVerified(e.target.checked)}
                className="h-4 w-4 accent-[#00E5FF]"
              />
              Verified Live-Account Execution
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-[#EAF7FF]">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4 w-4 accent-[#00E5FF]"
              />
              Published to Public Portfolio
            </label>
          </div>

          {error && (
            <p role="alert" className="text-xs text-rose-400">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-[#8194A9]/15 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#8194A9]/25 px-4 py-2 text-xs text-[#8194A9] hover:text-[#EAF7FF]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="font-michroma rounded-lg border border-[#00E5FF]/75 bg-[#00E5FF]/15 px-5 py-2 text-xs tracking-[0.1em] text-[#EAF7FF] hover:bg-[#00E5FF] hover:text-[#020305] disabled:opacity-50"
            >
              {saving ? 'SAVING...' : isEditing ? 'UPDATE TRADE' : 'SAVE TRADE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
