import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Liveness/readiness probe for uptime monitors and orchestrators.
 * Returns 200 when the app answers, 503 when the database is unreachable.
 * Exposes no operational detail beyond status and version.
 */
export async function GET() {
  let db: "up" | "down" = "down";
  if (prisma) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      db = "up";
    } catch {
      db = "down";
    }
  }

  const body = {
    ok: db === "up",
    status: db,
    version: process.env.npm_package_version ?? "0.1.0",
    env: env.NODE_ENV,
    time: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    status: db === "up" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
