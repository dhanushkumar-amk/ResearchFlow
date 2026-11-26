import type { NextConfig } from "next";
import path from "path";

const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001').replace(/\/+$/, '');

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: '/api/auth/:path*', destination: `${backendUrl}/api/auth/:path*` },
    ];
  },
  env: {
    API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  turbopack: {
    resolveAlias: {
      'react-router-dom': './lib/react-router-dom-shim.ts',
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-router-dom': path.resolve(__dirname, 'lib/react-router-dom-shim.ts'),
    };
    return config;
  },
};

export default nextConfig;
