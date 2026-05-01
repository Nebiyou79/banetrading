// hooks/useSupportConfig.ts
// ── SUPPORT CONFIG HOOK ──

import { useQuery } from '@tanstack/react-query';
import { supportService } from '@/services/supportService';
import type { SupportConfig } from '@/types/support';

export function useSupportConfig() {
  const query = useQuery<SupportConfig>({
    queryKey: ['support', 'config'],
    queryFn: () => supportService.getConfig(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    config: query.data ?? { ticketsEnabled: true, whatsappEnabled: false, whatsappNumber: '', whatsappMessage: '' },
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
  };
}