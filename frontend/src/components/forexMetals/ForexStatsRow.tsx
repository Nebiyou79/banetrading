// components/forexMetals/ForexStatsRow.tsx
// ── 5-CELL STATS ROW FOR FOREX/METALS ──

import React from 'react';
import type { ForexRow } from '@/types/markets';
import { useResponsive } from '@/hooks/useResponsive';
import ForexPriceCell from './ForexPriceCell';
import ForexChangePill from './ForexChangePill';
import SpreadCell from './SpreadCell';

interface ForexStatsRowProps {
  row: ForexRow;
}

export default function ForexStatsRow({ row }: ForexStatsRowProps) {
  const { isMobile } = useResponsive();

  return (
    <div className={`rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 ${isMobile ? 'grid grid-cols-2 gap-4' : 'grid grid-cols-3 sm:grid-cols-5 gap-4'}`}>
      <div><span className="text-xs font-medium text-[var(--text-muted)] uppercase">Price</span><div className="mt-1"><ForexPriceCell value={row.price} decimals={row.decimals} className="text-sm font-semibold" /></div></div>
      <div><span className="text-xs font-medium text-[var(--text-muted)] uppercase">24h Change</span><div className="mt-1"><ForexChangePill value={row.change24h} /></div></div>
      <div><span className="text-xs font-medium text-[var(--text-muted)] uppercase">24h High</span><div className="mt-1"><ForexPriceCell value={row.high24h} decimals={row.decimals} className="text-sm font-semibold" /></div></div>
      <div><span className="text-xs font-medium text-[var(--text-muted)] uppercase">24h Low</span><div className="mt-1"><ForexPriceCell value={row.low24h} decimals={row.decimals} className="text-sm font-semibold" /></div></div>
      <div><span className="text-xs font-medium text-[var(--text-muted)] uppercase">Spread</span><div className="mt-1"><SpreadCell high={row.high24h} low={row.low24h} decimals={row.decimals} className="text-sm font-semibold" /></div></div>
    </div>
  );
}