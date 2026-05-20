import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sisko.levelupgen.com',
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;
