// utils/trpc.ts
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import { createWSClient, wsLink } from '@trpc/client';
import { splitLink } from '@trpc/client';

// Define a simplified AppRouter type
type AppRouter = any;

function getBaseUrl() {
  if (typeof window !== 'undefined') return '';
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:3001`;
}

// Create tRPC React client
export const trpc = createTRPCReact<AppRouter>();

// WebSocket client for subscriptions (client-side only)
export const createTrpcClient = () => {
  const wsClient = typeof window !== 'undefined' 
    ? createWSClient({ url: 'ws://localhost:3002' }) 
    : null;

  return {
    links: [
      splitLink({
        condition: (op) => op.type === 'subscription',
        true: wsClient 
          ? wsLink({ client: wsClient }) 
          : httpBatchLink({
              url: `${getBaseUrl()}/trpc`,
              headers() {
                return {
                  authorization: 'Bearer mock-token', // Mock auth token
                };
              },
            }),
        false: httpBatchLink({
          url: `${getBaseUrl()}/trpc`,
          headers() {
            return {
              authorization: 'Bearer mock-token', // Mock auth token
            };
          },
        }),
      }),
    ],
  };
};

// Export types for convenience
export type RouterInputs = any;
export type RouterOutputs = any;