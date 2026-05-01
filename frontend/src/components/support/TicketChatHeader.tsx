// components/support/TicketChatHeader.tsx
// ── TICKET CHAT HEADER ──

import React from 'react';
import { useRouter } from 'next/router';
import type { Ticket } from '@/types/support';
import { StatusPillFromString } from '@/components/ui/StatusPill';

interface TicketChatHeaderProps {
  ticket: Ticket;
  isAdmin?: boolean;
  onStatusChange?: (status: string) => void;
}

export default function TicketChatHeader({ ticket, isAdmin = false, onStatusChange }: TicketChatHeaderProps) {
  const router = useRouter();

  return (
    <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-[var(--surface)] border-b border-[var(--border)] backdrop-blur-sm">
      {/* ── Back ── */}
      <button
        onClick={() => router.back()}
        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors duration-150"
        aria-label="Back"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* ── Subject + Status ── */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="font-semibold text-sm text-[var(--text-primary)] truncate">
          {ticket.subject}
        </span>
        {isAdmin ? (
          <select
            value={ticket.status}
            onChange={e => onStatusChange?.(e.target.value)}
            className="text-xs border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-primary)] rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[var(--focus-ring)]"
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        ) : (
          <StatusPillFromString status={ticket.status} />
        )}
      </div>
    </div>
  );
}