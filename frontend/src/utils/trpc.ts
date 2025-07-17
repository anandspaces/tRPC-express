// utils/trpc.ts
import { createTRPCReact, httpBatchLink, splitLink, wsLink, createWSClient } from '@trpc/react-query';
import { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '../../../backend/src/router';

// Function to get the base URL for API requests
function getBaseUrl() {
  // In the browser, use relative URLs
  if (typeof window !== 'undefined') return '';
  
  // In SSR or development, use the local server
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:3001`;
}

// Create tRPC React client
export const trpc = createTRPCReact<AppRouter>();

// WebSocket client for subscriptions (client-side only)
export const createTrpcClient = () => {
  // Create WebSocket client only in the browser
  const wsClient = typeof window !== 'undefined' 
    ? createWSClient({ 
        url: 'ws://localhost:3002',
        onOpen: () => console.log('[tRPC] WebSocket connection established'),
        onClose: () => console.log('[tRPC] WebSocket connection closed'),
      }) 
    : null;

  // Add global event listeners for debugging
  if (typeof window !== 'undefined') {
    // Log all tRPC requests and responses
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const url = args[0]?.toString() || '';
      
      if (url.includes('/trpc')) {
        console.log(`[tRPC] Request to ${url}`);
        const startTime = Date.now();
        
        return originalFetch.apply(this, args)
          .then(response => {
            const duration = Date.now() - startTime;
            console.log(`[tRPC] Response from ${url} (${duration}ms)`);
            return response;
          })
          .catch(error => {
            console.error(`[tRPC] Error from ${url}:`, error);
            throw error;
          });
      }
      
      return originalFetch.apply(this, args);
    };
  }

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
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;