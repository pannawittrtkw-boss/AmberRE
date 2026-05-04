import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  transpilePackages: ["react-leaflet"],
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  compress: true,
};

export default nextConfig;
