/**
 * Live-chat service layer — every conversation operation the visitor API
 * and the admin API need, in one module. All status transitions happen
 * here (never trusted from the client), every transition writes a
 * ConversationEvent row, and every change fans out on the pub/sub bus so
 * SSE streams update both sides in real time.
 */

import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { answerQuestion } from "@/lib/assistant";
import { sendMailNow, teamEmail } from "@/lib/mail";
import { publish, publishConversationEvent } from "./pubsub";
import { wantsHuman } from "./handoff";
import { buildAiSummary } from "./summary";
import { getLiveChatSettings } from "./settings";
import { visitorConnection } from "./availability";
import {
  maskPhone,
  type ConversationStatus,
  type ConversationSummaryDTO,
  type ConversationDetailDTO,
  type MessageDTO,
  type MessageType,
} from "./types";
import type { AdminSessionUser } from "@/lib/auth";

/* ───────────────────────────── tokens ───────────────────────────── */

export function newVisitorToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashVisitorToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newPublicToken(): string {
  return randomBytes(16).toString("base64url");
}

/* ─────────────────────────── DTO mapping ─────────────────────────── */

type ConvRow = NonNullable<Awaited<ReturnType<typeof loadConversation>>>;

async function loadConversation(id: string) {
  if (!prisma) return null;
  return prisma.chatConversation.findUnique({
    where: { id },
    include: {
      visitor: true,
      assigned: { select: { id: true, name: true } },
      tags: { include: { tag: true } },
    },
  });
}

export function toMessageDTO(m: {
  id: string;
  type: string;
  body: string;
  senderName: string | null;
  createdAt: Date;
}): MessageDTO {
  return { id: m.id, type: m.type as MessageType, body: m.body, senderName: m.senderName, createdAt: m.createdAt.toISOString() };
}

export function toSummaryDTO(c: ConvRow): ConversationSummaryDTO {
  return {
    id: c.id,
    status: c.status as ConversationStatus,
    mode: c.mode === "human" ? "human" : "ai",
    service: c.service,
    stage: c.stage,
    timeline: c.timeline,
    budget: c.budget,
    leadName: c.leadName,
    leadEmail: c.leadEmail,
    leadPhoneMasked: c.leadPhone ? maskPhone(c.leadPhone) : null,
    leadCountry: c.leadCountry,
    leadStatus: c.leadStatus,
    priority: (c.priority as ConversationSummaryDTO["priority"]) ?? "normal",
    assignedName: c.assigned?.name ?? null,
    unreadForAgent: c.unreadForAgent,
    lastMessage: c.lastMessagePreview ?? null,
    lastMessageAt: c.lastMessageAt.toISOString(),
    visitorOnline: visitorConnection(c.visitor.lastSeenAt) !== "disconnected",
    createdAt: c.createdAt.toISOString(),
  };
}

export async function toDetailDTO(c: ConvRow): Promise<ConversationDetailDTO> {
  if (!prisma) throw new Error("no database");
  const [messages, events, previous] = await Promise.all([
    prisma.chatMessage.findMany({ where: { conversationId: c.id }, orderBy: { createdAt: "asc" }, take: 500 }),
    prisma.conversationEvent.findMany({ where: { conversationId: c.id }, orderBy: { createdAt: "asc" }, take: 200 }),
    prisma.chatConversation.findMany({
      where: { visitorId: c.visitorId, id: { not: c.id } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, createdAt: true, status: true, service: true },
    }),
  ]);
  return {
    ...toSummaryDTO(c),
    requirement: c.requirement,
    leadPhone: c.leadPhone,
    aiSummary: c.aiSummary,
    context: (c.context as ConversationDetailDTO["context"]) ?? null,
    assignedId: c.assignedId,
    followUpAt: c.followUpAt?.toISOString() ?? null,
    acceptedAt: c.acceptedAt?.toISOString() ?? null,
    humanRequestedAt: c.humanRequestedAt?.toISOString() ?? null,
    tags: c.tags.map((t) => t.tag.label),
    messages: messages.map(toMessageDTO),
    events: events.map((e) => ({ id: e.id, type: e.type, actorName: e.actorName, createdAt: e.createdAt.toISOString(), meta: e.meta })),
    previousConversations: previous.map((p) => ({ id: p.id, createdAt: p.createdAt.toISOString(), status: p.status, service: p.service })),
  };
}

/* ─────────────────────────── visitor session ─────────────────────────── */

