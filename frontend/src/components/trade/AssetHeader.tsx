// components/trade/AssetHeader.tsx
// ── ASSET HEADER — Pair info with live price, change, and class badge ──

import { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { TradingPair, PairClass } from '@/types/trade';

interface AssetHeaderProps {
  pair: TradingPair | null;
  pairClass: PairClass;
  price: number | null;
  change24h: number | null;
  high24h: number | null;
  low24h: number | null;
  loading?: boolean;
}

function formatPrice(v: number | null, decimals: number): string {
  if (v === null || !Number.isFinite(v)) return '—';
  return v.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function getDecimals(pairClass: PairClass, price: number | null): number {
  if (pairClass === 'forex') return 4;
  if (pairClass === 'metals') return 2;
  if (price === null) return 2;
  if (price < 1) return 6;
  if (price < 100) return 4;
  return 2;
}

const CLASS_LABEL: Record<PairClass, string> = {
  crypto: 'CRYPTO',
  forex: 'FOREX',
  metals: 'METALS',
};

export function AssetHeader({
  pair,
  pairClass,
  price,
  change24h,
  high24h,
  low24h,
  loading,
}: AssetHeaderProps) {
  const decimals = getDecimals(pairClass, price);
  const isUp = (change24h ?? 0) >= 0;

  // Price flash animation
  const lastPriceRef = useRef<number | null>(null);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (price === null) return;
    const prev = lastPriceRef.current;
    if (prev !== null && prev !== price) {
      setFlash(price > prev ? 'up' : 'down');
      const t = setTimeout(() => setFlash(null), 500);
      lastPriceRef.current = price;
      return () => clearTimeout(t);
    }
    lastPriceRef.current = price;
  }, [price]);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
      {/* Left: Pair info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[var(--text-primary)] truncate">
              {pair?.display ?? '—'}
            </h2>
            <span className="shrink-0 inline-flex h-5 items-center rounded-full border border-[var(--border)] bg-[var(--bg-muted)] px-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              {CLASS_LABEL[pairClass]}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] truncate">{pair?.name ?? ''}</p>
        </div>
      </div>

      {/* Right: Price + Stats */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Price */}
        <div className="text-right">
          <span
            className={`block tabular text-xl font-bold text-[var(--text-primary)] transition-colors duration-300 ${
              flash === 'up' ? 'text-[var(--success)]' : flash === 'down' ? 'text-[var(--danger)]' : ''
            }`}
          >
            {loading ? '…' : formatPrice(price, decimals)}
          </span>
          {change24h !== null && (
            <span className={`inline-flex items-center gap-1 text-xs font-semibold ${isUp ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
              {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isUp ? '+' : ''}{change24h.toFixed(2)}%
            </span>
          )}
        </div>

        {/* High / Low */}
        <div className="hidden sm:flex flex-col gap-0.5 text-xs">
          <span className="text-[var(--text-muted)]">
            H <span className="tabular text-[var(--text-primary)]">{formatPrice(high24h, decimals)}</span>
          </span>
          <span className="text-[var(--text-muted)]">
            L <span className="tabular text-[var(--text-primary)]">{formatPrice(low24h, decimals)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}