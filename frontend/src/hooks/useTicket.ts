// hooks/useTicket.ts
// ── SINGLE TICKET DETAIL + MESSAGES HOOK ──

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supportService } from '@/services/supportService';
import type { SupportTicket, TicketMessage, TicketDetailResponse } from '@/types/support';

interface UseTicketReturn {
  ticket: SupportTicket | null;
  messages: TicketMessage[];
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTicket(id: string): UseTicketReturn {
  const query = useQuery<TicketDetailResponse>({
    queryKey: ['support', 'ticket', id],
    queryFn: () => supportService.getTicket(id),
    enabled: !!id,
    refetchInterval: (queryInfo) => {
      const status = (queryInfo.state.data as TicketDetailResponse | undefined)?.ticket?.status;
      if (!status || status === 'resolved' || status === 'closed') return false;
      return 4_000; // Poll every 4s while active
    },
  });

  // ── Auto mark-as-read on mount (best-effort) ──
  useEffect(() => {
    if (!id) return;
    supportService.markRead(id).catch(() => undefined);
  }, [id]);

  return {
    ticket: query.data?.ticket ?? null,
    messages: query.data?.messages ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? (query.error as Error).message : null,
    refetch: () => { query.refetch(); },
  };
}