export async function ensureVisitor(
  token: string | null,
  meta: { ipHash?: string | null; userAgent?: string | null; landingPage?: string | null },
): Promise<{ id: string; token: string; created: boolean } | null> {
  if (!prisma) return null;
  if (token) {
    const existing = await prisma.chatVisitor.findUnique({ where: { tokenHash: hashVisitorToken(token) } });
    if (existing) {
      if (existing.blocked) return null;
      await prisma.chatVisitor.update({ where: { id: existing.id }, data: { lastSeenAt: new Date() } }).catch(() => undefined);
      return { id: existing.id, token, created: false };
    }
  }
  const fresh = newVisitorToken();
  const row = await prisma.chatVisitor.create({
    data: {
      tokenHash: hashVisitorToken(fresh),
      ipHash: meta.ipHash ?? null,
      userAgent: meta.userAgent?.slice(0, 300) ?? null,
      landingPage: meta.landingPage?.slice(0, 500) ?? null,
    },
  });
  return { id: row.id, token: fresh, created: true };
}

export async function getVisitorIdByToken(token: string): Promise<string | null> {
  if (!prisma) return null;
  const v = await prisma.chatVisitor.findUnique({ where: { tokenHash: hashVisitorToken(token) } });
  if (!v || v.blocked) return null;
  return v.id;
}

export async function touchVisitor(visitorId: string): Promise<void> {
  if (!prisma) return;
  await prisma.chatVisitor.update({ where: { id: visitorId }, data: { lastSeenAt: new Date() } }).catch(() => undefined);
}

/* ─────────────────────────── conversations ─────────────────────────── */

const RESUMABLE: ConversationStatus[] = ["ai_only", "pre_chat", "waiting_for_agent", "active", "waiting_follow_up"];

export async function getResumableConversation(visitorId: string): Promise<ConvRow | null> {
  if (!prisma) return null;
  const rows = await prisma.chatConversation.findMany({
    where: { visitorId, status: { in: RESUMABLE } },
    orderBy: { lastMessageAt: "desc" },
    take: 1,
    include: { visitor: true, assigned: { select: { id: true, name: true } }, tags: { include: { tag: true } } },
  });
  return rows[0] ?? null;
}

export async function getConversationByPublicToken(publicToken: string, visitorId?: string): Promise<ConvRow | null> {
  if (!prisma) return null;
  const row = await prisma.chatConversation.findUnique({
    where: { publicToken },
    include: { visitor: true, assigned: { select: { id: true, name: true } }, tags: { include: { tag: true } } },
  });
  if (!row) return null;
  // Visitors may only ever touch their own thread.
  if (visitorId && row.visitorId !== visitorId) return null;
  return row;
}

export async function getConversationById(id: string): Promise<ConvRow | null> {
  return loadConversation(id);
}

/** The AI-only scratch conversation every visitor gets on first message. */
export async function ensureAiConversation(
  visitorId: string,
  context: { landingPage?: string; currentPage?: string; referrer?: string; utm?: Record<string, string> } | null,
): Promise<ConvRow> {
  if (!prisma) throw new Error("no database");
  const existing = await getResumableConversation(visitorId);
  if (existing) {
    if (context?.currentPage && (existing.context as Record<string, unknown> | null)?.currentPage !== context.currentPage) {
      await prisma.chatConversation
        .update({ where: { id: existing.id }, data: { context: { ...(existing.context as object), currentPage: context.currentPage } } })
        .catch(() => undefined);
    }
    return existing;
  }
  return prisma.chatConversation.create({
    data: {
      publicToken: newPublicToken(),
      visitorId,
      status: "ai_only",
      context: context ?? undefined,
    },
    include: { visitor: true, assigned: { select: { id: true, name: true } }, tags: { include: { tag: true } } },
  });
}

/* ─────────────────────────── messages ─────────────────────────── */

export async function appendMessage(
  conversationId: string,
  input: { type: MessageType; body: string; agentId?: string | null; senderName?: string | null },
): Promise<MessageDTO | null> {
  if (!prisma) return null;
  const body = input.body.slice(0, 4000);
  const msg = await prisma.chatMessage.create({
    data: {
      conversationId,
      type: input.type,
      body,
      agentId: input.agentId ?? null,
      senderName: input.senderName?.slice(0, 120) ?? null,
    },
  });
  const unread =
    input.type === "visitor" || input.type === "ai"
      ? { unreadForAgent: { increment: 1 }, unreadForVisitor: { set: 0 } }
      : input.type === "agent"
        ? { unreadForVisitor: { increment: 1 }, unreadForAgent: { set: 0 } }
        : {};
  await prisma.chatConversation.update({
    where: { id: conversationId },
    data: {
      lastMessageAt: new Date(),
      lastMessagePreview: body.replace(/\s+/g, " ").slice(0, 140),
      ...unread,
    },
  });
  const dto = toMessageDTO(msg);
  // Internal notes NEVER reach the visitor channel (spec §27) — they fan
  // out to the admin inbox only. Everything else is visitor-visible.
  if (input.type !== "internal_note") {
    publishConversationEvent(conversationId, { type: "message.new", conversationId, message: dto });
  } else {
    publish("admin", { type: "message.new", conversationId, message: dto });
  }
  return dto;
}

