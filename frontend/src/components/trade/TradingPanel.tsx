// components/trade/TradingPanel.tsx
// ── TRADING PANEL (CANONICAL — DELETE TradePanel.tsx) ──
// Uses calcPnl for consistent P&L preview in the amount input area.

import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { calcPnl } from '@/lib/tradePnl';
import type { Currency } from '@/types/convert';
import type {
  PairClass, PlanKey, TradeDirection,
  TradingConfigResponse, TradingPair,
} from '@/types/trade';
import { usePlaceTrade } from '@/hooks/usePlaceTrade';
import { TradingAssetSelector } from './TradingAssetSelector';
import { PlanSelector } from './PlanSelector';
import { AmountInput } from './AmountInput';
import { BuySellButtons } from './BuySellButtons';
import { ConfirmTradeModal } from './ConfirmTradeModal';

interface TradingPanelProps {
  pair:      TradingPair | null;
  pairClass: PairClass;
  config:    TradingConfigResponse | null;
  livePrice: number | null;
  balances:  Record<Currency, number>;
}

interface MarketRow { symbol: string; price: number; }

export function TradingPanel({ pair, config, livePrice, balances }: TradingPanelProps) {
  const [tradingAsset,     setTradingAsset]     = useState<Currency>('USDT');
  const [selectedPlanKey,  setSelectedPlanKey]  = useState<PlanKey | null>(null);
  const [stakeStr,         setStakeStr]         = useState('');
  const [pendingDirection, setPendingDirection] = useState<TradeDirection | null>(null);
  const [confirmOpen,      setConfirmOpen]      = useState(false);

  const { mutate: placeTrade, isPending: isPlacing, error: placeError } = usePlaceTrade();

  const assetUsdPriceQuery = useQuery<number | null>({
    queryKey: ['markets', 'assetPrice', tradingAsset],
    queryFn: async () => {
      if (tradingAsset === 'USDT') return 1;
      const { data } = await apiClient.get('/markets/list');
      const row = (data.rows as MarketRow[])?.find(r => r.symbol === tradingAsset);
      return row?.price ?? null;
    },
    staleTime: 15_000,
  });
  const assetUsdPrice = assetUsdPriceQuery.data ?? null;

  const selectedPlan = config?.plans.find(p => p.key === selectedPlanKey) ?? null;
  const minInAsset   = selectedPlan && assetUsdPrice && assetUsdPrice > 0
    ? selectedPlan.minUsd / assetUsdPrice : null;

  const stakeNum  = Number(stakeStr);
  const available = balances[tradingAsset] ?? 0;
  const feeBps    = config?.feeBps ?? 200;

  const isValid = useMemo(() => {
    if (!pair || !selectedPlan) return false;
    if (!Number.isFinite(stakeNum) || stakeNum <= 0) return false;
    if (stakeNum > available) return false;
    if (minInAsset !== null && stakeNum < minInAsset) return false;
    return true;
  }, [pair, selectedPlan, stakeNum, available, minInAsset]);

  // Live P&L preview shown below the amount input
  const pnlPreview = selectedPlan && stakeNum > 0
    ? calcPnl(stakeNum, selectedPlan.multiplier, feeBps)
    : null;

  const handleDirection = useCallback((dir: TradeDirection) => {
    setPendingDirection(dir);
    setConfirmOpen(true);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!pair || !pendingDirection || !selectedPlanKey) return;
    placeTrade(
      { pair: pair.symbol, direction: pendingDirection, planKey: selectedPlanKey, tradingAsset, stake: stakeNum },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          setPendingDirection(null);
          setStakeStr('');
        },
      }
    );
  }, [pair, pendingDirection, selectedPlanKey, tradingAsset, stakeNum, placeTrade]);

  const handleClose = useCallback(() => {
    setConfirmOpen(false);
    setPendingDirection(null);
  }, []);

  return (
    <>
      <div className="flex flex-col gap-5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 sm:p-5">
        <TradingAssetSelector value={tradingAsset} onChange={setTradingAsset} balances={balances} />

        <hr className="border-[var(--border-subtle)]" />

        <PlanSelector
          plans={config?.plans ?? []}
          selectedKey={selectedPlanKey}
          onSelect={setSelectedPlanKey}
          tradingAsset={tradingAsset}
          assetUsdPrice={assetUsdPrice}
        />

        <hr className="border-[var(--border-subtle)]" />

        <AmountInput
          value={stakeStr}
          onChange={setStakeStr}
          tradingAsset={tradingAsset}
          available={available}
          minInAsset={minInAsset}
        />

        {/* Live P&L preview */}
        {pnlPreview && (
          <div className="grid grid-cols-2 gap-2 -mt-2">
            <div className="rounded-lg bg-[var(--success-muted)] px-3 py-2 text-center">
              <p className="text-[10px] text-[var(--text-muted)] mb-0.5">If Won</p>
              <p className="tabular text-sm font-bold text-[var(--success)]">
                +{pnlPreview.netGain.toFixed(2)} {tradingAsset}
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">
                {pnlPreview.winCredited.toFixed(2)} back
              </p>
            </div>
            <div className="rounded-lg bg-[var(--danger-muted)] px-3 py-2 text-center">
              <p className="text-[10px] text-[var(--text-muted)] mb-0.5">If Lost</p>
              <p className="tabular text-sm font-bold text-[var(--danger)]">
                -{pnlPreview.totalLoss.toFixed(2)} {tradingAsset}
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">
                {pnlPreview.lossCredited.toFixed(2)} back
              </p>
            </div>
          </div>
        )}

        <hr className="border-[var(--border-subtle)]" />

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
        feeBps={feeBps}
        isLoading={isPlacing}
        error={placeError ? (placeError instanceof Error ? placeError.message : 'Trade failed') : null}
        onConfirm={handleConfirm}
      />
    </>
  );
}