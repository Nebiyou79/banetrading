// hooks/useTickets.ts
// ── TICKETS LIST HOOK ──
// Fetches the current user's tickets and exposes a refetch helper.

import { useQuery } from '@tanstack/react-query';
import { supportService } from '@/services/supportService';
import type { Ticket } from '@/types/support';

interface UseTicketsReturn {
  tickets: Ticket[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTickets(): UseTicketsReturn {
  const query = useQuery<{ tickets: Ticket[] }>({
    queryKey: ['support', 'tickets'],
    queryFn: () => supportService.listTickets(),
    refetchInterval: 15_000, // passive background refresh
  });

  return {
    tickets: query.data?.tickets ?? [],
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: () => query.refetch(),
  };
}