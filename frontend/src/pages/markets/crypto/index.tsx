// pages/markets/crypto/index.tsx
// ── Crypto Markets page ──

import { useState, useMemo, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import { withAuth } from '@/components/layout/withAuth';
import { useMarkets } from '@/hooks/useMarkets';
import { useResponsive } from '@/hooks/useResponsive';
import CryptoMarketsSearch from '@/components/crypto/CryptoMarketsSearch';
import CryptoFilterChips from '@/components/crypto/CryptoFilterChips';
import CryptoMarketsTable from '@/components/crypto/CryptoMarketsTable';
import CryptoMarketsCardList from '@/components/crypto/CryptoMarketsCardList';
import type { MarketRow } from '@/types/markets';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'PrimeBitTrade Clone';
const FAVORITES_KEY = 'crypto:favorites';

function loadFavorites(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
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

function CryptoMarketsPage(): JSX.Element {
  const router = useRouter();
  const { rows, source, stale, isLoading, error, refetch } = useMarkets();
  const { isMobile } = useResponsive();

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [favorites, setFavorites] = useState<Set<string>>(loadFavorites);

  // ── Persist favorites ──
  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  const handleToggleFavorite = useCallback((symbol: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(symbol)) {
        next.delete(symbol);
      } else {
        next.add(symbol);
      }
      return next;
    });
  }, []);

  // ── Filter + search ──
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

  // ── Live status dot ──
  const statusDot = error
    ? 'bg-[var(--danger)]'
    : stale
      ? 'bg-[var(--warning)]'
      : 'bg-[var(--success)]';

  return (
    <>
      <Head><title>Crypto Markets · {BRAND}</title></Head>
      <AuthenticatedShell>
        <div className="flex flex-col gap-6">
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
          <CryptoMarketsSearch value={search} onChange={setSearch} />

          {/* ── Filter chips ── */}
          <CryptoFilterChips active={activeFilter} onChange={setActiveFilter} />

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
            <CryptoMarketsCardList
              rows={filteredRows}
              isLoading={isLoading}
              onToggleFavorite={handleToggleFavorite}
              favoriteSet={favorites}
            />
          ) : (
            <CryptoMarketsTable
              rows={filteredRows}
              isLoading={isLoading}
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
      </AuthenticatedShell>
    </>
  );
}

export default withAuth(CryptoMarketsPage);