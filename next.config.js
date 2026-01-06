const webpack = require("webpack");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: __dirname,
  typescript: {
    ignoreBuildErrors: true,
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

    // Add fallbacks for Node.js modules when bundling for browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        buffer: false,
      };

      // Polyfill process.env for libraries like vscode-textmate that check it at runtime
      config.plugins.push(
        new webpack.DefinePlugin({
          "process.env.VSCODE_TEXTMATE_DEBUG": JSON.stringify(false),
        })
      );
    }

    return config;
  },
};

module.exports = nextConfig;
