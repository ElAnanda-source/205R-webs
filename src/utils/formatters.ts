import { getInstrumentSpec } from './tradingEngine';

export function formatCurrency(amount: number, currency = 'USD', signed = false): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const abs = Math.abs(safe);
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs);

  if (safe < 0) return `-${formatted}`;
  if (signed && safe > 0) return `+${formatted}`;
  return formatted;
}

export function formatPrice(price: number, instrument: string): string {
  const spec = getInstrumentSpec(instrument);
  if (!Number.isFinite(price)) return '0.00';
  return price.toFixed(spec.decimals);
}

export function formatPct(val: number, signed = false): string {
  const safe = Number.isFinite(val) ? val : 0;
  const sign = signed && safe > 0 ? '+' : '';
  return `${sign}${safe.toFixed(2)}%`;
}

export function formatRR(rr: number): string {
  const safe = Number.isFinite(rr) ? rr : 0;
  const sign = safe > 0 ? '+' : '';
  return `${sign}${safe.toFixed(2)}R`;
}

export function outcomeTextColor(outcome: string): string {
  if (outcome === 'WIN') return 'text-emerald-400';
  if (outcome === 'LOSS') return 'text-rose-400';
  return 'text-[#C4D5E8]';
}
