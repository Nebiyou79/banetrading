// pages/markets/forex/[symbol]/index.tsx
// ── FOREX/METALS DETAIL PAGE ──
// FIX: Hardcoded hex chart colors (lightweight-charts v5 cannot parse CSS vars)
// FIX: 3 timeframes only: 1h/4h/1d

import { useState, useRef, useEffect } from 'react';
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

// ⚠️ HARDCODED hex — lightweight-charts v5 cannot parse CSS variables
const CHART_COLORS = {
  dark: {
    bg: 'transparent', text: '#848E9C', grid: 'rgba(255,255,255,0.06)',
    border: '#2B3139', up: '#0ECB81', down: '#F6465D', lblBg: '#2B3139',
    volUp: 'rgba(14,203,129,0.25)', volDown: 'rgba(246,70,93,0.25)',
  },
  light: {
    bg: 'transparent', text: '#474D57', grid: 'rgba(0,0,0,0.06)',
    border: '#E0E3EB', up: '#0ECB81', down: '#F6465D', lblBg: '#E0E3EB',
    volUp: 'rgba(14,203,129,0.25)', volDown: 'rgba(246,70,93,0.25)',
  },
};

function getThemeColors() {
  if (typeof document === 'undefined') return CHART_COLORS.dark;
  return document.documentElement.getAttribute('data-theme') === 'light'
    ? CHART_COLORS.light : CHART_COLORS.dark;
}

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

  if (!router.isReady) {
    return (
      <AuthenticatedShell>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      </AuthenticatedShell>
    );
  }

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
              <button onClick={() => router.push('/markets/forex')} className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] text-white hover:opacity-90">Forex & Metals</button>
              <button onClick={() => router.push('/markets/crypto')} className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]">Crypto Markets</button>
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
        display:  meta.display,
        decimals: meta.decimals,
        name:     meta.name,
        class:    symbol.startsWith('XA') ? 'metals' as const : 'forex' as const,
      }
    : null;

  const title = detailRow ? `${detailRow.name} (${symbol}) · ${BRAND}` : `${symbol} · ${BRAND}`;

  return (
    <>
      <Head><title>{title}</title></Head>
      <AuthenticatedShell>
        <div className="flex flex-col gap-4">
          {/* Back Link */}
          <button
            onClick={() => router.push('/markets/forex')}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors w-fit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Forex & Metals
          </button>

          {isLoading && <DetailSkeleton />}

          {error && !isLoading && (
            <div className="flex flex-col items-center gap-3 py-16 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]">
              <p className="text-sm text-[var(--text-muted)]">{error}</p>
              <button onClick={() => refetch()} className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] text-white hover:opacity-90">Retry</button>
            </div>
          )}

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
                  <ForexChartInner candles={candles} symbol={symbol} />
                )}
              </ChartContainer>

              {description && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 sm:p-6">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">About {meta.name}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{description}</p>
                </div>
              )}

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

// ⚠️ HARDCODED hex — lightweight-charts v5 cannot parse CSS variables
function ForexChartInner({ candles, symbol }: { candles: any[]; symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<any>(null);
  const seriesRef    = useRef<any>(null);
  const mountedRef   = useRef(true);
  const CHART_H      = 460;

  useEffect(() => {
    mountedRef.current = true;
    const container = containerRef.current;
    if (!container) return;

    let chart: any = null;
    let ro: ResizeObserver | null = null;
    const c = getThemeColors();

    import('lightweight-charts').then(({ createChart, ColorType, CrosshairMode }) => {
      if (!mountedRef.current || !container) return;

      chart = createChart(container, {
        width:  container.clientWidth || 600,
        height: CHART_H,
        layout: { background: { type: ColorType.Solid, color: c.bg }, textColor: c.text },
        grid:   { vertLines: { color: c.grid }, horzLines: { color: c.grid } },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: { color: c.border, labelBackgroundColor: c.lblBg },
          horzLine: { color: c.border, labelBackgroundColor: c.lblBg },
        },
        timeScale:       { borderColor: c.border, timeVisible: true, secondsVisible: false },
        rightPriceScale: { borderColor: c.border },
        handleScroll: true,
        handleScale:  true,
      });

      const series = chart.addCandlestickSeries({
        upColor: c.up, downColor: c.down,
        borderUpColor: c.up, borderDownColor: c.down,
        wickUpColor: c.up, wickDownColor: c.down,
      });

      if (candles?.length) {
        series.setData(candles.map((k) => ({ time: k.time, open: k.open, high: k.high, low: k.low, close: k.close })));
        chart.timeScale().fitContent();
      }

      chartRef.current  = chart;
      seriesRef.current = series;

      ro = new ResizeObserver(() => { if (container && chart) chart.applyOptions({ width: container.clientWidth }); });
      ro.observe(container);
    }).catch(e => console.error('[ForexChart] init error:', e));

    return () => {
      mountedRef.current = false;
      ro?.disconnect();
      if (chart) { try { chart.remove(); } catch {} }
      chartRef.current = null; seriesRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  useEffect(() => {
    if (!candles?.length || !seriesRef.current) return;
    try {
      seriesRef.current.setData(candles.map((k) => ({ time: k.time, open: k.open, high: k.high, low: k.low, close: k.close })));
      chartRef.current?.timeScale().fitContent();
    } catch {}
  }, [candles]);

  return <div ref={containerRef} style={{ width: '100%', height: CHART_H }} />;
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