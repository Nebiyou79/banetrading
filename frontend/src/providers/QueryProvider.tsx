// providers/QueryProvider.tsx
// ── React Query provider ──

import { ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps): JSX.Element {
  const [client] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          retry: 1,
          refetchOnWindowFocus: false,
          staleTime: 30 * 1000,
        },
        mutations: {
          retry: 0,
        },
      },
    }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}