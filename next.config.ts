import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/sitemap.xml", destination: "/sitemap.xml" },
        { source: "/robots.txt", destination: "/robots.txt" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  images: {
    qualities: [75, 80, 85, 90, 100],
    remotePatterns: [
      { hostname: "ibb.co" },
      { hostname: "i.ibb.co" },
      { protocol: "http", hostname: "localhost", port: "5000" },
      { protocol: "http", hostname: "localhost", port: "3000" },
      { protocol: "https", hostname: "**.railway.app" },
      { protocol: "https", hostname: "**.render.com" },
      { protocol: "https", hostname: "**.onrender.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "cloudinary.com" },
    ],
  },
};

export default nextConfig;
