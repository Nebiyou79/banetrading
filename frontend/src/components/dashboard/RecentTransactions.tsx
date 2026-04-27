// components/dashboard/RecentTransactions.tsx
// ── Recent activity — table (desktop) / cards (mobile) ──

import { ArrowDownLeft, ArrowUpRight, LineChart, Inbox } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pill, PillTone } from '@/components/ui/Pill';
import { useResponsive } from '@/hooks/useResponsive';
import { formatAmount, formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { RecentTransaction, TransactionStatus, TransactionType } from '@/types/profile';

export interface RecentTransactionsProps {
  transactions: RecentTransaction[];
  isLoading: boolean;
  limit?: number;
}

const STATUS_TONE: Record<TransactionStatus, PillTone> = {
  pending:   'warning',
  approved:  'success',
  won:       'success',
  rejected:  'danger',
  lost:      'danger',
  cancelled: 'neutral',
};

function TypeIcon({ type }: { type: TransactionType }): JSX.Element {
  if (type === 'deposit') {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-success/10 text-success">
        <ArrowDownLeft className="h-4 w-4" />
      </span>
    );
  }
  if (type === 'withdrawal') {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-danger/10 text-danger">
        <ArrowUpRight className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-info/10 text-info">
      <LineChart className="h-4 w-4" />
    </span>
  );
}

function typeLabel(type: TransactionType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function RecentTransactions({ transactions, isLoading, limit = 8 }: RecentTransactionsProps): JSX.Element {
  const { isMobile } = useResponsive();
  const rows = transactions.slice(0, limit);

  return (
    <div className="rounded-card border border-border bg-elevated shadow-card h-full flex flex-col transition-colors hover:border-accent/40">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-text-muted">Recent activity</div>
          <h3 className="mt-0.5 text-sm font-semibold text-text-primary">Transactions</h3>
        </div>
        <span className="text-[11px] text-text-muted">Last {limit}</span>
      </div>

      <div className="flex-1 px-5 py-3">
        {isLoading ? (
          <div className="flex flex-col gap-3 py-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState />
        ) : isMobile ? (
          <ul className="flex flex-col divide-y divide-border">
            {rows.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <TypeIcon type={tx.type} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">{typeLabel(tx.type)}</div>
                    <div className="text-[11px] text-text-muted">{formatRelativeTime(tx.createdAt)}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={cn(
                    'text-sm font-medium tabular-nums',
                    tx.type === 'withdrawal' ? 'text-danger' : 'text-text-primary',
                  )}>
                    {tx.type === 'withdrawal' ? '−' : '+'}{formatAmount(tx.amount, tx.currency)}
                  </span>
                  <Pill tone={STATUS_TONE[tx.status]} size="xs">{tx.status}</Pill>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-text-muted">
                  <th className="py-2 pr-4 font-medium">Type</th>
                  <th className="py-2 pr-4 font-medium">Amount</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((tx) => (
                  <tr key={tx.id} className="text-text-primary">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <TypeIcon type={tx.type} />
                        <span className="text-sm font-medium">{typeLabel(tx.type)}</span>
                      </div>
                    </td>
                    <td className={cn(
                      'py-3 pr-4 tabular-nums text-sm',
                      tx.type === 'withdrawal' ? 'text-danger' : 'text-text-primary',
                    )}>
                      {tx.type === 'withdrawal' ? '−' : '+'}{formatAmount(tx.amount, tx.currency)}
                    </td>
                    <td className="py-3 pr-4">
                      <Pill tone={STATUS_TONE[tx.status]} size="xs">{tx.status}</Pill>
                    </td>
                    <td className="py-3 pr-4 text-right text-xs text-text-muted">
                      {formatRelativeTime(tx.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState(): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <div className="relative">
        <div className="h-14 w-14 rounded-full border border-dashed border-border bg-muted/60 flex items-center justify-center">
          <Inbox className="h-5 w-5 text-text-muted" />
        </div>
      </div>
      <div>
        <div className="text-sm font-medium text-text-primary">No transactions yet</div>
        <p className="mt-1 text-xs text-text-muted">Deposits, withdrawals, and trades will appear here.</p>
      </div>
    </div>
  );
}