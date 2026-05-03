// pages/markets/forex/[symbol]/index.tsx
// ── FOREX/METALS DETAIL PAGE — Professional layout ──

import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import { withAuth } from '@/components/layout/withAuth';
import { useCoin } from '@/hooks/useCoin';
import { useResponsive } from '@/hooks/useResponsive';
import { ChartContainer } from '@/components/chart/ChartContainer';
import ForexTimeframeSelector from '@/components/forexMetals/ForexTimeframeSelector';
import ForexSummaryCard from '@/components/forexMetals/ForexSummaryCard';
import ForexStatsRow from '@/components/forexMetals/ForexStatsRow';
import { useOhlc } from '@/hooks/useOhlc';
import { pairDescriptions } from '@/components/forexMetals/pairDescriptions';
import { FX_BY_SYMBOL, METAL_BY_SYMBOL } from '@/constants/assetClasses';
import type { Timeframe } from '@/types/markets';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'NebaTrade';

function ForexDetailPage(): JSX.Element {
  const router = useRouter();
  const { isMobile } = useResponsive();

  const { symbol: rawSymbol } = router.query;
  const symbol = typeof rawSymbol === 'string' ? rawSymbol.toUpperCase() : '';
  const meta = FX_BY_SYMBOL[symbol] || METAL_BY_SYMBOL[symbol];
  const isValid = !!meta;

  const { row, isLoading, error, refetch } = useCoin(isValid ? symbol : '');
  const [timeframe, setTimeframe] = useState<Timeframe>('1h');
  const { candles, isLoading: chartLoading, error: chartError, refetch: chartRefetch } = useOhlc(symbol, timeframe, 300);

  // Wait for router
  if (!router.isReady) {
    return (
      <AuthenticatedShell>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      </AuthenticatedShell>
    );
  }

  // Invalid symbol
  if (!symbol || !isValid) {
    return (
      <>
        <Head><title>Not Found · {BRAND}</title></Head>
        <AuthenticatedShell>
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <svg className="w-16 h-16 text-[var(--text-muted)]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Market Not Found</h2>
            <p className="text-sm text-[var(--text-muted)]">&ldquo;{symbol || rawSymbol}&rdquo; is not a supported pair.</p>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/markets/forex')}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
              >
                Forex & Metals
              </button>
              <button
                onClick={() => router.push('/markets/crypto')}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] transition-colors"
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
        class: symbol.startsWith('XA') ? 'metals' as const : 'forex' as const,
      }
    : null;

  const title = detailRow ? `${detailRow.name} (${symbol}) · ${BRAND}` : `${symbol} · ${BRAND}`;

  return (
    <>
      <Head><title>{title}</title></Head>
      <AuthenticatedShell>
        <div className="flex flex-col gap-4">
          {/* ── Back Link ── */}
          <button
            onClick={() => router.push('/markets/forex')}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors w-fit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Forex & Metals
          </button>

          {/* ── Loading ── */}
          {isLoading && <DetailSkeleton />}

          {/* ── Error ── */}
          {error && !isLoading && (
            <div className="flex flex-col items-center gap-3 py-16 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]">
              <svg className="w-12 h-12 text-[var(--text-muted)]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-[var(--text-muted)]">{error}</p>
              <button onClick={() => refetch()} className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] text-white hover:opacity-90">
                Retry
              </button>
            </div>
          )}

          {/* ── Content ── */}
          {detailRow && !isLoading && (
            <>
              <ForexSummaryCard row={detailRow as any} />
              <ForexStatsRow row={detailRow as any} />

              {/* Chart */}
              <ChartContainer
                isLoading={chartLoading}
                error={chartError}
                onRetry={() => chartRefetch()}
                isEmpty={!chartLoading && !chartError && candles.length === 0}
                toolbar={<ForexTimeframeSelector active={timeframe} onChange={setTimeframe} />}
              >
                {candles.length > 0 && (
                  <ChartInner candles={candles} symbol={symbol} />
                )}
              </ChartContainer>

              {/* About */}
              {description && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 sm:p-6">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">About {meta.name}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{description}</p>
                </div>
              )}

              {/* Trade CTA */}
              <div className="flex justify-center">
                <button
                  onClick={() => router.push(`/trade?symbol=${symbol}`)}
                  className="px-8 py-3 rounded-xl font-semibold bg-[var(--accent)] text-white hover:opacity-90 active:scale-[0.98] transition-all duration-150"
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

function ChartInner({ candles, symbol }: { candles: any[]; symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    import('lightweight-charts').then(({ createChart, ColorType }) => {
      const chart = createChart(container, {
        width: container.clientWidth,
        height: 460,
        layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: 'var(--text-secondary)' },
        grid: { vertLines: { color: 'var(--chart-grid)' }, horzLines: { color: 'var(--chart-grid)' } },
        timeScale: { borderColor: 'var(--border)', timeVisible: true },
        rightPriceScale: { borderColor: 'var(--border)' },
      });

      const series = chart.addCandlestickSeries({
        upColor: 'var(--chart-up)', downColor: 'var(--chart-down)',
        borderUpColor: 'var(--chart-up)', borderDownColor: 'var(--chart-down)',
        wickUpColor: 'var(--chart-up)', wickDownColor: 'var(--chart-down)',
      });

      series.setData(candles.map((c) => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close })));
      chart.timeScale().fitContent();

      const ro = new ResizeObserver(() => chart.applyOptions({ width: container.clientWidth }));
      ro.observe(container);
      return () => { ro.disconnect(); chart.remove(); };
    });
  }, [candles]);

  return <div ref={containerRef} style={{ width: '100%', height: 460 }} />;
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
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
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <div className="w-20 h-3 bg-[var(--bg-muted)] rounded mb-1.5" />
              <div className="w-16 h-5 bg-[var(--bg-muted)] rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]" style={{ height: 460 }} />
    </div>
  );
}

export default withAuth(ForexDetailPage);