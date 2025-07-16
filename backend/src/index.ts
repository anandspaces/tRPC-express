// src/index.ts
import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { WebSocketServer } from 'ws';
import { appRouter } from './router';
import { createContext, createWSSContext } from './context';

const app = express();

// Middleware
app.use(cors({
  origin: ['*'],
  credentials: true,
}));
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

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
});

const server = app.listen(3001, () => {
  console.log('🚀 Server running on http://localhost:3001');
});

// WebSocket server for real-time features
const wss = new WebSocketServer({ port: 3002 });

const wssHandler = applyWSSHandler({
  wss,
  router: appRouter,
  createContext: createWSSContext,
});

console.log('🔌 WebSocket server running on ws://localhost:3002');

// Cleanup on server shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down');
  wssHandler.broadcastReconnectNotification();
  wss.close();
  server.close();
});