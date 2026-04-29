/* eslint-disable @typescript-eslint/no-explicit-any */
// components/crypto/CryptoMarketsTable.tsx
// ── DESKTOP CRYPTO MARKETS TABLE ──

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import type { MarketRow } from '@/types/markets';
import CoinIcon from './CoinIcon';
import CryptoPriceCell from './CryptoPriceCell';
import CryptoChangePill from './CryptoChangePill';
import CryptoSparkline from './CryptoSparkline';

interface CryptoMarketsTableProps {
  rows: MarketRow[];
  isLoading?: boolean;
  onToggleFavorite?: (symbol: string) => void;
  favoriteSet?: Set<string>;
}

type SortKey = 'symbol' | 'price' | 'change24h' | 'volume24h' | 'high24h' | 'low24h';

const HEADERS: { key: SortKey; label: string }[] = [
  { key: 'symbol', label: 'Coin' },
  { key: 'price', label: 'Price' },
  { key: 'change24h', label: '24h %' },
  { key: 'volume24h', label: '24h Volume' },
  { key: 'high24h', label: '24h High' },
  { key: 'low24h', label: '24h Low' },
];

function formatCompact(value: number | null): string {
  if (value === null) return '—';
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

export default function CryptoMarketsTable({ rows, isLoading = false, onToggleFavorite, favoriteSet }: CryptoMarketsTableProps) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>('symbol');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sorted = [...rows].sort((a, b) => {
    const aVal = a[sortKey] ?? (sortKey === 'symbol' ? '' : 0);
    const bVal = b[sortKey] ?? (sortKey === 'symbol' ? '' : 0);
    if (typeof aVal === 'string') return sortDir === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal as string);
    return sortDir === 'asc' ? (Number(aVal) || 0) - (Number(bVal) || 0) : (Number(bVal) || 0) - (Number(aVal) || 0);
  });

  const skeletonRows = Array.from({ length: 15 }, (_, i) => i);

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
      <table className="w-full min-w-[800px]">
        <thead className="sticky top-0 z-10">
          <tr className="bg-[var(--bg-elevated)]">
            <th className="py-3 px-4 w-10" />
            {HEADERS.map(h => (
              <th key={h.key} className="py-3 px-4 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide cursor-pointer select-none hover:text-[var(--text-primary)] transition-colors duration-150" onClick={() => { sortKey === h.key ? setSortDir(p => p === 'asc' ? 'desc' : 'asc') : (setSortKey(h.key), setSortDir('asc')); }}>
                <span className="inline-flex items-center gap-1">{h.label}{sortKey === h.key && <span className="text-[var(--accent)]">{sortDir === 'asc' ? '▲' : '▼'}</span>}</span>
              </th>
            ))}
            <th className="py-3 px-4 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">7d</th>
            <th className="py-3 px-4 text-right text-xs font-medium text-[var(--text-secondary)] uppercase">Trade</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? skeletonRows.map(i => (
            <tr key={i} className="border-t border-[var(--border)] animate-pulse">
              <td className="py-3 px-4"><div className="w-5 h-5 bg-[var(--bg-muted)] rounded" /></td>
              <td className="py-3 px-4"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-[var(--bg-muted)] rounded-full" /><div className="w-16 h-4 bg-[var(--bg-muted)] rounded" /></div></td>
              <td className="py-3 px-4"><div className="w-20 h-4 bg-[var(--bg-muted)] rounded" /></td>
              <td className="py-3 px-4"><div className="w-16 h-6 bg-[var(--bg-muted)] rounded-full" /></td>
              <td className="py-3 px-4"><div className="w-16 h-4 bg-[var(--bg-muted)] rounded" /></td>
              <td className="py-3 px-4"><div className="w-20 h-4 bg-[var(--bg-muted)] rounded" /></td>
              <td className="py-3 px-4"><div className="w-20 h-4 bg-[var(--bg-muted)] rounded" /></td>
              <td className="py-3 px-4"><div className="w-20 h-6 bg-[var(--bg-muted)] rounded" /></td>
              <td className="py-3 px-4"><div className="w-16 h-8 bg-[var(--bg-muted)] rounded" /></td>
            </tr>
          )) : sorted.map(row => (
            <tr key={row.symbol} className="border-t border-[var(--border)] hover:bg-[var(--hover-bg)] cursor-pointer transition-colors duration-150" onClick={() => router.push(`/markets/crypto/${row.symbol}`)}>
              <td className="py-3 px-4" onClick={e => { e.stopPropagation(); onToggleFavorite?.(row.symbol); }}>
                <button className="text-lg transition-colors duration-150" style={{ color: favoriteSet?.has(row.symbol) ? 'var(--warning)' : 'var(--text-muted)' }} aria-label="Toggle favorite">
                  {favoriteSet?.has(row.symbol) ? '★' : '☆'}
                </button>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <CoinIcon iconUrl={(row as any).iconUrl} symbol={row.symbol} size={32} />
                  <div><div className="font-semibold text-sm text-[var(--text-primary)] tabular">{row.symbol}</div><div className="text-xs text-[var(--text-muted)]">{row.name}</div></div>
                </div>
              </td>
              <td className="py-3 px-4"><CryptoPriceCell value={row.price} className="text-sm" /></td>
              <td className="py-3 px-4"><CryptoChangePill value={row.change24h} /></td>
              <td className="py-3 px-4"><span className="tabular text-sm text-[var(--text-secondary)]">{formatCompact(row.volume24h)}</span></td>
              <td className="py-3 px-4"><CryptoPriceCell value={row.high24h} className="text-sm" /></td>
              <td className="py-3 px-4"><CryptoPriceCell value={row.low24h} className="text-sm" /></td>
              <td className="py-3 px-4"><CryptoSparkline data={(row as any).sparkline7d || []} width={80} height={28} /></td>
              <td className="py-3 px-4 text-right">
                <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent)] text-[var(--text-inverse)] hover:opacity-90 transition-opacity duration-150" onClick={e => { e.stopPropagation(); router.push(`/trade?symbol=${row.symbol}`); }}>Trade</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!isLoading && rows.length === 0 && <div className="py-16 text-center text-[var(--text-muted)]"><p className="text-sm">No coins found</p></div>}
    </div>
  );
}