import { describe, expect, it } from "vitest";
import { hashPassword, hashToken, verifyPassword } from "@/lib/auth";
import { ENQUIRY_STATUSES, enquiryStatusSchema, isEnquiryStatus } from "@/lib/enquiry-status";
import { cn } from "@/lib/utils";

describe("admin password hashing", () => {
  it("hashes and verifies a password (bcrypt roundtrip)", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).toMatch(/^\$2[aby]\$12\$/); // bcrypt, 12 rounds
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true);
    expect(await verifyPassword("wrong password", hash)).toBe(false);
  }, 30000); // bcrypt at 12 rounds is intentionally slow

  it("rejects a malformed hash without throwing", async () => {
    expect(await verifyPassword("x", "not-a-hash")).toBe(false);
  });
});

describe("session token hashing", () => {
  it("is deterministic and hex-encoded", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
    expect(hashToken("abc")).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken("abc")).not.toBe(hashToken("abd"));
  });
});

describe("enquiry status vocabulary", () => {
  it("has exactly the four lifecycle states", () => {
    expect([...ENQUIRY_STATUSES]).toEqual(["new", "in_progress", "closed", "archived"]);
  });

  it("validates via zod and rejects unknowns", () => {
    expect(enquiryStatusSchema.safeParse("new").success).toBe(true);
    expect(enquiryStatusSchema.safeParse("deleted").success).toBe(false);
  });

  it("narrows with the type guard", () => {
    expect(isEnquiryStatus("closed")).toBe(true);
    expect(isEnquiryStatus("CLOSED")).toBe(false);
  });
});

describe("cn utility", () => {
  it("joins truthy classes and skips falsy", () => {
    expect(cn("a", false, undefined, "b", null, "")).toBe("a b");
  });
});
