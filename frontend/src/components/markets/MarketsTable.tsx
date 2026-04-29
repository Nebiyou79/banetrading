/* eslint-disable @typescript-eslint/no-explicit-any */
// components/markets/MarketsTable.tsx
// ── MARKETS TABLE (CRYPTO + FX/METALS) ──

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { MarketRow, AssetClass } from '@/types/markets';
import { getAssetMeta } from '@/constants/assetClasses';
import CoinIcon from './CoinIcon';
import PriceCell from './PriceCell';
import ChangePill from './ChangePill';
import Sparkline from './Sparkline';
import ForexPairBadge from './ForexPairBadge';
import SpreadCell from './SpreadCell';

interface MarketsTableProps {
  rows: MarketRow[];
  isLoading?: boolean;
  assetClass?: AssetClass;
  onToggleFavorite?: (symbol: string) => void;
  favoriteSet?: Set<string>;
}

type SortKey = 'symbol' | 'price' | 'change24h' | 'volume24h' | 'high24h' | 'low24h' | 'spread';

const CRYPTO_HEADERS = [
  { key: 'symbol' as const, label: 'Coin' },
  { key: 'price' as const, label: 'Price' },
  { key: 'change24h' as const, label: '24h %' },
  { key: 'volume24h' as const, label: '24h Volume' },
  { key: 'high24h' as const, label: '24h High' },
  { key: 'low24h' as const, label: '24h Low' },
];

const FX_HEADERS = [
  { key: 'symbol' as const, label: 'Pair' },
  { key: 'price' as const, label: 'Price' },
  { key: 'change24h' as const, label: '24h %' },
  { key: 'high24h' as const, label: '24h High' },
  { key: 'low24h' as const, label: '24h Low' },
  { key: 'spread' as const, label: 'Spread' },
];

function formatCompact(value: number | null): string {
  if (value === null) return '—';
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value);
}

