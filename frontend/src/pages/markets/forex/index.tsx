// pages/markets/forex/index.tsx
// ── FOREX & METALS MARKETS PAGE — Professional layout ──

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
import { MarketsTable } from '@/components/markets/MarketsTable';
import { MarketsCardList } from '@/components/markets/MarketsCardList';
import type { ForexRow } from '@/types/markets';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'NebaTrade';

function ForexMetalsPage(): JSX.Element {
  const router = useRouter();
  const { isMobile } = useResponsive();

  const [tab, setTab] = useState<'forex' | 'metals'>(
    (router.query.type as string) === 'metals' ? 'metals' : 'forex'
  );
  const [search, setSearch] = useState('');

  const forexData = useForex();
  const metalsData = useMetals();
  const activeData = tab === 'forex' ? forexData : metalsData;

  // Filter
  const filteredRows = useMemo(() => {
    const raw: ForexRow[] = activeData.rows;
    if (!search.trim()) return raw;
    const q = search.toLowerCase();
    return raw.filter(
      (r) => r.symbol.toLowerCase().includes(q) || r.display.toLowerCase().includes(q) || r.name.toLowerCase().includes(q)
    );
  }, [activeData.rows, search]);

  const handleTabChange = (newTab: 'forex' | 'metals') => {
    setTab(newTab);
    router.push({ pathname: '/markets/forex', query: { type: newTab } }, undefined, { shallow: true });
  };

  const statusDot = activeData.error ? 'bg-[var(--danger)]' : activeData.stale ? 'bg-[var(--warning)]' : 'bg-[var(--success)]';

  return (
    <>
      <Head><title>Forex & Metals · {BRAND}</title></Head>
      <AuthenticatedShell>
        <div className="flex flex-col gap-4">
          {/* ── Tab Switcher ── */}
          <ForexTabSwitcher active={tab} onChange={handleTabChange} />

          {/* ── Header ── */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                {tab === 'forex' ? 'Forex' : 'Metals'} Markets
              </h1>
              <div className="flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${statusDot}`} />
                <span className="text-xs text-[var(--text-muted)]">
                  {activeData.isLoading ? 'Loading...' : `Source: ${activeData.source}`}
                </span>
              </div>
            </div>
            {activeData.error && (
              <button onClick={() => activeData.refetch()} className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] text-white hover:opacity-90 transition-opacity">
                Retry
              </button>
            )}
          </div>

          {/* ── Search ── */}
          <ForexMarketsSearch value={search} onChange={setSearch} />

          {/* ── Error ── */}
          {activeData.error && !activeData.isLoading && (
            <div className="flex flex-col items-center gap-3 py-16 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]">
              <svg className="w-12 h-12 text-[var(--text-muted)]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-[var(--text-muted)]">{activeData.error}</p>
              <button onClick={() => activeData.refetch()} className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] text-white hover:opacity-90">
                Try Again
              </button>
            </div>
          )}

          {/* ── Content ── */}
          {!activeData.error && (
            isMobile ? (
              <MarketsCardList rows={filteredRows} isLoading={activeData.isLoading} assetClass={tab} />
            ) : (
              <MarketsTable rows={filteredRows} isLoading={activeData.isLoading} assetClass={tab} />
            )
          )}

          {/* ── No matches ── */}
          {!activeData.isLoading && search && filteredRows.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-[var(--text-muted)]">No pairs matching &ldquo;{search}&rdquo;</p>
            </div>
          )}
        </div>
      </AuthenticatedShell>
    </>
  );
}

export default withAuth(ForexMetalsPage);