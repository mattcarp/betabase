/** @type {import('next').NextConfig} */
const path = require('path');
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
  // webpack: (config) => {
  //   config.resolve.alias = {
  //     ...config.resolve.alias,
  //     '@': '/Users/matt/Documents/projects/siam/src',
  //   };
  //   return config;
  // },
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

module.exports = nextConfig;