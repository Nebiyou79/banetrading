// pages/markets/forex/index.tsx
// ── Forex & Metals Markets page ──

import { useState, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import { withAuth } from '@/components/layout/withAuth';
import { useForex } from '@/hooks/useForex';
import { useMetals } from '@/hooks/useMetals';
import { useResponsive } from '@/hooks/useResponsive';
import ForexTabSwitcher from '@/components/forexMetals/ForexTabSwitcher';
import ForexMarketsSearch from '@/components/forexMetals/ForexMarketsSearch';
import ForexMarketsTable from '@/components/forexMetals/ForexMarketsTable';
import ForexMarketsCardList from '@/components/forexMetals/ForexMarketsCardList';
import type { ForexRow } from '@/types/markets';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'PrimeBitTrade Clone';

function ForexMetalsPage(): JSX.Element {
  const router = useRouter();
  const { isMobile } = useResponsive();

  const [tab, setTab] = useState<'forex' | 'metals'>(
    (router.query.type as string) === 'metals' ? 'metals' : 'forex',
  );
  const [search, setSearch] = useState('');

  const forexData = useForex();
  const metalsData = useMetals();
  const activeData = tab === 'forex' ? forexData : metalsData;

  // ── Filter ──
  const filteredRows = useMemo(() => {
    const raw: ForexRow[] = activeData.rows;
    if (!search.trim()) return raw;
    const q = search.toLowerCase();
    return raw.filter(
      r =>
        r.symbol.toLowerCase().includes(q) ||
        r.display.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q),
    );
  }, [activeData.rows, search]);

  // ── Tab change with URL sync ──
  const handleTabChange = (newTab: 'forex' | 'metals') => {
    setTab(newTab);
    router.push(
      { pathname: '/markets/forex', query: { type: newTab } },
      undefined,
      { shallow: true },
    );
  };

  // ── Status dot ──
  const statusDot = activeData.error
    ? 'bg-[var(--danger)]'
    : activeData.stale
      ? 'bg-[var(--warning)]'
      : 'bg-[var(--success)]';

  return (
    <>
      <Head><title>Forex & Metals · {BRAND}</title></Head>
      <AuthenticatedShell>
        <div className="flex flex-col gap-6">
          {/* ── Tab switcher ── */}
          <ForexTabSwitcher active={tab} onChange={handleTabChange} />

          {/* ── Header ── */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                {tab === 'forex' ? 'Forex' : 'Metals'} Markets
              </h1>
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusDot}`}
                  title={
                    activeData.error
                      ? 'Feed error'
                      : activeData.stale
                        ? 'Stale data'
                        : 'Live'
                  }
                />
                <span className="text-xs text-[var(--text-muted)]">
                  {activeData.isLoading ? 'Loading...' : `Source: ${activeData.source}`}
                </span>
              </div>
            </div>

            {activeData.error && (
              <button
                onClick={() => activeData.refetch()}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] text-[var(--text-inverse)] hover:opacity-90 transition-opacity duration-150"
              >
                Retry
              </button>
            )}
          </div>

          {/* ── Search ── */}
          <ForexMarketsSearch value={search} onChange={setSearch} />

          {/* ── Content ── */}
          {activeData.error && !activeData.isLoading ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-12 text-center">
              <p className="text-sm text-[var(--text-muted)] mb-4">
                {activeData.error}
              </p>
              <button
                onClick={() => activeData.refetch()}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] text-[var(--text-inverse)] hover:opacity-90 transition-opacity duration-150"
              >
                Try Again
              </button>
            </div>
          ) : isMobile ? (
            <ForexMarketsCardList
              rows={filteredRows}
              isLoading={activeData.isLoading}
            />
          ) : (
            <ForexMarketsTable
              rows={filteredRows}
              isLoading={activeData.isLoading}
              assetClass={tab}
            />
          )}

          {/* ── No matches ── */}
          {!activeData.isLoading && search && filteredRows.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-[var(--text-muted)]">
                No pairs matching &ldquo;{search}&rdquo;
              </p>
            </div>
          )}
        </div>
      </AuthenticatedShell>
    </>
  );
}

export default withAuth(ForexMetalsPage);