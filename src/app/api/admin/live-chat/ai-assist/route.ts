import { apiOk, apiError, isJsonRequest, readJsonBody } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireChatAgent } from "@/lib/livechat/admin-guard";
import { answerQuestion } from "@/lib/assistant";
import { buildAiSummary } from "@/lib/livechat/summary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/live-chat/ai-assist — Savo AI working FOR the agent
 * (spec §36): suggested replies, technical answers from the verified
 * knowledge base, requirement digests and a follow-up email draft.
 * Deterministic and site-truth only — suggestions never auto-send.
 *
 * { conversationId, kind: "suggest" | "answer" | "digest" | "email", text? }
 */

function suggestReply(conv: { service?: string | null; stage?: string | null; leadName?: string | null; requirement?: string | null }): string[] {
  const name = conv.leadName?.split(/\s+/)[0];
  const hello = name ? `${name}, thanks for reaching out to Savo.` : "Thanks for reaching out to Savo.";
  const out = [hello];
  if (conv.stage === "Just exploring an idea" || conv.stage === "Planning requirements") {
    out.push("Happy to walk through it with you. To point you to the right approach: is this a new build, or improving something that already exists?");
  } else if (conv.stage === "Need urgent technical support") {
    out.push("Understood — this sounds time-sensitive. Share the system affected and what changed most recently, and we'll triage it right away.");
  } else if (conv.service?.toLowerCase().includes("ai")) {
    out.push("For AI work we usually start with a 2–4 week first deployment on your real data, with guardrails and evaluation from sprint one. Would a short discovery call help scope it?");
  } else {
    out.push("Could you share a little more about the project so I can bring in the right specialist?");
  }
  if (conv.requirement) {
    out.push(`To confirm what I'm seeing: you're looking at ${conv.requirement.toLowerCase().slice(0, 120)} — is that the core of it?`);
  }
  out.push("Would you be available for a short discovery call this week? We can walk through your requirement together.");
  return out;
}

function emailDraft(conv: { leadName?: string | null; service?: string | null; requirement?: string | null; timeline?: string | null }): string {
  const first = conv.leadName?.split(/\s+/)[0] ?? "there";
  return [
    `Hi ${first},`,
    "",
    `Thank you for the chat on savotechnologies.com${conv.service ? ` about ${conv.service.toLowerCase()}` : ""}.`,
    conv.requirement ? `To recap: ${conv.requirement}` : "To recap our conversation — you're exploring a project with our team.",
    conv.timeline ? `You mentioned hoping to start ${conv.timeline.toLowerCase()}.` : "",
    "A senior consultant will follow up with next steps and, if useful, a short discovery call.",
    "",
    "Best regards,",
    "Savo Technologies",
    "hello@savotechnologies.com",
  ]
    .filter((l) => l !== "")
    .join("\n");
}

export async function POST(req: Request) {
  const user = await requireChatAgent();
  if (!user) return apiError("Not authorized.", 401);
  if (!isJsonRequest(req)) return apiError("Unsupported request format.", 415);
  if (!prisma) return apiError("Unavailable.", 503);

  const body = await readJsonBody(req);
  if (!body.ok) return apiError("Invalid request.", 400);
  const { conversationId, kind, text } = body.data as { conversationId?: unknown; kind?: unknown; text?: unknown };
  if (typeof conversationId !== "string" || typeof kind !== "string") return apiError("Invalid request.", 400);

  const conv = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    include: { tags: { include: { tag: true } } },
  });
  if (!conv) return apiError("Conversation not found.", 404);

  if (kind === "answer") {
    const question = typeof text === "string" ? text.trim() : "";
    if (!question) return apiError("Ask a question first.", 400);
    const entry = answerQuestion(question);
    if (!entry) {
      return apiOk({
        suggestion: [
          `No verified knowledge-base answer for “${question.slice(0, 120)}”.`,
          "Answer from your own expertise, or check the site content and add it to the knowledge base later.",
        ].join("\n"),
      });
    }
    return apiOk({ suggestion: entry.paragraphs.join("\n\n"), source: entry.id });
  }

  if (kind === "digest") {
    const msgs = await prisma.chatMessage.findMany({
      where: { conversationId: conv.id, type: "visitor" },
      orderBy: { createdAt: "asc" },
      take: 30,
      select: { body: true },
    });
    return apiOk({
      suggestion: buildAiSummary({
        service: conv.service,
        stage: conv.stage,
        requirement: conv.requirement,
        timeline: conv.timeline,
        budget: conv.budget,
        leadName: conv.leadName,
        leadCountry: conv.leadCountry,
        visitorMessages: msgs.map((m) => m.body),
      }),
    });
  }

  if (kind === "email") {
    return apiOk({ suggestion: emailDraft(conv) });
  }

  // Default: suggested replies
  return apiOk({ suggestion: suggestReply(conv).join("\n\n") });
}

