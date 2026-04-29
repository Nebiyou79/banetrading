/* eslint-disable @typescript-eslint/no-explicit-any */
// components/crypto/CryptoMarketsCardList.tsx
// ── MOBILE CRYPTO CARD GRID ──

import React from 'react';
import { useRouter } from 'next/router';
import type { MarketRow } from '@/types/markets';
import CoinIcon from './CoinIcon';
import CryptoPriceCell from './CryptoPriceCell';
import CryptoChangePill from './CryptoChangePill';
import CryptoSparkline from './CryptoSparkline';

interface CryptoMarketsCardListProps {
  rows: MarketRow[];
  isLoading?: boolean;
  onToggleFavorite?: (symbol: string) => void;
  favoriteSet?: Set<string>;
}

export default function CryptoMarketsCardList({ rows, isLoading = false, onToggleFavorite, favoriteSet }: CryptoMarketsCardListProps) {
  const router = useRouter();
  const skeleton = Array.from({ length: 6 }, (_, i) => i);

  if (isLoading) {
    return <div className="space-y-3">{skeleton.map(i => <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 animate-pulse"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-[var(--bg-muted)] rounded-full" /><div><div className="w-16 h-4 bg-[var(--bg-muted)] rounded mb-1" /><div className="w-20 h-3 bg-[var(--bg-muted)] rounded" /></div></div><div className="w-16 h-6 bg-[var(--bg-muted)] rounded-full" /></div><div className="flex items-center justify-between mt-3"><div className="w-24 h-6 bg-[var(--bg-muted)] rounded" /><div className="w-20 h-6 bg-[var(--bg-muted)] rounded" /></div></div>)}</div>;
  }
  if (rows.length === 0) return <div className="py-16 text-center text-[var(--text-muted)]"><p className="text-sm">No coins found</p></div>;

  return (
    <div className="space-y-3">
      {rows.map(row => (
        <div key={row.symbol} className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 cursor-pointer active:bg-[var(--hover-bg)] transition-colors duration-150" onClick={() => router.push(`/markets/crypto/${row.symbol}`)} role="button" tabIndex={0}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CoinIcon iconUrl={(row as any).iconUrl} symbol={row.symbol} size={40} />
              <div><div className="font-semibold text-sm text-[var(--text-primary)]">{row.symbol}</div><div className="text-xs text-[var(--text-muted)]">{row.name}</div></div>
            </div>
            <div className="flex items-center gap-2">
              {onToggleFavorite && (
                <button onClick={e => { e.stopPropagation(); onToggleFavorite(row.symbol); }} className="text-lg" style={{ color: favoriteSet?.has(row.symbol) ? 'var(--warning)' : 'var(--text-muted)' }}>★</button>
              )}
              <CryptoChangePill value={row.change24h} />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <CryptoPriceCell value={row.price} className="text-xl font-bold" />
            <CryptoSparkline data={(row as any).sparkline7d || []} width={90} height={32} />
          </div>
        </div>
      ))}
    </div>
  );
}