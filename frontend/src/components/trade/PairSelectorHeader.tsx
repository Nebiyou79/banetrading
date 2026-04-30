// components/trade/PairSelectorHeader.tsx
// ── PAIR HEADER ──
// Shows the active pair, its live price, 24h change, hi/lo, and a class badge.

import { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { TradingPair, PairClass } from '@/types/trade';

interface PairSelectorHeaderProps {
  pair: TradingPair | null;
  pairClass: PairClass;
  price: number | null;
  change24h: number | null;
  high24h: number | null;
  low24h: number | null;
  loading?: boolean;
}

function formatPrice(v: number | null, decimals = 2): string {
  if (v === null || !Number.isFinite(v)) return '—';
  return v.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function pickDecimals(pairClass: PairClass, price: number | null): number {
  if (pairClass === 'forex') return 4;
  if (pairClass === 'metals') return 2;
  if (price === null) return 2;
  if (price < 1) return 6;
  if (price < 100) return 4;
  return 2;
}

const CLASS_LABEL: Record<PairClass, string> = {
  crypto: 'CRYPTO',
  forex:  'FOREX',
  metals: 'METALS',
};

export function PairSelectorHeader({
  pair,
  pairClass,
  price,
  change24h,
  high24h,
  low24h,
  loading,
}: PairSelectorHeaderProps): JSX.Element {
  const decimals = pickDecimals(pairClass, price);
  const isUp = (change24h ?? 0) >= 0;

  // ── Flash on price tick ──
  const priceRef = useRef<HTMLSpanElement | null>(null);
  const lastPriceRef = useRef<number | null>(null);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (price === null) return;
    const prev = lastPriceRef.current;
    if (prev !== null && prev !== price) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFlash(price > prev ? 'up' : 'down');
      const t = setTimeout(() => setFlash(null), 600);
      lastPriceRef.current = price;
      return () => clearTimeout(t);
    }
    lastPriceRef.current = price;
  }, [price]);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: pair + badge + change */}
        <div className="flex items-start gap-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
                {pair?.display ?? '—'}
              </h2>
              <span className="inline-flex h-5 items-center rounded-full border border-[var(--border)] bg-[var(--bg-muted)] px-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                {CLASS_LABEL[pairClass]}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">{pair?.name ?? ''}</p>
          </div>
        </div>

        {/* Right: price + change + hi/lo */}
        <div className="flex flex-col gap-1 sm:items-end">
          <div className="flex items-baseline gap-2">
            <span
              ref={priceRef}
              className={`tabular text-2xl sm:text-3xl font-bold text-[var(--text-primary)] ${flash === 'up' ? 'flash-up' : ''} ${flash === 'down' ? 'flash-down' : ''}`}
            >
              {loading ? '…' : formatPrice(price, decimals)}
            </span>
            {change24h !== null && (
              <span className={`tabular text-sm font-semibold inline-flex items-center gap-1 ${isUp ? 'text-gain' : 'text-loss'}`}>
                {isUp
                  ? <TrendingUp className="h-3.5 w-3.5" />
                  : <TrendingDown className="h-3.5 w-3.5" />}
                {`${isUp ? '+' : ''}${change24h.toFixed(2)}%`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
            <span>
              <span className="text-[var(--text-muted)]">High</span>{' '}
              <span className="tabular text-[var(--text-primary)]">{formatPrice(high24h, decimals)}</span>
            </span>
            <span className="text-[var(--border)]">|</span>
            <span>
              <span className="text-[var(--text-muted)]">Low</span>{' '}
              <span className="tabular text-[var(--text-primary)]">{formatPrice(low24h, decimals)}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}