async function recordEvent(conversationId: string, type: string, actor?: { id?: string | null; name?: string | null }, meta?: object): Promise<void> {
  if (!prisma) return;
  await prisma.conversationEvent
    .create({
      data: { conversationId, type, actorId: actor?.id ?? null, actorName: actor?.name ?? null, meta: meta as object },
    })
    .catch(() => undefined);
}

/* ─────────────────────────── AI mode ─────────────────────────── */

export type AskResult =
  | { kind: "entry"; entryId: string; handoff: false }
  | { kind: "miss"; handoff: false }
  | { kind: "human_mode"; handoff: false }
  | { kind: "handoff"; handoff: true };

const HANDOFF_PROMPT =
  "Of course. I can connect you with the Savo team. I'll collect a few details first so the right person has some context before joining the conversation.";

const MISS_TEXT =
  "That one's beyond my verified notes — and I won't guess. Ask me about Savo's services, process, pricing, technology, offices or careers — or talk to the team directly and a senior consultant replies within one business day.";

export async function visitorAsk(conversationId: string, text: string): Promise<AskResult | null> {
  if (!prisma) return null;
  const conv = await prisma.chatConversation.findUnique({ where: { id: conversationId } });
  if (!conv) return null;

  await appendMessage(conversationId, { type: "visitor", body: text });
  await touchVisitor(conv.visitorId);

  // While the thread belongs to a human (waiting, active, follow-up or
  // visitor-left), Savo AI stays silent (owner rule): the visitor's words go
  // to the team, never to the AI — until the chat is ended and a fresh
  // conversation begins.
  if (conv.mode === "human") return { kind: "human_mode", handoff: false };

  if (wantsHuman(text)) {
    await appendMessage(conversationId, { type: "ai", body: HANDOFF_PROMPT });
    if (conv.status === "ai_only") {
      await setStatus(conversationId, "pre_chat", { note: "Visitor asked for a human" });
    }
    return { kind: "handoff", handoff: true };
  }

  const entry = answerQuestion(text);
  if (entry) {
    // Deterministic site-truth answers are rendered rich on the client;
    // the stored body mirrors the first paragraph for the admin thread.
    await appendMessage(conversationId, { type: "ai", body: entry.paragraphs.join("\n\n") });
    return { kind: "entry", entryId: entry.id, handoff: false };
  }
  await appendMessage(conversationId, { type: "ai", body: MISS_TEXT });
  return { kind: "miss", handoff: false };
}

/* ─────────────────────────── status core ─────────────────────────── */

async function setStatus(
  conversationId: string,
  status: ConversationStatus,
  opts: { actor?: { id?: string | null; name?: string | null }; note?: string; meta?: object; lateAccept?: boolean; skipVisitorStatus?: boolean } = {},
): Promise<void> {
  if (!prisma) return;
  const data: Record<string, unknown> = { status };
  if (status === "waiting_for_agent" ) data.humanRequestedAt = new Date();
  if (status === "active" && !opts.meta) data.acceptedAt = new Date();
  if (status === "closed") data.closedAt = new Date();
  if (status === "ai_only") data.mode = "ai";
  await prisma.chatConversation.update({ where: { id: conversationId }, data });
  await recordEvent(conversationId, `status:${status}`, opts.actor, { note: opts.note, ...opts.meta });
  publishConversationEvent(conversationId, {
    type: "status.changed",
    conversationId,
    status,
    agentName: (opts.meta as { agentName?: string } | undefined)?.agentName ?? null,
    note: opts.note,
    lateAccept: opts.lateAccept,
  });
  publish("admin", { type: "counts.changed" });
}

/* ─────────────────────────── human request ─────────────────────────── */

export type QualificationInput = {
  service?: string | null;
  stage?: string | null;
  requirement?: string | null;
  timeline?: string | null;
  budget?: string | null;
};

