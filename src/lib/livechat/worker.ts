/**
 * Live-chat background worker — the server-side heartbeat that makes the
 * 60-second response window real (spec §10): it runs inside the Next.js
 * server process, started once from instrumentation.ts, and never depends
 * on any browser tab being open.
 *
 * Every SWEEP_INTERVAL_MS:
 *   1. conversation sweep — response-window timeouts, visitor disconnects
 *   2. presence decay    — stale agent heartbeats demote online→away→offline
 *
 * Single-instance deployment: an interval per process is exactly right.
 * (Turbopack dev may load this twice; the global flag keeps one timer.)
 */

import { sweepOnce } from "./service";
import { publish } from "./pubsub";
import { PRESENCE_AWAY_MS, PRESENCE_OFFLINE_MS } from "./availability";

const SWEEP_INTERVAL_MS = 5_000;
const PRESENCE_PASS_EVERY = 6; // sweeps between presence checks (~30s)
const globalForWorker = globalThis as unknown as { __liveChatSweep?: NodeJS.Timeout; __liveChatSweepTick?: number };

async function presencePass(): Promise<void> {
  const { prisma } = await import("@/lib/prisma");
  if (!prisma) return;
  try {
    const stale = await prisma.agentPresence.findMany({
      where: { status: { in: ["online", "busy", "away"] }, lastSeenAt: { lt: new Date(Date.now() - PRESENCE_AWAY_MS) } },
      take: 50,
    });
    let changed = false;
    for (const row of stale) {
      const age = Date.now() - row.lastSeenAt.getTime();
      const next = age > PRESENCE_OFFLINE_MS ? "offline" : row.status === "away" ? "away" : "away";
      if (next !== row.status) {
        await prisma.agentPresence.update({ where: { userId: row.userId }, data: { status: next, manual: false } });
        changed = true;
      }
    }
    if (changed) publish("admin", { type: "counts.changed" });
  } catch {
    // Presence decay is best-effort.
  }
}

export function startLiveChatWorker(): void {
  if (globalForWorker.__liveChatSweep) return;
  const timer = setInterval(() => {
    void (async () => {
      try {
        await sweepOnce();
        globalForWorker.__liveChatSweepTick = (globalForWorker.__liveChatSweepTick ?? 0) + 1;
        if (globalForWorker.__liveChatSweepTick % PRESENCE_PASS_EVERY === 0) await presencePass();
      } catch {
        // A failed pass never kills the timer.
      }
    })();
  }, SWEEP_INTERVAL_MS);
  if (typeof timer.unref === "function") timer.unref();
  globalForWorker.__liveChatSweep = timer;
}
