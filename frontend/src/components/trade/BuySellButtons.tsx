// components/trade/BuySellButtons.tsx
// ── BUY / SELL BUTTONS ──
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
    <div className="grid grid-cols-2 gap-3 max-sm:flex max-sm:flex-col">
      <button
        type="button"
        onClick={onBuy}
        disabled={disabled || isLoading}
        className="rounded-xl bg-[var(--success)] py-3.5 text-base font-bold text-white transition-all duration-150 active:scale-[0.98] hover:brightness-110 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed"
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
        className="rounded-xl bg-[var(--danger)] py-3.5 text-base font-bold text-white transition-all duration-150 active:scale-[0.98] hover:brightness-110 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed"
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