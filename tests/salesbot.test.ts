import { describe, expect, it } from "vitest";
import {
  extractBudget,
  extractServices,
  extractTimeline,
  newSession,
  scoreLead,
  step,
  emptySlots,
} from "../src/lib/salesbot";

describe("salesbot entity extraction", () => {
  it("extracts service keywords", () => {
    expect(extractServices("we need a new website for our clinic")).toContain("Web Development");
    expect(extractServices("a flutter app for field staff")).toContain("Mobile App Development");
    expect(extractServices("an AI chatbot like this one")).toContain("AI Agent Development");
    expect(extractServices("hello there")).toHaveLength(0);
  });

  it("does not match careers chatter as mobile work", () => {
    expect(extractServices("I want to apply for a job as an app developer")).not.toContain("Mobile App Development");
  });

  it("classifies budget bands", () => {
    expect(extractBudget("around ₹3 lakhs")?.band).toBe("under-5k");
    expect(extractBudget("maybe $12k")?.band).toBe("5k-25k");
    expect(extractBudget("₹40 lakh budget")?.band).toBe("25k-plus");
    expect(extractBudget("not sure yet")?.band).toBe("undisclosed");
    expect(extractBudget("we like pineapples")).toBeNull();
  });

  it("classifies timeline urgency", () => {
    expect(extractTimeline("needed ASAP, it's urgent")?.urgency).toBe("urgent");
    expect(extractTimeline("sometime this quarter")?.urgency).toBe("this-quarter");
    expect(extractTimeline("just exploring for now")?.urgency).toBe("exploring");
  });
});

describe("salesbot lead scoring", () => {
  it("scores cold with no slots", () => {
    const { score, label } = scoreLead(emptySlots());
    expect(score).toBe(0);
    expect(label).toBe("Cold");
  });

  it("reaches hot with full qualification", () => {
    const { score, label } = scoreLead({
      ...emptySlots(),
      need: "new ecommerce platform",
      budget: "$5k to $25k",
      budgetBand: "5k-25k",
      timeline: "Urgent",
      urgency: "urgent",
      services: ["Web Development"],
    });
    expect(score).toBeGreaterThanOrEqual(70);
    expect(label).toBe("Hot");
  });
});

describe("salesbot conversation flow", () => {
  it("greets and moves to discovery", () => {
    const s = newSession("t1");
    const t = step(s, "hi");
    expect(t.intent).toBe("greeting");
    expect(t.nextStage).toBe("discover");
    expect(t.reply.length).toBeGreaterThan(10);
  });

  it("captures the need and asks for budget", () => {
    let s = newSession("t2");
    s.stage = "discover";
    s = { ...s, stage: step(s, "hello").nextStage };
    const t = step(s, "we need an online store for our bakery");
    expect(t.slots.services).toContain("Web Development");
    expect(t.nextStage).toBe("qualify-budget");
  });

  it("fills budget slot and moves to timeline", () => {
    const s = newSession("t3");
    s.stage = "qualify-budget";
    const t = step(s, "around $15k");
    expect(t.slots.budgetBand).toBe("5k-25k");
    expect(t.nextStage).toBe("qualify-timeline");
  });

  it("produces a brief once fully qualified", () => {
    const s = newSession("t4");
    s.stage = "qualify-timeline";
    s.slots = { ...emptySlots(), need: "support automation", budget: "$5k to $25k", budgetBand: "5k-25k", services: ["AI Agent Development"] };
    const t = step(s, "this quarter");
    expect(t.slots.timeline).toBeTruthy();
    expect(t.nextStage).toBe("brief");
    expect(t.brief).not.toBeNull();
    expect(t.brief?.services[0]?.title).toBe("AI Agent Development");
    expect(t.brief?.leadLabel).toBe("Hot");
  });

  it("answers pricing questions without inventing numbers", () => {
    const s = newSession("t5");
    s.stage = "qna";
    const t = step(s, "how much does a website cost?");
    expect(t.intent).toBe("question:pricing");
    expect(t.reply).not.toMatch(/\$\d{3,}/); // no invented dollar figures
    expect(t.reply.toLowerCase()).toContain("don't quote");
  });

  it("deflects out-of-knowledge questions honestly", () => {
    const s = newSession("t6");
    s.stage = "qna";
    const t = step(s, "what is the meaning of life?");
    expect(t.intent).toBe("question:unmatched");
    expect(t.reply.toLowerCase()).toContain("don't guess");
  });

  it("bands every real-world budget phrasing (regression: the stuck loop)", () => {
    expect(extractBudget("15-20 lakh rupees", { expectBudget: true })?.band).toBe("5k-25k"); // upper 20L ≈ $25k
    expect(extractBudget("10k usd")?.band).toBe("5k-25k");
    expect(extractBudget("₹8-10 lakh")?.band).toBe("5k-25k");
    expect(extractBudget("$5-25k")?.band).toBe("5k-25k");
    expect(extractBudget("maybe 20k", { expectBudget: true })?.band).toBe("5k-25k");
    expect(extractBudget("1 crore")?.band).toBe("25k-plus");
    expect(extractBudget("around ₹3 lakhs")?.band).toBe("under-5k");
    expect(extractBudget("₹50,000")?.band).toBe("under-5k");
  });

  it("answers questions mid-qualification instead of repeating the prompt", () => {
    const s = newSession("q1");
    s.stage = "qualify-budget";
    const t = step(s, "why do you ask about budget?");
    expect(t.intent).toBe("question:unmatched");
    expect(t.stage).toBe("qualify-budget"); // stage preserved
    expect(t.reply).not.toContain("Noted. On budget");
  });

  it("accepts ok/yes as undecided instead of looping", () => {
    const s = newSession("q2");
    s.stage = "qualify-budget";
    const t = step(s, "ok");
    expect(t.slots.budgetBand).toBe("undisclosed");
    expect(t.nextStage).toBe("qualify-timeline");
  });

  it("never loops: escapes after two unproductive budget turns", () => {
    const s = newSession("q3");
    s.stage = "qualify-budget";
    s.stageAttempts = 1;
    const t = step(s, "hmm maybe"); // still no budget signal
    expect(t.nextStage).toBe("qualify-timeline");
    expect(t.slots.budgetBand).toBe("undisclosed");
  });

  it("restarts cleanly", () => {
    const s = newSession("t7");
    s.slots = { ...emptySlots(), budget: "$5k to $25k", budgetBand: "5k-25k" };
    const t = step(s, "restart");
    expect(t.slots.budget).toBeNull();
    expect(t.stage).toBe("greet");
  });
});
