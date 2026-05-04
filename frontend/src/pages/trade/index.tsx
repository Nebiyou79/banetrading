// pages/trade/index.tsx
// ── TRADING PAGE — Professional layout with fixed chart colors ──

import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import { withAuth } from '@/components/layout/withAuth';
import { useTradingConfig } from '@/hooks/useTradingConfig';
import { useTradePairs } from '@/hooks/useTradePairs';
import { useUserBalances } from '@/hooks/useUserBalances';
import { useActiveTrades } from '@/hooks/useActiveTrades';
import { useTradeHistory } from '@/hooks/useTradeHistory';
import { useMarketStore } from '@/stores/market.store';
import { usePageMarketWebSocket } from '@/hooks/useMarketWebSocket';
import { AssetHeader } from '@/components/trade/AssetHeader';
import { PairsBar } from '@/components/trade/PairsBar';
import { ChartContainer } from '@/components/chart/ChartContainer';
import { TradingPanel } from '@/components/trade/TradingPanel';
import { ActiveTradeCard } from '@/components/trade/ActiveTradeCard';
import { YourTradesTable } from '@/components/trade/YourTradesTable';
import { TradeResultModal } from '@/components/trade/TradeResultModal';
import { useMarketCandles } from '@/hooks/useMarketCandles';
import TimeframeSelector from '@/components/crypto/TimeframeSelector';
import type { PairClass, TradingPair, Trade } from '@/types/trade';
import type { Currency } from '@/types/convert';
import type { Timeframe } from '@/types/markets';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'NebaTrade';

// ⚠️ Hardcoded colors — lightweight-charts v5 CANNOT parse CSS variables
const CHART_COLORS = {
  dark:  { bg: 'transparent', text: '#848E9C', grid: 'rgba(255,255,255,0.06)', border: '#2B3139', up: '#0ECB81', down: '#F6465D', lblBg: '#2B3139', volUp: 'rgba(14,203,129,0.25)', volDown: 'rgba(246,70,93,0.25)' },
  light: { bg: 'transparent', text: '#474D57', grid: 'rgba(0,0,0,0.06)',       border: '#E0E3EB', up: '#0ECB81', down: '#F6465D', lblBg: '#E0E3EB', volUp: 'rgba(14,203,129,0.25)', volDown: 'rgba(246,70,93,0.25)' },
};

function TradePage(): JSX.Element {
  const router = useRouter();
  const symbolParam = (router.query.symbol as string) || 'BTCUSDT';

  const { config }  = useTradingConfig();
  const { pairs }   = useTradePairs();
  const { balances }= useUserBalances();
  const { trades: activeTrades, recentlyResolved, clearResolved } = useActiveTrades();

  const [historyOffset, setHistoryOffset] = useState(0);
  const { trades: historyTrades, total: historyTotal, isLoading: historyLoading } = useTradeHistory(20, historyOffset);

  const [activePair,      setActivePair]      = useState<TradingPair | null>(null);
  const [activePairClass, setActivePairClass] = useState<PairClass>('crypto');
  const [resultModalTrade, setResultModalTrade] = useState<Trade | null>(null);
  const [chartTimeframe, setChartTimeframe]   = useState<Timeframe>('1h');

  usePageMarketWebSocket(activePair?.symbol ?? '');

  const livePrice = useMarketStore(s => s.prices[activePair?.symbol ?? ''] ?? null);
  const wsTicker  = useMarketStore(s => s.tickers[activePair?.symbol ?? ''] ?? null);

  // Resolve pair from URL
  useEffect(() => {
    if (!pairs) return;
    const found =
      pairs.crypto.find(p => p.symbol === symbolParam) ??
      pairs.forex.find(p => p.symbol === symbolParam)  ??
      pairs.metals.find(p => p.symbol === symbolParam) ??
      pairs.crypto[0] ?? null;
    if (found) {
      setActivePair(prev => prev?.symbol === found.symbol ? prev : found);
      setActivePairClass(
        pairs.crypto.includes(found) ? 'crypto' :
        pairs.forex.includes(found)  ? 'forex'  : 'metals'
      );
    }
  }, [symbolParam, pairs]);

  // Result modal queue
  useEffect(() => {
    if (recentlyResolved.length > 0 && !resultModalTrade) {
      setResultModalTrade(recentlyResolved[0]);
    }
  }, [recentlyResolved, resultModalTrade]);

  const handleSelectPair = useCallback((pair: TradingPair) => {
    setActivePair(pair);
    router.replace({ pathname: '/trade', query: { symbol: pair.symbol } }, undefined, { shallow: true, scroll: false });
  }, [router]);

  const handleCloseResult = useCallback(() => {
    setResultModalTrade(null);
    clearResolved();
  }, [clearResolved]);

  const pendingTrades = useMemo(() => activeTrades.filter(t => t.status === 'pending'), [activeTrades]);

  return (
    <>
      <Head><title>Trade · {BRAND}</title></Head>
      <AuthenticatedShell>
        <div className="flex flex-col gap-3">
          {/* Pairs Bar */}
          <PairsBar
            pairs={pairs}
            activeClass={activePairClass}
            activeSymbol={activePair?.symbol ?? ''}
            onClassChange={c => {
              setActivePairClass(c);
              const first = pairs[c][0];
              if (first) handleSelectPair(first);
            }}
            onSelectPair={handleSelectPair}
          />

          {/* Main Grid */}
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_380px]">
            {/* Chart Column */}
            <div className="flex flex-col gap-3 min-w-0">
              <ChartContainer
                toolbar={
                  <TimeframeSelector
                    active={chartTimeframe}
                    onChange={setChartTimeframe}
                    disabledTimeframes={activePairClass !== 'crypto' ? ['1m','5m','15m'] : []}
                  />
                }
              >
                <TradingChartInner
                  symbol={activePair?.symbol ?? 'BTCUSDT'}
                  pairClass={activePairClass}
                  timeframe={chartTimeframe}
                />
              </ChartContainer>
            </div>

            {/* Trade Panel Column */}
            <div className="flex flex-col gap-3">
              <AssetHeader
                pair={activePair}
                pairClass={activePairClass}
                price={livePrice}
                change24h={wsTicker?.change24h ?? null}
                high24h={wsTicker?.high24h ?? null}
                low24h={wsTicker?.low24h ?? null}
              />
              <TradingPanel
                pair={activePair}
                pairClass={activePairClass}
                config={config}
                livePrice={livePrice}
                balances={balances as Record<Currency, number>}
              />
            </div>
          </div>

          {/* Active Trades */}
          {pendingTrades.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {pendingTrades.map(t => <ActiveTradeCard key={t._id} trade={t} />)}
            </div>
          )}

          {/* Trade History */}
          <YourTradesTable
            activeTrades={pendingTrades}
            historyTrades={historyTrades}
            historyTotal={historyTotal}
            historyOffset={historyOffset}
            onLoadMore={() => setHistoryOffset(o => o + 20)}
            isLoading={historyLoading}
          />
        </div>

        <TradeResultModal trade={resultModalTrade} onClose={handleCloseResult} />
      </AuthenticatedShell>
    </>
  );
}

