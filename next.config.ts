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
  // The Next.js file tracer bundles @prisma/client's ENTIRE runtime
  // directory into every function that imports it — including the native
  // query engine binary and every database dialect's engine/compiler wasm
  // variant (mysql, sqlite, sqlserver, cockroachdb) — even though the
  // generator's engineType="client" + @prisma/adapter-neon setup (see
  // prisma/schema.prisma, src/lib/prisma.ts) only ever loads
  // query_compiler_bg.wasm for postgresql via a plain fs.readFileSync.
  // Confirmed by inspecting .next/server/**/*.nft.json: this was adding
  // ~80MB of dead weight per function, which is what was actually filling
  // up Vercel's Functions Storage across ~99 API routes, not the engine
  // switch itself (that part had already correctly dropped the reachable
  // code path, but Next.js's static tracer can't know that at build time).
  outputFileTracingExcludes: {
    "**/*": [
      "node_modules/.prisma/client/libquery_engine-*",
      "node_modules/.prisma/client/query_engine_bg.wasm",
      "node_modules/.prisma/client/query_engine_bg.js",
      "node_modules/@prisma/client/runtime/query_engine_bg.*",
      "node_modules/@prisma/client/runtime/query_compiler_bg.*.wasm-base64.*",
      "node_modules/@prisma/client/runtime/binary.js",
      "node_modules/@prisma/client/runtime/binary.mjs",
      "node_modules/@prisma/client/runtime/library.js",
      "node_modules/@prisma/client/runtime/library.mjs",
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  compress: true,
};

export default nextConfig;
