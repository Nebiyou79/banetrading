// components/trade/PlanCard.tsx
// ── PLAN CARD ──
// Single selectable plan tile. Shows name, multiplier pill, duration, min in
// the trading asset (computed from current asset USD price).

import type { TradingPlan } from '@/types/trade';
import type { Currency } from '@/types/convert';

interface PlanCardProps {
  plan: TradingPlan;
  active: boolean;
  onSelect: () => void;
  tradingAsset: Currency;
  assetUsdPrice: number | null;
}

function formatAssetMin(min: number, asset: Currency): string {
  if (asset === 'USDT') return min.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (min < 0.0001) return min.toFixed(8);
  if (min < 1)      return min.toFixed(6);
  return min.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

export function PlanCard({ plan, active, onSelect, tradingAsset, assetUsdPrice }: PlanCardProps): JSX.Element {
  const minInAsset = assetUsdPrice && assetUsdPrice > 0
    ? plan.minUsd / assetUsdPrice
    : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={
        'w-full text-left rounded-xl border p-3.5 transition-colors duration-150 active:scale-[0.99] ' +
        (active
          ? 'border-[var(--accent)] bg-[var(--accent-muted)]'
          : 'border-[var(--border)] bg-[var(--bg-muted)] hover:bg-[var(--hover-bg)]')
      }
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold uppercase tracking-wide text-[var(--text-primary)]">
          {plan.key}
        </span>
        <span className="inline-flex items-center rounded-full bg-[var(--success-muted)] px-2 py-0.5 text-xs font-semibold tabular text-[var(--success)]">
          {`+${(plan.multiplier * 100).toFixed(0)}%`}
        </span>
      </div>

      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="tabular text-base font-bold text-[var(--text-primary)]">
          {plan.durationSec}s
        </span>
        <span className="text-xs text-[var(--text-muted)]">duration</span>
      </div>

      <div className="mt-1.5 text-xs text-[var(--text-secondary)]">
        <span className="text-[var(--text-muted)]">Min:</span>{' '}
        {minInAsset === null
          ? <span className="tabular text-[var(--text-muted)]">…</span>
          : (
              <span className="tabular text-[var(--text-primary)]">
                {formatAssetMin(minInAsset, tradingAsset)} {tradingAsset}
              </span>
            )}
        <span className="text-[var(--text-muted)]"> (~</span>
        <span className="tabular text-[var(--text-secondary)]">{plan.minUsd.toLocaleString('en-US')}</span>
        <span className="text-[var(--text-muted)]"> USDT)</span>
      </div>
    </button>
  );
}