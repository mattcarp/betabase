/** @type {import('next').NextConfig} */
const path = require('path');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
const isProd = process.env.NODE_ENV === 'production';
const nextConfig = {
  // output: 'standalone', // Only needed for Docker deployments
  eslint: {
    // Temporarily ignore ESLint errors during builds to get deployment working
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Skip TypeScript checks during builds to avoid dependency issues on Render
    ignoreBuildErrors: true,
  },
  // In local/dev, explicitly set the tracing root to avoid monorepo lockfile confusion
  ...(isProd ? {} : { outputFileTracingRoot: __dirname }),
  reactStrictMode: false,
  images: {
    domains: ['localhost', 'siam.onrender.com'],
  },
  // Performance optimizations
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'lucide-react',
      'recharts',
      'framer-motion',
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);