export type ContactInput = {
  name: string;
  phone?: string | null;
  country?: string | null;
  email?: string | null;
};

export async function startHumanRequest(input: {
  visitorId: string;
  conversation?: ConvRow | null;
  qualification: QualificationInput;
  contact: ContactInput;
  consent: boolean;
  pageContext: { landingPage?: string; currentPage?: string; referrer?: string; utm?: Record<string, string> } | null;
  /** True when availability already says nobody is there (offline flow). */
  offline?: boolean;
}): Promise<{ conversation: ConvRow; offline: boolean } | { error: string }> {
  if (!prisma) return { error: "Live chat is unavailable right now." };
  if (!input.consent) return { error: "Please confirm we may contact you about this enquiry." };

  // Resolve the thread: the supplied one, or the resumable one, or fresh.
  let conv = input.conversation ?? null;
  if (conv && conv.visitorId !== input.visitorId) conv = null;
  if (!conv) conv = await getResumableConversation(input.visitorId);
  if (!conv) {
    conv = await prisma.chatConversation.create({
      data: {
        publicToken: newPublicToken(),
        visitorId: input.visitorId,
        status: "ai_only",
        context: input.pageContext ?? undefined,
      },
      include: { visitor: true, assigned: { select: { id: true, name: true } }, tags: { include: { tag: true } } },
    });
  }

  const q = input.qualification;
  const visitorMessages = await prisma.chatMessage.findMany({
    where: { conversationId: conv.id, type: "visitor" },
    orderBy: { createdAt: "asc" },
    take: 30,
    select: { body: true },
  });

  const mergedContext = { ...((conv.context as object) ?? {}), ...(input.pageContext ?? {}) };
  const phoneDisplay = input.contact.phone?.trim() || null;
  const summary = buildAiSummary({
    service: q.service ?? conv.service,
    stage: q.stage ?? conv.stage,
    requirement: q.requirement ?? conv.requirement,
    timeline: q.timeline ?? conv.timeline,
    budget: q.budget ?? conv.budget,
    leadName: input.contact.name,
    leadCountry: input.contact.country,
    visitorMessages: visitorMessages.map((m) => m.body),
  });

  await prisma.chatConversation.update({
    where: { id: conv.id },
    data: {
      service: q.service ?? conv.service,
      stage: q.stage ?? conv.stage,
      requirement: q.requirement ?? conv.requirement,
      timeline: q.timeline ?? conv.timeline,
      budget: q.budget ?? conv.budget,
      leadName: input.contact.name.slice(0, 120),
      leadEmail: input.contact.email?.slice(0, 160) || null,
      leadPhone: input.contact.phone?.slice(0, 32) || null,
      leadCountry: input.contact.country?.slice(0, 60) || null,
      leadStatus: "new",
      aiSummary: summary,
      context: mergedContext,
      mode: "human",
    },
  });
  await prisma.chatVisitor.update({
    where: { id: input.visitorId },
    data: {
      name: input.contact.name.slice(0, 120),
      email: input.contact.email?.slice(0, 160) || null,
      phone: input.contact.phone?.slice(0, 32) || null,
      countryCode: input.contact.country?.slice(0, 60) || null,
    },
  }).catch(() => undefined);

  /* Record everything the visitor gave us directly in the thread — the
     conversation is the lead record (spec §8, §31). */
  const detailLines = [
    `Lead captured — ${input.contact.name}`,
    q.service ?? conv.service ? `Discuss: ${q.service ?? conv.service}` : null,
    q.stage ?? conv.stage ? `Stage: ${q.stage ?? conv.stage}` : null,
    q.requirement ?? conv.requirement ? `Requirement: ${(q.requirement ?? conv.requirement)!.slice(0, 400)}` : null,
    q.timeline ?? conv.timeline ? `Timeline: ${q.timeline ?? conv.timeline}` : null,
    q.budget ?? conv.budget ? `Budget: ${q.budget ?? conv.budget}` : null,
    `Contact: ${[phoneDisplay, input.contact.email?.trim()].filter(Boolean).join(" · ") || "—"}`,
    mergedContext.currentPage ? `Page: ${String(mergedContext.currentPage).slice(0, 120)}` : null,
  ].filter((l): l is string => l !== null);
  await appendMessage(conv.id, { type: "system", body: detailLines.join("\n") });

  await appendMessage(conv.id, {
    type: "system",
    body: "Visitor requested human assistance — requirement and contact details captured.",
  });
  await recordEvent(conv.id, "human_requested", { name: input.contact.name }, { service: q.service ?? null, stage: q.stage ?? null });

  // Always give the team the full response window (owner decision): the
  // request waits for an agent even outside business hours, and the sweep
  // moves it to follow-up with the honest message if nobody joins in time.
  const offline = input.offline === true;
  await setStatus(conv.id, "waiting_for_agent", { note: offline ? "Requested outside live hours — waiting window started" : "Waiting for an available Savo agent" });
  await appendMessage(conv.id, { type: "ai", body: "We've shared your requirement with our team. A Savo specialist should join shortly." });

  await recordEvent(conv.id, "agent_notified");
  notifyAgents(conv.id, {
    name: input.contact.name,
    service: q.service ?? conv.service ?? "—",
    stage: q.stage ?? conv.stage ?? null,
    requirement: q.requirement ?? conv.requirement ?? "",
    timeline: q.timeline ?? conv.timeline ?? null,
    budget: q.budget ?? conv.budget ?? null,
    phone: phoneDisplay,
    email: input.contact.email?.trim() || null,
    page: mergedContext.currentPage ? String(mergedContext.currentPage) : null,
    offline,
  });

  publish("admin", { type: "conversation.new", conversationId: conv.id });
  const fresh = await loadConversation(conv.id);
  if (!fresh) return { error: "Conversation could not be created." };
  return { conversation: fresh, offline: false };
}

