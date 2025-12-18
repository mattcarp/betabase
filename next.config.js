module.exports = {
  "output": "standalone",
  "typescript": {
    "ignoreBuildErrors": true
  },
  "reactStrictMode": true,
  "images": {
    "remotePatterns": [
      {
        "protocol": "http",
        "hostname": "localhost"
      },
      {
        "protocol": "https",
        "hostname": "siam.onrender.com"
      }
    ],
    "formats": [
      "image/avif",
      "image/webp"
    ]
  },
  "experimental": {
    "optimizePackageImports": [
      "@radix-ui/react-icons",
      "recharts",
      "framer-motion"
    ]
  }
}