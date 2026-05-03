// pages/markets/crypto/[symbol]/index.tsx
// ── CRYPTO COIN DETAIL PAGE — Professional layout ──

import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import { withAuth } from '@/components/layout/withAuth';
import { useCoin } from '@/hooks/useCoin';
import { useResponsive } from '@/hooks/useResponsive';
import CoinIcon from '@/components/crypto/CoinIcon';
import CryptoPriceCell from '@/components/crypto/CryptoPriceCell';
import CryptoChangePill from '@/components/crypto/CryptoChangePill';
import CoinStatsRow from '@/components/crypto/CoinStatsRow';
import { ChartContainer } from '@/components/chart/ChartContainer';
import { useOhlc } from '@/hooks/useOhlc';
import { useMarketStore } from '@/stores/market.store';
import { coinDescriptions } from '@/components/crypto/coinDescriptions';
import { TIER_1_SYMBOLS } from '@/constants/assetClasses';
import type { Timeframe } from '@/types/markets';
import TimeframeSelector from '@/components/crypto/TimeframeSelector';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'NebaTrade';

function CoinDetailPage(): JSX.Element {
  const router = useRouter();
  const { isMobile } = useResponsive();

  const { symbol: rawSymbol } = router.query;
  const symbol = typeof rawSymbol === 'string' ? rawSymbol.toUpperCase() : '';
  const isValid = TIER_1_SYMBOLS.has(symbol);

  const { row, isLoading, error, refetch } = useCoin(isValid ? symbol : '');
  const [timeframe, setTimeframe] = useState<Timeframe>('1h');
  const { candles, isLoading: chartLoading, error: chartError, refetch: chartRefetch } = useOhlc(symbol, timeframe, 500);
  const wsPrice = useMarketStore((s) => s.prices[symbol]);

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
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Coin Not Found</h2>
            <p className="text-sm text-[var(--text-muted)]">&ldquo;{symbol || rawSymbol}&rdquo; is not a supported coin.</p>
            <button onClick={() => router.push('/markets/crypto')} className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] text-white hover:opacity-90 transition-opacity">
              Back to Crypto Markets
            </button>
          </div>
        </AuthenticatedShell>
      </>
    );
  }

  const description = coinDescriptions[symbol];
  const title = row ? `${row.name} (${row.symbol}) · ${BRAND}` : `${symbol} · ${BRAND}`;
  const displayPrice = wsPrice ?? row?.price ?? null;

  return (
    <>
      <Head><title>{title}</title></Head>
      <AuthenticatedShell>
        <div className="flex flex-col gap-4">
          {/* ── Back Link ── */}
          <button
            onClick={() => router.push('/markets/crypto')}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors w-fit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Crypto Markets
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
          {row && !isLoading && (
            <>
              {/* Summary Card */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 sm:p-6">
                <div className={`flex ${isMobile ? 'flex-col gap-4' : 'flex-row items-center justify-between'}`}>
                  <div className="flex items-center gap-4">
                    <CoinIcon iconUrl={(row as any).iconUrl} symbol={row.symbol} size={48} />
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">{row.name}</h2>
                        <span className="text-sm text-[var(--text-muted)] tabular">{row.symbol}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <CryptoPriceCell value={displayPrice} className="text-3xl sm:text-4xl font-bold tracking-tight" />
                        <CryptoChangePill value={row.change24h} className="text-base px-3 py-1" />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/trade?symbol=${row.symbol}`)}
                    className={`px-6 py-3 rounded-xl font-semibold text-base bg-[var(--accent)] text-white hover:opacity-90 active:scale-[0.98] transition-all duration-150 ${isMobile ? 'w-full' : 'shrink-0'}`}
                  >
                    Trade Now
                  </button>
                </div>
              </div>

              {/* Stats Row */}
              <CoinStatsRow row={{ ...row, price: displayPrice }} />

              {/* Chart */}
              <ChartContainer
                isLoading={chartLoading}
                error={chartError}
                onRetry={() => chartRefetch()}
                isEmpty={!chartLoading && !chartError && candles.length === 0}
                toolbar={<TimeframeSelector active={timeframe} onChange={setTimeframe} />}
              >
                {candles.length > 0 && (
                  <CoinChartInner candles={candles} wsPrice={wsPrice} symbol={symbol} />
                )}
              </ChartContainer>

              {/* About */}
              {description && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 sm:p-6">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">About {row.name}</h3>
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

// Inner chart component (simplified)
function CoinChartInner({ candles, wsPrice, symbol }: { candles: any[]; wsPrice: number | null; symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);

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

      chartRef.current = chart;
      seriesRef.current = series;

      const ro = new ResizeObserver(() => chart.applyOptions({ width: container.clientWidth }));
      ro.observe(container);
      return () => { ro.disconnect(); chart.remove(); };
    });
  }, [candles]);

  useEffect(() => {
    if (!wsPrice || !seriesRef.current || !candles?.length) return;
    const last = candles[candles.length - 1];
    seriesRef.current.update({ time: last.time, close: wsPrice, high: Math.max(last.high, wsPrice), low: Math.min(last.low, wsPrice) });
  }, [wsPrice]);

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
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
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

export default withAuth(CoinDetailPage);