/* One notification email per human request (deduped by event log) — carries
   the complete captured record so the team can act without opening the panel. */
async function notifyAgents(
  conversationId: string,
  lead: {
    name: string;
    service: string;
    stage?: string | null;
    requirement: string;
    timeline?: string | null;
    budget?: string | null;
    phone: string | null;
    email: string | null;
    page?: string | null;
    offline: boolean;
  },
): Promise<void> {
  if (!prisma) return;
  try {
    const already = await prisma.conversationEvent.findFirst({ where: { conversationId, type: "email:sent" } });
    if (already) return;
    await prisma.conversationEvent.create({ data: { conversationId, type: "email:sent", meta: { channel: "team" } } });
  } catch {
    return;
  }
  const subject = lead.offline
    ? `Live-chat follow-up: ${lead.name} — ${lead.service}`
    : `Live-chat request: ${lead.name} — ${lead.service}`;
  const contact = [lead.phone, lead.email].filter(Boolean).join(" · ") || "no contact details";
  const rows = [
    ["Name", lead.name],
    ["Service", lead.service],
    ["Stage", lead.stage ?? null],
    ["Timeline", lead.timeline ?? null],
    ["Budget", lead.budget ?? null],
    ["Contact", contact],
    ["Requirement", lead.requirement || null],
    ["Page", lead.page ?? null],
  ].filter(([, v]) => v) as [string, string][];
  const text = [
    lead.offline ? "A visitor left a live-chat request while the team was offline." : "A visitor is waiting for a live chat right now.",
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    "Open the Live Chat inbox in the admin panel to respond.",
  ].join("\n");
  const html = `<div style="font-family:ui-sans-serif,system-ui,sans-serif;line-height:1.6"><h2 style="margin:0 0 8px">${subject}</h2><p>${
    lead.offline ? "A visitor left a live-chat request while the team was offline." : "A visitor is <strong>waiting for a live chat right now</strong>."
  }</p><p>${rows.map(([k, v]) => `<strong>${k}:</strong> ${v}`).join("<br/>")}</p><p>Open the <strong>Live Chat</strong> inbox in the admin panel to respond.</p></div>`;
  sendMailNow(teamEmail(), { subject, text, html });
}

/* ─────────────────────────── agent side ─────────────────────────── */

export type AgentInfo = { id: string; name: string };

