import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  // Allow leaflet CSS
  transpilePackages: ["react-leaflet"],
};

export default nextConfig;
