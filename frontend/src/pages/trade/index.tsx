// pages/trade/index.tsx
// ── TRADING PAGE (FIXED — NO INFINITE LOOPS) ──

import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import { withAuth } from '@/components/layout/withAuth';
import { useTradingConfig } from '@/hooks/useTradingConfig';
import { useTradePairs } from '@/hooks/useTradePairs';
import { useUserBalances } from '@/hooks/useUserBalances';
import { useActiveTrades } from '@/hooks/useActiveTrades';
import { useTradeHistory } from '@/hooks/useTradeHistory';
import { useMarketStore } from '@/stores/market.store';
import { usePageMarketWebSocket } from '@/hooks/useMarketWebSocket';
import { PairSelectorHeader } from '@/components/trade/PairSelectorHeader';
import { PairsBar } from '@/components/trade/PairsBar';
import { TradingChart } from '@/components/trade/TradingChart';
import { TradingPanel } from '@/components/trade/TradingPanel';
import { ActiveTradeCard } from '@/components/trade/ActiveTradeCard';
import { YourTradesTable } from '@/components/trade/YourTradesTable';
import { TradeResultModal } from '@/components/trade/TradeResultModal';
import type { PairClass, TradingPair, Trade } from '@/types/trade';
import type { Currency } from '@/types/convert';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'PrimeBitTrade Clone';

function TradePage(): JSX.Element {
  const router = useRouter();
  const symbolParam = (router.query.symbol as string) || 'BTCUSDT';

  const { config } = useTradingConfig();
  const { pairs } = useTradePairs();
  const { balances } = useUserBalances();
  const { trades: activeTrades, recentlyResolved, clearResolved } = useActiveTrades();

  const [historyOffset, setHistoryOffset] = useState(0);
  const { trades: historyTrades, total: historyTotal, isLoading: historyLoading } =
    useTradeHistory(20, historyOffset);

  const [activePair, setActivePair] = useState<TradingPair | null>(null);
  const [activePairClass, setActivePairClass] = useState<PairClass>('crypto');
  const [resultModalTrade, setResultModalTrade] = useState<Trade | null>(null);

  // ── Subscribe to WebSocket for the active pair ──
  // ⚠️ FIX: Pass stable string, not an object
  usePageMarketWebSocket(activePair?.symbol ?? '');

  // ── Get live prices from Zustand store ──
  // ⚠️ FIX: Select individual values to avoid re-rendering on unrelated changes
  const livePrice = useMarketStore((s) => s.prices[activePair?.symbol ?? ''] ?? null);
  const wsTicker = useMarketStore((s) => s.tickers[activePair?.symbol ?? ''] ?? null);

  // Resolve symbol from pairs (only when pairs change, not on every render)
  useEffect(() => {
    if (!pairs) return;
    
    const found =
      pairs.crypto.find((p) => p.symbol === symbolParam) ??
      pairs.forex.find((p) => p.symbol === symbolParam) ??
      pairs.metals.find((p) => p.symbol === symbolParam) ??
      pairs.crypto[0] ??
      null;
      
    if (found) {
      setActivePair((prev) => {
        // Only update if actually different
        if (prev?.symbol === found.symbol) return prev;
        return found;
      });
      setActivePairClass(
        pairs.crypto.includes(found)
          ? 'crypto'
          : pairs.forex.includes(found)
            ? 'forex'
            : 'metals',
      );
    }
  }, [symbolParam, pairs]);

  // recentlyResolved queue
  useEffect(() => {
    if (recentlyResolved.length > 0 && resultModalTrade === null) {
      setResultModalTrade(recentlyResolved[0]);
    }
  }, [recentlyResolved, resultModalTrade]);

  const handleSelectPair = useCallback(
    (pair: TradingPair) => {
      setActivePair(pair);
      router.replace(
        { pathname: '/trade', query: { symbol: pair.symbol } },
        undefined,
        { shallow: true, scroll: false },
      );
    },
    [router],
  );

  const handleCloseResult = useCallback(() => {
    setResultModalTrade(null);
    clearResolved();
  }, [clearResolved]);

  const pendingTrades = useMemo(
    () => activeTrades.filter((t) => t.status === 'pending'),
    [activeTrades],
  );

  const change24h = wsTicker?.change24h ?? null;
  const high24h = wsTicker?.high24h ?? null;
  const low24h = wsTicker?.low24h ?? null;

  return (
    <>
      <Head>
        <title>Trade · {BRAND}</title>
      </Head>
      <AuthenticatedShell>
        <div className="space-y-4 p-4 sm:p-6">
          <PairSelectorHeader
            pair={activePair}
            pairClass={activePairClass}
            price={livePrice}
            change24h={change24h}
            high24h={high24h}
            low24h={low24h}
          />

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

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_400px]">
            <div className="flex flex-col gap-4">
              <TradingChart
                symbol={activePair?.symbol ?? 'BTCUSDT'}
                pairClass={activePairClass}
              />
            </div>
            <TradingPanel
              pair={activePair}
              pairClass={activePairClass}
              config={config}
              livePrice={livePrice}
              balances={balances as Record<Currency, number>}
            />
          </div>

          {pendingTrades.length > 0 && (
            <div className="flex flex-col gap-3">
              {pendingTrades.map((t) => (
                <ActiveTradeCard key={t._id} trade={t} />
              ))}
            </div>
          )}

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

export default withAuth(TradePage);