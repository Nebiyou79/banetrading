// pages/history/index.tsx
// ── HISTORY PAGE ──

import { useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import { withAuth } from '@/components/layout/withAuth';
import { useResponsive } from '@/hooks/useResponsive';
import { useHistory } from '@/hooks/useHistory';
import HistoryTabs from '@/components/history/HistoryTabs';
import HistoryFilters from '@/components/history/HistoryFilters';
import HistoryEmptyState from '@/components/history/HistoryEmptyState';
import TradesHistoryTable from '@/components/history/TradesHistoryTable';
import DepositsHistoryTable from '@/components/history/DepositsHistoryTable';
import WithdrawalsHistoryTable from '@/components/history/WithdrawalsHistoryTable';
import ConversionsHistoryTable from '@/components/history/ConversionsHistoryTable';
import type { HistoryItemType } from '@/types/history';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'PrimeBitTrade Clone';

function HistoryPage(): JSX.Element {
  const router = useRouter();
  const { isMobile } = useResponsive();

  const [tab, setTab] = useState<HistoryItemType>(
    (router.query.tab as HistoryItemType) || 'trade',
  );
  const [status, setStatus] = useState((router.query.status as string) || '');
  const [from, setFrom] = useState((router.query.from as string) || '');
  const [to, setTo] = useState((router.query.to as string) || '');

  const { items, isLoading, hasMore, loadMore, isLoadingMore, error, refetch } = useHistory({
    type: tab,
    status: status || undefined,
    from: from || undefined,
    to: to || undefined,
  });

  const handleTabChange = useCallback((newTab: HistoryItemType) => {
    setTab(newTab);
    router.push({ query: { tab: newTab } }, undefined, { shallow: true });
  }, [router]);

  const handleReset = () => {
    setStatus('');
    setFrom('');
    setTo('');
    router.push({ query: { tab } }, undefined, { shallow: true });
  };

  const renderTable = () => {
    switch (tab) {
      case 'trade':
        return <TradesHistoryTable items={items as any} isLoading={isLoading} />;
      case 'deposit':
        return <DepositsHistoryTable items={items as any} isLoading={isLoading} />;
      case 'withdrawal':
        return <WithdrawalsHistoryTable items={items as any} isLoading={isLoading} />;
      case 'conversion':
        return <ConversionsHistoryTable items={items as any} isLoading={isLoading} />;
      default:
        return null;
    }
  };

  return (
    <>
      <Head><title>History · {BRAND}</title></Head>
      <AuthenticatedShell>
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">History</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">View all your past transactions</p>
          </div>

          <HistoryFilters
            type={tab}
            status={status}
            from={from}
            to={to}
            onStatusChange={setStatus}
            onFromChange={setFrom}
            onToChange={setTo}
            onReset={handleReset}
          />

          <HistoryTabs active={tab} onChange={handleTabChange} />

          {error && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-8 text-center">
              <p className="text-sm text-[var(--text-muted)] mb-3">{error}</p>
              <button onClick={() => refetch()} className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] text-[var(--text-inverse)]">
                Retry
              </button>
            </div>
          )}

          {!isLoading && items.length === 0 ? (
            <HistoryEmptyState type={tab} />
          ) : (
            <>
              {renderTable()}
              {hasMore && (
                <div className="flex justify-center">
                  <button
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="px-6 py-3 rounded-xl text-sm font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] transition-colors duration-150 disabled:opacity-50"
                  >
                    {isLoadingMore ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </AuthenticatedShell>
    </>
  );
}

export default withAuth(HistoryPage);