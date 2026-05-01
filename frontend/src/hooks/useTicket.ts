// hooks/useTicket.ts
// ── SINGLE TICKET DETAIL + MESSAGES HOOK ──

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supportService } from '@/services/supportService';
import type { TicketDetailResponse } from '@/types/support';

export function useTicket(id: string) {
  const queryClient = useQueryClient();

  const query = useQuery<TicketDetailResponse>({
    queryKey: ['support', 'ticket', id],
    queryFn: () => supportService.getTicket(id),
    enabled: !!id,
    refetchInterval: (queryData) => {
      const status = queryData?.state?.data?.ticket?.status;
      if (!status || status === 'resolved' || status === 'closed') return false;
      return 4000; // Poll every 4s while active
    },
  });

  // ── Auto mark as read on mount ──
  useEffect(() => {
    if (!id) return;
    supportService.markRead(id).catch(() => {
      // Silent — mark read is best-effort
    });
  }, [id]);

  return {
    ticket: query.data?.ticket ?? null,
    messages: query.data?.messages ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? (query.error as Error).message : null,
    refetch: () => query.refetch(),
  };
}