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
  async redirects() {
    return [
      {
        // Halaman di domain Vercel lama → produksi. Cookie PKCE login Google per host,
        // callback-nya (AUTH_URL) di www, jadi login yang mulai di sini selalu gagal
        // (InvalidCheck → "Server error"). /api/* tidak: Apps Script pakai Bearer.
        source: '/:path((?!api/|_next/).*)',
        has: [{ type: 'host', value: 'sisko-v2.vercel.app' }],
        destination: 'https://www.levelupgen.com/:path',
        permanent: false,
      },
    ]
  },
};

export default nextConfig;
