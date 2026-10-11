import "server-only";
import { PrismaClient } from "@prisma/client";
import { serverEnv } from "@/lib/server-env";

/**
 * Prisma singleton - avoids exhausting connections during dev hot reloads.
 * Returns null when no database is configured so the enquiry API can
 * degrade gracefully instead of crashing the render path.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient | null };

export const prisma: PrismaClient | null =
  globalForPrisma.prisma ??
  (serverEnv.DATABASE_URL ? new PrismaClient({
    datasources: { db: { url: serverEnv.DATABASE_URL } },
    // Raw engine errors can contain SQL parameters; callers emit safe operational events.
    log: [],
  }) : null);

// One client per process/module realm in production too. This is NOT a cross-process pool.
if (prisma) globalForPrisma.prisma = prisma;
