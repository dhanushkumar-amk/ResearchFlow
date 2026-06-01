import type { NextConfig } from "next";
import path from "path";

const nextConfig: any = {
  env: {
    API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  turbopack: {
    resolveAlias: {
      'react-router-dom': './lib/react-router-dom-shim.ts',
    },
  },
  webpack: (config: any) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-router-dom': path.resolve(__dirname, 'lib/react-router-dom-shim.ts'),
    };
    return config;
  },
};

export default nextConfig;
