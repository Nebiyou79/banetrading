// pages/history.tsx
// ── Transaction history — filter chips + RecentTransactions ──

import { useMemo, useState } from 'react';
import Head from 'next/head';
import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import { withAuth } from '@/components/layout/withAuth';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { useRecentTransactions } from '@/hooks/useRecentTransactions';
import { cn } from '@/lib/cn';
import type { TransactionType } from '@/types/profile';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'PrimeBitTrade';

type Filter = 'all' | 'deposit' | 'withdrawal' | 'trade';

const CHIPS: Array<{ id: Filter; label: string }> = [
  { id: 'all',         label: 'All'         },
  { id: 'deposit',     label: 'Deposits'    },
  { id: 'withdrawal',  label: 'Withdrawals' },
  { id: 'trade',       label: 'Trades'      },
];

function HistoryPage(): JSX.Element {
  const { transactions, isLoading } = useRecentTransactions(50);
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return transactions;
    return transactions.filter((t) => t.type === (filter as TransactionType));
  }, [transactions, filter]);

  return (
    <>
      <Head><title>History · {BRAND}</title></Head>
      <AuthenticatedShell>
        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-1.5">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-text-primary">
              History
            </h1>
            <p className="text-sm text-text-secondary">Your most recent 50 deposits, withdrawals, and trades.</p>
          </header>

          {/* ── Filter chips ── */}
          <div className="flex flex-wrap items-center gap-2">
            {CHIPS.map((chip) => {
              const active = filter === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setFilter(chip.id)}
                  aria-pressed={active}
                  className={cn(
                    'inline-flex items-center rounded-full border h-9 px-4 text-xs font-medium transition-colors',
                    active
                      ? 'bg-accent text-text-inverse border-accent'
                      : 'bg-muted text-text-secondary border-border hover:text-text-primary hover:border-border-strong',
                  )}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          <RecentTransactions transactions={filtered} isLoading={isLoading} limit={50} />
        </div>
      </AuthenticatedShell>
    </>
  );
}

export default withAuth(HistoryPage);