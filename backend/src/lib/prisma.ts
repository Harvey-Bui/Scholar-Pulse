import { PrismaClient } from '@prisma/client';

// On Vercel, each warm serverless invocation can re-run this module; caching
// the client on `globalThis` avoids opening a fresh Postgres connection pool
// per invocation. Harmless for a normal long-running server too.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
