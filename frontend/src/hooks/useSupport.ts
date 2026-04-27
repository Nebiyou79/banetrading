'use client';
// hooks/useSupport.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import supportService from '@/services/supportService';
import type { SupportMessage } from '@/types';

export const useSupport = (pollInterval = 5000) => {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ticketIdRef = useRef<string | null>(null);

  const fetchMessages = useCallback(async () => {
    setError(null);
    try {
      const data = await supportService.getMyMessages();
      setMessages(data);
      if (data.length > 0 && !ticketIdRef.current) {
        ticketIdRef.current = data[0].ticketId;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
    if (pollInterval > 0) {
      intervalRef.current = setInterval(fetchMessages, pollInterval);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchMessages, pollInterval]);

  const sendMessage = useCallback(async (message: string) => {
    setSending(true);
    setSendError(null);
    try {
      const result = await supportService.sendMessage(message, ticketIdRef.current || undefined);
      ticketIdRef.current = result.ticketId;
      await fetchMessages();
      return result;
    } catch (err: any) {
      setSendError(err.message || 'Failed to send message');
      throw err;
    } finally {
      setSending(false);
    }
  }, [fetchMessages]);

  const unreadCount = messages.filter((m) => m.sender === 'admin' && !m.read).length;

  return {
    messages,
    loading,
    error,
    sending,
    sendError,
    sendMessage,
    fetchMessages,
    unreadCount,
  };
};
