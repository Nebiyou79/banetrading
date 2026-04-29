/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/markets/forex/[symbol].tsx
// ── Forex/Metal Pair Detail page ──

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import { withAuth } from '@/components/layout/withAuth';
import { useCoin } from '@/hooks/useCoin';
import { useResponsive } from '@/hooks/useResponsive';
import ForexSummaryCard from '@/components/forexMetals/ForexSummaryCard';
import ForexStatsRow from '@/components/forexMetals/ForexStatsRow';
import ForexChart from '@/components/forexMetals/ForexChart';
import { pairDescriptions } from '@/components/forexMetals/pairDescriptions';
import { FX_BY_SYMBOL, METAL_BY_SYMBOL } from '@/constants/assetClasses';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'PrimeBitTrade Clone';

function ForexDetailPage(): JSX.Element {
  const router = useRouter();
  const { isMobile } = useResponsive();

  const { symbol: rawSymbol } = router.query;
  const symbol = typeof rawSymbol === 'string' ? rawSymbol.toUpperCase() : '';
  const meta = FX_BY_SYMBOL[symbol] || METAL_BY_SYMBOL[symbol];
  const isValid = !!meta;

  const { row, isLoading, error, refetch } = useCoin(isValid ? symbol : '');

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const update = () => {
      setTheme(
        document.documentElement.getAttribute('data-theme') === 'light'
          ? 'light'
          : 'dark',
      );
    };
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => obs.disconnect();
  }, []);

  // ── Wait for router ──
  if (!router.isReady) {
    return (
      <AuthenticatedShell>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full" />
        </div>
      </AuthenticatedShell>
    );
  }

  // ── Invalid symbol ──
  if (!symbol || !isValid) {
    return (
      <>
        <Head><title>Not Found · {BRAND}</title></Head>
        <AuthenticatedShell>
          <div className="max-w-4xl mx-auto py-16 text-center">
            <svg
              className="mx-auto w-16 h-16 mb-4 text-[var(--text-muted)] opacity-40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
              Market Not Found
            </h2>
            <p className="text-sm text-[var(--text-muted)] mb-6">
              &ldquo;{symbol || rawSymbol}&rdquo; is not a supported pair.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push('/markets/forex')}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] text-[var(--text-inverse)] hover:opacity-90 transition-opacity duration-150"
              >
                Forex & Metals
              </button>
              <button
                onClick={() => router.push('/markets/crypto')}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] transition-colors duration-150"
              >
                Crypto Markets
              </button>
            </div>
          </div>
        </AuthenticatedShell>
      </>
    );
  }

  const description = pairDescriptions[symbol];

  const detailRow = row
    ? {
        ...row,
        display: meta.display,
        decimals: meta.decimals,
        name: meta.name,
        class: meta.symbol.startsWith('X') ? ('metals' as const) : ('forex' as const),
      }
    : null;

  const title = detailRow ? `${detailRow.name} (${symbol}) · ${BRAND}` : `${symbol} · ${BRAND}`;

  return (
    <>
      <Head><title>{title}</title></Head>
      <AuthenticatedShell>
        <div className="flex flex-col gap-6">
          {/* ── Back link ── */}
          <button
            onClick={() => router.push('/markets/forex')}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-150 w-fit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Forex & Metals
          </button>

          {/* ── Loading ── */}
          {isLoading && (
            <div className="flex flex-col gap-6 animate-pulse">
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
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {Array.from({ length: 5 }, (_, i) => (
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
              />
            </div>
          )}

          {/* ── Error ── */}
          {error && !isLoading && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-12 text-center">
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
          {detailRow && !isLoading && (
            <>
              <ForexSummaryCard row={detailRow as any} />
              <ForexStatsRow row={detailRow as any} />
              <ForexChart symbol={symbol} theme={theme} />

              {description && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 sm:p-6">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                    About {meta.name}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {description}
                  </p>
                </div>
              )}

              {/* ── Trade CTA ── */}
              <div className="flex justify-center">
                <button
                  onClick={() => router.push(`/trade?symbol=${symbol}`)}
                  className="px-8 py-3 rounded-xl font-semibold bg-[var(--accent)] text-[var(--text-inverse)] hover:opacity-90 active:scale-[0.98] transition-all duration-150"
                >
                  Trade {symbol}
                </button>
              </div>
            </>
          )}
        </div>
      </AuthenticatedShell>
    </>
  );
}

export default withAuth(ForexDetailPage);