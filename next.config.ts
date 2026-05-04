import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  transpilePackages: ["react-leaflet"],
  // Keep Prisma's generated runtime out of the Next.js bundle so the
  // generated client (with the latest models from prisma generate)
  // is loaded fresh from node_modules at runtime instead of being
  // tree-shaken / cached at build time.
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-neon"],
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  compress: true,
};

export default nextConfig;
