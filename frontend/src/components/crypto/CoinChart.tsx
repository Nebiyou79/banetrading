// components/crypto/CoinChart.tsx
// ── CANDLESTICK CHART — hardcoded colors (lightweight-charts cannot parse CSS vars) ──

import React, { useRef, useEffect, useState } from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import type { Timeframe } from '@/types/markets';
import { useOhlc } from '@/hooks/useOhlc';
import { useMarketStore } from '@/stores/market.store';
import TimeframeSelector from './TimeframeSelector';

interface CoinChartProps {
  symbol: string;
  theme: 'dark' | 'light';
  disabledTimeframes?: Timeframe[];
}

// ⚠️ MUST use hardcoded hex/rgba — lightweight-charts v5 CANNOT parse CSS variables
const THEME = {
  dark: {
    bg:       'transparent',
    text:     '#848E9C',
    grid:     'rgba(255,255,255,0.06)',
    border:   '#2B3139',
    up:       '#0ECB81',
    down:     '#F6465D',
    volUp:    'rgba(14,203,129,0.25)',
    volDown:  'rgba(246,70,93,0.25)',
    crossH:   '#848E9C',
    lblBg:    '#2B3139',
  },
  light: {
    bg:       'transparent',
    text:     '#474D57',
    grid:     'rgba(0,0,0,0.06)',
    border:   '#E0E3EB',
    up:       '#0ECB81',
    down:     '#F6465D',
    volUp:    'rgba(14,203,129,0.25)',
    volDown:  'rgba(246,70,93,0.25)',
    crossH:   '#9B7CC0',
    lblBg:    '#E0E3EB',
  },
} as const;

export default function CoinChart({ symbol, theme, disabledTimeframes = [] }: CoinChartProps) {
  const { isMobile } = useResponsive();
  const chartHeight = isMobile ? 300 : 460;

  const containerRef  = useRef<HTMLDivElement>(null);
  const chartRef      = useRef<any>(null);
  const candleRef     = useRef<any>(null);
  const volRef        = useRef<any>(null);
  const mountedRef    = useRef(true);

  const [timeframe, setTimeframe] = useState<Timeframe>('1h');
  const { candles, isLoading, isFetching, error, refetch } = useOhlc(symbol, timeframe, 500);
  const wsPrice = useMarketStore(s => s.prices[symbol]);

  // ── Chart init ──
  useEffect(() => {
    mountedRef.current = true;
    const container = containerRef.current;
    if (!container) return;

    // Destroy previous instance
    if (chartRef.current) {
      try { chartRef.current.remove(); } catch { /* ignore */ }
      chartRef.current = null; candleRef.current = null; volRef.current = null;
    }

    let chart: any = null;
    let ro: ResizeObserver | null = null;
    const c = THEME[theme];

    import('lightweight-charts').then(({ createChart, ColorType, CrosshairMode }) => {
      if (!mountedRef.current || !containerRef.current) return;

      chart = createChart(containerRef.current, {
        width:  containerRef.current.clientWidth || 600,
        height: chartHeight,
        layout: {
          background: { type: ColorType.Solid, color: c.bg },
          textColor:  c.text,
        },
        grid: {
          vertLines: { color: c.grid },
          horzLines: { color: c.grid },
        },
        crosshair: {
          mode:     CrosshairMode.Normal,
          vertLine: { color: c.border, labelBackgroundColor: c.lblBg },
          horzLine: { color: c.border, labelBackgroundColor: c.lblBg },
        },
        rightPriceScale: {
          borderColor:  c.border,
          scaleMargins: { top: 0.08, bottom: 0.18 },
        },
        timeScale: {
          borderColor:    c.border,
          timeVisible:    true,
          secondsVisible: false,
        },
        handleScroll: true,
        handleScale:  true,
      });

      const candleSeries = chart.addCandlestickSeries({
        upColor:        c.up,
        downColor:      c.down,
        borderUpColor:  c.up,
        borderDownColor:c.down,
        wickUpColor:    c.up,
        wickDownColor:  c.down,
      });

      const volSeries = chart.addHistogramSeries({
        priceFormat:  { type: 'volume' },
        priceScaleId: 'vol',
      });
      volSeries.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

      chartRef.current  = chart;
      candleRef.current = candleSeries;
      volRef.current    = volSeries;

      if (candles?.length) {
        candleSeries.setData(candles.map(k => ({ time: k.time as any, open: k.open, high: k.high, low: k.low, close: k.close })));
        volSeries.setData(candles.map(k => ({ time: k.time as any, value: k.volume ?? 0, color: k.close >= k.open ? c.volUp : c.volDown })));
        chart.timeScale().fitContent();
      }

      ro = new ResizeObserver(() => {
        if (containerRef.current && chartRef.current) {
          chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
        }
      });
      ro.observe(containerRef.current);
    }).catch(e => console.error('[CoinChart] init error:', e));

    return () => {
      mountedRef.current = false;
      ro?.disconnect();
      if (chart) { try { chart.remove(); } catch { /* ignore */ } }
      chartRef.current = null; candleRef.current = null; volRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, chartHeight]);

  // ── Update candles ──
  useEffect(() => {
    if (!candleRef.current || !volRef.current || !candles?.length) return;
    const c = THEME[theme];
    try {
      candleRef.current.setData(candles.map(k => ({ time: k.time as any, open: k.open, high: k.high, low: k.low, close: k.close })));
      volRef.current.setData(candles.map(k => ({ time: k.time as any, value: k.volume ?? 0, color: k.close >= k.open ? c.volUp : c.volDown })));
      chartRef.current?.timeScale().fitContent();
    } catch (e) { console.warn('[CoinChart] setData:', e); }
  }, [candles, theme]);

  // ── Live WS price tick ──
  useEffect(() => {
    if (!wsPrice || !candleRef.current || !candles?.length) return;
    const last = candles[candles.length - 1];
    try {
      candleRef.current.update({
        time:  last.time as any,
        open:  last.open,
        high:  Math.max(last.high, wsPrice),
        low:   Math.min(last.low, wsPrice),
        close: wsPrice,
      });
    } catch { /* stale ref */ }
  }, [wsPrice, candles]);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]">
      {/* Timeframe bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <TimeframeSelector active={timeframe} onChange={setTimeframe} disabledTimeframes={disabledTimeframes} />
        {isFetching && !isLoading && (
          <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
            <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx={12} cy={12} r={10} stroke="currentColor" strokeWidth={4}/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Updating
          </span>
        )}
      </div>

      <div className="relative px-0 pb-0" style={{ height: chartHeight }}>
        <div ref={containerRef} style={{ width: '100%', height: chartHeight }} />

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-elevated)] rounded-b-xl">
            <div className="flex flex-col items-center gap-2">
              <svg className="animate-spin w-8 h-8 text-[var(--accent)]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx={12} cy={12} r={10} stroke="currentColor" strokeWidth={4}/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <span className="text-xs text-[var(--text-muted)]">Loading chart…</span>
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[var(--bg-elevated)] rounded-b-xl">
            <p className="text-sm text-[var(--text-muted)]">Chart temporarily unavailable</p>
            <button onClick={() => refetch()} className="px-4 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent)] text-white hover:opacity-90">
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && candles?.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-[var(--text-muted)]">No chart data available</p>
          </div>
        )}
      </div>
    </div>
  );
}