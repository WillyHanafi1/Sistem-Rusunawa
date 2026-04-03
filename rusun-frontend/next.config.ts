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
  trailingSlash: true,
  async rewrites() {
    return [
      {
        source: "/api/:path((?!auth(?:/|$)).+)",
        destination: "http://localhost:8100/api/:path*",
      },
    ];
  },
};

export default nextConfig as any;
