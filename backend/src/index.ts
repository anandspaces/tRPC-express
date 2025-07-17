// src/index.ts
import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { WebSocketServer } from 'ws';
import { appRouter } from './router';
import { createContext, createWSSContext } from './context';

const app = express();

// Define allowed origins
const allowedOrigins = [
  'http://localhost:3000',     // Next.js dev server
  'http://127.0.0.1:3000',     // Alternative localhost
  'http://localhost:3001',     // Self (for testing)
  'http://localhost',          // Simple localhost
];

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin === '*') {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // Log request headers and body
  console.log(`Headers: ${JSON.stringify(req.headers)}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`Body: ${JSON.stringify(req.body)}`);
  }
  
  // Capture response data
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] Response ${res.statusCode} in ${duration}ms`);
    return originalSend.call(this, body);
  };
  
  next();
});

// Root route - API documentation
app.get('/', (req, res) => {
  const apiRoutes = Object.keys(appRouter._def.procedures);
  const routerKeys = Object.keys(appRouter._def.record || {});
  
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>tRPC API Documentation</title>
    <style>
      body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; max-width: 800px; margin: 0 auto; padding: 20px; }
      h1 { color: #333; }
      h2 { color: #555; margin-top: 30px; }
      pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
      .endpoint { margin-bottom: 15px; padding: 10px; border-left: 4px solid #0070f3; background: #f0f7ff; }
      .method { font-weight: bold; color: #0070f3; }
      a { color: #0070f3; text-decoration: none; }
      a:hover { text-decoration: underline; }
    </style>
  </head>
  <body>
    <h1>tRPC API Documentation</h1>
    <p>This is the API documentation for the tRPC server.</p>
    
    <h2>Base Endpoints</h2>
    <div class="endpoint">
      <p><span class="method">GET</span> <a href="/trpc">/trpc</a> - tRPC endpoint</p>
      <p><span class="method">GET</span> <a href="/health">/health</a> - Health check</p>
    </div>
    
    <h2>Root Procedures</h2>
    <pre>${JSON.stringify(apiRoutes, null, 2)}</pre>
    
    <h2>Nested Routers</h2>
    <pre>${JSON.stringify(routerKeys, null, 2)}</pre>
    
    <h2>Usage</h2>
    <p>To use a procedure, make a request to <code>/trpc/[PROCEDURE]</code></p>
    <p>For example: <a href="/trpc/hello?input=%7B%22name%22%3A%22World%22%7D">/trpc/hello?input={"name":"World"}</a></p>
    
    <h2>WebSocket</h2>
    <p>WebSocket server is available at <code>ws://localhost:3002</code> for subscriptions.</p>
  </body>
  </html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// tRPC middleware
app.use('/trpc', createExpressMiddleware({
  router: appRouter,
  createContext,
  onError: ({ error, path }) => {
    console.error(`[${new Date().toISOString()}] Error in tRPC handler for path "${path}":`, error);
  },
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(`[${new Date().toISOString()}] Error:`, err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
});

const server = app.listen(3001, () => {
  console.log('🚀 Server running on http://localhost:3001');
  console.log('📝 API documentation available at http://localhost:3001');
});

// WebSocket server for real-time features
const wss = new WebSocketServer({ port: 3002 });

const wssHandler = applyWSSHandler({
  wss,
  router: appRouter,
  createContext: createWSSContext,
  onError: ({ error }) => {
    console.error(`[${new Date().toISOString()}] WebSocket Error:`, error);
  },
});

console.log('🔌 WebSocket server running on ws://localhost:3002');

// Cleanup on server shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down');
  wssHandler.broadcastReconnectNotification();
  wss.close();
  server.close();
});