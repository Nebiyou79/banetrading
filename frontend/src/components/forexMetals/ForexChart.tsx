// components/forexMetals/ForexChart.tsx
// ── FOREX/METALS CHART (FIXED — stable cleanup, no async race) ──

import React, { useRef, useEffect, useState } from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import type { Timeframe } from '@/types/markets';
import { useOhlc } from '@/hooks/useOhlc';
import ForexTimeframeSelector from './ForexTimeframeSelector';

interface ForexChartProps {
  symbol: string;
  theme: 'dark' | 'light';
}

const CHART_COLORS = {
  dark: {
    textColor: '#848E9C',
    gridColor: '#1E2329',
    crosshairColor: '#848E9C',
    upColor: '#0ECB81',
    downColor: '#F6465D',
    volumeUp: 'rgba(16, 217, 138, 0.3)',
    volumeDown: 'rgba(244, 63, 94, 0.3)',
  },
  light: {
    textColor: '#474D57',
    gridColor: '#EAECEF',
    crosshairColor: '#474D57',
    upColor: '#0ECB81',
    downColor: '#F6465D',
    volumeUp: 'rgba(16, 217, 138, 0.3)',
    volumeDown: 'rgba(244, 63, 94, 0.3)',
  },
};

export default function ForexChart({ symbol, theme }: ForexChartProps) {
  const { isDesktop } = useResponsive();
  const chartHeight = isDesktop ? 480 : 320;

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const mountedRef = useRef(true);

  const [timeframe, setTimeframe] = useState<Timeframe>('1h');
  const { candles, isLoading, isFetching, error, refetch } = useOhlc(symbol, timeframe, 500);
  const isSubHourlyError = error?.includes('Sub-hourly') || error?.includes('premium');

  // ── Initialize chart ──
  useEffect(() => {
    mountedRef.current = true;
    const container = containerRef.current;
    if (!container) return;

    if (chartRef.current) {
      try { chartRef.current.remove(); } catch { /* ignore */ }
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    }

    let chart: any = null;
    let resizeObserver: ResizeObserver | null = null;

    import('lightweight-charts').then(({ createChart, ColorType, CrosshairMode }) => {
      if (!mountedRef.current || !containerRef.current) return;

      const c = CHART_COLORS[theme];

      chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: chartHeight,
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: c.textColor,
        },
        grid: {
          vertLines: { color: c.gridColor },
          horzLines: { color: c.gridColor },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: { color: c.crosshairColor, labelBackgroundColor: c.crosshairColor },
          horzLine: { color: c.crosshairColor, labelBackgroundColor: c.crosshairColor },
        },
        rightPriceScale: {
          borderColor: c.gridColor,
          scaleMargins: { top: 0.1, bottom: 0.2 },
          autoScale: true,
        },
        timeScale: { borderColor: c.gridColor, timeVisible: true, secondsVisible: false },
      });

      const candleSeries = chart.addCandlestickSeries({
        upColor: c.upColor,
        downColor: c.downColor,
        borderUpColor: c.upColor,
        borderDownColor: c.downColor,
        wickUpColor: c.upColor,
        wickDownColor: c.downColor,
        priceScaleId: 'right',
        priceLineVisible: true,
        lastValueVisible: true,
      });

      const volumeSeries = chart.addHistogramSeries({
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      });
      volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

      chartRef.current = chart;
      candleSeriesRef.current = candleSeries;
      volumeSeriesRef.current = volumeSeries;

      // Paint any already-fetched candles
      if (candles && candles.length > 0) {
        candleSeries.setData(
          candles.map((k) => ({ time: k.time as any, open: k.open, high: k.high, low: k.low, close: k.close }))
        );
        volumeSeries.setData(
          candles.map((k) => ({
            time: k.time as any,
            value: k.volume,
            color: k.close >= k.open ? c.volumeUp : c.volumeDown,
          }))
        );
        chart.timeScale().fitContent();
      }

      resizeObserver = new ResizeObserver(() => {
        if (containerRef.current && chartRef.current) {
          chartRef.current.applyOptions({
            width: containerRef.current.clientWidth,
            height: chartHeight,
          });
        }
      });
      if (containerRef.current) resizeObserver.observe(containerRef.current);
    }).catch((err) => {
      console.error('[ForexChart] lightweight-charts import failed:', err);
    });

    return () => {
      mountedRef.current = false;
      if (resizeObserver) resizeObserver.disconnect();
      if (chart) {
        try { chart.remove(); } catch { /* ignore */ }
      }
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, chartHeight]);

  // ── Update data when candles arrive ──
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || !candles || candles.length === 0) return;
    const c = CHART_COLORS[theme];
    try {
      candleSeriesRef.current.setData(
        candles.map((k) => ({ time: k.time as any, open: k.open, high: k.high, low: k.low, close: k.close }))
      );
      volumeSeriesRef.current.setData(
        candles.map((k) => ({
          time: k.time as any,
          value: k.volume,
          color: k.close >= k.open ? c.volumeUp : c.volumeDown,
        }))
      );
      chartRef.current?.timeScale().fitContent();
    } catch (err) {
      console.warn('[ForexChart] setData error:', err);
    }
  }, [candles, theme]);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <ForexTimeframeSelector active={timeframe} onChange={setTimeframe} />
        {isFetching && (
          <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
            <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx={12} cy={12} r={10} stroke="currentColor" strokeWidth={4} />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Updating</span>
          </div>
        )}
      </div>

      <div className="relative">
        <div ref={containerRef} style={{ height: chartHeight }} className="w-full" />

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--overlay)] rounded-lg">
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin w-8 h-8 text-[var(--accent)]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx={12} cy={12} r={10} stroke="currentColor" strokeWidth={4} />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm text-[var(--text-secondary)]">Loading chart data...</span>
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--overlay)] rounded-lg gap-3">
            <p className="text-sm text-[var(--text-muted)]">
              {isSubHourlyError
                ? 'Premium data feed required for this interval.'
                : 'Chart temporarily unavailable'}
            </p>
            {!isSubHourlyError && (
              <button
                onClick={() => refetch()}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] text-[var(--text-inverse)] hover:opacity-90 transition-opacity duration-150"
              >
                Retry
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}