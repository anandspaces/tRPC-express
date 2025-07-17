'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, createTrpcClient } from '../utils/trpc';

// Set up custom logging for React Query
const logQueryError = (error: unknown) => {
  console.error('Query error:', error);
};

const logMutationError = (error: unknown) => {
  console.error('Mutation error:', error);
};

export default function TrpcProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Create a new QueryClient with custom error handling
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
        onError: logQueryError
      },
      mutations: {
        onError: logMutationError
      }
    }
    // Removed deprecated logger option
  }));

  // Create tRPC client
  const [trpcClient] = useState(() => {
    console.log('Creating tRPC client');
    return trpc.createClient(createTrpcClient());
  });

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
} 