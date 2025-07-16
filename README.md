# tRPC Express Demo

A demo application showcasing tRPC with Express backend and Next.js frontend.

## Features

- Full-stack TypeScript application with end-to-end type safety
- Express.js backend with tRPC API
- Next.js frontend with tRPC client
- Real-time updates with WebSockets
- CRUD operations for users and posts

## Project Structure

- `/backend`: Express.js backend with tRPC API
- `/frontend`: Next.js frontend with tRPC client

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository
2. Install dependencies:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running the Application

1. Start the backend server:

```bash
cd backend
npm run dev
```

2. In a separate terminal, start the frontend:

```bash
cd frontend
npm run dev
```

3. Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

## API Endpoints

- REST API: `http://localhost:3001`
- tRPC API: `http://localhost:3001/trpc`
- WebSocket: `ws://localhost:3002`

## Development

The application uses:

- Backend:
  - Express.js
  - tRPC v10
  - WebSockets for real-time updates
  - In-memory data store (for demo purposes)

- Frontend:
  - Next.js
  - tRPC client
  - React Query for data fetching
  - Tailwind CSS for styling