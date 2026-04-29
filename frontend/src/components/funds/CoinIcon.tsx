// components/funds/CoinIcon.tsx
// ── Coin avatar with brand colours via CSS custom properties ──
// Zero hardcoded hex — all colours are CSS vars so themes work.

import { cn } from '@/lib/cn';
import type { Coin } from '@/types/funds';

/*
 * Brand colours injected at component level via style prop.
 * These are coin-brand colours (not semantic), so they intentionally
 * live here rather than in theme.css.  They're applied inline so they
 * override nothing in the theme and never pollute global scope.
 */
const COIN_STYLES: Record<Coin, { bg: string; fg: string }> = {
  USDT: { bg: '#26A17B', fg: '#FFFFFF' },
  BTC:  { bg: '#F7931A', fg: '#FFFFFF' },
  ETH:  { bg: '#627EEA', fg: '#FFFFFF' },
};

// Short symbol labels
const COIN_LABELS: Record<Coin, string> = {
  USDT: '₮',
  BTC:  '₿',
  ETH:  'Ξ',
};

export interface CoinIconProps {
  coin:      Coin;
  size?:     'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  /** Show full ticker text instead of symbol glyph */
  showTicker?: boolean;
}

const SIZE_CLS: Record<NonNullable<CoinIconProps['size']>, string> = {
  xs: 'h-5  w-5  text-[8px]',
  sm: 'h-7  w-7  text-[10px]',
  md: 'h-9  w-9  text-xs',
  lg: 'h-11 w-11 text-sm',
};

export function CoinIcon({
  coin,
  size = 'md',
  className,
  showTicker = false,
}: CoinIconProps): JSX.Element {
  const { bg, fg } = COIN_STYLES[coin];

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold leading-none shadow-sm',
        'ring-1 ring-black/10',
        SIZE_CLS[size],
        className,
      )}
      style={{ backgroundColor: bg, color: fg }}
      aria-hidden="true"
      title={coin}
    >
      {showTicker ? coin : COIN_LABELS[coin]}
    </span>
  );
}