export default function MarketsTable({
  rows,
  isLoading = false,
  assetClass = 'crypto',
  onToggleFavorite,
  favoriteSet,
}: MarketsTableProps) {
  const router = useRouter();
  const headers = assetClass === 'crypto' ? CRYPTO_HEADERS : FX_HEADERS;
  const [sortKey, setSortKey] = useState<SortKey>('symbol');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sorted = [...rows].sort((a, b) => {
    const aVal = a[sortKey as keyof MarketRow] ?? (sortKey === 'symbol' ? '' : 0);
    const bVal = b[sortKey as keyof MarketRow] ?? (sortKey === 'symbol' ? '' : 0);
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortDir === 'asc' ? (Number(aVal) || 0) - (Number(bVal) || 0) : (Number(bVal) || 0) - (Number(aVal) || 0);
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(p => (p === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const skeletonRows = Array.from({ length: assetClass === 'crypto' ? 15 : 7 }, (_, i) => i);

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
      <table className="w-full min-w-[700px]">
        <thead className="sticky top-0 z-10">
          <tr className="bg-[var(--bg-elevated)]">
            {assetClass === 'crypto' && <th className="py-3 px-4 w-10" />}
            {headers.map(h => (
              <th
                key={h.key}
                className="py-3 px-4 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide cursor-pointer select-none hover:text-[var(--text-primary)] transition-colors duration-150"
                onClick={() => handleSort(h.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {h.label}
                  {sortKey === h.key && (
                    <span className="text-[var(--accent)]">{sortDir === 'asc' ? '▲' : '▼'}</span>
                  )}
                </span>
              </th>
            ))}
            {assetClass === 'crypto' && (
              <th className="py-3 px-4 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">7d</th>
            )}
            <th className="py-3 px-4 text-right text-xs font-medium text-[var(--text-secondary)] uppercase">Trade</th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? skeletonRows.map(i => (
                <tr key={i} className="border-t border-[var(--border)] animate-pulse">
                  {assetClass === 'crypto' && <td className="py-3 px-4"><div className="w-5 h-5 bg-[var(--bg-muted)] rounded" /></td>}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[var(--bg-muted)] rounded-full" />
                      <div className="w-16 h-4 bg-[var(--bg-muted)] rounded" />
                    </div>
                  </td>
                  <td className="py-3 px-4"><div className="w-20 h-4 bg-[var(--bg-muted)] rounded" /></td>
                  <td className="py-3 px-4"><div className="w-16 h-6 bg-[var(--bg-muted)] rounded-full" /></td>
                  {assetClass === 'crypto' && <td className="py-3 px-4"><div className="w-16 h-4 bg-[var(--bg-muted)] rounded" /></td>}
                  <td className="py-3 px-4"><div className="w-20 h-4 bg-[var(--bg-muted)] rounded" /></td>
                  <td className="py-3 px-4"><div className="w-20 h-4 bg-[var(--bg-muted)] rounded" /></td>
                  {assetClass === 'crypto' && <td className="py-3 px-4"><div className="w-20 h-6 bg-[var(--bg-muted)] rounded" /></td>}
                  <td className="py-3 px-4"><div className="w-16 h-8 bg-[var(--bg-muted)] rounded" /></td>
                </tr>
              ))
            : sorted.map(row => {
                const meta = assetClass !== 'crypto' ? getAssetMeta(row.symbol) : null;
                const decimals = meta?.decimals ?? 2;
                return (
                  <tr
                    key={row.symbol}
                    className="border-t border-[var(--border)] hover:bg-[var(--hover-bg)] cursor-pointer transition-colors duration-150"
                    onClick={() => router.push(`/markets/${row.symbol}`)}
                  >
                    {assetClass === 'crypto' && (
                      <td className="py-3 px-4" onClick={e => { e.stopPropagation(); onToggleFavorite?.(row.symbol); }}>
                        <button
                          className="text-lg transition-colors duration-150"
                          style={{ color: favoriteSet?.has(row.symbol) ? 'var(--warning)' : 'var(--text-muted)' }}
                          aria-label={favoriteSet?.has(row.symbol) ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          {favoriteSet?.has(row.symbol) ? '★' : '☆'}
                        </button>
                      </td>
                    )}
                    <td className="py-3 px-4">
                      {assetClass === 'crypto' ? (
                        <div className="flex items-center gap-3">
                          <CoinIcon iconUrl={(row as any).iconUrl} symbol={row.symbol} size={32} />
                          <div>
                            <div className="font-semibold text-sm text-[var(--text-primary)] tabular">{row.symbol}</div>
                            <div className="text-xs text-[var(--text-muted)]">{row.name}</div>
                          </div>
                        </div>
                      ) : (
                        <ForexPairBadge symbol={row.symbol} display={meta?.display || row.symbol} size={28} />
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <PriceCell value={row.price} className="text-sm" decimals={assetClass !== 'crypto' ? decimals : undefined} />
                    </td>
                    <td className="py-3 px-4"><ChangePill value={row.change24h} /></td>
                    {assetClass === 'crypto' && (
                      <td className="py-3 px-4">
                        <span className="tabular text-sm text-[var(--text-secondary)]">{formatCompact(row.volume24h)}</span>
                      </td>
                    )}
                    <td className="py-3 px-4"><PriceCell value={row.high24h} className="text-sm" decimals={assetClass !== 'crypto' ? decimals : undefined} /></td>
                    <td className="py-3 px-4"><PriceCell value={row.low24h} className="text-sm" decimals={assetClass !== 'crypto' ? decimals : undefined} /></td>
                    {assetClass === 'crypto' ? (
                      <td className="py-3 px-4"><Sparkline data={(row as any).sparkline7d || []} width={80} height={28} /></td>
                    ) : (
                      <td className="py-3 px-4"><SpreadCell high={row.high24h} low={row.low24h} decimals={decimals} /></td>
                    )}
                    <td className="py-3 px-4 text-right">
                      <button
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent)] text-[var(--text-inverse)] hover:opacity-90 transition-opacity duration-150"
                        onClick={e => { e.stopPropagation(); router.push(`/trade?symbol=${row.symbol}`); }}
                      >
                        Trade
                      </button>
                    </td>
                  </tr>
                );
              })}
        </tbody>
      </table>
      {!isLoading && rows.length === 0 && (
        <div className="py-16 text-center text-[var(--text-muted)]">
          <p className="text-sm">No data available</p>
        </div>
      )}
    </div>
  );
}