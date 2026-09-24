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

  /* Contact page additions — topics and optional phone */

  it("accepts every contact topic as a project type", () => {
    for (const topic of ["New project", "Hire a team", "Support", "Careers", "Something else"]) {
      expect(enquirySchema.safeParse({ ...valid, projectType: topic }).success).toBe(true);
    }
  });

  it("accepts a well-formed optional phone and trims it", () => {
    const r = enquirySchema.safeParse({ ...valid, phone: " +91 98765 43210 " });
    expect(r.success).toBe(true);
    expect(r.success && r.data.phone).toBe("+91 98765 43210");
  });

  it("accepts an empty phone but rejects garbage", () => {
    expect(enquirySchema.safeParse({ ...valid, phone: "" }).success).toBe(true);
    expect(enquirySchema.safeParse({ ...valid, phone: "call me maybe" }).success).toBe(false);
  });

  /* Careers additions — role titles as project types */

  it("accepts every open role title and the general application", () => {
    const titles = [
      ...["Senior Frontend Engineer", "Backend Engineer", "AI / ML Engineer", "Mobile Engineer", "DevOps Engineer", "UI/UX Designer"],
      "General application",
    ];
    for (const title of titles) {
      const r = enquirySchema.safeParse({ ...valid, projectType: title, message: "x".repeat(20) });
      expect(r.success).toBe(true);
    }
  });

  it("still rejects an unknown role title", () => {
    expect(enquirySchema.safeParse({ ...valid, projectType: "Chief Vibes Officer" }).success).toBe(false);
  });
});
