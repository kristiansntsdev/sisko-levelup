import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