/** Atomic accept — the first agent wins, everyone else gets "taken". */
export async function acceptConversation(conversationId: string, agent: AgentInfo): Promise<{ ok: boolean; reason?: string }> {
  if (!prisma) return { ok: false, reason: "unavailable" };
  const conv = await prisma.chatConversation.findUnique({ where: { id: conversationId } });
  if (!conv) return { ok: false, reason: "not_found" };
  if (conv.assignedId === agent.id && conv.status === "active") return { ok: true };
  if (conv.status !== "waiting_for_agent" && conv.status !== "waiting_follow_up") {
    return { ok: false, reason: "taken" };
  }
  // Guard the race: the update only lands while the status is still waiting.
  const claimed = await prisma.chatConversation.updateMany({
    where: { id: conversationId, status: { in: ["waiting_for_agent", "waiting_follow_up"] } },
    data: { assignedId: agent.id, status: "active", mode: "human", acceptedAt: new Date() },
  });
  if (claimed.count !== 1) return { ok: false, reason: "taken" };
  const late = conv.status === "waiting_follow_up";
  await recordEvent(conversationId, "agent_accepted", agent, { lateAccept: late });
  await recordEvent(conversationId, "assigned", agent, { agentName: agent.name });
  const joinLine = late
    ? `A member of the Savo team is now available — you're connected with ${agent.name} from Savo.`
    : `You're now connected with ${agent.name} from Savo.`;
  await appendMessage(conversationId, { type: "system", body: joinLine });
  publishConversationEvent(conversationId, {
    type: "status.changed",
    conversationId,
    status: "active",
    agentName: agent.name,
    lateAccept: late,
  });
  publish("admin", { type: "counts.changed" });
  return { ok: true };
}

export async function agentMessage(conversationId: string, agent: AgentInfo, body: string): Promise<MessageDTO | { error: string }> {
  if (!prisma) return { error: "unavailable" };
  const conv = await prisma.chatConversation.findUnique({ where: { id: conversationId } });
  if (!conv) return { error: "not_found" };
  const msg = await appendMessage(conversationId, { type: "agent", body, agentId: agent.id, senderName: `${agent.name} — Savo` });
  const patch: Record<string, unknown> = {};
  if (!conv.firstResponseAt) patch.firstResponseAt = new Date();
  // Any agent reply engages the thread — waiting, timed-out or left: the
  // visitor is being served, the window timer must never fire after this.
  if (conv.status === "waiting_for_agent" || conv.status === "waiting_follow_up" || conv.status === "visitor_left") {
    patch.status = "active";
    if (!conv.acceptedAt) patch.acceptedAt = new Date();
    if (!conv.assignedId) patch.assignedId = agent.id;
  }
  patch.mode = "human";
  if (Object.keys(patch).length > 0) {
    await prisma.chatConversation.update({ where: { id: conversationId }, data: patch });
    if (patch.status === "active") {
      await recordEvent(conversationId, "status:active", agent, { note: "Agent message resumed the conversation" });
      publishConversationEvent(conversationId, { type: "status.changed", conversationId, status: "active", agentName: agent.name });
    }
  }
  return msg ?? { error: "failed" };
}

export async function internalNote(conversationId: string, agent: AgentInfo, body: string): Promise<MessageDTO | { error: string }> {
  const msg = await appendMessage(conversationId, { type: "internal_note", body, agentId: agent.id, senderName: agent.name });
  return msg ?? { error: "failed" };
}

export async function markRead(conversationId: string, by: "agent" | "visitor"): Promise<void> {
  if (!prisma) return;
  await prisma.chatConversation
    .update({
      where: { id: conversationId },
      data: by === "agent" ? { unreadForAgent: 0 } : { unreadForVisitor: 0 },
    })
    .catch(() => undefined);
}

export async function closeConversation(conversationId: string, agent: AgentInfo): Promise<void> {
  await setStatus(conversationId, "closed", { actor: agent, note: `Conversation closed by ${agent.name}` });
  await appendMessage(conversationId, { type: "system", body: `Conversation closed by ${agent.name}` });
}

/** Visitor-side end: closes the thread so the widget returns to the fresh
 *  Ask Savo AI / Talk to a Human choice (owner rule — AI never returns to a
 *  live human thread until the visitor or the team ends it). */
export async function endConversationByVisitor(conversationId: string): Promise<void> {
  if (!prisma) return;
  const conv = await prisma.chatConversation.findUnique({ where: { id: conversationId } });
  if (!conv || conv.status === "closed" || conv.status === "spam") return;
  await setStatus(conversationId, "closed", { note: "Conversation ended by visitor" });
  await appendMessage(conversationId, { type: "system", body: "Conversation ended. If you need further assistance, message us back — Savo AI is ready 24/7, and the team is one tap away." });
}

/** Agent asks the visitor to confirm ending the chat — the visitor decides
 *  with a Yes/No card; nobody is dropped without consent. */
export async function requestEndByAgent(conversationId: string, agent: AgentInfo): Promise<void> {
  if (!prisma) return;
  const conv = await prisma.chatConversation.findUnique({ where: { id: conversationId } });
  if (!conv || conv.status === "closed" || conv.status === "spam") return;
  await recordEvent(conversationId, "end_requested", agent);
  await appendMessage(conversationId, { type: "system", body: `${agent.name} asked the visitor to confirm ending the chat.` });
  publishConversationEvent(conversationId, { type: "end.requested", conversationId, agentName: agent.name });
}

