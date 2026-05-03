// components/trade/TradingChart.tsx
// ── TRADING CHART (FIXED: explicit height, no race, no overlap) ──

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

const COLORS = {
  dark: { bg: 'transparent', text: '#848E9C', grid: '#1E2329', border: '#2B3139', up: '#0ECB81', down: '#F6465D' },
  light: { bg: 'transparent', text: '#474D57', grid: '#EAECEF', border: '#D9D9D9', up: '#0ECB81', down: '#F6465D' },
};

function getTheme(): 'dark' | 'light' {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

export function TradingChart({ symbol, pairClass }: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const mountedRef = useRef(true);

  const [timeframe, setTimeframe] = useState(pairClass === 'crypto' ? '15m' : '1h');
  const timeframes = pairClass === 'crypto' ? TIMEFRAMES_CRYPTO : TIMEFRAMES_FX;

  // Use market candles hook — calls /api/chart which now returns real data
  const { data: candlesData, isLoading } = useMarketCandles(symbol, timeframe, pairClass, { enabled: !!symbol });
  const wsPrice = useMarketStore((s) => s.prices[symbol]);

  // Chart height: fixed so it never collapses
  const CHART_H = 380;

  useEffect(() => {
    mountedRef.current = true;
    const container = containerRef.current;
    if (!container) return;

    if (chartRef.current) {
      try { chartRef.current.remove(); } catch { /* ignore */ }
      chartRef.current = null;
      seriesRef.current = null;
    }

    let chart: any = null;
    let ro: ResizeObserver | null = null;
    const c = COLORS[getTheme()];

    import('lightweight-charts').then(({ createChart, ColorType }) => {
      if (!mountedRef.current || !containerRef.current) return;

      chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth || 600,
        height: CHART_H,
        layout: { background: { type: ColorType.Solid, color: c.bg }, textColor: c.text },
        grid: { vertLines: { color: c.grid }, horzLines: { color: c.grid } },
        timeScale: { borderColor: c.border, timeVisible: true },
        rightPriceScale: { borderColor: c.border },
        crosshair: { mode: 0 },
        handleScroll: true,
        handleScale: true,
      });

      const series = chart.addCandlestickSeries({
        upColor: c.up, downColor: c.down,
        borderUpColor: c.up, borderDownColor: c.down,
        wickUpColor: c.up, wickDownColor: c.down,
      });

      chartRef.current = chart;
      seriesRef.current = series;

      if (candlesData?.length) {
        series.setData(candlesData.map((c) => ({ time: c.time as any, open: c.open, high: c.high, low: c.low, close: c.close })));
        chart.timeScale().fitContent();
      }

      ro = new ResizeObserver(() => {
        if (containerRef.current && chartRef.current) {
          chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
        }
      });
      ro.observe(containerRef.current);
    }).catch((e) => console.error('[TradingChart] init:', e));

    return () => {
      mountedRef.current = false;
      if (ro) ro.disconnect();
      if (chart) { try { chart.remove(); } catch { /* ignore */ } }
      chartRef.current = null;
      seriesRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, pairClass, timeframe]);

  useEffect(() => {
    if (!seriesRef.current || !candlesData?.length) return;
    try {
      seriesRef.current.setData(candlesData.map((c) => ({ time: c.time as any, open: c.open, high: c.high, low: c.low, close: c.close })));
      chartRef.current?.timeScale().fitContent();
    } catch (e) { console.warn('[TradingChart] setData:', e); }
  }, [candlesData]);

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
    } catch { /* stale ref */ }
  }, [wsPrice, candlesData]);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3 sm:p-4">
      {/* Timeframe chips */}
      <div className="flex flex-wrap gap-1.5">
        {timeframes.map((tf) => (
          <button
            key={tf}
            type="button"
            onClick={() => setTimeframe(tf)}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors duration-150 ${
              tf === timeframe
                ? 'bg-[var(--accent-muted)] text-[var(--accent)] border border-[var(--accent)]'
                : 'border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Chart area — fixed height */}
      <div className="relative" style={{ height: CHART_H }}>
        <div ref={containerRef} style={{ width: '100%', height: CHART_H }} />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-elevated)] rounded-lg">
            <div className="animate-spin w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full" />
          </div>
        )}
        {!isLoading && !candlesData?.length && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-[var(--text-muted)]">No chart data</p>
          </div>
        )}
      </div>
    </div>
  );
}