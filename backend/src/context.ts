// src/context.ts
import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { IncomingMessage } from 'http';
import { WebSocket } from 'ws';
import * as express from 'express';
import { NodeHTTPCreateContextFnOptions } from '@trpc/server/adapters/node-http';

// Create a shared context type that works for both HTTP and WebSocket
export interface ContextType {
  req: any;
  res: any;
  userId: string;
}

// Context for Express
export const createContext = ({ req, res }: CreateExpressContextOptions): ContextType => {
  // For development purposes, always provide a mock user ID
  // In production, you would validate the token and get the real user ID
  return {
    req,
    res,
    userId: 'user-123', // Always authenticated for development
  };
};

// Context for WebSocket - use the same type as the HTTP context
export const createWSSContext = (opts: NodeHTTPCreateContextFnOptions<IncomingMessage, WebSocket>): ContextType => {
  // For development purposes, always provide a mock user ID
  return {
    req: opts.req,
    res: {},
    userId: 'user-123', // Always authenticated for development
  };
};

export type Context = inferAsyncReturnType<typeof createContext>;