// components/trade/TradingAssetSelector.tsx
// ── TRADING ASSET SELECTOR ──
// Native-feeling dropdown that lists user's available balances. Shows balance
// next to each option. Uses click-outside + keyboard ESC to close.

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Currency } from '@/types/convert';

interface TradingAssetSelectorProps {
  value: Currency;
  onChange: (asset: Currency) => void;
  balances: Record<Currency, number>;
  disabled?: boolean;
}

const ASSETS: Currency[] = ['USDT', 'BTC', 'ETH', 'SOL', 'BNB', 'XRP'];

const COIN_COLOR: Record<Currency, string> = {
  USDT: '#26A17B',
  BTC:  '#F7931A',
  ETH:  '#627EEA',
  SOL:  '#9945FF',
  BNB:  '#F3BA2F',
  XRP:  '#23292F',
};

function formatBalance(v: number): string {
  if (!Number.isFinite(v)) return '0.00000000';
  if (v === 0) return '0.00';
  if (v < 0.0001) return v.toFixed(8);
  if (v < 1) return v.toFixed(6);
  return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
}

export function TradingAssetSelector({
  value,
  onChange,
  balances,
  disabled,
}: TradingAssetSelectorProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Show only assets the user actually holds; if all are zero, show all so the
  // user can still pick one (and see the selector, e.g. before depositing).
  const hasAny = ASSETS.some((a) => (balances[a] || 0) > 0);
  const visible = hasAny ? ASSETS.filter((a) => (balances[a] || 0) > 0) : ASSETS;
  // Always include the currently selected asset.
  const list = visible.includes(value) ? visible : [value, ...visible];

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
        Trading asset
      </label>

      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={
          'flex w-full items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-2.5 text-sm text-[var(--text-primary)] transition-colors duration-150 hover:border-[var(--border-strong)] focus:border-[var(--accent)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed'
        }
      >
        <span className="flex items-center gap-2">
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: COIN_COLOR[value] }}
          >
            {value.slice(0, 2)}
          </span>
          <span className="font-semibold">{value}</span>
          <span className="text-xs text-[var(--text-secondary)] tabular">
            {formatBalance(balances[value] || 0)}
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 text-[var(--text-muted)] transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] py-1 shadow-lg animate-modal-in">
          {list.map((asset) => {
            const isActive = asset === value;
            return (
              <button
                key={asset}
                type="button"
                onClick={() => {
                  onChange(asset);
                  setOpen(false);
                }}
                className={
                  'flex w-full items-center justify-between gap-3 px-3 py-2.5 text-sm transition-colors duration-100 ' +
                  (isActive
                    ? 'bg-[var(--accent-muted)] text-[var(--accent)]'
                    : 'text-[var(--text-primary)] hover:bg-[var(--hover-bg)]')
                }
              >
                <span className="flex items-center gap-2">
                  <span
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: COIN_COLOR[asset] }}
                  >
                    {asset.slice(0, 2)}
                  </span>
                  <span className="font-semibold">{asset}</span>
                </span>
                <span className="text-xs text-[var(--text-secondary)] tabular">
                  {formatBalance(balances[asset] || 0)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}