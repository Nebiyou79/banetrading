// components/trade/AmountInput.tsx
// ── AMOUNT INPUT ──
// Numeric input with asset-symbol suffix, quick-fill chips (25/50/75/100%),
// available-balance line, and inline validation hints.

import { ChangeEvent } from 'react';
import type { Currency } from '@/types/convert';

interface AmountInputProps {
  value: string;
  onChange: (next: string) => void;
  tradingAsset: Currency;
  available: number;
  minInAsset: number | null;
}

const CHIPS: Array<{ label: string; pct: number }> = [
  { label: '25%',  pct: 0.25 },
  { label: '50%',  pct: 0.50 },
  { label: '75%',  pct: 0.75 },
  { label: '100%', pct: 1.00 },
];

function formatBal(v: number, asset: Currency): string {
  if (!Number.isFinite(v)) return '0';
  if (asset === 'USDT') return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (v < 0.0001) return v.toFixed(8);
  if (v < 1)      return v.toFixed(6);
  return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
}

function formatMin(v: number, asset: Currency): string {
  if (asset === 'USDT') return v.toFixed(2);
  return v.toFixed(8);
}

export function AmountInput({
  value,
  onChange,
  tradingAsset,
  available,
  minInAsset,
}: AmountInputProps): JSX.Element {
  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    // allow only digits and a single dot
    if (v === '' || /^\d*\.?\d*$/.test(v)) onChange(v);
  };

  const num = Number(value);
  const isNum = value !== '' && Number.isFinite(num) && num > 0;
  const belowMin = isNum && minInAsset !== null && num < minInAsset;
  const exceeds = isNum && num > available;

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
        Amount
      </label>

      <div className={
        'flex items-center rounded-lg border bg-[var(--bg-muted)] transition-colors duration-150 ' +
        (belowMin || exceeds
          ? 'border-[var(--danger)]'
          : 'border-[var(--border)] hover:border-[var(--border-strong)] focus-within:border-[var(--accent)]')
      }>
        <input
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          placeholder="0.00"
          value={value}
          onChange={handleInput}
          className="tabular w-full bg-transparent px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
        />
        <span className="pr-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          {tradingAsset}
        </span>
      </div>

      {/* Quick fills */}
      <div className="grid grid-cols-4 gap-1.5">
        {CHIPS.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => {
              if (available <= 0) return;
              const fill = available * c.pct;
              const decimals = tradingAsset === 'USDT' ? 2 : 8;
              onChange(fill.toFixed(decimals));
            }}
            disabled={available <= 0}
            className="rounded-md bg-[var(--bg-muted)] px-2 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--accent-muted)] hover:text-[var(--accent)] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Helper line */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--text-muted)]">
          Available:{' '}
          <span className="tabular text-[var(--text-secondary)]">
            {formatBal(available, tradingAsset)} {tradingAsset}
          </span>
        </span>
      </div>

      {/* Inline validation */}
      {belowMin && minInAsset !== null && (
        <p className="text-xs text-[var(--danger)]">
          Below minimum (<span className="tabular">{formatMin(minInAsset, tradingAsset)}</span> {tradingAsset})
        </p>
      )}
      {exceeds && (
        <p className="text-xs text-[var(--danger)]">Exceeds available balance</p>
      )}
    </div>
  );
}