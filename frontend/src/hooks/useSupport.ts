'use client';
// hooks/useSupport.ts
// ── SUPPORT HOOK ──
// Wraps the ticket-based support API into a simple chat-like interface.
// Strategy:
//   1. listTickets()  → find the most recent open/in_progress ticket
//   2. getTicket(id)  → hydrate messages for that ticket
//   3. Poll on interval while ticket is active
//   4. sendMessage()  → builds FormData and calls supportService.sendMessage

import { useState, useEffect, useCallback, useRef } from 'react';
import { supportService } from '@/services/supportService';
import type { TicketMessage, Ticket } from '@/types/support';

// ── Re-export a clean shape for consumers that don't want raw TicketMessage ──
export type { TicketMessage };

export interface UseSupportReturn {
  /** Current ticket being tracked (null = no active ticket found) */
  ticket: Ticket | null;
  /** All messages for the current ticket */
  messages: TicketMessage[];
  loading: boolean;
  error: string | null;
  sending: boolean;
  sendError: string | null;
  /** Send a plain-text message (+ optional file attachment) */
  sendMessage: (body: string, file?: File | null) => Promise<void>;
  /** Manually re-fetch messages */
  refresh: () => Promise<void>;
  /** Number of unread messages from support agents */
  unreadCount: number;
}

export function useSupport(pollInterval = 5000): UseSupportReturn {
  const [ticket, setTicket]   = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [sending, setSending]   = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Keep a stable ref so the poll callback always sees the latest ticketId
  const ticketIdRef = useRef<string | null>(null);

  // ── Core fetch: find the latest active ticket and load its messages ──
  const fetchMessages = useCallback(async () => {
    setError(null);
    try {
      // 1. List all user tickets
      const { tickets } = await supportService.listTickets();

      if (tickets.length === 0) {
        setTicket(null);
        setMessages([]);
        return;
      }

      // 2. Prefer the first open/in_progress ticket; fall back to the most recent one
      const active =
        tickets.find(t => t.status === 'open' || t.status === 'in_progress') ??
        tickets[0];

      ticketIdRef.current = active._id;
      setTicket(active);

      // 3. Load full message thread for that ticket
      const detail = await supportService.getTicket(active._id);
      setMessages(detail.messages);

      // 4. Mark as read (best-effort)
      supportService.markRead(active._id).catch(() => undefined);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load messages';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Poll while component is mounted ──
  useEffect(() => {
    fetchMessages();

    if (pollInterval > 0) {
      intervalRef.current = setInterval(fetchMessages, pollInterval);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchMessages, pollInterval]);

  // ── Send a message to the current ticket ──
  const sendMessage = useCallback(
    async (body: string, file?: File | null) => {
      const id = ticketIdRef.current;
      if (!id) {
        setSendError('No active ticket found. Please open a support ticket first.');
        return;
      }

      setSending(true);
      setSendError(null);

      try {
        const formData = new FormData();
        formData.append('body', body.trim());
        if (file) formData.append('attachment', file);

        // Returns { message: TicketMessage }
        const { message: sent } = await supportService.sendMessage(id, formData);

        // Optimistically append the new message so the UI updates immediately,
        // then let the next poll reconcile with the server state.
        setMessages(prev => {
          const exists = prev.some(m => m._id === sent._id);
          return exists ? prev : [...prev, sent];
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to send message';
        setSendError(message);
        throw err;
      } finally {
        setSending(false);
      }
    },
    [],
  );

  const unreadCount = messages.filter(
    m => m.senderRole === 'admin' && !m.readAt,
  ).length;

  return {
    ticket,
    messages,
    loading,
    error,
    sending,
    sendError,
    sendMessage,
    refresh: fetchMessages,
    unreadCount,
  };
}

// ── Default export for consumers that do: import useSupport from '…' ──
export default useSupport;