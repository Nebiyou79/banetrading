// components/support/TicketsList.tsx
// ── TICKETS LIST ──

import React from 'react';
import { useRouter } from 'next/router';
import type { Ticket } from '@/types/support';
import { StatusPillFromString } from '@/components/ui/StatusPill';

interface TicketsListProps {
  tickets: Ticket[];
  isLoading?: boolean;
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function TicketsList({ tickets, isLoading = false }: TicketsListProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-20 bg-[var(--bg-muted)] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg className="w-12 h-12 mb-3 text-[var(--text-muted)] opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <p className="text-sm text-[var(--text-muted)]">You haven&apos;t opened any tickets yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tickets.map(ticket => (
        <div
          key={ticket._id}
          className="relative rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 cursor-pointer hover:bg-[var(--hover-bg)] transition-colors duration-150"
          onClick={() => router.push(`/help/tickets/${ticket._id}`)}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter') router.push(`/help/tickets/${ticket._id}`); }}
        >
          {/* ── Unread badge ── */}
          {ticket.unreadByUser > 0 && (
            <span className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full bg-[var(--danger)]" />
          )}

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm text-[var(--text-primary)] truncate">
                  {ticket.subject}
                </span>
                <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-muted)] px-2 py-0.5 rounded-full flex-shrink-0">
                  {ticket.category}
                </span>
              </div>
              {ticket.lastMessagePreview && (
                <p className="text-xs text-[var(--text-muted)] truncate mt-1">
                  {ticket.lastMessagePreview}
                </p>
              )}
            </div>

            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <StatusPillFromString status={ticket.status} />
              <span className="text-xs text-[var(--text-muted)] tabular">
                {formatRelative(ticket.lastMessageAt)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}