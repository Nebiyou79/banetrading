// hooks/useAdminMutation.ts
// ── Generic admin mutation hook ──

import { useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';

interface UseAdminMutationOptions {
  invalidateKeys?: QueryKey[];
  onSuccessMessage?: string;
}

export function useAdminMutation<TVariables, TData>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseAdminMutationOptions,
) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn,
    onSuccess: () => {
      if (options?.invalidateKeys) {
        options.invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
}