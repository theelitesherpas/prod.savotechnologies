/**
 * Live-chat runtime settings, admin-configurable, DB-backed with code
 * defaults (same contract as lib/settings.ts: a fresh database changes
 * nothing about behaviour until an admin edits the values).
 *
 * Keys (ChatSetting rows, JSON values):
 *   business_hours  { enabled, timeZone, days: {1..5:{start,end}}, ... }
 * budgets string[], pre-chat budget options
 * quick_replies { label, body }[], agent canned replies
 * phone_required boolean, live-chat request needs a phone number
 *   response_window seconds an agent has to accept before follow-up (60)
 */

import { prisma } from "@/lib/prisma";

export type BusinessHours = {
  /** When false, live chat accepts requests around the clock. */
  enabled: boolean;
  /** IANA zone the hours are interpreted in, e.g. "Asia/Kolkata". */
  timeZone: string;
  /** 0=Sunday … 6=Saturday. start/end are "HH:MM" local. null = closed. */
  days: ({ start: string; end: string } | null)[];
};

export type QuickReply = { label: string; body: string };

export type LiveChatSettings = {
  businessHours: BusinessHours;
  budgets: string[];
  quickReplies: QuickReply[];
  phoneRequired: boolean;
  responseWindowSec: number;
};

export const DEFAULT_SETTINGS: LiveChatSettings = {
 // Mon, Fri 10:00 to 19:00 IST by default (spec §38); admins can change it.
  businessHours: {
    enabled: true,
    timeZone: "Asia/Kolkata",
    days: [
      null, // Sun
      { start: "10:00", end: "19:00" },
      { start: "10:00", end: "19:00" },
      { start: "10:00", end: "19:00" },
      { start: "10:00", end: "19:00" },
      { start: "10:00", end: "19:00" },
      null, // Sat
    ],
  },
 budgets: ["Under $1.5k", "$1.5k to $4k", "$3k to $5k", "$5k to $15k", "$15k to $40k", "$40k+", "Not sure yet", "Prefer to discuss"],
  quickReplies: [
 { label: "Greeting", body: "Thanks for reaching out to Savo. Happy to help! What would you like to know?" },
    { label: "More detail", body: "Could you share a little more about your project so I can point you to the right team?" },
    { label: "Discovery call", body: "Would you be available for a short discovery call this week? We can walk through your requirement together." },
 { label: "Technical review", body: "We've received your requirement and will review it with our technical team. I'll come back to you shortly." },
  ],
  phoneRequired: true,
  responseWindowSec: 60,
};

const KEY_BUSINESS_HOURS = "business_hours";
const KEY_BUDGETS = "budgets";
const KEY_QUICK_REPLIES = "quick_replies";
const KEY_PHONE_REQUIRED = "phone_required";
const KEY_RESPONSE_WINDOW = "response_window";

function coerceHours(input: unknown): BusinessHours {
  const def = DEFAULT_SETTINGS.businessHours;
  if (!input || typeof input !== "object") return def;
  const raw = input as Partial<BusinessHours>;
  if (!Array.isArray(raw.days) || raw.days.length !== 7) return def;
  const days = raw.days.map((d) => {
    if (!d || typeof d !== "object") return null;
    const { start, end } = d as { start?: unknown; end?: unknown };
    if (typeof start !== "string" || typeof end !== "string") return null;
    if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) return null;
    return { start, end };
  });
  return {
    enabled: raw.enabled !== false,
    timeZone: typeof raw.timeZone === "string" && raw.timeZone ? raw.timeZone : def.timeZone,
    days,
  };
}

export async function getLiveChatSettings(): Promise<LiveChatSettings> {
  if (!prisma) return DEFAULT_SETTINGS;
  try {
    const rows = await prisma.chatSetting.findMany();
    const byKey = new Map(rows.map((r) => [r.key, r.value]));
    const budgets = byKey.get(KEY_BUDGETS);
    const replies = byKey.get(KEY_QUICK_REPLIES);
    const phone = byKey.get(KEY_PHONE_REQUIRED);
    const window = byKey.get(KEY_RESPONSE_WINDOW);
    return {
      businessHours: coerceHours(byKey.get(KEY_BUSINESS_HOURS)),
      budgets:
        Array.isArray(budgets) && budgets.every((b) => typeof b === "string")
          ? (budgets as string[]).slice(0, 12)
          : DEFAULT_SETTINGS.budgets,
      quickReplies:
        Array.isArray(replies) && replies.every((r) => r && typeof r === "object" && typeof (r as QuickReply).label === "string" && typeof (r as QuickReply).body === "string")
          ? (replies as QuickReply[]).slice(0, 24)
          : DEFAULT_SETTINGS.quickReplies,
      phoneRequired: typeof phone === "boolean" ? phone : DEFAULT_SETTINGS.phoneRequired,
      responseWindowSec:
        typeof window === "number" && Number.isFinite(window) && window >= 30 && window <= 600
          ? Math.round(window)
          : DEFAULT_SETTINGS.responseWindowSec,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveLiveChatSettings(patch: {
  businessHours?: unknown;
  budgets?: unknown;
  quickReplies?: unknown;
  phoneRequired?: unknown;
  responseWindowSec?: unknown;
}): Promise<LiveChatSettings> {
  if (!prisma) return DEFAULT_SETTINGS;
  const writes: { key: string; value: unknown }[] = [];
  if (patch.businessHours !== undefined) writes.push({ key: KEY_BUSINESS_HOURS, value: coerceHours(patch.businessHours) });
  if (patch.budgets !== undefined && Array.isArray(patch.budgets)) {
    writes.push({
      key: KEY_BUDGETS,
      value: patch.budgets.filter((b) => typeof b === "string" && b.trim()).slice(0, 12),
    });
  }
  if (patch.quickReplies !== undefined && Array.isArray(patch.quickReplies)) {
    writes.push({
      key: KEY_QUICK_REPLIES,
      value: patch.quickReplies
        .filter((r): r is QuickReply => !!r && typeof r === "object" && typeof (r as QuickReply).label === "string" && typeof (r as QuickReply).body === "string")
        .slice(0, 24),
    });
  }
  if (patch.phoneRequired !== undefined) writes.push({ key: KEY_PHONE_REQUIRED, value: patch.phoneRequired === true });
  if (patch.responseWindowSec !== undefined && typeof patch.responseWindowSec === "number") {
    writes.push({ key: KEY_RESPONSE_WINDOW, value: Math.min(600, Math.max(30, Math.round(patch.responseWindowSec))) });
  }
  for (const w of writes) {
    await prisma.chatSetting.upsert({ where: { key: w.key }, update: { value: w.value as object }, create: { key: w.key, value: w.value as object } });
  }
  return getLiveChatSettings();
}
