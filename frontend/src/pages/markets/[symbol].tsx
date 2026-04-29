// pages/markets/[symbol].tsx
// ── COIN DETAIL PAGE (Pages Router) ──

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useCoin } from '@/hooks/useCoin';
import { useResponsive } from '@/hooks/useResponsive';
import CoinSummaryCard from '@/components/markets/CoinSummaryCard';
import CoinStatsRow from '@/components/markets/CoinStatsRow';
import CoinChart from '@/components/markets/CoinChart';
import { coinDescriptions } from '@/components/markets/coinDescriptions';
import type { NextPage } from 'next';
import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';

// ── Tier-1 symbol validator ──
const TIER_1_SYMBOLS = new Set([
  'BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE',
  'TRX', 'MATIC', 'DOT', 'LTC', 'AVAX', 'LINK', 'BCH',
]);

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

const CoinDetailPage: NextPage = () => {
  const router = useRouter();
  const { isMobile } = useResponsive();

  // ── Read symbol from URL ──
  const { symbol: rawSymbol } = router.query;
  const symbol = typeof rawSymbol === 'string' ? rawSymbol.toUpperCase() : '';

  const { row, isLoading, error, refetch } = useCoin(symbol || '');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // ── Detect theme from <html> data-theme attribute ──
  useEffect(() => {
    const html = document.documentElement;
    const update = () => {
      const t = html.getAttribute('data-theme');
      setTheme(t === 'light' ? 'light' : 'dark');
    };
    update();

    const observer = new MutationObserver(update);
    observer.observe(html, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // ── Wait for router to be ready ──
  if (!router.isReady) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin mx-auto w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full mb-4" />
        <p className="text-sm text-[var(--text-muted)]">Loading...</p>
      </div>
    );
  }

  // ── Validate symbol ──
  const isValidSymbol = TIER_1_SYMBOLS.has(symbol);

  // ── 404 if invalid ──
  if (!symbol || !isValidSymbol) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <svg className="mx-auto w-16 h-16 mb-4 text-[var(--text-muted)] opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
          Coin Not Found
        </h2>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          &ldquo;{symbol || rawSymbol}&rdquo; is not a supported coin.
        </p>
        <button
          onClick={() => router.push('/markets')}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] text-[var(--text-inverse)] hover:opacity-90 transition-opacity duration-150"
        >
          Back to Markets
        </button>
      </div>
    );
  }

  const description = coinDescriptions[symbol] || null;

  return (
    <AuthenticatedShell>
            <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* ── Loading skeleton ── */}
      {isLoading && (
        <div className="space-y-6 animate-pulse">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[var(--bg-muted)] rounded-full" />
              <div className="space-y-2">
                <div className="w-32 h-5 bg-[var(--bg-muted)] rounded" />
                <div className="w-48 h-8 bg-[var(--bg-muted)] rounded" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i}>
                  <div className="w-20 h-3 bg-[var(--bg-muted)] rounded mb-1.5" />
                  <div className="w-16 h-5 bg-[var(--bg-muted)] rounded" />
                </div>
              ))}
            </div>
          </div>
          <div
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]"
            style={{ height: isMobile ? 320 : 480 }}
          >
            <div className="w-full h-full bg-[var(--bg-muted)] rounded-xl flex items-center justify-center">
              <div className="animate-spin w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full" />
            </div>
          </div>
        </div>
      )}

      {/* ── Error state ── */}
      {error && !isLoading && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-12 text-center">
          <svg className="mx-auto w-10 h-10 mb-3 text-[var(--text-muted)] opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-[var(--text-muted)] mb-4">{error}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] text-[var(--text-inverse)] hover:opacity-90 transition-opacity duration-150"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Content ── */}
      {row && !isLoading && (
        <>
          {/* ── Summary Card ── */}
          <CoinSummaryCard row={row} />

          {/* ── Stats Row ── */}
          <CoinStatsRow row={row} />

          {/* ── Chart ── */}
          <CoinChart symbol={symbol} theme={theme} />

          {/* ── About section ── */}
          {description && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 sm:p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                About {row.name}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {description}
              </p>
            </div>
          )}

          {/* ── Quick stats (additional context) ── */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 sm:p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Market Info
            </h3>
            <div className={`grid ${isMobile ? 'grid-cols-2 gap-4' : 'grid-cols-4 gap-6'}`}>
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">Volume (24h)</p>
                <p className="tabular text-sm font-semibold text-[var(--text-primary)]">
                  {formatCompact(row.volume24h)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">Market Cap</p>
                <p className="tabular text-sm font-semibold text-[var(--text-primary)]">
                  {formatCompact(row.marketCap)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">Data Source</p>
                <p className="tabular text-sm font-medium text-[var(--text-secondary)] capitalize">
                  {row.source}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">24h Range</p>
                <p className="tabular text-sm font-semibold text-[var(--text-primary)]">
                  ${row.low24h?.toLocaleString() ?? '—'} – ${row.high24h?.toLocaleString() ?? '—'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
    </AuthenticatedShell>

  );
};

export default CoinDetailPage;