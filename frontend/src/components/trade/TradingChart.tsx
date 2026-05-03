// components/trade/TradingChart.tsx
// ── TRADING CHART (FIXED — stable sync init, safe cleanup, no race condition) ──

import { useEffect, useRef, useState } from 'react';
import { useMarketCandles } from '@/hooks/useMarketCandles';
import { useMarketStore } from '@/stores/market.store';
import type { PairClass } from '@/types/trade';

interface TradingChartProps {
  symbol: string;
  pairClass: PairClass;
}

const TIMEFRAMES_CRYPTO = ['1m', '5m', '15m', '1h', '4h', '1d'];
const TIMEFRAMES_FX = ['1h', '4h', '1d', '1w'];

const CHART_COLORS = {
  dark: {
    background: 'transparent',
    textColor: '#848E9C',
    gridColor: '#1E2329',
    borderColor: '#2B3139',
    upColor: '#0ECB81',
    downColor: '#F6465D',
  },
  light: {
    background: 'transparent',
    textColor: '#474D57',
    gridColor: '#EAECEF',
    borderColor: '#D9D9D9',
    upColor: '#0ECB81',
    downColor: '#F6465D',
  },
};

export function TradingChart({ symbol, pairClass }: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Store chart API refs — typed as any to avoid heavyweight lightweight-charts imports
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  // Track whether component is still mounted to prevent stale updates
  const mountedRef = useRef(true);
  // Track the symbol/timeframe the chart was last initialized for
  const initKeyRef = useRef<string>('');

  const [timeframe, setTimeframe] = useState(
    pairClass === 'crypto' ? '15m' : '1h'
  );

  const timeframes = pairClass === 'crypto' ? TIMEFRAMES_CRYPTO : TIMEFRAMES_FX;

  const { data: candlesData, isLoading: candlesLoading } = useMarketCandles(
    symbol,
    timeframe,
    pairClass,
    { enabled: !!symbol }
  );

  const wsPrice = useMarketStore((s) => s.prices[symbol]);

  // ── Detect current theme ──
  const getTheme = (): 'dark' | 'light' => {
    if (typeof document === 'undefined') return 'dark';
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  };

  // ── Initialize chart once container is available ──
  useEffect(() => {
    mountedRef.current = true;
    const initKey = `${symbol}-${timeframe}`;

    // Avoid re-initializing if nothing meaningful changed
    if (initKeyRef.current === initKey && chartRef.current) return;
    initKeyRef.current = initKey;

    const container = containerRef.current;
    if (!container) return;

    // Destroy previous chart instance before creating a new one
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch { /* ignore errors during cleanup */ }
      chartRef.current = null;
      seriesRef.current = null;
    }

    // Dynamically import to avoid SSR issues; use .then() not async/await
    // so cleanup can run synchronously without undefined variables
    let chart: any = null;
    let resizeObserver: ResizeObserver | null = null;

    import('lightweight-charts').then(({ createChart, ColorType }) => {
      // If component unmounted while importing, abort
      if (!mountedRef.current || !containerRef.current) return;

      const colors = CHART_COLORS[getTheme()];

      chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight || 380,
        layout: {
          background: { type: ColorType.Solid, color: colors.background },
          textColor: colors.textColor,
        },
        grid: {
          vertLines: { color: colors.gridColor },
          horzLines: { color: colors.gridColor },
        },
        timeScale: {
          borderColor: colors.borderColor,
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: {
          borderColor: colors.borderColor,
        },
        crosshair: { mode: 0 },
      });

      const series = chart.addCandlestickSeries({
        upColor: colors.upColor,
        downColor: colors.downColor,
        borderUpColor: colors.upColor,
        borderDownColor: colors.downColor,
        wickUpColor: colors.upColor,
        wickDownColor: colors.downColor,
      });

      chartRef.current = chart;
      seriesRef.current = series;

      // Load any already-fetched candle data immediately
      if (candlesData && candlesData.length > 0) {
        const formatted = candlesData.map((c) => ({
          time: c.time as any,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }));
        series.setData(formatted);
        chart.timeScale().fitContent();
      }

      // Responsive resize observer
      resizeObserver = new ResizeObserver(() => {
        if (containerRef.current && chartRef.current) {
          chartRef.current.applyOptions({
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight || 380,
          });
        }
      });
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }
    }).catch((err) => {
      console.error('[TradingChart] Failed to load lightweight-charts:', err);
    });

    // Cleanup: always synchronously available (no undefined)
    return () => {
      mountedRef.current = false;
      if (resizeObserver) resizeObserver.disconnect();
      if (chart) {
        try { chart.remove(); } catch { /* ignore */ }
      }
      chartRef.current = null;
      seriesRef.current = null;
    };
    // Re-initialize when symbol or pairClass changes; timeframe handled separately
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, pairClass]);

  // ── Update candle data when it arrives ──
  useEffect(() => {
    if (!seriesRef.current || !candlesData || candlesData.length === 0) return;

    const formatted = candlesData.map((c) => ({
      time: c.time as any,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    try {
      seriesRef.current.setData(formatted);
      chartRef.current?.timeScale()?.fitContent();
    } catch (err) {
      console.warn('[TradingChart] setData error:', err);
    }
  }, [candlesData]);

  // ── Live WebSocket price update on last candle ──
  useEffect(() => {
    if (!wsPrice || !seriesRef.current || !candlesData?.length) return;

    const last = candlesData[candlesData.length - 1];
    try {
      seriesRef.current.update({
        time: last.time,
        open: last.open,
        high: Math.max(last.high, wsPrice),
        low: Math.min(last.low, wsPrice),
        close: wsPrice,
      });
    } catch { /* stale chart ref during transition */ }
  }, [wsPrice, candlesData]);

  // ── Handle timeframe change — reset initKey so chart re-initializes ──
  const handleTimeframeChange = (tf: string) => {
    setTimeframe(tf);
    initKeyRef.current = ''; // force re-init on next render
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3 sm:p-4">
      {/* Timeframe selector */}
      <div className="flex flex-wrap gap-1.5">
        {timeframes.map((tf) => (
          <button
            key={tf}
            type="button"
            onClick={() => handleTimeframeChange(tf)}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold tabular transition-colors duration-150 ${
              tf === timeframe
                ? 'bg-[var(--accent-muted)] text-[var(--accent)] border border-[var(--accent)]'
                : 'border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Chart container */}
      <div className="relative">
        <div
          ref={containerRef}
          className="h-[260px] w-full rounded-lg md:h-[380px]"
        />
        {candlesLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--overlay)] rounded-lg">
            <div className="animate-spin w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full" />
          </div>
        )}
        {!candlesLoading && (!candlesData || candlesData.length === 0) && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg">
            <p className="text-sm text-[var(--text-muted)]">Chart data unavailable</p>
          </div>
        )}
      </div>
    </div>
  );
}