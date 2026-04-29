// components/forexMetals/ForexMarketsCardList.tsx
// ── MOBILE FOREX/METALS CARD GRID ──

import React from 'react';
import { useRouter } from 'next/router';
import type { ForexRow } from '@/types/markets';
import ForexPairBadge from './ForexPairBadge';
import ForexPriceCell from './ForexPriceCell';
import ForexChangePill from './ForexChangePill';
import SpreadCell from './SpreadCell';

interface ForexMarketsCardListProps {
  rows: ForexRow[];
  isLoading?: boolean;
}

export default function ForexMarketsCardList({ rows, isLoading = false }: ForexMarketsCardListProps) {
  const router = useRouter();
  const skeleton = Array.from({ length: 4 }, (_, i) => i);

  if (isLoading) {
    return <div className="space-y-3">{skeleton.map(i => <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 animate-pulse"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-[var(--bg-muted)] rounded-full" /><div><div className="w-20 h-4 bg-[var(--bg-muted)] rounded mb-1" /><div className="w-16 h-3 bg-[var(--bg-muted)] rounded" /></div></div><div className="w-16 h-6 bg-[var(--bg-muted)] rounded-full" /></div><div className="flex items-center justify-between mt-3"><div className="w-24 h-6 bg-[var(--bg-muted)] rounded" /><div className="w-16 h-4 bg-[var(--bg-muted)] rounded" /></div></div>)}</div>;
  }
  if (rows.length === 0) return <div className="py-16 text-center text-[var(--text-muted)]"><p className="text-sm">No pairs available</p></div>;

  return (
    <div className="space-y-3">
      {rows.map(row => (
        <div key={row.symbol} className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 cursor-pointer active:bg-[var(--hover-bg)] transition-colors duration-150" onClick={() => router.push(`/markets/forex/${row.symbol}`)} role="button" tabIndex={0}>
          <div className="flex items-center justify-between">
            <ForexPairBadge symbol={row.symbol} display={row.display} size={32} />
            <ForexChangePill value={row.change24h} />
          </div>
          <div className="flex items-center justify-between mt-3">
            <ForexPriceCell value={row.price} decimals={row.decimals} className="text-xl font-bold" />
            <div className="text-xs text-[var(--text-muted)]">
              Spread: <SpreadCell high={row.high24h} low={row.low24h} decimals={row.decimals} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}