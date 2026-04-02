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
  async rewrites() {
    return [
      {
        // Forward ke backend KECUALI /api/auth/* yang ditangani Next.js route.ts
        source: "/api/:path((?!auth(?:/|$)).+)",
        destination: "http://localhost:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig as any;
