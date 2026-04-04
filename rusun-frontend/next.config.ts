import type { NextConfig } from "next";
import path from "path";

const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  turbopack: {
    root: process.cwd(),
  },
  trailingSlash: false,
  async rewrites() {
    return [
      {
        source: "/api/:path((?!auth/).*)", // Match /api/xxx but NOT /api/auth/xxx
        destination: `${process.env.API_INTERNAL_URL || "http://localhost:8100"}/api/:path*`,
      },
      {
        source: "/api", // Special case for exact root /api if needed
        destination: `${process.env.API_INTERNAL_URL || "http://localhost:8100"}/api`,
      },
    ];
  },
};

export default nextConfig as any;
