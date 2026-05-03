// components/trade/TradePanel.tsx
// ── TRADE PANEL — Unified trading interface ──

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
}

export function TradingPanel({
  pair,
  config,
  livePrice,
  balances,
}: TradingPanelProps) {
  const [tradingAsset] = useState<Currency>('USDT');
  const [selectedPlanKey, setSelectedPlanKey] = useState<PlanKey | null>(null);
  const [stakeStr, setStakeStr] = useState('');
  const [direction, setDirection] = useState<TradeDirection | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { mutate: placeTrade, isPending: isPlacing, error: placeError } = usePlaceTrade();

  // Asset USD price for min calculation
  const { data: assetUsdPrice } = useQuery<number | null>({
    queryKey: ['markets', 'assetPrice', tradingAsset],
    queryFn: async () => {
      if (tradingAsset === 'USDT') return 1;
      const { data } = await apiClient.get('/markets/list');
      const row = (data.rows as MarketRow[])?.find((r) => r.symbol === tradingAsset);
      return row?.price ?? null;
    },
    staleTime: 30_000,
  });

  const selectedPlan = config?.plans.find((p) => p.key === selectedPlanKey) ?? null;
  const minInAsset = selectedPlan && assetUsdPrice && assetUsdPrice > 0
    ? selectedPlan.minUsd / assetUsdPrice
    : null;

  const stakeNum = Number(stakeStr);
  const available = balances[tradingAsset] ?? 0;

  const isValid = useMemo(() => {
    if (!pair || !selectedPlan) return false;
    if (!Number.isFinite(stakeNum) || stakeNum <= 0) return false;
    if (stakeNum > available) return false;
    if (minInAsset !== null && stakeNum < minInAsset) return false;
    return true;
  }, [pair, selectedPlan, stakeNum, available, minInAsset]);

  const handleBuy = useCallback(() => {
    setDirection('buy');
    setConfirmOpen(true);
  }, []);

  const handleSell = useCallback(() => {
    setDirection('sell');
    setConfirmOpen(true);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!pair || !direction || !selectedPlanKey) return;
    placeTrade(
      { pair: pair.symbol, direction, planKey: selectedPlanKey, tradingAsset, stake: stakeNum },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          setDirection(null);
          setStakeStr('');
        },
      }
    );
  }, [pair, direction, selectedPlanKey, tradingAsset, stakeNum, placeTrade]);

  const handleClose = useCallback(() => {
    setConfirmOpen(false);
    setDirection(null);
  }, []);

  return (
    <>
      <div className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">Place Trade</h3>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-4 p-4">
          {/* Asset Selector */}
          <TradingAssetSelector
            value={tradingAsset}
            onChange={() => {}}
            balances={balances}
          />

          {/* Divider */}
          <div className="h-px bg-[var(--border)]" />

          {/* Plan Selector */}
          <PlanSelector
            plans={config?.plans ?? []}
            selectedKey={selectedPlanKey}
            onSelect={setSelectedPlanKey}
            tradingAsset={tradingAsset}
            assetUsdPrice={assetUsdPrice ?? null}
          />

          {/* Divider */}
          <div className="h-px bg-[var(--border)]" />

          {/* Amount Input */}
          <AmountInput
            value={stakeStr}
            onChange={setStakeStr}
            tradingAsset={tradingAsset}
            available={available}
            minInAsset={minInAsset}
          />
        </div>

        {/* Footer — Buy/Sell Buttons */}
        <div className="p-4 pt-0">
          <BuySellButtons
            baseCoin={pair?.base ?? '—'}
            disabled={!isValid}
            isLoading={isPlacing}
            onBuy={handleBuy}
            onSell={handleSell}
          />
        </div>
      </div>

      <ConfirmTradeModal
        open={confirmOpen}
        onClose={handleClose}
        pair={pair}
        direction={direction ?? 'buy'}
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