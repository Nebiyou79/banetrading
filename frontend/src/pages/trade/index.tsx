// pages/trade/index.tsx
// ── TRADING PAGE — Professional layout ──

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
import { useMarketStore as useStore } from '@/stores/market.store';
import type { PairClass, TradingPair, Trade } from '@/types/trade';
import type { Currency } from '@/types/convert';
import type { Timeframe } from '@/types/markets';
import TimeframeSelector from '@/components/crypto/TimeframeSelector';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'NebaTrade';

function TradePage(): JSX.Element {
  const router = useRouter();
  const symbolParam = (router.query.symbol as string) || 'BTCUSDT';

  const { config } = useTradingConfig();
  const { pairs } = useTradePairs();
  const { balances } = useUserBalances();
  const { trades: activeTrades, recentlyResolved, clearResolved } = useActiveTrades();

  const [historyOffset, setHistoryOffset] = useState(0);
  const { trades: historyTrades, total: historyTotal, isLoading: historyLoading } = useTradeHistory(20, historyOffset);

  const [activePair, setActivePair] = useState<TradingPair | null>(null);
  const [activePairClass, setActivePairClass] = useState<PairClass>('crypto');
  const [resultModalTrade, setResultModalTrade] = useState<Trade | null>(null);

  // WebSocket subscription
  usePageMarketWebSocket(activePair?.symbol ?? '');

  // Live prices from store
  const livePrice = useStore((s) => s.prices[activePair?.symbol ?? ''] ?? null);
  const wsTicker = useStore((s) => s.tickers[activePair?.symbol ?? ''] ?? null);

  // Resolve pair from URL
  useEffect(() => {
    if (!pairs) return;
    const found =
      pairs.crypto.find((p) => p.symbol === symbolParam) ??
      pairs.forex.find((p) => p.symbol === symbolParam) ??
      pairs.metals.find((p) => p.symbol === symbolParam) ??
      pairs.crypto[0] ?? null;
    if (found) {
      setActivePair((prev) => prev?.symbol === found.symbol ? prev : found);
      setActivePairClass(
        pairs.crypto.includes(found) ? 'crypto' :
        pairs.forex.includes(found) ? 'forex' : 'metals'
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

  const pendingTrades = useMemo(() => activeTrades.filter((t) => t.status === 'pending'), [activeTrades]);

  return (
    <>
      <Head><title>Trade · {BRAND}</title></Head>
      <AuthenticatedShell>
        <div className="flex flex-col gap-3">
          {/* ── Pairs Bar ── */}
          <PairsBar
            pairs={pairs}
            activeClass={activePairClass}
            activeSymbol={activePair?.symbol ?? ''}
            onClassChange={(c) => {
              setActivePairClass(c);
              const first = pairs[c][0];
              if (first) handleSelectPair(first);
            }}
            onSelectPair={handleSelectPair}
          />

          {/* ── Main Grid: Chart + Trade Panel ── */}
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_380px]">
            {/* Chart Column */}
            <div className="flex flex-col gap-3 min-w-0">
              {/* Chart Container */}
              <ChartContainer
                toolbar={
                  <TimeframeSelector
                    active="1h"
                    onChange={(tf) => {}}
                  />
                }
              >
                <TradingChartInner
                  symbol={activePair?.symbol ?? 'BTCUSDT'}
                  pairClass={activePairClass}
                />
              </ChartContainer>
            </div>

            {/* Trade Panel Column */}
            <div className="flex flex-col gap-3">
              {/* Asset Header */}
              <AssetHeader
                pair={activePair}
                pairClass={activePairClass}
                price={livePrice}
                change24h={wsTicker?.change24h ?? null}
                high24h={wsTicker?.high24h ?? null}
                low24h={wsTicker?.low24h ?? null}
              />

              {/* Trade Panel */}
              <TradingPanel
                pair={activePair}
                pairClass={activePairClass}
                config={config}
                livePrice={livePrice}
                balances={balances as Record<Currency, number>}
              />
            </div>
          </div>

          {/* ── Active Trades ── */}
          {pendingTrades.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {pendingTrades.map((t) => (
                <ActiveTradeCard key={t._id} trade={t} />
              ))}
            </div>
          )}

          {/* ── Trade History ── */}
          <YourTradesTable
            activeTrades={pendingTrades}
            historyTrades={historyTrades}
            historyTotal={historyTotal}
            historyOffset={historyOffset}
            onLoadMore={() => setHistoryOffset((o) => o + 20)}
            isLoading={historyLoading}
          />
        </div>

        <TradeResultModal trade={resultModalTrade} onClose={handleCloseResult} />
      </AuthenticatedShell>
    </>
  );
}

// Inner chart component (lazy-loaded lightweight-charts)
function TradingChartInner({ symbol, pairClass }: { symbol: string; pairClass: PairClass }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('1h');

  const { data: candlesData, isLoading, error, refetch } = useMarketCandles(symbol, timeframe, pairClass);
  const wsPrice = useStore((s) => s.prices[symbol]);

  const CHART_HEIGHT = 480;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    import('lightweight-charts').then(({ createChart, ColorType }) => {
      const chart = createChart(container, {
        width: container.clientWidth,
        height: CHART_HEIGHT,
        layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: 'var(--text-secondary)' },
        grid: { vertLines: { color: 'var(--chart-grid)' }, horzLines: { color: 'var(--chart-grid)' } },
        timeScale: { borderColor: 'var(--border)', timeVisible: true },
        rightPriceScale: { borderColor: 'var(--border)' },
        crosshair: { mode: 0 },
      });

      const series = chart.addCandlestickSeries({
        upColor: 'var(--chart-up)', downColor: 'var(--chart-down)',
        borderUpColor: 'var(--chart-up)', borderDownColor: 'var(--chart-down)',
        wickUpColor: 'var(--chart-up)', wickDownColor: 'var(--chart-down)',
      });

      chartRef.current = chart;
      seriesRef.current = series;

      const ro = new ResizeObserver(() => chart.applyOptions({ width: container.clientWidth }));
      ro.observe(container);

      return () => { ro.disconnect(); chart.remove(); };
    });
  }, [symbol, pairClass, timeframe]);

  useEffect(() => {
    if (!seriesRef.current || !candlesData?.length) return;
    seriesRef.current.setData(candlesData.map((c: any) => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close })));
    chartRef.current?.timeScale().fitContent();
  }, [candlesData]);

  useEffect(() => {
    if (!wsPrice || !seriesRef.current || !candlesData?.length) return;
    const last = candlesData[candlesData.length - 1];
    seriesRef.current.update({ time: last.time, close: wsPrice, high: Math.max(last.high, wsPrice), low: Math.min(last.low, wsPrice) });
  }, [wsPrice]);

  return <div ref={containerRef} style={{ width: '100%', height: CHART_HEIGHT }} />;
}

export default withAuth(TradePage);