// pages/markets/crypto/[symbol]/index.tsx
// ── CRYPTO COIN DETAIL PAGE ──
// FIX: Symbol routing accepts both BTC and BTCUSDT formats
// FIX: Hardcoded hex chart colors (lightweight-charts v5 cannot parse CSS vars)
// FIX: 3 timeframes only: 15m/1h/4h

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

// ⚠️ HARDCODED hex colors — lightweight-charts v5 CANNOT parse CSS variables
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

// Normalize symbol: accepts BTC or BTCUSDT, always return bare symbol (BTC)
function normalizeSymbol(raw: string): string {
  if (!raw) return '';
  const upper = raw.toUpperCase();
  // If it ends with USDT, strip it for lookup (but keep original for trade link)
  return upper.endsWith('USDT') ? upper.slice(0, -4) : upper;
}

function CoinDetailPage(): JSX.Element {
  const router = useRouter();
  const { isMobile } = useResponsive();

  const { symbol: rawSymbol } = router.query;
  const rawStr = typeof rawSymbol === 'string' ? rawSymbol : '';
  const symbol = normalizeSymbol(rawStr); // BTC, ETH, etc.
  const isValid = TIER_1_SYMBOLS.has(symbol);

  // For API calls we need the bare symbol; hooks will append USDT as needed
  const { row, isLoading, error, refetch } = useCoin(isValid ? symbol : '');
  const [timeframe, setTimeframe] = useState<Timeframe>('1h');

  // Pass symbol with USDT for OHLC (backend expects BTCUSDT format)
  const ohlcSymbol = isValid ? `${symbol}USDT` : '';
  const { candles, isLoading: chartLoading, error: chartError, refetch: chartRefetch } = useOhlc(ohlcSymbol, timeframe, 300);
  const wsPrice = useMarketStore((s) => s.prices[`${symbol}USDT`] ?? s.prices[symbol]);

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
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Coin Not Found</h2>
            <p className="text-sm text-[var(--text-muted)]">&ldquo;{rawStr}&rdquo; is not a supported coin.</p>
            <button onClick={() => router.push('/markets/crypto')} className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] text-white hover:opacity-90 transition-opacity">
              Back to Crypto Markets
            </button>
          </div>
        </AuthenticatedShell>
      </>
    );
  }

  const description = coinDescriptions[symbol];
  const title = row ? `${row.name} (${symbol}) · ${BRAND}` : `${symbol} · ${BRAND}`;
  const displayPrice = wsPrice ?? row?.price ?? null;

  return (
    <>
      <Head><title>{title}</title></Head>
      <AuthenticatedShell>
        <div className="flex flex-col gap-4">
          {/* Back Link */}
          <button
            onClick={() => router.push('/markets/crypto')}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors w-fit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Crypto Markets
          </button>

          {isLoading && <DetailSkeleton />}

          {error && !isLoading && (
            <div className="flex flex-col items-center gap-3 py-16 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]">
              <p className="text-sm text-[var(--text-muted)]">{error}</p>
              <button onClick={() => refetch()} className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] text-white hover:opacity-90">Retry</button>
            </div>
          )}

          {row && !isLoading && (
            <>
              {/* Summary Card */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 sm:p-6">
                <div className={`flex ${isMobile ? 'flex-col gap-4' : 'flex-row items-center justify-between'}`}>
                  <div className="flex items-center gap-4">
                    <CoinIcon iconUrl={(row as any).iconUrl} symbol={symbol} size={48} />
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">{row.name}</h2>
                        <span className="text-sm text-[var(--text-muted)] tabular">{symbol}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <CryptoPriceCell value={displayPrice} className="text-3xl sm:text-4xl font-bold tracking-tight" />
                        <CryptoChangePill value={row.change24h} className="text-base px-3 py-1" />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/trade?symbol=${symbol}USDT`)}
                    className={`px-6 py-3 rounded-xl font-semibold text-base bg-[var(--accent)] text-white hover:opacity-90 active:scale-[0.98] transition-all duration-150 ${isMobile ? 'w-full' : 'shrink-0'}`}
                  >
                    Trade Now
                  </button>
                </div>
              </div>

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
                  <CoinChartInner candles={candles} wsPrice={wsPrice ?? null} symbol={symbol} />
                )}
              </ChartContainer>

              {description && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 sm:p-6">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">About {row.name}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{description}</p>
                </div>
              )}

              <div className="flex justify-center">
                <button
                  onClick={() => router.push(`/trade?symbol=${symbol}USDT`)}
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
function CoinChartInner({
  candles,
  wsPrice,
  symbol,
}: {
  candles: any[];
  wsPrice: number | null;
  symbol: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<any>(null);
  const seriesRef    = useRef<any>(null);
  const volRef       = useRef<any>(null);
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
        rightPriceScale: { borderColor: c.border, scaleMargins: { top: 0.08, bottom: 0.18 } },
      });

      const series = chart.addCandlestickSeries({
        upColor: c.up, downColor: c.down,
        borderUpColor: c.up, borderDownColor: c.down,
        wickUpColor: c.up, wickDownColor: c.down,
      });

      const vol = chart.addHistogramSeries({ priceFormat: { type: 'volume' }, priceScaleId: 'vol' });
      vol.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

      if (candles?.length) {
        series.setData(candles.map((k) => ({ time: k.time, open: k.open, high: k.high, low: k.low, close: k.close })));
        vol.setData(candles.map((k) => ({ time: k.time, value: k.volume ?? 0, color: k.close >= k.open ? c.volUp : c.volDown })));
        chart.timeScale().fitContent();
      }

      chartRef.current  = chart;
      seriesRef.current = series;
      volRef.current    = vol;

      ro = new ResizeObserver(() => { if (container && chart) chart.applyOptions({ width: container.clientWidth }); });
      ro.observe(container);
    }).catch(e => console.error('[CoinChart] init error:', e));

    return () => {
      mountedRef.current = false;
      ro?.disconnect();
      if (chart) { try { chart.remove(); } catch {} }
      chartRef.current = null; seriesRef.current = null; volRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  // Update candles
  useEffect(() => {
    if (!candles?.length || !seriesRef.current) return;
    const c = getThemeColors();
    try {
      seriesRef.current.setData(candles.map((k) => ({ time: k.time, open: k.open, high: k.high, low: k.low, close: k.close })));
      volRef.current?.setData(candles.map((k) => ({ time: k.time, value: k.volume ?? 0, color: k.close >= k.open ? c.volUp : c.volDown })));
      chartRef.current?.timeScale().fitContent();
    } catch {}
  }, [candles]);

  // Update last candle with WS price
  useEffect(() => {
    if (!wsPrice || !seriesRef.current || !candles?.length) return;
    const last = candles[candles.length - 1];
    try {
      seriesRef.current.update({
        time:  last.time,
        open:  last.open,
        high:  Math.max(last.high, wsPrice),
        low:   Math.min(last.low, wsPrice),
        close: wsPrice,
      });
    } catch {}
  }, [wsPrice, candles]);

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