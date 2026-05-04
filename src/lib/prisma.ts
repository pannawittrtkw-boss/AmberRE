import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

// Use Neon's HTTP-based serverless driver in production (Vercel) so each
// invocation skips the TCP connection setup that caused 1-2s cold latency.
// In dev (no Vercel) fall back to the default TCP-based PrismaClient.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (process.env.VERCEL && connectionString) {
    const adapter = new PrismaNeon({ connectionString });
    return new PrismaClient({ adapter });
  }
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
