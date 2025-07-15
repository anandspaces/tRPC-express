import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/trpc/:path*',
        destination: 'http://localhost:3001/trpc/:path*',
      },
    ];
  },
};

export default nextConfig;
