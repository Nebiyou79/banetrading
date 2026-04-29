// pages/markets/forex.tsx
// ── FOREX MARKETS PAGE ──

import React from 'react';
import { useForex } from '@/hooks/useForex';
import { useResponsive } from '@/hooks/useResponsive';
import MarketsTable from '@/components/markets/MarketsTable';
import MarketsCardList from '@/components/markets/MarketsCardList';
import AssetClassTabs from '@/components/markets/AsserClassTabs';
import type { NextPage } from 'next';

const ForexMarketsPage: NextPage = () => {
  const { rows, source, stale, isLoading, error, refetch } = useForex();
  const { isMobile } = useResponsive();

  const statusDot = error
    ? 'bg-[var(--danger)]'
    : stale
      ? 'bg-[var(--warning)]'
      : 'bg-[var(--success)]';

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* ── Tab navigation ── */}
      <AssetClassTabs active="forex" />

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            Forex Markets
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
          rows={rows}
          isLoading={isLoading}
          assetClass="forex"
        />
      ) : (
        <MarketsTable
          rows={rows}
          isLoading={isLoading}
          assetClass="forex"
        />
      )}
    </div>
  );
};


export default ForexMarketsPage;