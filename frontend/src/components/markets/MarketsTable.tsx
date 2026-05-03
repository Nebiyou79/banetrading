// components/markets/MarketsTable.tsx
// ── MARKETS TABLE — Professional unified table for all asset classes ──

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import type { MarketRow, ForexRow, AssetClass } from '@/types/markets';
import { AssetRow } from './AssetRow';
import { TableSkeleton } from '@/components/ui/Skeleton';

interface MarketsTableProps {
  rows: (MarketRow | ForexRow)[];
  isLoading?: boolean;
  assetClass: AssetClass;
  onToggleFavorite?: (symbol: string) => void;
  favoriteSet?: Set<string>;
}

type SortKey = 'symbol' | 'price' | 'change24h' | 'volume24h' | 'high24h' | 'low24h' | 'spread';

export function MarketsTable({
  rows,
  isLoading = false,
  assetClass,
  onToggleFavorite,
  favoriteSet,
}: MarketsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('symbol');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const isCrypto = assetClass === 'crypto';

  const headers: { key: SortKey; label: string }[] = isCrypto
    ? [
        { key: 'symbol', label: 'Coin' },
        { key: 'price', label: 'Price' },
        { key: 'change24h', label: '24h %' },
        { key: 'volume24h', label: '24h Volume' },
        { key: 'low24h', label: '24h Low' },
      ]
    : [
        { key: 'symbol', label: 'Pair' },
        { key: 'price', label: 'Price' },
        { key: 'change24h', label: '24h %' },
        { key: 'high24h', label: '24h High' },
        { key: 'spread', label: 'Spread' },
      ];

  const sorted = [...rows].sort((a, b) => {
    const aVal = sortKey === 'spread'
      ? (((a as ForexRow).high24h ?? 0) - ((a as ForexRow).low24h ?? 0))
      : sortKey === 'symbol'
        ? a.symbol
        : ((a as any)[sortKey] ?? 0);
    const bVal = sortKey === 'spread'
      ? (((b as ForexRow).high24h ?? 0) - ((b as ForexRow).low24h ?? 0))
      : sortKey === 'symbol'
        ? b.symbol
        : ((b as any)[sortKey] ?? 0);
    if (typeof aVal === 'string') return sortDir === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal as string);
    return sortDir === 'asc' ? (Number(aVal) || 0) - (Number(bVal) || 0) : (Number(bVal) || 0) - (Number(aVal) || 0);
  });

  if (isLoading) return <TableSkeleton rows={isCrypto ? 15 : 7} cols={isCrypto ? 7 : 6} />;

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]">
        <svg className="w-12 h-12 text-[var(--text-muted)]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p className="text-sm text-[var(--text-muted)]">No {assetClass} pairs found</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-muted)]/50">
              {onToggleFavorite && <th className="py-2.5 px-4 w-10" />}
              {headers.map((h) => (
                <th
                  key={h.key}
                  className="py-2.5 px-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer select-none hover:text-[var(--text-primary)] transition-colors"
                  onClick={() => {
                    if (sortKey === h.key) setSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                    else { setSortKey(h.key); setSortDir('asc'); }
                  }}
                >
                  <span className="inline-flex items-center gap-1">
                    {h.label}
                    {sortKey === h.key && (
                      <span className="text-[var(--accent)] text-xs">{sortDir === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </span>
                </th>
              ))}
              {isCrypto && <th className="py-2.5 px-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">7d</th>}
              <th className="py-2.5 px-4 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Trade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {sorted.map((asset) => (
              <AssetRow
                key={asset.symbol}
                asset={asset}
                assetClass={assetClass}
                onFavorite={onToggleFavorite}
                isFavorite={favoriteSet?.has(asset.symbol)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}