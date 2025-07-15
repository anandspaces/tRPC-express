# tRPC Express with Next.js

This is a full-stack TypeScript project that demonstrates how to use tRPC with Express.js backend and Next.js frontend.

## Features

- End-to-end type safety with tRPC
- Express.js backend with tRPC API endpoints
- Next.js frontend with tRPC client integration
- Real-time updates with WebSocket subscriptions
- CRUD operations for users and posts
- Authentication middleware

## Project Structure

- `backend/`: Express.js server with tRPC
- `frontend/`: Next.js application with tRPC client

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies for both backend and frontend:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running the Development Servers

1. Start the backend server:

```bash
cd backend
npx tsx src/index.ts
```

2. Start the frontend development server:

```bash
cd frontend
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## API Endpoints

- REST: `http://localhost:3001/health` - Health check endpoint
- tRPC: `http://localhost:3001/trpc` - tRPC API endpoint
- WebSocket: `ws://localhost:3002` - WebSocket endpoint for subscriptions

## License

MIT