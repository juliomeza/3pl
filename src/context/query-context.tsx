'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, ReactNode } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 25 * 1000, // 25 seconds - consider data fresh
        refetchOnWindowFocus: true, // Refetch when returning to tab
        refetchOnReconnect: true, // Refetch when network reconnects
        retry: 2, // Retry failed requests 2 times
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}