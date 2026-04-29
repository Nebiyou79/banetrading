// pages/markets/crypto.tsx
// ── CRYPTO MARKETS PAGE ──

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useMarkets } from '@/hooks/useMarkets';
import { useResponsive } from '@/hooks/useResponsive';
import MarketsSearch from '@/components/markets/MarketsSearch';
import MarketsTable from '@/components/markets/MarketsTable';
import MarketsCardList from '@/components/markets/MarketsCardList';
import AssetClassTabs from '@/components/markets/AsserClassTabs';
import type { MarketRow } from '@/types/markets';
import type { NextPage } from 'next';

const FAVORITES_KEY = 'markets:favorites';

function loadFavorites(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch {
    return new Set();
  }
}

function saveFavorites(set: Set<string>) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...set]));
  } catch {
    // ignore quota
  }
}

type FilterKey = 'all' | 'gainers' | 'losers' | 'favorites';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'gainers', label: 'Gainers' },
  { key: 'losers', label: 'Losers' },
  { key: 'favorites', label: 'Favorites' },
];

const CryptoMarketsPage: NextPage = () => {
  const router = useRouter();
  const { rows, source, stale, isLoading, error, refetch } = useMarkets();
  const { isMobile } = useResponsive();

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [favorites, setFavorites] = useState<Set<string>>(loadFavorites);

  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  const handleToggleFavorite = useCallback((symbol: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(symbol) ? next.delete(symbol) : next.add(symbol);
      return next;
    });
  }, []);

  const filteredRows = useMemo(() => {
    let result: MarketRow[] = rows;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        r => r.symbol.toLowerCase().includes(q) || r.name.toLowerCase().includes(q),
      );
    }

    switch (activeFilter) {
      case 'gainers':
        result = result.filter(r => (r.change24h ?? 0) > 0);
        break;
      case 'losers':
        result = result.filter(r => (r.change24h ?? 0) < 0);
        break;
      case 'favorites':
        result = result.filter(r => favorites.has(r.symbol));
        break;
      default:
        break;
    }

    return result;
  }, [rows, search, activeFilter, favorites]);

  const statusDot = error
    ? 'bg-[var(--danger)]'
    : stale
      ? 'bg-[var(--warning)]'
      : 'bg-[var(--success)]';

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* ── Tab navigation ── */}
      <AssetClassTabs active="crypto" />

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            Crypto Markets
          </h1>
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusDot}`}
              title={error ? 'Feed error' : stale ? 'Stale data' : 'Live'}
            />
            <span className="text-xs text-[var(--text-muted)]">
              {isLoading ? 'Loading...' : `Source: ${source}`}
            </span>
          </div>
        </div>

        {error && (
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] text-[var(--text-inverse)] hover:opacity-90 transition-opacity duration-150"
          >
            Retry
          </button>
        )}
      </div>

      {/* ── Search ── */}
      <MarketsSearch value={search} onChange={setSearch} />

      {/* ── Filter chips ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none" role="tablist">
        {FILTERS.map(f => (
          <button
            key={f.key}
            role="tab"
            aria-selected={activeFilter === f.key}
            onClick={() => setActiveFilter(f.key)}
            onKeyDown={e => { if (e.key === 'Enter') setActiveFilter(f.key); }}
            className={`
              flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]
              ${
                activeFilter === f.key
                  ? 'bg-[var(--accent)] text-[var(--text-inverse)]'
                  : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
              }
            `}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      {error && !isLoading ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-12 text-center">
          <svg className="mx-auto w-10 h-10 mb-3 text-[var(--text-muted)] opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-[var(--text-muted)] mb-4">{error}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] text-[var(--text-inverse)] hover:opacity-90 transition-opacity duration-150"
          >
            Try Again
          </button>
        </div>
      ) : isMobile ? (
        <MarketsCardList
          rows={filteredRows}
          isLoading={isLoading}
          assetClass="crypto"
          onToggleFavorite={handleToggleFavorite}
          favoriteSet={favorites}
        />
      ) : (
        <MarketsTable
          rows={filteredRows}
          isLoading={isLoading}
          assetClass="crypto"
          onToggleFavorite={handleToggleFavorite}
          favoriteSet={favorites}
        />
      )}

      {/* ── No matches ── */}
      {!isLoading && search && filteredRows.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            No coins matching &ldquo;{search}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
};


export default CryptoMarketsPage;