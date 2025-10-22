/** @type {import('next').NextConfig} */
const path = require('path');
const isProd = process.env.NODE_ENV === 'production';

// Bundle analyzer configuration
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  // output: 'standalone', // Only needed for Docker deployments

  // PERFORMANCE OPTIMIZATION: Enable ESLint checks (was: ignoreDuringBuilds: true)
  eslint: {
    // Only ignore during builds in development, enforce in production
    ignoreDuringBuilds: !isProd,
  },

  // PERFORMANCE OPTIMIZATION: Enable TypeScript checks (was: ignoreBuildErrors: true)
  typescript: {
    // Only ignore during builds in development, enforce in production
    ignoreBuildErrors: !isProd,
  },

  // In local/dev, explicitly set the tracing root to avoid monorepo lockfile confusion
  ...(isProd ? {} : { outputFileTracingRoot: __dirname }),

  // PERFORMANCE OPTIMIZATION: Enable React strict mode
  reactStrictMode: true,

  // PERFORMANCE OPTIMIZATION: Image optimization
  images: {
    domains: ['localhost', 'siam.onrender.com'],
    formats: ['image/avif', 'image/webp'],
  },

  // PERFORMANCE OPTIMIZATION: Production optimizations
  ...(isProd && {
    compiler: {
      removeConsole: {
        exclude: ['error', 'warn'],
      },
    },
  }),

  // PERFORMANCE OPTIMIZATION: Enable SWC minification
  swcMinify: true,

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);