// src/test-client.ts
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './router';

async function main() {
  console.log('Starting test client...');
  
  // Create a tRPC client
  const client = createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: 'http://localhost:3001/trpc',
        headers: {
          Authorization: 'Bearer mock-token',
        },
      }),
    ],
  });

  try {
    // Test the hello procedure
    console.log('Testing hello procedure...');
    const helloResult = await client.hello.query({ name: 'Test Client' });
    console.log('Hello result:', helloResult);

    // Test the users.list procedure
    console.log('\nTesting users.list procedure...');
    const usersResult = await client.users.list.query();
    console.log(`Found ${usersResult.length} users:`);
    usersResult.forEach(user => {
      console.log(`- ${user.name} (${user.email})`);
    });

    // Test the posts.list procedure
    console.log('\nTesting posts.list procedure...');
    const postsResult = await client.posts.list.query();
    console.log(`Found ${postsResult.length} posts:`);
    postsResult.forEach(post => {
      console.log(`- ${post.title} by ${post.author?.name || 'Unknown'}`);
    });

    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Error during tests:', error);
  }
}

// Run the tests
main().catch(console.error); 