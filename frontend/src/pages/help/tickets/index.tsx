// pages/help/tickets/index.tsx
// ── TICKETS LIST PAGE ──

import { useState } from 'react';
import Head from 'next/head';

import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import { withAuth } from '@/components/layout/withAuth';
import { useTickets } from '@/hooks/useTickets';
import TicketsList from '@/components/support/TicketsList';
import NewTicketModal from '@/components/support/NewTicketModal';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'Support';

function TicketsListPage(): JSX.Element {
  const { tickets, isLoading, error, refetch } = useTickets();
  const [showNewTicket, setShowNewTicket] = useState(false);

  return (
    <>
      <Head>
        <title>Support Tickets · {BRAND}</title>
      </Head>

      <AuthenticatedShell>
        <div className="flex flex-col gap-6">
          {/* ── Header ── */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              Support
            </h1>
            <button
              onClick={() => setShowNewTicket(true)}
              className="px-4 py-2.5 rounded-lg text-sm font-medium bg-[var(--accent)] text-[var(--text-inverse)] hover:opacity-90 transition-opacity duration-150"
            >
              + New Ticket
            </button>
          </div>

          {/* ── Error state ── */}
          {error && !isLoading && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-8 text-center">
              <p className="text-sm text-[var(--text-muted)] mb-3">{error}</p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] text-[var(--text-inverse)]"
              >
                Retry
              </button>
            </div>
          )}

          {/* ── List ── */}
          <TicketsList tickets={tickets} isLoading={isLoading} />
        </div>

        <NewTicketModal
          open={showNewTicket}
          onClose={() => setShowNewTicket(false)}
        />
      </AuthenticatedShell>
    </>
  );
}

export default withAuth(TicketsListPage);