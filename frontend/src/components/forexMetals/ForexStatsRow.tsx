// components/forexMetals/ForexStatsRow.tsx
// ── FOREX STATS ROW — Clean 5-column stats display ──

import React from 'react';
import type { ForexRow } from '@/types/markets';
import { useResponsive } from '@/hooks/useResponsive';
import ForexPriceCell from './ForexPriceCell';
import ForexChangePill from './ForexChangePill';
import SpreadCell from './SpreadCell';

interface ForexStatsRowProps {
  row: ForexRow;
}

function StatCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{label}</span>
      <div>{children}</div>
    </div>
  );
}

export default function ForexStatsRow({ row }: ForexStatsRowProps) {
  const { isMobile } = useResponsive();

  return (
    <div className={`rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 ${
      isMobile ? 'grid grid-cols-2 gap-4' : 'grid grid-cols-5 gap-4'
    }`}>
      <StatCell label="Price">
        <ForexPriceCell value={row.price} decimals={row.decimals} className="text-sm font-semibold" />
      </StatCell>
      <StatCell label="24h Change">
        <ForexChangePill value={row.change24h} />
      </StatCell>
      <StatCell label="24h High">
        <ForexPriceCell value={row.high24h} decimals={row.decimals} className="text-sm font-semibold" />
      </StatCell>
      <StatCell label="24h Low">
        <ForexPriceCell value={row.low24h} decimals={row.decimals} className="text-sm font-semibold" />
      </StatCell>
      <StatCell label="Spread">
        <SpreadCell high={row.high24h} low={row.low24h} decimals={row.decimals} className="text-sm font-semibold" />
      </StatCell>
    </div>
  );
}