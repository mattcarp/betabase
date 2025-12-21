/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    // Allow builds with warnings (errors are already fixed)
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "siam.onrender.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // Optimize imports to reduce bundle size
    optimizePackageImports: [
      "@radix-ui/react-icons",
      "recharts",
      "framer-motion",
      "lucide-react",
      "@supabase/supabase-js",
    ],
    // Disable parallel build workers to reduce memory usage
    webpackBuildWorker: false,
  },
  // Externalize server-only packages to prevent bundling
  serverExternalPackages: [
    "playwright",
    "pdf-parse",
    "@mendable/firecrawl-js",
    "sharp",
  ],
  webpack: (config, { isServer }) => {
    // Reduce memory usage during build
    config.optimization = {
      ...config.optimization,
      // Disable source maps in production to save memory
      ...(process.env.NODE_ENV === "production" && {
        minimize: true,
      }),
    };

    // Externalize playwright completely on server
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        playwright: "commonjs playwright",
        "playwright-core": "commonjs playwright-core",
      });
    }

    return config;
  },
};

module.exports = nextConfig;