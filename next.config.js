/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: '/Users/matt/Documents/projects/siam',
  reactStrictMode: false,
  images: {
    domains: ['localhost', 'siam.onrender.com'],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': '/Users/matt/Documents/projects/siam/src',
    };
    return config;
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

module.exports = nextConfig;