import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { isUnavailableServiceRequest, SERVICE_SCOPE_MESSAGE } from "@/lib/service-scope";
import { answerQuestion, entryById, followUps, KNOWLEDGE } from "@/lib/assistant";
import { extractServices, newSession, step } from "@/lib/salesbot";
import { SERVICE_DETAILS } from "@/constants/services-detail";
import { servicePageDetail } from "@/sections/services/service-page-content";
import { HOME_COPY } from "@/sections/home-v2/homepage-copy";

const retired = [
  "Can you redesign our website?", "Website redesign pricing", "Re-design my site",
  "We need a web site revamp", "Can you rebuild our existing website?",
  "Refresh the storefront", "Modernise our old website", "Replatform our Shopify store",
  "Migrate my WordPress site to Next.js", "A new look for our website", "redesign",
];
const forbiddenCopy = /\b(?:re[ -]?design(?:s|ing|ed)?|revamp(?:s|ing|ed)?|makeovers?|replatform(?:s|ing|ed)?)\b/i;

describe("current service scope", () => {
  it.each(retired)("does not sell the retired request: %s", request => {
    expect(isUnavailableServiceRequest(request)).toBe(true);
    const entry = answerQuestion(request)!;
    expect(entry.paragraphs).toEqual([SERVICE_SCOPE_MESSAGE]);
    expect(entryById(entry.id)).toEqual(entry);
    expect(followUps(entry).some(x => x.id === "redesign")).toBe(false);
    expect(extractServices(request)).toEqual([]);
    const turn = step(newSession("scope-check"), request);
    expect(turn.intent).toBe("out-of-scope");
    expect(turn.reply).toBe(SERVICE_SCOPE_MESSAGE);
    expect(turn.slots.services).toEqual([]);
    expect(turn.nextStage).toBe("discover");
    expect(turn.brief).toBeNull();
  });
  it.each(["A new website for our clinic", "Design a new web application", "Migrate our cloud infrastructure", "Redesign a database schema", "Fix a bug on our website", "Build a mobile application"])("retains unrelated services: %s", request => {
    expect(isUnavailableServiceRequest(request)).toBe(false);
  });
  it("clears a stale retired SalesBot need rather than qualifying it under another name", () => {
    const session = newSession("old-session");
    session.stage = "recommend";
    session.slots.need = "website redesign";
    session.slots.services = ["Web Development", "UI/UX Design"];
    const turn = step(session, "Yes, please proceed");
    expect(turn.intent).toBe("out-of-scope");
    expect(turn.slots.need).toBeNull();
    expect(turn.slots.services).toEqual([]);
    expect(turn.brief).toBeNull();
  });
  it("removes the published knowledge entry and service/SEO FAQ offers", () => {
    expect(entryById("redesign")).toBeUndefined();
    expect(JSON.stringify([KNOWLEDGE, HOME_COPY, SERVICE_DETAILS, SERVICE_DETAILS.map(x => servicePageDetail(x.slug))])).not.toMatch(forbiddenCopy);
  });
  it("removes retired selections from both visitor enquiry paths", () => {
    for (const file of ["src/components/shared/ask-savo-bar.tsx", "src/components/shared/project-lead-modal.tsx"]) expect(readFileSync(file, "utf8")).not.toMatch(forbiddenCopy);
  });
});
