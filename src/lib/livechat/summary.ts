/**
 * AI requirement summary — the internal digest agents see when a
 * conversation transfers from Savo AI to a human (spec §16).
 *
 * Deterministic and honest: built strictly from what the visitor actually
 * said (qualification answers + their messages), never invented. This is
 * the same no-guessing philosophy as the Savo Assistant knowledge base.
 */

export type SummaryInput = {
  service?: string | null;
  stage?: string | null;
  requirement?: string | null;
  timeline?: string | null;
  budget?: string | null;
  leadName?: string | null;
  leadCountry?: string | null;
  /** Visitor messages from the AI portion of the thread. */
  visitorMessages: string[];
};

const MAX_EXCERPTS = 6;
const EXCERPT_LEN = 220;

function excerpt(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > EXCERPT_LEN ? `${clean.slice(0, EXCERPT_LEN - 1)}…` : clean;
}

/** Human-readable one-line label for a lead-status code. */
export const LEAD_STATUS_LABELS: Record<string, string> = {
  new: "New",
  qualified: "Qualified",
  contacted: "Contacted",
  meeting: "Meeting requested",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
  not_applicable: "Not applicable",
};

export function buildAiSummary(input: SummaryInput): string {
  const lines: string[] = [];

  const head: string[] = [];
  if (input.leadName) head.push(input.leadName);
  if (input.service) head.push(`wants to discuss: ${input.service}`);
  else head.push("topic not specified yet");
  if (input.stage) head.push(`stage: ${input.stage}`);
  lines.push(head.join(" · "));

  if (input.requirement) lines.push(`Requirement: ${excerpt(input.requirement)}`);
  if (input.timeline) lines.push(`Timeline: ${input.timeline}`);
  if (input.budget) lines.push(`Budget: ${input.budget}`);

  const msgs = input.visitorMessages.filter((m) => m.trim()).slice(-MAX_EXCERPTS);
  if (msgs.length > 0) {
    lines.push("");
    lines.push("From the AI conversation:");
    for (const m of msgs) lines.push(`— “${excerpt(m)}”`);
  }

  if (lines.length === 1) {
    lines.push("No requirement details captured yet — ask the visitor for the project shape and timeline.");
  }

  return lines.join("\n");
}