/** Visitor's answer to an end-request: accept closes the thread; declining
 *  keeps it open and tells the team. */
export async function respondToEndRequest(conversationId: string, accept: boolean): Promise<void> {
  if (!prisma) return;
  if (accept) {
    await endConversationByVisitor(conversationId);
    return;
  }
  await recordEvent(conversationId, "end_declined", { name: "visitor" });
  await appendMessage(conversationId, { type: "system", body: "Visitor wants to continue the conversation." });
}

export async function reopenConversation(conversationId: string, agent: AgentInfo): Promise<void> {
  await setStatus(conversationId, "waiting_follow_up", { actor: agent, note: `Reopened by ${agent.name}` });
  await appendMessage(conversationId, { type: "system", body: `Conversation reopened by ${agent.name}` });
}

export async function assignConversation(conversationId: string, agentId: string | null, agentName: string | null, actor: AgentInfo): Promise<void> {
  if (!prisma) return;
  const conv = await prisma.chatConversation.findUnique({ where: { id: conversationId } });
  if (!conv) return;
  // Assigning a waiting conversation ENGAGES it — the assigned agent owns
  // the thread, the response-window timer must stop, and the visitor must
  // be told they're connected (owner report: assignment left the chat
  // "waiting" until the sweep timed it out).
  const engaging = !!agentId && (conv.status === "waiting_for_agent" || conv.status === "waiting_follow_up");
  const data: Record<string, unknown> = { assignedId: agentId };
  if (engaging) {
    data.status = "active";
    data.mode = "human";
    if (!conv.acceptedAt) data.acceptedAt = new Date();
    if (!conv.firstResponseAt) data.firstResponseAt = new Date();
  }
  await prisma.chatConversation.update({ where: { id: conversationId }, data });
  await recordEvent(conversationId, "transferred", actor, { toAgent: agentName ?? "unassigned" });
  if (engaging) {
    await recordEvent(conversationId, "agent_accepted", { id: agentId, name: agentName }, { via: "assignment" });
    await appendMessage(conversationId, { type: "system", body: `You're now connected with ${agentName} from Savo.` });
    publishConversationEvent(conversationId, { type: "status.changed", conversationId, status: "active", agentName: agentName ?? actor.name });
  } else {
    await appendMessage(conversationId, {
      type: "system",
      body: agentId ? `Assigned to ${agentName}` : `Unassigned by ${actor.name}`,
    });
  }
  publishConversationEvent(conversationId, { type: "summary.updated", conversationId });
  publish("admin", { type: "counts.changed" });
}

export async function updateConversationFields(
  conversationId: string,
  patch: { priority?: string; leadStatus?: string; followUpAt?: Date | null },
  actor: AgentInfo,
): Promise<void> {
  if (!prisma) return;
  const data: Record<string, unknown> = {};
  if (patch.priority && ["low", "normal", "high"].includes(patch.priority)) data.priority = patch.priority;
  if (patch.leadStatus) data.leadStatus = patch.leadStatus;
  if (patch.followUpAt !== undefined) data.followUpAt = patch.followUpAt;
  if (Object.keys(data).length === 0) return;
  await prisma.chatConversation.update({ where: { id: conversationId }, data });
  await recordEvent(conversationId, "fields_updated", actor, data as object);
  publishConversationEvent(conversationId, { type: "summary.updated", conversationId });
  publish("admin", { type: "counts.changed" });
}

export async function setTags(conversationId: string, labels: string[], actor: AgentInfo): Promise<void> {
  if (!prisma) return;
  const clean = [...new Set(labels.map((l) => l.trim().slice(0, 40)).filter(Boolean))].slice(0, 10);
  const tagRows = [];
  for (const label of clean) {
    tagRows.push(await prisma.chatTag.upsert({ where: { label }, update: {}, create: { label } }));
  }
  await prisma.conversationTag.deleteMany({ where: { conversationId } });
  if (tagRows.length > 0) {
    await prisma.conversationTag.createMany({ data: tagRows.map((t) => ({ conversationId, tagId: t.id })) });
  }
  await recordEvent(conversationId, "tags_updated", actor, { tags: clean });
  publishConversationEvent(conversationId, { type: "summary.updated", conversationId });
}

