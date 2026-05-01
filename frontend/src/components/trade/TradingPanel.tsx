// components/trade/TradingPanel.tsx
// ── TRADING PANEL ──
import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import type { Currency } from '@/types/convert';
import type {
  PairClass,
  PlanKey,
  TradeDirection,
  TradingConfigResponse,
  TradingPair,
} from '@/types/trade';
import { usePlaceTrade } from '@/hooks/usePlaceTrade';
import { TradingAssetSelector } from './TradingAssetSelector';
import { PlanSelector } from './PlanSelector';
import { AmountInput } from './AmountInput';
import { BuySellButtons } from './BuySellButtons';
import { ConfirmTradeModal } from './ConfirmTradeModal';

interface TradingPanelProps {
  pair: TradingPair | null;
  pairClass: PairClass;
  config: TradingConfigResponse | null;
  livePrice: number | null;
  balances: Record<Currency, number>;
}

interface MarketRow {
  symbol: string;
  price: number;
  change24h?: number;
}

export function TradingPanel({
  pair,
  config,
  livePrice,
  balances,
}: TradingPanelProps) {
  const [tradingAsset, setTradingAsset] = useState<Currency>('USDT');
  const [selectedPlanKey, setSelectedPlanKey] = useState<PlanKey | null>(null);
  const [stakeStr, setStakeStr] = useState('');
  const [pendingDirection, setPendingDirection] = useState<TradeDirection | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { mutate: placeTrade, isPending: isPlacing, error: placeError } = usePlaceTrade();

  // Fetch asset USD price for min conversion
  const assetUsdPriceQuery = useQuery<number | null>({
    queryKey: ['markets', 'assetPrice', tradingAsset],
    queryFn: async () => {
      if (tradingAsset === 'USDT') return 1;
      const { data } = await apiClient.get('/markets/list');
      const row = (data.rows as MarketRow[])?.find(
        (r) => r.symbol === tradingAsset
      );
      return row?.price ?? null;
    },
    staleTime: 15_000,
  });
  const assetUsdPrice = assetUsdPriceQuery.data ?? null;

  // Computed
  const selectedPlan = config?.plans.find((p) => p.key === selectedPlanKey) ?? null;
  const minInAsset =
    selectedPlan && assetUsdPrice && assetUsdPrice > 0
      ? selectedPlan.minUsd / assetUsdPrice
      : null;

  const stakeNum = Number(stakeStr);
  const available = balances[tradingAsset] ?? 0;
  const isValid = useMemo(() => {
    if (!pair) return false;
    if (!selectedPlan) return false;
    if (!Number.isFinite(stakeNum) || stakeNum <= 0) return false;
    if (stakeNum > available) return false;
    if (minInAsset !== null && stakeNum < minInAsset) return false;
    return true;
  }, [pair, selectedPlan, stakeNum, available, minInAsset]);

  const handleDirection = useCallback(
    (dir: TradeDirection) => {
      setPendingDirection(dir);
      setConfirmOpen(true);
    },
    []
  );

  const handleConfirm = useCallback(() => {
    if (!pair || !pendingDirection || !selectedPlanKey) return;
    placeTrade(
      {
        pair: pair.symbol,
        direction: pendingDirection,
        planKey: selectedPlanKey,
        tradingAsset,
        stake: stakeNum,
      },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          setPendingDirection(null);
          setStakeStr('');
        },
      }
    );
  }, [
    pair,
    pendingDirection,
    selectedPlanKey,
    tradingAsset,
    stakeNum,
    placeTrade,
  ]);

  const handleClose = useCallback(() => {
    setConfirmOpen(false);
    setPendingDirection(null);
  }, []);

  return (
    <>
      <div className="flex flex-col gap-5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 sm:p-5">
        {/* Trading Asset */}
        <div>
          <TradingAssetSelector
            value={tradingAsset}
            onChange={setTradingAsset}
            balances={balances}
          />
        </div>

        <hr className="border-[var(--border-subtle)]" />

        {/* Plan */}
        <PlanSelector
          plans={config?.plans ?? []}
          selectedKey={selectedPlanKey}
          onSelect={setSelectedPlanKey}
          tradingAsset={tradingAsset}
          assetUsdPrice={assetUsdPrice}
        />

        <hr className="border-[var(--border-subtle)]" />

        {/* Amount */}
        <AmountInput
          value={stakeStr}
          onChange={setStakeStr}
          tradingAsset={tradingAsset}
          available={available}
          minInAsset={minInAsset}
        />

        <hr className="border-[var(--border-subtle)]" />

        {/* Buttons */}
        <BuySellButtons
          baseCoin={pair?.base ?? '—'}
          disabled={!isValid}
          isLoading={isPlacing}
          onBuy={() => handleDirection('buy')}
          onSell={() => handleDirection('sell')}
        />
      </div>

      <ConfirmTradeModal
        open={confirmOpen}
        onClose={handleClose}
        pair={pair}
        direction={pendingDirection ?? 'buy'}
        plan={selectedPlan}
        tradingAsset={tradingAsset}
        stake={stakeNum}
        entryPrice={livePrice}
        feeBps={config?.feeBps ?? 200}
        isLoading={isPlacing}
        error={placeError ? (placeError instanceof Error ? placeError.message : 'Trade failed') : null}
        onConfirm={handleConfirm}
      />
    </>
  );
}