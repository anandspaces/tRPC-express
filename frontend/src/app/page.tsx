'use client';

import { useState } from 'react';
import { trpc } from '../utils/trpc';

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string; // Changed from Date to string to match backend
}

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string; // Changed from Date to string to match backend
  author?: User;
}

// Define types for subscription data
type UserChangeData = User | { deleted: string };
type PostChangeData = Post | { deleted: string };

export default function Home() {
  const [activeTab, setActiveTab] = useState<'users' | 'posts'>('users');
  const [newUser, setNewUser] = useState({ name: '', email: '' });
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Queries
  const { data: users, refetch: refetchUsers } = trpc.users.list.useQuery();
  const { data: posts, refetch: refetchPosts } = trpc.posts.list.useQuery();
  const { data: greeting } = trpc.hello.useQuery({ name: 'World' });

  // Mutations
  const createUser = trpc.users.create.useMutation({
    onSuccess: () => {
      refetchUsers();
      setNewUser({ name: '', email: '' });
    },
  });

  const updateUser = trpc.users.update.useMutation({
    onSuccess: () => {
      refetchUsers();
      setEditingUser(null);
    },
  });

  const deleteUser = trpc.users.delete.useMutation({
    onSuccess: () => {
      refetchUsers();
    },
  });

  const createPost = trpc.posts.create.useMutation({
    onSuccess: () => {
      refetchPosts();
      setNewPost({ title: '', content: '' });
    },
  });

  const deletePost = trpc.posts.delete.useMutation({
    onSuccess: () => {
      refetchPosts();
    },
  });

  // Subscriptions for real-time updates
  trpc.onUserChange.useSubscription(undefined, {
    onData: (data) => {
      console.log('User changed:', data);
      refetchUsers();
    },
    onError: (err) => {
      console.error('Error in user subscription:', err);
    },
  });

  trpc.onPostChange.useSubscription(undefined, {
    onData: (data) => {
      console.log('Post changed:', data);
      refetchPosts();
    },
    onError: (err) => {
      console.error('Error in post subscription:', err);
    },
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUser.name && newUser.email) {
      createUser.mutate(newUser);
    }
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateUser.mutate({
        id: editingUser.id,
        name: editingUser.name,
        email: editingUser.email,
      });
    }
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPost.title && newPost.content) {
      createPost.mutate(newPost);
    }
  };

  // For tRPC v10 with React Query v4, we need to check if the mutation is loading
  // We can't directly access isLoading or status, so we'll check if it's not idle
  const isUserCreating = createUser.status !== 'idle';
  const isPostCreating = createPost.status !== 'idle';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">tRPC Demo App</h1>
          <p className="text-gray-600">{greeting?.greeting}</p>
          <div className="mt-4 flex justify-center space-x-4">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'users' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'posts' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Posts
            </button>
          </div>
        </header>

        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">Create User</h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isUserCreating}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUserCreating ? 'Creating...' : 'Create User'}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">Users</h2>
              {users?.map((user: User) => (
                <div key={user.id} className="border-b border-gray-200 py-4 last:border-b-0">
                  {editingUser?.id === user.id ? (
                    <form onSubmit={handleUpdateUser} className="space-y-2">
                      <input
                        type="text"
                        value={editingUser.name}
                        onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="email"
                        value={editingUser.email}
                        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <div className="flex space-x-2">
                        <button
                          type="submit"
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingUser(null)}
                          className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-900">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteUser.mutate({ id: user.id })}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">Create Post</h2>
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content
                  </label>
                  <textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPostCreating}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPostCreating ? 'Creating...' : 'Create Post'}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">Posts</h2>
              {posts?.map((post: Post) => (
                <div key={post.id} className="border-b border-gray-200 py-4 last:border-b-0">
                  <div>
                    <h3 className="font-medium text-gray-900">{post.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{post.content}</p>
                    <p className="text-xs text-gray-500">
                      By: {post.author?.name || 'Unknown'}
                    </p>
                  </div>
                  <div className="mt-2">
                    <button
                      onClick={() => deletePost.mutate({ id: post.id })}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}