import { PrismaClient } from '@prisma/client';

// Ensure single Prisma instance in dev
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  });

if (process.env.NODE_ENV === 'development') {
  globalForPrisma.prisma = prisma;
}
