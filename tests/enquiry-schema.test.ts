import { describe, expect, it } from "vitest";
import { enquirySchema } from "@/schemas/enquiry";

describe("enquirySchema", () => {
  const valid = {
    name: "Aarav Shah",
    email: "aarav@example.com",
    projectType: "Website",
    message: "We need a marketing site for our launch.",
  };

  it("accepts a complete enquiry", () => {
    expect(enquirySchema.safeParse(valid).success).toBe(true);
  });

  it("accepts optional company/budget and empty honeypot", () => {
    const r = enquirySchema.safeParse({ ...valid, company: "Acme", budget: "$5k – $15k", website: "" });
    expect(r.success).toBe(true);
  });

  it("rejects a disposable-looking invalid email", () => {
    expect(enquirySchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects an unknown project type", () => {
    expect(enquirySchema.safeParse({ ...valid, projectType: "Blockchain Mars Colony" }).success).toBe(false);
  });

  it("rejects an empty message", () => {
    expect(enquirySchema.safeParse({ ...valid, message: "" }).success).toBe(false);
  });

  it("rejects an over-long message (50k char bomb)", () => {
    expect(enquirySchema.safeParse({ ...valid, message: "x".repeat(6000) }).success).toBe(false);
  });

  it("keeps the honeypot field optional but bounded", () => {
    const r = enquirySchema.safeParse({ ...valid, website: "x".repeat(600) });
    expect(r.success).toBe(false);
  });
});
