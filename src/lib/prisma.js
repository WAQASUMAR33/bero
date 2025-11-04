import { PrismaClient } from '@prisma/client';

// Increase max listeners to prevent warnings from Prisma Client
if (process.stdout) {
  process.stdout.setMaxListeners(20);
}
if (process.stderr) {
  process.stderr.setMaxListeners(20);
}

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

