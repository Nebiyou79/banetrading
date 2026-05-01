// components/trade/PlanSelector.tsx
// ── PLAN SELECTOR ──
// Stack of PlanCard components. Mobile: stacked column. Desktop: still column
// inside a ~360px panel — the right column is narrow enough that vertical is
// best for legibility. The plan list updates min displays as the asset changes.

import type { TradingPlan, PlanKey } from '@/types/trade';
import type { Currency } from '@/types/convert';
import { PlanCard } from './PlanCard';

interface PlanSelectorProps {
  plans: TradingPlan[];
  selectedKey: PlanKey | null;
  onSelect: (key: PlanKey) => void;
  tradingAsset: Currency;
  assetUsdPrice: number | null;
}

export function PlanSelector({
  plans,
  selectedKey,
  onSelect,
  tradingAsset,
  assetUsdPrice,
}: PlanSelectorProps): JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
        Plan
      </span>
      <div className="flex flex-col gap-2">
        {plans.length === 0 && (
          <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-muted)] p-3 text-xs text-[var(--text-muted)] text-center">
            No plans available.
          </div>
        )}
        {plans.map((plan) => (
          <PlanCard
            key={plan.key}
            plan={plan}
            active={plan.key === selectedKey}
            onSelect={() => onSelect(plan.key)}
            tradingAsset={tradingAsset}
            assetUsdPrice={assetUsdPrice}
          />
        ))}
      </div>
    </div>
  );
}