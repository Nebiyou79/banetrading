// components/dashboard/BalanceBreakdown.tsx
// ── Horizontal stacked bar showing portfolio allocation per currency ──

import { useMemo } from 'react';
import { PieChart } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatUsd } from '@/lib/format';
import type { BalanceEntry, Portfolio } from '@/types/profile';

export interface BalanceBreakdownProps {
  portfolio: Portfolio | null;
  isLoading: boolean;
}

// Deterministic palette mapping currencies to theme tokens
const PALETTE: string[] = [
  'var(--accent)',
  'var(--info)',
  'var(--success)',
  'var(--warning)',
  'var(--danger)',
  'var(--text-muted)',
];

function colorForIndex(i: number): string {
  return PALETTE[i % PALETTE.length];
}

export function BalanceBreakdown({ portfolio, isLoading }: BalanceBreakdownProps): JSX.Element {
  const rows: Array<BalanceEntry & { color: string }> = useMemo(() => {
    const balances = portfolio?.balances ?? [];
    return balances
      .slice()
      .sort((a, b) => b.usdValue - a.usdValue)
      .map((b, i) => ({ ...b, color: colorForIndex(i) }));
  }, [portfolio]);

  const isEmpty = !isLoading && rows.length === 0;
  const total = portfolio?.totalBalanceUsd ?? 0;
  const onlyOne = rows.length === 1;

  return (
    <div className="rounded-card border border-border bg-elevated p-5 shadow-card transition-colors hover:border-accent/40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PieChart className="h-4 w-4 text-text-muted" />
          <div>
            <div className="text-[11px] uppercase tracking-wider text-text-muted">Allocation</div>
            <h3 className="mt-0.5 text-sm font-semibold text-text-primary">Balance breakdown</h3>
          </div>
        </div>
        <div className="text-xs tabular-nums text-text-muted">Total: <span className="text-text-primary">{formatUsd(total)}</span></div>
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-3 w-full rounded-full" />
          <Skeleton className="h-5 w-40" />
        </div>
      ) : isEmpty ? (
        <div className="mt-4 rounded-input border border-dashed border-border bg-muted/40 p-5 text-center text-xs text-text-muted">
          No balances yet. Deposit funds to see your allocation here.
        </div>
      ) : (
        <>
          <div
            className="mt-4 flex h-3 w-full overflow-hidden rounded-full border border-border bg-muted"
            role="img"
            aria-label="Portfolio allocation"
          >
            {rows.map((row) => (
              <div
                key={row.currency}
                style={{
                  width: `${Math.max(row.pct, 1)}%`,
                  backgroundColor: row.color,
                }}
                title={`${row.currency} · ${row.pct.toFixed(1)}%`}
                className="h-full transition-[width] duration-300"
              />
            ))}
          </div>

          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {rows.map((row) => (
              <li
                key={row.currency}
                className="flex items-center justify-between rounded-input border border-border bg-muted px-3 py-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: row.color }}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium text-text-primary">{row.currency}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs tabular-nums text-text-secondary">{formatUsd(row.usdValue)}</span>
                  <span className="text-[11px] tabular-nums text-text-muted">{row.pct.toFixed(1)}%</span>
                </div>
              </li>
            ))}
          </ul>

          {onlyOne && (
            <p className="mt-3 text-[11px] text-text-muted">
              Deposit another asset to diversify your portfolio.
            </p>
          )}
        </>
      )}
    </div>
  );
}