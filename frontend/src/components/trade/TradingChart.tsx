// components/trade/TradingChart.tsx
// ── TRADING CHART — hardcoded colors (lightweight-charts cannot parse CSS vars) ──

import { useEffect, useRef, useState } from 'react';
import { useMarketCandles } from '@/hooks/useMarketCandles';
import { useMarketStore } from '@/stores/market.store';
import type { PairClass } from '@/types/trade';

interface TradingChartProps {
  symbol:    string;
  pairClass: PairClass;
}

// ⚠️ MUST use hardcoded hex/rgba — lightweight-charts v5 CANNOT parse CSS variables
const THEME = {
  dark: {
    bg:      'transparent',
    text:    '#848E9C',
    grid:    'rgba(255,255,255,0.06)',
    border:  '#2B3139',
    up:      '#0ECB81',
    down:    '#F6465D',
    volUp:   'rgba(14,203,129,0.25)',
    volDown: 'rgba(246,70,93,0.25)',
    lblBg:   '#2B3139',
  },
  light: {
    bg:      'transparent',
    text:    '#474D57',
    grid:    'rgba(0,0,0,0.06)',
    border:  '#E0E3EB',
    up:      '#0ECB81',
    down:    '#F6465D',
    volUp:   'rgba(14,203,129,0.25)',
    volDown: 'rgba(246,70,93,0.25)',
    lblBg:   '#E0E3EB',
  },
} as const;

function getTheme(): 'dark' | 'light' {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

const TIMEFRAMES_CRYPTO = ['1m', '5m', '15m', '1h', '4h', '1d'];
const TIMEFRAMES_FX     = ['1h', '4h', '1d', '1w'];

export function TradingChart({ symbol, pairClass }: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef     = useRef<any>(null);
  const seriesRef    = useRef<any>(null);
  const volRef       = useRef<any>(null);
  const mountedRef   = useRef(true);

  const [timeframe, setTimeframe] = useState(pairClass === 'crypto' ? '1h' : '1h');
  const timeframes = pairClass === 'crypto' ? TIMEFRAMES_CRYPTO : TIMEFRAMES_FX;

  const { data: candlesData, isLoading } = useMarketCandles(symbol, timeframe, pairClass, { enabled: !!symbol });
  const wsPrice = useMarketStore(s => s.prices[symbol]);

  const CHART_H = 380;

  useEffect(() => {
    mountedRef.current = true;
    const container = containerRef.current;
    if (!container) return;

    if (chartRef.current) {
      try { chartRef.current.remove(); } catch { /* ignore */ }
      chartRef.current = null; seriesRef.current = null; volRef.current = null;
    }

    let chart: any = null;
    let ro: ResizeObserver | null = null;
    const c = THEME[getTheme()];

    import('lightweight-charts').then(({ createChart, ColorType, CrosshairMode }) => {
      if (!mountedRef.current || !containerRef.current) return;

      chart = createChart(containerRef.current, {
        width:  containerRef.current.clientWidth || 600,
        height: CHART_H,
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
        timeScale: {
          borderColor:    c.border,
          timeVisible:    true,
          secondsVisible: false,
        },
        rightPriceScale: {
          borderColor:  c.border,
          scaleMargins: { top: 0.08, bottom: 0.18 },
        },
        handleScroll: true,
        handleScale:  true,
      });

      const series = chart.addCandlestickSeries({
        upColor:         c.up,
        downColor:       c.down,
        borderUpColor:   c.up,
        borderDownColor: c.down,
        wickUpColor:     c.up,
        wickDownColor:   c.down,
      });

      const vol = chart.addHistogramSeries({
        priceFormat:  { type: 'volume' },
        priceScaleId: 'vol',
      });
      vol.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

      chartRef.current  = chart;
      seriesRef.current = series;
      volRef.current    = vol;

      if (candlesData?.length) {
        series.setData(candlesData.map((c: any) => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close })));
        vol.setData(candlesData.map((c: any) => ({ time: c.time, value: c.volume ?? 0, color: c.close >= c.open ? THEME[getTheme()].volUp : THEME[getTheme()].volDown })));
        chart.timeScale().fitContent();
      }

      ro = new ResizeObserver(() => {
        if (containerRef.current && chartRef.current) {
          chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
        }
      });
      ro.observe(containerRef.current);
    }).catch(e => console.error('[TradingChart] init:', e));

    return () => {
      mountedRef.current = false;
      ro?.disconnect();
      if (chart) { try { chart.remove(); } catch { /* ignore */ } }
      chartRef.current = null; seriesRef.current = null; volRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, pairClass, timeframe]);

  useEffect(() => {
    if (!seriesRef.current || !candlesData?.length) return;
    const c = THEME[getTheme()];
    try {
      seriesRef.current.setData(candlesData.map((c: any) => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close })));
      volRef.current?.setData(candlesData.map((c: any) => ({ time: c.time, value: c.volume ?? 0, color: c.close >= c.open ? THEME[getTheme()].volUp : THEME[getTheme()].volDown })));
      chartRef.current?.timeScale().fitContent();
    } catch (e) { console.warn('[TradingChart] setData:', e); }
  }, [candlesData]);

  useEffect(() => {
    if (!wsPrice || !seriesRef.current || !candlesData?.length) return;
    const last = candlesData[candlesData.length - 1];
    try {
      seriesRef.current.update({
        time:  last.time,
        open:  last.open,
        high:  Math.max(last.high, wsPrice),
        low:   Math.min(last.low, wsPrice),
        close: wsPrice,
      });
    } catch { /* stale ref */ }
  }, [wsPrice, candlesData]);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3 sm:p-4">
      {/* Timeframe chips */}
      <div className="flex flex-wrap gap-1.5">
        {timeframes.map(tf => (
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

      {/* Chart area */}
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