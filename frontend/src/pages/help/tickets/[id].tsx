// pages/help/tickets/[id].tsx
// ── TICKET CHAT PAGE ──

import { useRef, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import { withAuth } from '@/components/layout/withAuth';
import { useTicket } from '@/hooks/useTicket';
import { useSendMessage } from '@/hooks/useSendMessage';
import TicketChatHeader from '@/components/support/TicketChatHeader';
import MessageBubble from '@/components/support/MessageBubble';
import MessageComposer from '@/components/support/MessageComposer';
import React from 'react';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'PrimeBitTrade Clone';

function TicketChatPage(): JSX.Element {
  const router = useRouter();
  const { id } = router.query;
  const ticketId = typeof id === 'string' ? id : '';

  const { ticket, messages, isLoading } = useTicket(ticketId);
  const { sendMessage, isSending } = useSendMessage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

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
    await sendMessage(ticketId, body, file);
  };

  const isClosed = ticket?.status === 'resolved' || ticket?.status === 'closed';

  if (!router.isReady || isLoading) {
    return (
      <AuthenticatedShell>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full" />
        </div>
      </AuthenticatedShell>
    );
  }

  if (!ticket) {
    return (
      <AuthenticatedShell>
        <div className="py-16 text-center">
          <p className="text-sm text-[var(--text-muted)]">Ticket not found</p>
        </div>
      </AuthenticatedShell>
    );
  }

  return (
    <>
      <Head><title>{ticket.subject} · {BRAND}</title></Head>
      <AuthenticatedShell contained={false}>
        <div className="flex flex-col h-[calc(100vh-4rem)]">
          <TicketChatHeader ticket={ticket} />

          {/* ── Messages area ── */}
          <div
            className="flex-1 overflow-y-auto px-4 py-4"
            style={{ maxHeight: 'calc(100vh - 180px)' }}
            onScroll={handleScroll}
          >
            {messages.map((msg, i) => {
              const prevMsg = i > 0 ? messages[i - 1] : null;
              const showDaySeparator = !prevMsg ||
                new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();

              return (
                <React.Fragment key={msg._id}>
                  {showDaySeparator && (
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

          {/* ── Composer ── */}
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

function formatDay(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 86400000 && now.getDate() === date.getDate()) return 'Today';
  if (diff < 172800000 && now.getDate() - date.getDate() === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default withAuth(TicketChatPage);