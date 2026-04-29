// components/markets/CoinStatsRow.tsx
// ── 6-CELL STATS ROW ──

'use client';

import React from 'react';
import type { MarketRow } from '@/types/markets';
import { useResponsive } from '@/hooks/useResponsive';
import PriceCell from './PriceCell';
import ChangePill from './ChangePill';

interface CoinStatsRowProps {
  row: MarketRow;
}

function formatCompact(value: number | null): string {
  if (value === null) return '—';
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface StatCellProps {
  label: string;
  value: React.ReactNode;
}

function StatCell({ label, value }: StatCellProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
        {label}
      </span>
      <span className="tabular text-sm font-semibold text-[var(--text-primary)]">
        {value}
      </span>
    </div>
  );
}

const stats: { label: string; key: keyof MarketRow }[] = [
  { label: 'Price', key: 'price' },
  { label: '24h Change', key: 'change24h' },
  { label: '24h High', key: 'high24h' },
  { label: '24h Low', key: 'low24h' },
  { label: '24h Volume', key: 'volume24h' },
  { label: 'Market Cap', key: 'marketCap' },
];

export default function CoinStatsRow({ row }: CoinStatsRowProps) {
  const { isMobile } = useResponsive();

  const content = stats.map(stat => {
    const val = row[stat.key];

    if (stat.key === 'change24h') {
      return (
        <StatCell
          key={stat.key}
          label={stat.label}
          value={<ChangePill value={val as number | null} />}
        />
      );
    }
    if (stat.key === 'volume24h' || stat.key === 'marketCap') {
      return (
        <StatCell
          key={stat.key}
          label={stat.label}
          value={formatCompact(val as number | null)}
        />
      );
    }
    return (
      <StatCell
        key={stat.key}
        label={stat.label}
        value={<PriceCell value={val as number | null} />}
      />
    );
  });

  return (
    <div
      className={`
        rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5
        ${isMobile ? 'grid grid-cols-2 gap-4' : 'grid grid-cols-3 sm:grid-cols-6 gap-4'}
      `}
    >
      {content}
    </div>
  );
}