// components/trade/TradingAssetSelector.tsx
// ── TRADING ASSET SELECTOR (FIXED: USDT-only) ──
// Trading is locked to USDT. Non-USDT balances show a convert prompt.

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ArrowRightLeft } from 'lucide-react';
import type { Currency } from '@/types/convert';

interface TradingAssetSelectorProps {
  value: Currency;
  onChange: (asset: Currency) => void;
  balances: Record<Currency, number>;
  disabled?: boolean;
}

// Only USDT is allowed for trading
const TRADING_ASSET: Currency = 'USDT';

function formatBalance(v: number): string {
  if (!Number.isFinite(v)) return '0.00';
  return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function TradingAssetSelector({
  value,
  onChange,
  balances,
  disabled,
}: TradingAssetSelectorProps): JSX.Element {
  const usdtBalance = balances['USDT'] || 0;

  // Non-USDT balances — for "convert" hint
  const otherAssets: Array<{ symbol: Currency; balance: number }> = (
    ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'] as Currency[]
  )
    .filter((a) => (balances[a] || 0) > 0)
    .map((a) => ({ symbol: a, balance: balances[a] || 0 }));

  // Always ensure we pass USDT upstream on mount
  useEffect(() => {
    if (value !== TRADING_ASSET) {
      onChange(TRADING_ASSET);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
        Trading Asset
      </label>

      {/* Locked USDT display */}
      <div
        className={`flex w-full items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-2.5 ${
          disabled ? 'opacity-50' : ''
        }`}
      >
        <span className="flex items-center gap-2">
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: '#26A17B' }}
          >
            US
          </span>
          <span className="font-semibold text-sm text-[var(--text-primary)]">USDT</span>
          <span className="text-xs text-[var(--text-secondary)] tabular">
            {formatBalance(usdtBalance)}
          </span>
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)] rounded-full px-2 py-0.5 bg-[var(--accent-muted)]">
          Only
        </span>
      </div>

      {/* Convert hint when user has non-USDT balances */}
      {otherAssets.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-2.5">
          <ArrowRightLeft className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-[var(--accent)]" />
          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-[var(--text-secondary)]">
              You hold{' '}
              {otherAssets.map((a) => `${a.symbol}`).join(', ')}.{' '}
              <a
                href="/convert"
                className="text-[var(--accent)] hover:underline font-medium"
              >
                Convert to USDT
              </a>{' '}
              to use them for trading.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}