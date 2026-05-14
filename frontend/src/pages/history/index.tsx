// pages/history/index.tsx
// ── HISTORY PAGE ──

import { useState, useCallback, useMemo } from 'react';
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

  // FIX: Always fetch 'all' types, then filter client-side
  const { items, isLoading, hasMore, loadMore, isLoadingMore, error, refetch } = useHistory({
    type: 'all', // Changed from tab to 'all'
    status: status || undefined,
    from: from || undefined,
    to: to || undefined,
  });

  // FIX: Filter items client-side based on active tab
  const filteredItems = useMemo(() => {
    if (tab === 'all') {
      return items;
    }
    return items.filter(item => item.type === tab);
  }, [items, tab]);

  // Debug logs
  console.log('Tab:', tab);
  console.log('Total items:', items.length);
  console.log('Filtered items:', filteredItems.length);
  console.log('Items by type:', {
    trade: items.filter(i => i.type === 'trade').length,
    deposit: items.filter(i => i.type === 'deposit').length,
    withdrawal: items.filter(i => i.type === 'withdrawal').length,
    conversion: items.filter(i => i.type === 'conversion').length,
  });

  const handleTabChange = useCallback((newTab: HistoryItemType) => {
    setTab(newTab);
    // Only update URL, don't re-fetch
    router.push({ query: { tab: newTab, status, from, to } }, undefined, { shallow: true });
  }, [router, status, from, to]);

  const handleReset = () => {
    setStatus('');
    setFrom('');
    setTo('');
    router.push({ query: { tab } }, undefined, { shallow: true });
  };

  const renderTable = () => {
    // Use filteredItems instead of items
    if (filteredItems.length === 0) {
      return <HistoryEmptyState type={tab} />;
    }

    switch (tab) {
      case 'trade':
        return <TradesHistoryTable items={filteredItems as any} isLoading={isLoading} />;
      case 'deposit':
        return <DepositsHistoryTable items={filteredItems as any} isLoading={isLoading} />;
      case 'withdrawal':
        return <WithdrawalsHistoryTable items={filteredItems as any} isLoading={isLoading} />;
      case 'conversion':
        return <ConversionsHistoryTable items={filteredItems as any} isLoading={isLoading} />;
      default:
        return <HistoryEmptyState type="all" />;
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

          {!isLoading && filteredItems.length === 0 ? (
            <HistoryEmptyState type={tab} />
          ) : (
            <>
              {renderTable()}
              {hasMore && tab === 'all' && (
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