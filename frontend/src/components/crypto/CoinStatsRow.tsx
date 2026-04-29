// components/crypto/CoinStatsRow.tsx
// ── 6-CELL STATS ROW ──

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

interface StatCellProps {
  label: string;
  value: React.ReactNode;
}

function StatCell({ label, value }: StatCellProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">{label}</span>
      <span className="tabular text-sm font-semibold text-[var(--text-primary)]">{value}</span>
    </div>
  );
}

export default function CoinStatsRow({ row }: CoinStatsRowProps) {
  const { isMobile } = useResponsive();

  const stats = [
    { label: 'Price', content: <CryptoPriceCell value={row.price} /> },
    {
      label: '24h Change',
      content: <CryptoChangePill value={row.change24h} />,
    },
    { label: '24h High', content: <CryptoPriceCell value={row.high24h} /> },
    { label: '24h Low', content: <CryptoPriceCell value={row.low24h} /> },
    { label: '24h Volume', content: <span className="tabular text-sm text-[var(--text-primary)]">{formatCompact(row.volume24h)}</span> },
    { label: 'Market Cap', content: <span className="tabular text-sm text-[var(--text-primary)]">{formatCompact(row.marketCap)}</span> },
  ];

  return (
    <div className={`rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 ${isMobile ? 'grid grid-cols-2 gap-4' : 'grid grid-cols-3 sm:grid-cols-6 gap-4'}`}>
      {stats.map((s, i) => (
        <StatCell key={i} label={s.label} value={s.content} />
      ))}
    </div>
  );
}