import "server-only";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Append-only audit trail for admin operations.
 * Failures are logged but never break the mutation the trail belongs to.
 */
export async function audit(
  userId: string | null,
  action: string,
  entity?: string,
  entityId?: string,
  meta?: Record<string, unknown>,
): Promise<void> {
  if (!prisma) return;
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        meta: meta ? (JSON.parse(JSON.stringify(meta)) as import("@prisma/client").Prisma.InputJsonValue) : undefined,
      },
    });
  } catch (err) {
    logger.warn("audit.write_failed", {
      action,
      message: err instanceof Error ? err.message : "unknown",
    });
  }
}
