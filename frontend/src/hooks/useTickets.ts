// hooks/useTickets.ts
// ── USER'S TICKETS LIST HOOK ──

import { useQuery } from '@tanstack/react-query';
import { supportService } from '@/services/supportService';
import type { Ticket } from '@/types/support';

export function useTickets() {
  const query = useQuery({
    queryKey: ['support', 'tickets'],
    queryFn: () => supportService.listTickets(),
    staleTime: 30_000,
  });

  return {
    tickets: query.data?.tickets ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? (query.error as Error).message : null,
    refetch: () => query.refetch(),
  };
}