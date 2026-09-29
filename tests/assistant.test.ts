import { describe, expect, it } from "vitest";
import { answerQuestion, entryById, followUps, INITIAL_SUGGESTIONS, KNOWLEDGE } from "@/lib/assistant";

describe("Savo Assistant knowledge engine", () => {
  it("answers service questions", () => {
    expect(answerQuestion("What does Savo build?")?.id).toBe("build");
    expect(answerQuestion("do you build mobile apps?")?.id).toBe("mobile");
    expect(answerQuestion("can you make a website for us")?.id).toBe("web");
  });

  it("answers AI questions", () => {
    expect(answerQuestion("Do you build AI agents?")?.id).toBe("ai");
    expect(answerQuestion("can you integrate an llm")?.id).toBe("ai");
  });

  it("answers pricing, timeline and location questions", () => {
    expect(answerQuestion("how much does it cost?")?.id).toBe("cost");
    expect(answerQuestion("what is the price of a website")?.id).toBe("cost");
    expect(answerQuestion("how fast can we start?")?.id).toBe("start");
    expect(answerQuestion("where are you located?")?.id).toBe("where");
    expect(answerQuestion("office in india or switzerland")?.id).toBe("where");
  });

  it("answers careers and hiring questions distinctly", () => {
    expect(answerQuestion("are you hiring?")?.id).toBe("careers");
    expect(answerQuestion("can we hire dedicated developers?")?.id).toBe("hire");
  });

  it("returns null for unmatched questions instead of guessing", () => {
    expect(answerQuestion("what is the weather like")).toBeNull();
    expect(answerQuestion("who won the cricket match")).toBeNull();
    expect(answerQuestion("")).toBeNull();
  });

  it("follow-ups prefer the same category and never include the entry itself", () => {
    const entry = entryById("cost")!;
    const f = followUps(entry);
    expect(f.length).toBeGreaterThan(0);
    expect(f.every((x) => x.id !== entry.id)).toBe(true);
    expect(f[0].category).toBe(entry.category);
  });

  it("every initial suggestion and link resolves", () => {
    for (const id of INITIAL_SUGGESTIONS) expect(entryById(id)).toBeDefined();
    for (const e of KNOWLEDGE) {
      expect(e.paragraphs.length).toBeGreaterThan(0);
      expect(e.keywords.length).toBeGreaterThan(0);
      for (const l of e.links ?? []) expect(l.href.startsWith("/")).toBe(true);
    }
  });

  it("answers greetings and small-talk warmly", () => {
    expect(answerQuestion("Hi")?.id).toBe("greeting");
    expect(answerQuestion("hello")?.id).toBe("greeting");
    expect(answerQuestion("hii")?.id).toBe("greeting");
    expect(answerQuestion("good morning")?.id).toBe("greeting");
    expect(answerQuestion("thanks")?.id).toBe("thanks");
    expect(answerQuestion("thank you")?.id).toBe("thanks");
  });

  it("matches loose phrasings about Savo itself", () => {
    expect(answerQuestion("what savo do")?.id).toBe("build");
    expect(answerQuestion("what does savo do")?.id).toBe("build");
    expect(answerQuestion("who are you")?.id).toBe("who");
    expect(answerQuestion("what do you offer")?.id).toBe("build");
  });

  it("greeting never collides with careers", () => {
    expect(answerQuestion("hi")?.id).not.toBe("careers");
  });
});
