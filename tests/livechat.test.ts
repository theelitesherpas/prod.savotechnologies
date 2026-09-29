import { describe, expect, it } from "vitest";
import { wantsHuman } from "@/lib/livechat/handoff";
import { withinBusinessHours } from "@/lib/livechat/availability";
import { buildAiSummary } from "@/lib/livechat/summary";
import { maskPhone } from "@/lib/livechat/types";
import { DEFAULT_SETTINGS } from "@/lib/livechat/settings";
import type { BusinessHours } from "@/lib/livechat/settings";

/* ─────────────── AI→human handoff intent (spec §4) ─────────────── */

describe("wantsHuman", () => {
  const yes = [
    "I want to talk to someone",
    "Can I speak with your team?",
    "Connect me to a person",
    "Talk to human",
    "I need a quotation",
    "I want to discuss my project",
    "Can someone call me?",
    "I want to hire Savo",
    "I need to talk to sales",
    "connect me with an agent please",
    "transfer me to a human",
    "can I talk to a real person about pricing",
    "book a call",
  ];
  const no = [
    "What is React?",
    "How much does a website cost?",
    "Do you work with Flutter?",
    "Where are you located?",
    "Tell me about your AI services",
    "What is your process?",
    "", // empty
    "x".repeat(600), // oversize → no match (guard)
  ];

  for (const phrase of yes) {
    it(`detects "${phrase}"`, () => {
      expect(wantsHuman(phrase)).toBe(true);
    });
  }
  for (const phrase of no) {
    it(`ignores "${phrase.slice(0, 30)}"`, () => {
      expect(wantsHuman(phrase)).toBe(false);
    });
  }
});

/* ─────────────── business hours (spec §38) ─────────────── */

describe("withinBusinessHours", () => {
  const hours: BusinessHours = {
    enabled: true,
    timeZone: "Asia/Kolkata",
    days: [
      null,
      { start: "10:00", end: "19:00" },
      { start: "10:00", end: "19:00" },
      { start: "10:00", end: "19:00" },
      { start: "10:00", end: "19:00" },
      { start: "10:00", end: "19:00" },
      null,
    ],
  };

  it("open on a Monday at 12:00 IST", () => {
    expect(withinBusinessHours(hours, new Date("2026-03-02T12:00:00+05:30"))).toBe(true);
  });
  it("closed before opening (08:00 IST Monday)", () => {
    expect(withinBusinessHours(hours, new Date("2026-03-02T08:00:00+05:30"))).toBe(false);
  });
  it("closed after hours (21:00 IST Monday)", () => {
    expect(withinBusinessHours(hours, new Date("2026-03-02T21:00:00+05:30"))).toBe(false);
  });
  it("closed on Sunday regardless of time", () => {
    expect(withinBusinessHours(hours, new Date("2026-03-01T12:00:00+05:30"))).toBe(false);
  });
  it("interprets the visitor's local time in the configured zone (UTC 06:30 = 12:00 IST)", () => {
    expect(withinBusinessHours(hours, new Date("2026-03-02T06:30:00Z"))).toBe(true);
  });
  it("disabled hours are always open", () => {
    expect(withinBusinessHours({ ...hours, enabled: false }, new Date("2026-03-01T03:00:00Z"))).toBe(true);
  });
});

/* ─────────────── AI requirement summary (spec §16) ─────────────── */

describe("buildAiSummary", () => {
  it("assembles qualification + conversation excerpts", () => {
    const summary = buildAiSummary({
      service: "Mobile application",
      stage: "Planning requirements",
      requirement: "Marketplace app for home-service providers",
      timeline: "Within 1–3 months",
      budget: "$15k – $40k",
      leadName: "Rahul",
      leadCountry: "India",
      visitorMessages: ["I need two apps, one for customers and one for providers", "Also an admin dashboard with payments"],
    });
    expect(summary).toContain("Rahul");
    expect(summary).toContain("Mobile application");
    expect(summary).toContain("Marketplace app");
    expect(summary).toContain("admin dashboard");
    expect(summary).not.toContain("Internal only"); // no accidental leaks of markers
  });
  it("falls back to a guidance line with zero input", () => {
    expect(buildAiSummary({ visitorMessages: [] })).toContain("ask the visitor");
  });
  it("caps long excerpts", () => {
    const summary = buildAiSummary({ visitorMessages: ["word ".repeat(200)] });
    expect(summary.length).toBeLessThan(600);
  });
});

/* ─────────────── phone masking (spec §7, §40) ─────────────── */

describe("maskPhone", () => {
  it("masks all but the last 4 digits", () => {
    expect(maskPhone("+91 9876543210")).toMatch(/•{4,6} 3210$/);
  });
  it("handles short numbers safely", () => {
    expect(maskPhone("1234")).toMatch(/•/);
  });
});

/* ─────────────── settings defaults (spec §38) ─────────────── */

describe("DEFAULT_SETTINGS", () => {
  it("response window is the spec's 60 seconds", () => {
    expect(DEFAULT_SETTINGS.responseWindowSec).toBe(60);
  });
  it("default budget options include the non-committal outs", () => {
    expect(DEFAULT_SETTINGS.budgets).toContain("Not sure yet");
    expect(DEFAULT_SETTINGS.budgets).toContain("Prefer to discuss");
  });
});
