import { PrismaClient } from '@prisma/client';

// Singleton — critical for serverless: avoids exhausting DB connections by
// reusing one client across warm function invocations.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ['error'] });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
