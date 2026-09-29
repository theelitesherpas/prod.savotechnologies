/**
 * Live-chat availability: business hours (admin-configured) and real agent
 * presence. The visitor-facing "Talk to a Human" CTA is honest — it only
 * promises a human when one is plausibly there: within configured hours AND
 * at least one agent heartbeating recently. Outside that, the widget offers
 * "Leave a Message" and the request lands in waiting_follow_up.
 *
 * Pure time logic (withinBusinessHours) is unit-tested; presence needs the
 * DB and degrades to "offline" without one.
 */

import { prisma } from "@/lib/prisma";
import type { BusinessHours } from "./settings";
import type { PresenceStatus } from "./types";

/** Heartbeat freshness for "online": admin UI pings every 30s. */
export const PRESENCE_ONLINE_MS = 75 * 1000;
/** After this without a heartbeat an agent reads as away, then offline. */
export const PRESENCE_AWAY_MS = 3 * 60 * 1000;
export const PRESENCE_OFFLINE_MS = 10 * 60 * 1000;

/** Visitor connection freshness for the admin "online/idle/disconnected" dot. */
export const VISITOR_ONLINE_MS = 45 * 1000;
export const VISITOR_IDLE_MS = 3 * 60 * 1000;

export function withinBusinessHours(hours: BusinessHours, now: Date = new Date()): boolean {
  if (!hours.enabled) return true;
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: hours.timeZone,
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
      hour12: false,
    }).formatToParts(now);
  } catch {
    // Unknown time zone — fall back to server-local interpretation.
    parts = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", weekday: "short", hour12: false }).formatToParts(now);
  }
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayIndex = weekdays.indexOf(get("weekday"));
  const today = hours.days[dayIndex >= 0 && dayIndex < 7 ? dayIndex : 0];
  if (!today) return false;
  const minutes = Number(get("hour")) * 60 + Number(get("minute"));
  const [sh, sm] = today.start.split(":").map(Number);
  const [eh, em] = today.end.split(":").map(Number);
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  return minutes >= start && minutes <= end;
}

export type AgentsOnline = { online: number; busy: number; away: number; anyActive: boolean };

export async function getAgentsOnline(): Promise<AgentsOnline> {
  if (!prisma) return { online: 0, busy: 0, away: 0, anyActive: false };
  try {
    const rows = await prisma.agentPresence.findMany({ where: { lastSeenAt: { gte: new Date(Date.now() - PRESENCE_OFFLINE_MS) } } });
    let online = 0;
    let busy = 0;
    let away = 0;
    for (const row of rows) {
      const effective = effectivePresence(row.status, row.lastSeenAt);
      if (effective === "online") online += 1;
      else if (effective === "busy") busy += 1;
      else if (effective === "away") away += 1;
    }
    return { online, busy, away, anyActive: online + busy > 0 };
  } catch {
    return { online: 0, busy: 0, away: 0, anyActive: false };
  }
}

/** A stale heartbeat demotes a manual status: online→away→offline. */
export function effectivePresence(status: PresenceStatus | string, lastSeenAt: Date): PresenceStatus {
  const age = Date.now() - lastSeenAt.getTime();
  if (age > PRESENCE_OFFLINE_MS) return "offline";
  if (age > PRESENCE_AWAY_MS) return status === "offline" ? "offline" : "away";
  return (status as PresenceStatus) ?? "offline";
}

export function visitorConnection(lastSeenAt: Date | null | undefined): "online" | "idle" | "disconnected" {
  if (!lastSeenAt) return "disconnected";
  const age = Date.now() - lastSeenAt.getTime();
  if (age <= VISITOR_ONLINE_MS) return "online";
  if (age <= VISITOR_IDLE_MS) return "idle";
  return "disconnected";
}

/** Should the widget offer live chat right now (vs Leave a Message)? */
export async function liveChatOpen(hours: BusinessHours): Promise<boolean> {
  if (!withinBusinessHours(hours)) return false;
  const agents = await getAgentsOnline();
  return agents.anyActive;
}
