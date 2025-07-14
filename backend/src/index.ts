// src/index.ts
import express from 'express';
import cors from 'cors';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { WebSocketServer } from 'ws';
import { appRouter } from './router';
import { createContext } from './context';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// tRPC middleware
app.use('/trpc', createExpressMiddleware({
  router: appRouter,
  createContext,
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const server = app.listen(3001, () => {
  console.log('🚀 Server running on http://localhost:3001');
});

// WebSocket server for real-time features
const wss = new WebSocketServer({ port: 3002 });

applyWSSHandler({
  wss,
  router: appRouter,
  createContext,
});

console.log('🔌 WebSocket server running on ws://localhost:3002');