// components/trade/BuySellButtons.tsx
// ── BUY / SELL BUTTONS — Professional CTA styling ──

import { Loader2 } from 'lucide-react';

interface BuySellButtonsProps {
  baseCoin: string;
  disabled: boolean;
  isLoading: boolean;
  onBuy: () => void;
  onSell: () => void;
}

export function BuySellButtons({
  baseCoin,
  disabled,
  isLoading,
  onBuy,
  onSell,
}: BuySellButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={onBuy}
        disabled={disabled || isLoading}
        className="relative overflow-hidden rounded-xl bg-[var(--success)] py-3.5 text-base font-bold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:active:scale-100"
      >
        {isLoading ? (
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        ) : (
          `Buy ${baseCoin}`
        )}
      </button>
      <button
        type="button"
        onClick={onSell}
        disabled={disabled || isLoading}
        className="relative overflow-hidden rounded-xl bg-[var(--danger)] py-3.5 text-base font-bold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:active:scale-100"
      >
        {isLoading ? (
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        ) : (
          `Sell ${baseCoin}`
        )}
      </button>
    </div>
  );
}