// hooks/useSupportConfig.ts
// ── SUPPORT CONFIG HOOK ──
// Fetches whatsapp / ticket feature-flags from the public config endpoint.

import { useQuery } from '@tanstack/react-query';
import { supportService } from '@/services/supportService';
import type { SupportConfig } from '@/types/support';

const FALLBACK_CONFIG: SupportConfig = {
  whatsappNumber: '',
  whatsappMessage: '',
  emailContact: '',
  ticketsEnabled: true,
  whatsappEnabled: false,
};

interface UseSupportConfigReturn {
  config: SupportConfig;
  isLoading: boolean;
  error: string | null;
}

export function useSupportConfig(): UseSupportConfigReturn {
  const query = useQuery<SupportConfig>({
    queryKey: ['support', 'config'],
    queryFn: () => supportService.getConfig(),
    staleTime: 5 * 60_000, // Config rarely changes – 5-minute stale window
  });

  return {
    config: query.data ?? FALLBACK_CONFIG,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
  };
}