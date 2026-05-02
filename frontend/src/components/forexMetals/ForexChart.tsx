// components/forexMetals/ForexChart.tsx
// ── FOREX/METALS CHART (FIXED — HARDCODED COLORS) ──

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
import ForexTimeframeSelector from './ForexTimeframeSelector';

interface ForexChartProps {
  symbol: string;
  theme: 'dark' | 'light';
}

// ⚠️ FIX: Hardcoded colors
const CHART_COLORS = {
  dark: {
    textColor: '#848E9C',
    gridColor: 'rgba(255,255,255,0.04)',
    crosshairColor: '#848E9C',
    upColor: '#0ECB81',
    downColor: '#F6465D',
    volumeUp: 'rgba(16, 217, 138, 0.3)',
    volumeDown: 'rgba(244, 63, 94, 0.3)',
  },
  light: {
    textColor: '#474D57',
    gridColor: 'rgba(0,0,0,0.06)',
    crosshairColor: '#474D57',
    upColor: '#0ECB81',
    downColor: '#F6465D',
    volumeUp: 'rgba(16, 217, 138, 0.3)',
    volumeDown: 'rgba(244, 63, 94, 0.3)',
  },
};

export default function ForexChart({ symbol, theme }: ForexChartProps) {
  const { isMobile, isDesktop } = useResponsive();
  const chartHeight = isDesktop ? 480 : 320;

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  const [timeframe, setTimeframe] = useState<Timeframe>('1h');
  const { candles, isLoading, isFetching, error, refetch } = useOhlc(symbol, timeframe, 500);
  const isSubHourlyError = error?.includes('Sub-hourly') || error?.includes('premium');

  const getChartColors = useCallback(() => {
    return theme === 'light' ? CHART_COLORS.light : CHART_COLORS.dark;
  }, [theme]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }

    const colors = getChartColors();

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: chartHeight,
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: colors.textColor },
      grid: { vertLines: { color: colors.gridColor }, horzLines: { color: colors.gridColor } },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: colors.crosshairColor, labelBackgroundColor: colors.crosshairColor },
        horzLine: { color: colors.crosshairColor, labelBackgroundColor: colors.crosshairColor },
      },
      rightPriceScale: {
        borderColor: colors.gridColor,
        scaleMargins: { top: 0.1, bottom: 0.2 },
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
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth, height: chartHeight });
      }
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(containerRef.current);
    return () => { ro.disconnect(); chart.remove(); chartRef.current = null; };
  }, [theme, chartHeight, getChartColors]);

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

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <ForexTimeframeSelector active={timeframe} onChange={setTimeframe} />
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