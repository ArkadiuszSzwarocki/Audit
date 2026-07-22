import { PrismaClient } from '@/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const adapter = new PrismaLibSql({ url: 'file:./dev.db' });

export function getPrismaClient(): PrismaClient {
  if (
    !globalForPrisma.prisma ||
    !(globalForPrisma.prisma as any).auditTypeQuestion ||
    !(globalForPrisma.prisma as any).kaizenScoringCategory
  ) {
    globalForPrisma.prisma = new PrismaClient({
      adapter,
      log: ['query'],
    });
  }
  return globalForPrisma.prisma;
}

// Proxy wrapper ensures that if PrismaClient schema was regenerated,
// accessing any model property will fetch or instantiate the fresh PrismaClient instance.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});