// ── Inner chart with hardcoded colors ──
function TradingChartInner({
  symbol, pairClass, timeframe,
}: {
  symbol: string; pairClass: PairClass; timeframe: Timeframe;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<any>(null);
  const seriesRef    = useRef<any>(null);
  const volRef       = useRef<any>(null);
  const mountedRef   = useRef(true);

  const { data: candlesData, isLoading, error, refetch } = useMarketCandles(symbol, timeframe, pairClass);
  const wsPrice = useMarketStore(s => s.prices[symbol]);

  const CHART_H = 480;

  function getColors() {
    if (typeof document === 'undefined') return CHART_COLORS.dark;
    return document.documentElement.getAttribute('data-theme') === 'light'
      ? CHART_COLORS.light : CHART_COLORS.dark;
  }

  useEffect(() => {
    mountedRef.current = true;
    const container = containerRef.current;
    if (!container) return;

    if (chartRef.current) {
      try { chartRef.current.remove(); } catch {}
      chartRef.current = null; seriesRef.current = null; volRef.current = null;
    }

    let chart: any = null;
    let ro: ResizeObserver | null = null;
    const c = getColors();

    import('lightweight-charts').then(({ createChart, ColorType, CrosshairMode }) => {
      if (!mountedRef.current || !containerRef.current) return;

      chart = createChart(containerRef.current, {
        width:  containerRef.current.clientWidth,
        height: CHART_H,
        layout: { background: { type: ColorType.Solid, color: c.bg }, textColor: c.text },
        grid:   { vertLines: { color: c.grid }, horzLines: { color: c.grid } },
        crosshair: {
          mode:     CrosshairMode.Normal,
          vertLine: { color: c.border, labelBackgroundColor: c.lblBg },
          horzLine: { color: c.border, labelBackgroundColor: c.lblBg },
        },
        timeScale:       { borderColor: c.border, timeVisible: true, secondsVisible: false },
        rightPriceScale: { borderColor: c.border, scaleMargins: { top: 0.08, bottom: 0.18 } },
      });

      const series = chart.addCandlestickSeries({
        upColor: c.up, downColor: c.down, borderUpColor: c.up, borderDownColor: c.down, wickUpColor: c.up, wickDownColor: c.down,
      });

      const vol = chart.addHistogramSeries({ priceFormat: { type: 'volume' }, priceScaleId: 'vol' });
      vol.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

      chartRef.current = chart; seriesRef.current = series; volRef.current = vol;

      if (candlesData?.length) {
        series.setData(candlesData.map((k: any) => ({ time: k.time, open: k.open, high: k.high, low: k.low, close: k.close })));
        vol.setData(candlesData.map((k: any) => ({ time: k.time, value: k.volume ?? 0, color: k.close >= k.open ? c.volUp : c.volDown })));
        chart.timeScale().fitContent();
      }

      ro = new ResizeObserver(() => chart.applyOptions({ width: container.clientWidth }));
      ro.observe(container);
    });

    return () => {
      mountedRef.current = false;
      ro?.disconnect();
      if (chart) { try { chart.remove(); } catch {} }
      chartRef.current = null; seriesRef.current = null; volRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, pairClass, timeframe]);

  useEffect(() => {
    if (!seriesRef.current || !candlesData?.length) return;
    const c = getColors();
    try {
      seriesRef.current.setData(candlesData.map((k: any) => ({ time: k.time, open: k.open, high: k.high, low: k.low, close: k.close })));
      volRef.current?.setData(candlesData.map((k: any) => ({ time: k.time, value: k.volume ?? 0, color: k.close >= k.open ? c.volUp : c.volDown })));
      chartRef.current?.timeScale().fitContent();
    } catch {}
  }, [candlesData]);

  useEffect(() => {
    if (!wsPrice || !seriesRef.current || !candlesData?.length) return;
    const last = candlesData[candlesData.length - 1];
    try {
      seriesRef.current.update({ time: last.time, open: last.open, high: Math.max(last.high, wsPrice), low: Math.min(last.low, wsPrice), close: wsPrice });
    } catch {}
  }, [wsPrice, candlesData]);

  return <div ref={containerRef} style={{ width: '100%', height: CHART_H }} />;
}

export default withAuth(TradePage);