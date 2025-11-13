import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pooling is handled by the database connection string
  // For PostgreSQL, connection pooling can be configured in the DATABASE_URL
  // Example: postgresql://user:password@host:port/database?connection_limit=10&pool_timeout=20
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;