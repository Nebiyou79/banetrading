// components/trade/TradingChart.tsx
// ── TRADING CHART ──
import { useEffect, useRef, useState, useCallback } from 'react';
import { apiClient } from '@/services/apiClient';
import type { PairClass } from '@/types/trade';

// Lazy-load lightweight-charts — the existing CoinChart already sets up the
// chart component, so we mimic the same API surface here.
// We assume a utility createChartInstance from the existing chart code is
// available; if not, inline a minimal chart factory.

interface TradingChartProps {
  symbol: string;
  pairClass: PairClass;
}

const TIMEFRAMES_CRYPTO = ['1m', '5m', '15m', '1h', '4h', '1d'];
const TIMEFRAMES_FX = ['1h', '4h', '1d', '1w'];

interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export function TradingChart({ symbol, pairClass }: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<unknown>(null);
  const seriesRef = useRef<unknown>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [timeframe, setTimeframe] = useState(
    pairClass === 'crypto' ? '15m' : '1h'
  );

  const timeframes = pairClass === 'crypto' ? TIMEFRAMES_CRYPTO : TIMEFRAMES_FX;

  const fetchOHLC = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const { data } = await apiClient.get('/markets/ohlc', {
        params: { symbol, interval: timeframe, limit: 200 },
        signal: ctrl.signal,
      });
      if (seriesRef.current) {
        (seriesRef.current as { setData: (d: Candle[]) => void }).setData(
          data.candles ?? data
        );
      }
    } catch {
      // aborted or failed silently
    }
  }, [symbol, timeframe]);

  useEffect(() => {
    // Dynamic import lightweight-charts
    let cleanup: (() => void) | undefined;
    (async () => {
      const { createChart, ColorType } = await import('lightweight-charts');
      if (!containerRef.current) return;

      const chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight || 380,
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: 'var(--text-secondary)',
        },
        grid: {
          vertLines: { color: 'var(--border-subtle)' },
          horzLines: { color: 'var(--border-subtle)' },
        },
        timeScale: {
          borderColor: 'var(--border)',
          timeVisible: true,
        },
        rightPriceScale: {
          borderColor: 'var(--border)',
        },
      });
      const series = chart.addCandlestickSeries({
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderUpColor: '#22c55e',
        borderDownColor: '#ef4444',
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
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
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    fetchOHLC();
  }, [fetchOHLC]);

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
      <div
        ref={containerRef}
        className="h-[260px] w-full rounded-lg md:h-[380px]"
      />
    </div>
  );
}