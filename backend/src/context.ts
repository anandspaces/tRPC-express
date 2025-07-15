// src/context.ts
import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { CreateWSSContextFnOptions } from '@trpc/server/adapters/ws';

// Context for Express
export const createContext = ({ req, res }: CreateExpressContextOptions) => {
  return {
    req,
    res,
    userId: req.headers.authorization ? 'user-123' : null, // Mock auth
  };
};

// Context for WebSocket
export const createWSSContext = ({ req }: CreateWSSContextFnOptions) => {
  return {
    req,
    res: {}, // Provide an empty object for compatibility
    userId: req.headers.authorization ? 'user-123' : null,
  };
};

export type Context = inferAsyncReturnType<typeof createContext>;