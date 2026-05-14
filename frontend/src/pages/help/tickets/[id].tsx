// pages/help/tickets/[id].tsx
// ── TICKET CHAT PAGE ──

import React, { useRef, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import { withAuth } from '@/components/layout/withAuth';
import { useTicket } from '@/hooks/useTicket';
import { useSendMessage } from '@/hooks/useSendMessage';
import TicketChatHeader from '@/components/support/TicketChatHeader';
import MessageBubble from '@/components/support/MessageBubble';
import MessageComposer from '@/components/support/MessageComposer';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'Support';

function TicketChatPage(): JSX.Element {
  const router = useRouter();
  const { id } = router.query;
  const ticketId = typeof id === 'string' ? id : '';

  const { ticket, messages, isLoading } = useTicket(ticketId);
  const { sendMessage, isSending } = useSendMessage();

  const messagesEndRef   = useRef<HTMLDivElement>(null);
  const isAtBottomRef    = useRef(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ── Auto-scroll to bottom on new messages ──
  useEffect(() => {
    if (isAtBottomRef.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    isAtBottomRef.current = el.scrollTop + el.clientHeight >= el.scrollHeight - 50;
  };

  const handleSend = async (body: string, file?: File | null) => {
    if (!ticketId) return;
    try {
      await sendMessage(ticketId, body, file);
    } catch {
      // Error is already stored in useSendMessage; composer stays enabled for retry
    }
  };

  const isClosed =
    ticket?.status === 'resolved' || ticket?.status === 'closed';

  // ── Loading state ──
  if (!router.isReady || isLoading) {
    return (
      <AuthenticatedShell>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full" />
        </div>
      </AuthenticatedShell>
    );
  }

  // ── Not found ──
  if (!ticket) {
    return (
      <AuthenticatedShell>
        <div className="py-16 text-center">
          <p className="text-sm text-[var(--text-muted)]">Ticket not found.</p>
        </div>
      </AuthenticatedShell>
    );
  }

  return (
    <>
      <Head>
        <title>{ticket.subject} · {BRAND}</title>
      </Head>

      <AuthenticatedShell contained={false}>
        {/* ── Full-height flex column ── */}
        <div className="flex flex-col h-[calc(100vh-4rem)]">
          {/* Header */}
          <TicketChatHeader ticket={ticket} />

          {/* Messages */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto px-4 py-4"
            onScroll={handleScroll}
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                <svg className="w-10 h-10 text-[var(--text-muted)] opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="text-sm text-[var(--text-muted)]">No messages yet. Send one below.</p>
              </div>
            )}

            {messages.map((msg, i) => {
              const prev = i > 0 ? messages[i - 1] : null;
              const showDay =
                !prev ||
                new Date(msg.createdAt).toDateString() !==
                new Date(prev.createdAt).toDateString();

              return (
                <React.Fragment key={msg._id}>
                  {showDay && (
                    <div className="flex justify-center my-4">
                      <span className="text-xs text-[var(--text-muted)] bg-[var(--border)] rounded-full px-3 py-1">
                        {formatDay(new Date(msg.createdAt))}
                      </span>
                    </div>
                  )}
                  <MessageBubble message={msg} />
                </React.Fragment>
              );
            })}

            <div ref={messagesEndRef} />
          </div>

          {/* Closed banner */}
          {isClosed && (
            <div className="px-4 py-2 text-center text-xs text-[var(--text-muted)] bg-[var(--bg-muted)] border-t border-[var(--border)]">
              This ticket is {ticket.status}. You can open a new ticket if you need further help.
            </div>
          )}

          {/* Composer */}
          <MessageComposer
            onSend={handleSend}
            isSending={isSending}
            disabled={isClosed}
          />
        </div>
      </AuthenticatedShell>
    </>
  );
}

// ── Helpers ──
function formatDay(date: Date): string {
  const now  = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 86_400_000 && now.getDate() === date.getDate()) return 'Today';
  if (diff < 172_800_000 && now.getDate() - date.getDate() === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default withAuth(TicketChatPage);