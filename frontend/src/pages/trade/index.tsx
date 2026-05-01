// pages/trade/index.tsx
// ── TRADING PAGE ──

import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import { withAuth } from '@/components/layout/withAuth';
import { useTradingConfig } from '@/hooks/useTradingConfig';
import { useTradePairs } from '@/hooks/useTradePairs';
import { useUserBalances } from '@/hooks/useUserBalances';
import { useActiveTrades } from '@/hooks/useActiveTrades';
import { useTradeHistory } from '@/hooks/useTradeHistory';
import { PairSelectorHeader } from '@/components/trade/PairSelectorHeader';
import { PairsBar } from '@/components/trade/PairsBar';
import { TradingChart } from '@/components/trade/TradingChart';
import { TradingPanel } from '@/components/trade/TradingPanel';
import { ActiveTradeCard } from '@/components/trade/ActiveTradeCard';
import { YourTradesTable } from '@/components/trade/YourTradesTable';
import { TradeResultModal } from '@/components/trade/TradeResultModal';
import type {
  PairClass,
  TradingPair,
  Trade,
} from '@/types/trade';
import type { Currency } from '@/types/convert';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'PrimeBitTrade Clone';

interface MarketRow {
  symbol: string;
  price: number;
  change24h?: number;
  high24h?: number;
  low24h?: number;
}

function TradePage(): JSX.Element {
  const router = useRouter();
  const symbolParam = (router.query.symbol as string) || 'BTCUSDT';

  const { config } = useTradingConfig();
  const { pairs } = useTradePairs();
  const { balances } = useUserBalances();
  const {
    trades: activeTrades,
    recentlyResolved,
    clearResolved,
  } = useActiveTrades();

  const [historyOffset, setHistoryOffset] = useState(0);
  const {
    trades: historyTrades,
    total: historyTotal,
    isLoading: historyLoading,
  } = useTradeHistory(20, historyOffset);

  const [activePair, setActivePair] = useState<TradingPair | null>(null);
  const [activePairClass, setActivePairClass] = useState<PairClass>('crypto');
  const [resultModalTrade, setResultModalTrade] = useState<Trade | null>(null);

  // Resolve symbol from pairs
  useEffect(() => {
    const found =
      pairs.crypto.find((p) => p.symbol === symbolParam) ??
      pairs.forex.find((p) => p.symbol === symbolParam) ??
      pairs.metals.find((p) => p.symbol === symbolParam) ??
      pairs.crypto[0] ??
      null;
    if (found) {
      setActivePair(found);
      setActivePairClass(
        pairs.crypto.includes(found)
          ? 'crypto'
          : pairs.forex.includes(found)
          ? 'forex'
          : 'metals'
      );
    }
  }, [symbolParam, pairs]);

  // Live price polling
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [change24h, setChange24h] = useState<number | null>(null);
  const [high24h, setHigh24h] = useState<number | null>(null);
  const [low24h, setLow24h] = useState<number | null>(null);

  const priceQuery = useQuery<MarketRow | null>({
    queryKey: ['markets', 'price', activePair?.symbol],
    queryFn: async () => {
      if (!activePair) return null;
      const { data } = await apiClient.get('/markets/list');
      const rows = data.rows as MarketRow[];
      const match = rows?.find(
        (r) => r.symbol === activePair?.symbol || r.symbol === activePair?.base
      );
      return match ?? null;
    },
    refetchInterval: 3000,
    enabled: !!activePair,
  });

  useEffect(() => {
    const d = priceQuery.data;
    setLivePrice(d?.price ?? null);
    setChange24h(d?.change24h ?? null);
    setHigh24h(d?.high24h ?? null);
    setLow24h(d?.low24h ?? null);
  }, [priceQuery.data]);

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
        { shallow: true, scroll: false }
      );
    },
    [router]
  );

  const handleCloseResult = useCallback(() => {
    setResultModalTrade(null);
    clearResolved();
  }, [clearResolved]);

  const pendingTrades = useMemo(
    () => activeTrades.filter((t) => t.status === 'pending'),
    [activeTrades]
  );

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

        <TradeResultModal
          trade={resultModalTrade}
          onClose={handleCloseResult}
        />
      </AuthenticatedShell>
    </>
  );
}

export default withAuth(TradePage);