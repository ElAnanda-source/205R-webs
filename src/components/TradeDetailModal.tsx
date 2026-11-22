import { X } from 'lucide-react';
import type { PublicTradeRecord } from '../types/trading';
import { formatCurrency, formatPrice, formatRR } from '../utils/formatters';

interface TradeDetailModalProps {
  trade: PublicTradeRecord | null;
  currency: string;
  onClose: () => void;
}

export function TradeDetailModal({ trade, currency, onClose }: TradeDetailModalProps) {
  if (!trade) return null;
  const redacted = Boolean(trade.financialsRedacted || trade.netPnl === null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#020305]/88 p-3 sm:p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trade-detail-title"
      onClick={onClose}
    >
      <div
        className="cyber-glass-signature max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#8194A9]/15 pb-4">
          <div className="min-w-0">
            <p className="font-inter text-xs text-[#8194A9]">
              {trade.tradeDate} · {trade.tradeTime} · {trade.session} Session
            </p>
            <h2
              id="trade-detail-title"
              className="font-michroma mt-1 text-base sm:text-lg tracking-[0.08em] text-[#EAF7FF] break-words"
            >
              {trade.tradeId} — {trade.instrument}
            </h2>
            <p className="font-inter mt-1 text-xs text-[#8194A9]">
              {trade.isVerified
                ? 'Verified Live-Account Execution Record'
                : 'Draft Historical Record (Reconstructed Draft Entry)'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close trade detail modal"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#8194A9]/25 bg-[#020305] text-[#EAF7FF] hover:border-[#00E5FF] hover:text-[#00E5FF]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <span className="font-inter block text-[11px] text-[#8194A9]">Direction</span>
            <span className="font-michroma text-xs text-[#EAF7FF]">{trade.direction}</span>
          </div>
          <div>
            <span className="font-inter block text-[11px] text-[#8194A9]">Methodology</span>
            <span className="font-michroma text-xs text-[#00E5FF]">{trade.methodology}</span>
          </div>
          <div>
            <span className="font-inter block text-[11px] text-[#8194A9]">Outcome</span>
            <span
              className={`font-michroma text-xs ${
                trade.outcome === 'WIN'
                  ? 'text-emerald-400'
                  : trade.outcome === 'LOSS'
                    ? 'text-rose-400'
                    : 'text-[#EAF7FF]/80'
              }`}
            >
              {trade.outcome}
            </span>
          </div>
          <div>
            <span className="font-inter block text-[11px] text-[#8194A9]">Entry Price</span>
            <span className="font-mono tabular-nums text-sm text-[#EAF7FF]">
              {formatPrice(trade.entryPrice, trade.instrument)}
            </span>
          </div>
          <div>
            <span className="font-inter block text-[11px] text-[#8194A9]">Exit Price</span>
            <span className="font-mono tabular-nums text-sm text-[#EAF7FF]">
              {formatPrice(trade.exitPrice, trade.instrument)}
            </span>
          </div>
          <div>
            <span className="font-inter block text-[11px] text-[#8194A9]">Lot / Contract Size</span>
            <span className="font-mono tabular-nums text-sm text-[#EAF7FF]">
              {trade.lotSize !== null ? trade.lotSize.toFixed(2) : 'Owner Private'}
            </span>
          </div>
          <div>
            <span className="font-inter block text-[11px] text-[#8194A9]">Stop Loss</span>
            <span className="font-mono tabular-nums text-sm text-[#EAF7FF]/80">
              {formatPrice(trade.stopLoss, trade.instrument)}
            </span>
          </div>
          <div>
            <span className="font-inter block text-[11px] text-[#8194A9]">Take Profit</span>
            <span className="font-mono tabular-nums text-sm text-[#EAF7FF]/80">
              {formatPrice(trade.takeProfit, trade.instrument)}
            </span>
          </div>
          <div>
            <span className="font-inter block text-[11px] text-[#8194A9]">Risk-to-Reward</span>
            <span className="font-mono tabular-nums text-sm text-[#00E5FF]">
              {formatRR(trade.riskRewardRatio)}
            </span>
          </div>
          <div>
            <span className="font-inter block text-[11px] text-[#8194A9]">Gross P&amp;L</span>
            <span className="font-mono tabular-nums text-sm text-[#EAF7FF]/85">
              {redacted ? 'Owner Private' : formatCurrency(trade.grossPnl ?? 0, currency, true)}
            </span>
          </div>
          <div>
            <span className="font-inter block text-[11px] text-[#8194A9]">Commission / Swap</span>
            <span className="font-mono tabular-nums text-sm text-[#8194A9]">
              {redacted
                ? 'Owner Private'
                : `-${formatCurrency(trade.commission ?? 0, currency)} / ${formatCurrency(trade.swap ?? 0, currency, true)}`}
            </span>
          </div>
          <div>
            <span className="font-inter block text-[11px] text-[#8194A9]">Net P&amp;L</span>
            <span
              className={`font-michroma tabular-nums text-sm ${
                redacted
                  ? 'text-[#8194A9]'
                  : (trade.netPnl ?? 0) >= 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
              }`}
            >
              {redacted ? 'Owner Private' : formatCurrency(trade.netPnl ?? 0, currency, true)}
            </span>
          </div>
        </div>

        <div className="mt-6 border-t border-[#8194A9]/15 pt-4">
          <h3 className="font-michroma text-xs tracking-[0.1em] text-[#8194A9]">
            EXECUTION NOTES
          </h3>
          <p className="font-inter mt-2 text-sm leading-relaxed text-[#EAF7FF]">
            {trade.notes || 'No execution commentary recorded for this position.'}
          </p>
        </div>

        {trade.screenshotUrl && (
          <div className="mt-5 border-t border-[#8194A9]/15 pt-4">
            <h3 className="font-michroma mb-2 text-xs tracking-[0.1em] text-[#8194A9]">
              CHART SCREENSHOT
            </h3>
            <img
              src={trade.screenshotUrl}
              alt={`Chart screenshot for ${trade.tradeId}`}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="max-h-80 w-full rounded-xl border border-[#8194A9]/20 object-contain bg-[#020305]"
            />
          </div>
        )}
      </div>
    </div>
  );
}
