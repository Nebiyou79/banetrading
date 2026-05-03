// components/crypto/CoinStatsRow.tsx
// ── COIN STATS ROW — Professional 6-cell grid ──

import React from 'react';
import type { MarketRow } from '@/types/markets';
import { useResponsive } from '@/hooks/useResponsive';
import CryptoPriceCell from './CryptoPriceCell';
import CryptoChangePill from './CryptoChangePill';

interface CoinStatsRowProps {
  row: MarketRow;
}

function formatCompact(value: number | null): string {
  if (value === null) return '—';
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value);
}

function StatCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{label}</span>
      <div>{children}</div>
    </div>
  );
}

export default function CoinStatsRow({ row }: CoinStatsRowProps) {
  const { isMobile } = useResponsive();

  return (
    <div className={`rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 ${
      isMobile ? 'grid grid-cols-2 gap-4' : 'grid grid-cols-3 sm:grid-cols-6 gap-4'
    }`}>
      <StatCell label="Price">
        <CryptoPriceCell value={row.price} className="text-sm font-semibold" />
      </StatCell>
      <StatCell label="24h Change">
        <CryptoChangePill value={row.change24h} />
      </StatCell>
      <StatCell label="24h High">
        <CryptoPriceCell value={row.high24h} className="text-sm font-semibold" />
      </StatCell>
      <StatCell label="24h Low">
        <CryptoPriceCell value={row.low24h} className="text-sm font-semibold" />
      </StatCell>
      <StatCell label="24h Volume">
        <span className="tabular text-sm font-semibold text-[var(--text-primary)]">{formatCompact(row.volume24h)}</span>
      </StatCell>
      <StatCell label="Market Cap">
        <span className="tabular text-sm font-semibold text-[var(--text-primary)]">{formatCompact(row.marketCap)}</span>
      </StatCell>
    </div>
  );
}