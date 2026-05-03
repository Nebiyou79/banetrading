// components/trade/PlanSelector.tsx
// ── PLAN SELECTOR — Professional plan cards ──

import type { TradingPlan, PlanKey } from '@/types/trade';
import type { Currency } from '@/types/convert';

interface PlanSelectorProps {
  plans: TradingPlan[];
  selectedKey: PlanKey | null;
  onSelect: (key: PlanKey) => void;
  tradingAsset: Currency;
  assetUsdPrice: number | null;
}

function formatAssetMin(min: number, asset: Currency): string {
  if (asset === 'USDT') return min.toFixed(2);
  if (min < 0.0001) return min.toFixed(8);
  if (min < 1) return min.toFixed(6);
  return min.toFixed(4);
}

export function PlanSelector({
  plans,
  selectedKey,
  onSelect,
  tradingAsset,
  assetUsdPrice,
}: PlanSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
        Select Plan
      </span>
      <div className="grid grid-cols-1 gap-2">
        {plans.map((plan) => {
          const isActive = plan.key === selectedKey;
          const minInAsset = assetUsdPrice && assetUsdPrice > 0
            ? plan.minUsd / assetUsdPrice
            : null;

          return (
            <button
              key={plan.key}
              type="button"
              onClick={() => onSelect(plan.key)}
              className={`w-full text-left rounded-lg border p-3 transition-all duration-150 ${
                isActive
                  ? 'border-[var(--accent)] bg-[var(--accent-muted)] ring-1 ring-[var(--accent)]/30'
                  : 'border-[var(--border)] bg-[var(--bg-muted)] hover:border-[var(--border-strong)] hover:bg-[var(--hover-bg)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wide">
                    {plan.key}
                  </span>
                  <span className="ml-2 text-xs text-[var(--text-secondary)]">
                    {plan.durationSec}s
                  </span>
                </div>
                <span className="inline-flex items-center rounded-full bg-[var(--success-muted)] px-2 py-0.5 text-xs font-bold text-[var(--success)]">
                  +{(plan.multiplier * 100).toFixed(0)}%
                </span>
              </div>
              {minInAsset !== null && (
                <p className="mt-1.5 text-xs text-[var(--text-secondary)]">
                  Min:{' '}
                  <span className="tabular font-medium text-[var(--text-primary)]">
                    {formatAssetMin(minInAsset, tradingAsset)} {tradingAsset}
                  </span>
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}