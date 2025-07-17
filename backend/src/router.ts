// src/router.ts
import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import { Context, ContextType } from './context';
import { observable } from '@trpc/server/observable';
import { EventEmitter } from 'events';

const t = initTRPC.context<ContextType>().create();

// Logging middleware
const loggerMiddleware = t.middleware(async ({ path, type, next, input, ctx }) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] => Executing ${type} procedure: ${path}`);
  console.log(`Input: ${JSON.stringify(input)}`);
  console.log(`Context: userId=${ctx.userId}`);

  const result = await next();

  const durationMs = Date.now() - start;
  if (result.ok) {
    console.log(`[${new Date().toISOString()}] <= Completed ${type} procedure: ${path} in ${durationMs}ms`);
  } else {
    console.error(`[${new Date().toISOString()}] <= Failed ${type} procedure: ${path} in ${durationMs}ms`);
    console.error(`Error: ${result.error.message}`);
  }

  return result;
});

// Event emitter for real-time updates
const ee = new EventEmitter();

// Mock database
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string; // Changed from Date to string for frontend compatibility
}

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string; // Changed from Date to string for frontend compatibility
}

let users: User[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', createdAt: new Date().toISOString() },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', createdAt: new Date().toISOString() },
];

let posts: Post[] = [
  { id: '1', title: 'Hello World', content: 'This is my first post!', authorId: '1', createdAt: new Date().toISOString() },
  { id: '2', title: 'tRPC is Amazing', content: 'End-to-end type safety is incredible!', authorId: '2', createdAt: new Date().toISOString() },
];

// Middleware
const isAuthenticated = t.middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});

// Procedures
const publicProcedure = t.procedure.use(loggerMiddleware);
const protectedProcedure = t.procedure.use(isAuthenticated).use(loggerMiddleware);

// User router
const userRouter = t.router({
  list: publicProcedure.query(() => {
    return users;
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      const user = users.find(u => u.id === input.id);
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }
      return user;
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email(),
    }))
    .mutation(({ input }) => {
      const newUser: User = {
        id: (users.length + 1).toString(),
        name: input.name,
        email: input.email,
        createdAt: new Date().toISOString(),
      };
      
      users.push(newUser);
      ee.emit('userCreated', newUser);
      
      return newUser;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      email: z.string().email().optional(),
    }))
    .mutation(({ input }) => {
      const userIndex = users.findIndex(u => u.id === input.id);
      if (userIndex === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      const updatedUser = {
        ...users[userIndex],
        ...(input.name && { name: input.name }),
        ...(input.email && { email: input.email }),
      };

      users[userIndex] = updatedUser;
      ee.emit('userUpdated', updatedUser);

      return updatedUser;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const userIndex = users.findIndex(u => u.id === input.id);
      if (userIndex === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      users.splice(userIndex, 1);
      ee.emit('userDeleted', input.id);

      return { success: true };
    }),
});

// Post router
const postRouter = t.router({
  list: publicProcedure.query(() => {
    return posts.map(post => ({
      ...post,
      author: users.find(u => u.id === post.authorId),
    }));
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      const post = posts.find(p => p.id === input.id);
      if (!post) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
      }
      
      return {
        ...post,
        author: users.find(u => u.id === post.authorId),
      };
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      content: z.string().min(1),
    }))
    .mutation(({ input, ctx }) => {
      const newPost: Post = {
        id: (posts.length + 1).toString(),
        title: input.title,
        content: input.content,
        authorId: ctx.userId!,
        createdAt: new Date().toISOString(),
      };
      
      posts.push(newPost);
      ee.emit('postCreated', newPost);
      
      return newPost;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().optional(),
      content: z.string().optional(),
    }))
    .mutation(({ input, ctx }) => {
      const postIndex = posts.findIndex(p => p.id === input.id);
      if (postIndex === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
      }

      const post = posts[postIndex];
      if (post.authorId !== ctx.userId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not your post' });
      }

      const updatedPost = {
        ...post,
        ...(input.title && { title: input.title }),
        ...(input.content && { content: input.content }),
      };

      posts[postIndex] = updatedPost;
      ee.emit('postUpdated', updatedPost);

      return updatedPost;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input, ctx }) => {
      const postIndex = posts.findIndex(p => p.id === input.id);
      if (postIndex === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
      }

      const post = posts[postIndex];
      if (post.authorId !== ctx.userId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not your post' });
      }

      posts.splice(postIndex, 1);
      ee.emit('postDeleted', input.id);

      return { success: true };
    }),
});

// Main app router
export const appRouter = t.router({
  _index: publicProcedure
    .query(() => {
      return {
        message: 'tRPC API Server',
        routes: ['hello', 'users', 'posts'],
        documentation: 'Visit the root URL for API documentation'
      };
    }),

  hello: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => {
      return { greeting: `Hello ${input.name}!` };
    }),

  users: userRouter,
  posts: postRouter,

  // Real-time subscriptions
  onUserChange: publicProcedure.subscription(() => {
    return observable<User | { deleted: string }>((emit) => {
      const onUserCreated = (user: User) => emit.next(user);
      const onUserUpdated = (user: User) => emit.next(user);
      const onUserDeleted = (id: string) => emit.next({ deleted: id });

      ee.on('userCreated', onUserCreated);
      ee.on('userUpdated', onUserUpdated);
      ee.on('userDeleted', onUserDeleted);

      return () => {
        ee.off('userCreated', onUserCreated);
        ee.off('userUpdated', onUserUpdated);
        ee.off('userDeleted', onUserDeleted);
      };
    });
  }),

  onPostChange: publicProcedure.subscription(() => {
    return observable<Post | { deleted: string }>((emit) => {
      const onPostCreated = (post: Post) => emit.next(post);
      const onPostUpdated = (post: Post) => emit.next(post);
      const onPostDeleted = (id: string) => emit.next({ deleted: id });

      ee.on('postCreated', onPostCreated);
      ee.on('postUpdated', onPostUpdated);
      ee.on('postDeleted', onPostDeleted);

      return () => {
        ee.off('postCreated', onPostCreated);
        ee.off('postUpdated', onPostUpdated);
        ee.off('postDeleted', onPostDeleted);
      };
    });
  }),
});

// Export type definition of API
export type AppRouter = typeof appRouter;