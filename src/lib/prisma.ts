import { PrismaClient } from "@prisma/client";

/**
 * Prisma singleton - avoids exhausting connections during dev hot reloads.
 * Returns null when no database is configured so the enquiry API can
 * degrade gracefully instead of crashing the render path.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient | null };

export const prisma: PrismaClient | null =
  globalForPrisma.prisma ??
  (process.env.DATABASE_URL ? new PrismaClient({ log: ["error"] }) : null);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
