// hooks/useAdminData.ts
// ── Generic admin data-fetching hook ──

import { useQuery, QueryKey } from '@tanstack/react-query';

interface UseAdminDataOptions {
  enabled?: boolean;
  staleTime?: number;
}

export function useAdminData<TData>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: UseAdminDataOptions,
) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn,
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTime ?? 30_000, // 30s default
    retry: 1,
  });

  return {
    data: data ?? null,
    isLoading,
    isError,
    error,
    refetch,
  };
}