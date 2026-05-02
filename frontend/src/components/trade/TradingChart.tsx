// components/trade/TradingChart.tsx
// ── TRADING CHART (FIXED — CSS VARIABLES RESOLVED TO ACTUAL COLORS) ──

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

/**
 * Resolve a CSS variable to its actual value.
 * Falls back to a hardcoded color if the variable is not available.
 */
function getCSSVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/**
 * Dark theme colors (hardcoded — lightweight-charts requires actual color values)
 */
const CHART_COLORS = {
  dark: {
    background: '#0B0E11',
    textColor: '#848E9C',
    gridColor: '#1E2329',
    borderColor: '#2B3139',
    upColor: '#0ECB81',
    downColor: '#F6465D',
  },
  light: {
    background: '#FFFFFF',
    textColor: '#474D57',
    gridColor: '#EAECEF',
    borderColor: '#D9D9D9',
    upColor: '#0ECB81',
    downColor: '#F6465D',
  },
};

export function TradingChart({ symbol, pairClass }: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);

  const [timeframe, setTimeframe] = useState(
    pairClass === 'crypto' ? '15m' : '1h'
  );

  const timeframes = pairClass === 'crypto' ? TIMEFRAMES_CRYPTO : TIMEFRAMES_FX;

  // Use new market candles hook (calls /api/chart, never Binance directly)
  const { data: candlesData, isLoading: candlesLoading } = useMarketCandles(
    symbol,
    timeframe,
    pairClass,
    { enabled: !!symbol }
  );

  // Get live WS price for last-candle updates
  const wsPrice = useMarketStore((s) => s.prices[symbol]);

  // ── Init chart (with hardcoded colors, not CSS vars) ──
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    (async () => {
      const { createChart, ColorType } = await import('lightweight-charts');
      if (!containerRef.current) return;

      // Detect theme
      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      const colors = isDark ? CHART_COLORS.dark : CHART_COLORS.light;

      const chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight || 380,
        layout: {
          // ⚠️ FIX: Use actual color values, NOT CSS variables
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: colors.textColor,
        },
        grid: {
          vertLines: { color: colors.gridColor },
          horzLines: { color: colors.gridColor },
        },
        timeScale: {
          borderColor: colors.borderColor,
          timeVisible: true,
        },
        rightPriceScale: {
          borderColor: colors.borderColor,
        },
        crosshair: {
          mode: 0,
        },
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

      const resizeObs = new ResizeObserver(() => {
        if (containerRef.current) {
          chart.applyOptions({
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
          });
        }
      });
      resizeObs.observe(containerRef.current);

      cleanup = () => {
        resizeObs.disconnect();
        chart.remove();
      };
    })();

    return () => {
      cleanup?.();
    };
  }, []);

  // ── Update chart data ──
  useEffect(() => {
    if (!candlesData || !seriesRef.current) return;

    const formatted = candlesData.map((c) => ({
      time: c.time as any,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    seriesRef.current.setData(formatted);
    chartRef.current?.timeScale()?.fitContent();
  }, [candlesData]);

  // ── Live price update from WS ──
  useEffect(() => {
    if (!wsPrice || !seriesRef.current || !candlesData?.length) return;

    const last = candlesData[candlesData.length - 1];
    seriesRef.current.update({
      time: last.time,
      open: last.open,
      high: Math.max(last.high, wsPrice),
      low: Math.min(last.low, wsPrice),
      close: wsPrice,
    });
  }, [wsPrice, candlesData]);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3 sm:p-4">
      {/* Timeframes */}
      <div className="flex flex-wrap gap-1.5">
        {timeframes.map((tf) => (
          <button
            key={tf}
            type="button"
            onClick={() => setTimeframe(tf)}
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

      {/* Chart */}
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
      </div>
    </div>
  );
}