export async function regenerateSummary(conversationId: string, actor: AgentInfo): Promise<void> {
  if (!prisma) return;
  const conv = await prisma.chatConversation.findUnique({ where: { id: conversationId } });
  if (!conv) return;
  const msgs = await prisma.chatMessage.findMany({
    where: { conversationId, type: "visitor" },
    orderBy: { createdAt: "asc" },
    take: 30,
    select: { body: true },
  });
  const summary = buildAiSummary({
    service: conv.service,
    stage: conv.stage,
    requirement: conv.requirement,
    timeline: conv.timeline,
    budget: conv.budget,
    leadName: conv.leadName,
    leadCountry: conv.leadCountry,
    visitorMessages: msgs.map((m) => m.body),
  });
  await prisma.chatConversation.update({ where: { id: conversationId }, data: { aiSummary: summary } });
  await recordEvent(conversationId, "summary_regenerated", actor);
  publishConversationEvent(conversationId, { type: "summary.updated", conversationId });
}

export async function returnToAi(conversationId: string, actor: AgentInfo): Promise<void> {
  if (!prisma) return;
  const conv = await prisma.chatConversation.findUnique({ where: { id: conversationId } });
  if (!conv) return;
  await prisma.chatConversation.update({ where: { id: conversationId }, data: { mode: "ai", status: "ai_only" } });
  await recordEvent(conversationId, "returned_to_ai", actor);
  await appendMessage(conversationId, { type: "system", body: `The team handed the conversation back to Savo AI. You can continue with Savo AI here whenever you need anything else.` });
  publishConversationEvent(conversationId, { type: "status.changed", conversationId, status: "ai_only", note: "returned_to_ai" });
  publish("admin", { type: "counts.changed" });
}

export async function blockVisitor(conversationId: string, actor: AgentInfo): Promise<void> {
  if (!prisma) return;
  const conv = await prisma.chatConversation.findUnique({ where: { id: conversationId } });
  if (!conv) return;
  await prisma.chatVisitor.update({ where: { id: conv.visitorId }, data: { blocked: true, blockedAt: new Date() } });
  await setStatus(conversationId, "spam", { actor: actor, note: `Visitor blocked by ${actor.name}` });
}

export async function markSpam(conversationId: string, actor: AgentInfo): Promise<void> {
  await setStatus(conversationId, "spam", { actor: actor, note: `Marked spam by ${actor.name}` });
}

export function typingSignal(conversationId: string, who: "visitor" | "agent", typing: boolean, name?: string | null): void {
  publishConversationEvent(conversationId, { type: "typing", conversationId, who, name: name ?? null, typing });
}

/* ─────────────────────────── sweep (background) ─────────────────────────── */

/**
 * Server-side maintenance pass — run every few seconds by the worker in
 * instrumentation.ts. Never depends on any browser being open:
 *   1. waiting_for_agent older than the response window → waiting_follow_up
 *   2. active/waiting conversations with a stale visitor → visitor_left
 */
export async function sweepOnce(): Promise<void> {
  if (!prisma) return;
  const settings = await getLiveChatSettings();
  const cutoff = new Date(Date.now() - settings.responseWindowSec * 1000);

  // 1. Response-window timeout
  const expired = await prisma.chatConversation.findMany({
    where: { status: "waiting_for_agent", humanRequestedAt: { lt: cutoff } },
    take: 20,
  });
  for (const conv of expired) {
    await setStatus(conv.id, "waiting_follow_up", { note: "response_window_timeout" });
    await recordEvent(conv.id, "timeout", undefined, { windowSec: settings.responseWindowSec });
    await appendMessage(conv.id, {
      type: "ai",
      body: "Our team isn't available for live chat at the moment, but your request has been received. Someone from Savo will get back to you as soon as possible.",
    });
    // Visitor may continue with AI immediately (spec §12).
    await prisma.chatConversation.update({ where: { id: conv.id }, data: { mode: "ai" } }).catch(() => undefined);
    publish("admin", { type: "counts.changed" });
    logger.info("livechat.response_timeout", { conversationId: conv.id });
  }

  // 2. Stale visitors (heartbeat older than the idle window)
  const staleCutoff = new Date(Date.now() - 4 * 60 * 1000);
  const stale = await prisma.chatConversation.findMany({
    where: { status: "active", visitor: { lastSeenAt: { lt: staleCutoff } } },
    take: 20,
    include: { visitor: true },
  });
  for (const conv of stale) {
    await setStatus(conv.id, "visitor_left", { note: "visitor_disconnected" });
    await recordEvent(conv.id, "visitor_left");
    logger.info("livechat.visitor_left", { conversationId: conv.id });
  }
}

export type { AdminSessionUser };
