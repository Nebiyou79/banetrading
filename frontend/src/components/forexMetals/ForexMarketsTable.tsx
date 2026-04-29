// components/forexMetals/ForexMarketsTable.tsx
// ── DESKTOP FOREX/METALS MARKETS TABLE ──

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import type { ForexRow } from '@/types/markets';
import ForexPairBadge from './ForexPairBadge';
import ForexPriceCell from './ForexPriceCell';
import ForexChangePill from './ForexChangePill';
import SpreadCell from './SpreadCell';

interface ForexMarketsTableProps {
  rows: ForexRow[];
  isLoading?: boolean;
  assetClass?: 'forex' | 'metals';
}

type SortKey = 'symbol' | 'price' | 'change24h' | 'high24h' | 'low24h' | 'spread';

const HEADERS: { key: SortKey; label: string }[] = [
  { key: 'symbol', label: 'Pair' },
  { key: 'price', label: 'Price' },
  { key: 'change24h', label: '24h %' },
  { key: 'high24h', label: '24h High' },
  { key: 'low24h', label: '24h Low' },
  { key: 'spread', label: 'Spread' },
];

export default function ForexMarketsTable({ rows, isLoading = false, assetClass = 'forex' }: ForexMarketsTableProps) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>('symbol');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sorted = [...rows].sort((a, b) => {
    const aVal = sortKey === 'spread'
      ? ((a.high24h ?? 0) - (a.low24h ?? 0))
      : sortKey === 'symbol'
        ? a.symbol
        : (a[sortKey as keyof ForexRow] ?? 0);
    const bVal = sortKey === 'spread'
      ? ((b.high24h ?? 0) - (b.low24h ?? 0))
      : sortKey === 'symbol'
        ? b.symbol
        : (b[sortKey as keyof ForexRow] ?? 0);
    if (typeof aVal === 'string') return sortDir === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal as string);
    return sortDir === 'asc' ? (Number(aVal) || 0) - (Number(bVal) || 0) : (Number(bVal) || 0) - (Number(aVal) || 0);
  });

  const skeletonRows = Array.from({ length: assetClass === 'forex' ? 5 : 2 }, (_, i) => i);

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
      <table className="w-full min-w-[700px]">
        <thead className="sticky top-0 z-10">
          <tr className="bg-[var(--bg-elevated)]">
            {HEADERS.map(h => (
              <th key={h.key} className="py-3 px-4 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide cursor-pointer select-none hover:text-[var(--text-primary)] transition-colors duration-150" onClick={() => { setSortKey(h.key); setSortDir(p => sortKey === h.key ? (p === 'asc' ? 'desc' : 'asc') : 'asc'); }}>
                <span className="inline-flex items-center gap-1">{h.label}{sortKey === h.key && <span className="text-[var(--accent)]">{sortDir === 'asc' ? '▲' : '▼'}</span>}</span>
              </th>
            ))}
            <th className="py-3 px-4 text-right text-xs font-medium text-[var(--text-secondary)] uppercase">Trade</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? skeletonRows.map(i => (
            <tr key={i} className="border-t border-[var(--border)] animate-pulse">
              <td className="py-3 px-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-[var(--bg-muted)] rounded-full" /><div className="w-20 h-4 bg-[var(--bg-muted)] rounded" /></div></td>
              <td className="py-3 px-4"><div className="w-20 h-4 bg-[var(--bg-muted)] rounded" /></td>
              <td className="py-3 px-4"><div className="w-16 h-6 bg-[var(--bg-muted)] rounded-full" /></td>
              <td className="py-3 px-4"><div className="w-20 h-4 bg-[var(--bg-muted)] rounded" /></td>
              <td className="py-3 px-4"><div className="w-20 h-4 bg-[var(--bg-muted)] rounded" /></td>
              <td className="py-3 px-4"><div className="w-16 h-4 bg-[var(--bg-muted)] rounded" /></td>
              <td className="py-3 px-4"><div className="w-16 h-8 bg-[var(--bg-muted)] rounded" /></td>
            </tr>
          )) : sorted.map(row => (
            <tr key={row.symbol} className="border-t border-[var(--border)] hover:bg-[var(--hover-bg)] cursor-pointer transition-colors duration-150" onClick={() => router.push(`/markets/forex/${row.symbol}`)}>
              <td className="py-3 px-4"><ForexPairBadge symbol={row.symbol} display={row.display} size={28} /></td>
              <td className="py-3 px-4"><ForexPriceCell value={row.price} decimals={row.decimals} className="text-sm" /></td>
              <td className="py-3 px-4"><ForexChangePill value={row.change24h} /></td>
              <td className="py-3 px-4"><ForexPriceCell value={row.high24h} decimals={row.decimals} className="text-sm" /></td>
              <td className="py-3 px-4"><ForexPriceCell value={row.low24h} decimals={row.decimals} className="text-sm" /></td>
              <td className="py-3 px-4"><SpreadCell high={row.high24h} low={row.low24h} decimals={row.decimals} /></td>
              <td className="py-3 px-4 text-right">
                <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent)] text-[var(--text-inverse)] hover:opacity-90 transition-opacity duration-150" onClick={e => { e.stopPropagation(); router.push(`/trade?symbol=${row.symbol}`); }}>Trade</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!isLoading && rows.length === 0 && <div className="py-16 text-center text-[var(--text-muted)]"><p className="text-sm">No pairs available</p></div>}
    </div>
  );
}