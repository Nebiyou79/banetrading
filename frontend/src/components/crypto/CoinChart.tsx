// components/crypto/CoinChart.tsx
// ── CANDLESTICK CHART (lightweight-charts v5) ──
// UPDATED: WS live price for last candle update

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  createChart,
  ColorType,
  CrosshairMode,
} from 'lightweight-charts';
import type {
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
  Time,
} from 'lightweight-charts';
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

export default function CoinChart({ symbol, theme, disabledTimeframes }: CoinChartProps) {
  const { isMobile, isDesktop } = useResponsive();
  const chartHeight = isDesktop ? 480 : 320;

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  const [timeframe, setTimeframe] = useState<Timeframe>('1h');
  const { candles, isLoading, isFetching, error, refetch } = useOhlc(symbol, timeframe, 500);

  // Get live WS price for last-candle updates
  const wsPrice = useMarketStore((s) => s.prices[symbol]);

  const getChartColors = useCallback(() => {
    if (typeof document === 'undefined') {
      return {
        textColor: '#6E7EA8',
        gridColor: 'rgba(255,255,255,0.04)',
        crosshairColor: '#6E7EA8',
        upColor: '#10D98A',
        downColor: '#F43F5E',
        volumeUp: 'rgba(16, 217, 138, 0.3)',
        volumeDown: 'rgba(244, 63, 94, 0.3)',
      };
    }
    const style = getComputedStyle(document.documentElement);
    return {
      textColor: style.getPropertyValue('--text-secondary').trim() || '#6E7EA8',
      gridColor: style.getPropertyValue('--chart-grid').trim() || 'rgba(255,255,255,0.04)',
      crosshairColor: style.getPropertyValue('--chart-crosshair').trim() || '#6E7EA8',
      upColor: style.getPropertyValue('--chart-up').trim() || '#10D98A',
      downColor: style.getPropertyValue('--chart-down').trim() || '#F43F5E',
      volumeUp: 'rgba(16, 217, 138, 0.3)',
      volumeDown: 'rgba(244, 63, 94, 0.3)',
    };
  }, []);

  // ── Create / recreate chart on theme change ──
  useEffect(() => {
    if (!containerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const colors = getChartColors();

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: chartHeight,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: colors.textColor,
      },
      grid: {
        vertLines: { color: colors.gridColor },
        horzLines: { color: colors.gridColor },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: colors.crosshairColor, labelBackgroundColor: colors.crosshairColor },
        horzLine: { color: colors.crosshairColor, labelBackgroundColor: colors.crosshairColor },
      },
      rightPriceScale: {
        borderColor: colors.gridColor,
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
        autoScale: true,
      },
      timeScale: { borderColor: colors.gridColor, timeVisible: true, secondsVisible: false },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: colors.upColor,
      downColor: colors.downColor,
      borderUpColor: colors.upColor,
      borderDownColor: colors.downColor,
      wickUpColor: colors.upColor,
      wickDownColor: colors.downColor,
      priceScaleId: 'right',
      priceLineVisible: true,
      lastValueVisible: true,
      autoscaleInfoProvider: (original: () => { priceRange: { minValue: number; maxValue: number } } | null) => {
        const res = original();
        if (res) {
          res.priceRange.minValue *= 0.995;
          res.priceRange.maxValue *= 1.005;
        }
        return res;
      },
    });

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: chartHeight,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [theme, chartHeight, getChartColors]);

  // ── Update data when candles change ──
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || candles.length === 0) return;

    const colors = getChartColors();

    const candleData: CandlestickData[] = candles.map(c => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    const volumeData: HistogramData[] = candles.map(c => ({
      time: c.time as Time,
      value: c.volume,
      color: c.close >= c.open ? colors.volumeUp : colors.volumeDown,
    }));

    candleSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);

    chartRef.current?.timeScale().fitContent();
  }, [candles, getChartColors]);

  // ── Live price update from WebSocket ──
  useEffect(() => {
    if (!wsPrice || !candleSeriesRef.current || candles.length === 0) return;

    const last = candles[candles.length - 1];
    candleSeriesRef.current.update({
      time: last.time as Time,
      open: last.open,
      high: Math.max(last.high, wsPrice),
      low: Math.min(last.low, wsPrice),
      close: wsPrice,
    });
  }, [wsPrice, candles]);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 sm:p-5">
      {/* ── Timeframe selector + loading indicator ── */}
      <div className="flex items-center justify-between mb-4">
        <TimeframeSelector
          active={timeframe}
          onChange={setTimeframe}
          // disabledTimeframes={disabledTimeframes}
        />
        <div className="flex items-center gap-2">
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
      </div>

      {/* ── Chart container ── */}
      <div className="relative">
        <div ref={containerRef} style={{ height: chartHeight }} className="w-full" />

        {/* ── Loading overlay ── */}
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

        {/* ── Error state ── */}
        {error && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--overlay)] rounded-lg gap-3">
            <svg className="w-10 h-10 text-[var(--text-muted)] opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-[var(--text-muted)]">Chart temporarily unavailable</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] text-[var(--text-inverse)] hover:opacity-90 transition-opacity duration-150"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}