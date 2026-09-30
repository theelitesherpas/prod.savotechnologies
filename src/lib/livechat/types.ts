/**
 * Live-chat shared types, the contract between the visitor widget, the
 * admin inbox and the service layer. Statuses transition server-side only
 * (see service.ts); every status change writes a ConversationEvent row.
 */

export const CONVERSATION_STATUSES = [
  "ai_only",
  "pre_chat",
  "waiting_for_agent",
  "active",
  "waiting_follow_up",
  "visitor_left",
  "closed",
  "spam",
] as const;
export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];

export const MESSAGE_TYPES = ["visitor", "ai", "agent", "system", "internal_note"] as const;
export type MessageType = (typeof MESSAGE_TYPES)[number];

export const LEAD_STATUSES = [
  "new",
  "qualified",
  "contacted",
  "meeting",
  "proposal",
  "negotiation",
  "won",
  "lost",
  "not_applicable",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const PRIORITIES = ["low", "normal", "high"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRESENCE_STATUSES = ["online", "busy", "away", "offline"] as const;
export type PresenceStatus = (typeof PRESENCE_STATUSES)[number];

/** Statuses where an agent could still legitimately pick the thread up. */
export const OPEN_STATUSES: ConversationStatus[] = [
  "waiting_for_agent",
  "active",
  "waiting_follow_up",
  "visitor_left",
];

export type MessageDTO = {
  id: string;
  type: MessageType;
  body: string;
  senderName: string | null;
  createdAt: string;
};

export type ConversationSummaryDTO = {
  id: string;
  status: ConversationStatus;
  mode: "ai" | "human";
  service: string | null;
  stage: string | null;
  timeline: string | null;
  budget: string | null;
  leadName: string | null;
  leadEmail: string | null;
  leadPhoneMasked: string | null;
  leadCountry: string | null;
  leadStatus: string;
  priority: Priority;
  assignedName: string | null;
  unreadForAgent: number;
  lastMessage: string | null;
  lastMessageAt: string;
  visitorOnline: boolean;
  createdAt: string;
};

export type ConversationDetailDTO = ConversationSummaryDTO & {
  requirement: string | null;
 leadPhone: string | null; // full number, admins with access only
  aiSummary: string | null;
  context: {
    landingPage?: string;
    currentPage?: string;
    referrer?: string;
    utm?: Record<string, string>;
  } | null;
  assignedId: string | null;
  followUpAt: string | null;
  acceptedAt: string | null;
  humanRequestedAt: string | null;
  tags: string[];
  messages: MessageDTO[];
  events: { id: string; type: string; actorName: string | null; createdAt: string; meta: unknown }[];
  previousConversations: { id: string; createdAt: string; status: string; service: string | null }[];
};

/** Mask a phone for visitor-facing display and low-privilege surfaces. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return "•".repeat(Math.max(digits.length - 1, 2)) + digits.slice(-1);
  return `${"•".repeat(Math.min(digits.length - 4, 6))} ${digits.slice(-4)}`;
}
