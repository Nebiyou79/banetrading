// lib/format.ts
// ── Formatting helpers ──

const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const COMPACT_USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 2,
});

export function formatUsd(value: number, compact = false): string {
  if (!Number.isFinite(value)) return '$0.00';
  return (compact ? COMPACT_USD : USD_FORMATTER).format(value);
}

export function formatSignedUsd(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${formatUsd(Math.abs(value))}`;
}

export function formatSignedPercent(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${Math.abs(value).toFixed(2)}%`;
}

export function formatAmount(amount: number, currency: string): string {
  const fractionDigits = currency === 'BTC' || currency === 'ETH' ? 6 : 2;
  const value = Number.isFinite(amount) ? amount : 0;
  return `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: fractionDigits })} ${currency}`;
}

const RELATIVE_FORMAT = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export function formatRelativeTime(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return '—';
  const diffSec = Math.round((date.getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60)        return RELATIVE_FORMAT.format(diffSec, 'second');
  if (abs < 3600)      return RELATIVE_FORMAT.format(Math.round(diffSec / 60), 'minute');
  if (abs < 86_400)    return RELATIVE_FORMAT.format(Math.round(diffSec / 3600), 'hour');
  if (abs < 604_800)   return RELATIVE_FORMAT.format(Math.round(diffSec / 86_400), 'day');
  if (abs < 2_629_800) return RELATIVE_FORMAT.format(Math.round(diffSec / 604_800), 'week');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDate(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getGreeting(date = new Date()): 'morning' | 'afternoon' | 'evening' {
  const h = date.getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}