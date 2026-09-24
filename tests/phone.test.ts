import { describe, expect, it } from "vitest";
import { validatePhone, COUNTRY_PHONE_RULES } from "@/lib/phone";

describe("validatePhone", () => {
  it("accepts a valid Indian number with dial prefix", () => {
    const r = validatePhone("India", "+919876543210");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.normalized).toBe("+919876543210");
  });

  it("accepts a valid Indian number without prefix", () => {
    const r = validatePhone("India", "98765 43210");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.normalized).toBe("+919876543210");
  });

  it("rejects too-short numbers with a country-specific message", () => {
    const r = validatePhone("India", "12345");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("10 digits");
  });

  it("rejects too-long numbers", () => {
    const r = validatePhone("Singapore", "8123456789012");
    expect(r.ok).toBe(false);
  });

  it("rejects non-numeric input", () => {
    const r = validatePhone("India", "not-a-phone");
    expect(r.ok).toBe(false);
  });

  it("rejects unknown countries", () => {
    const r = validatePhone("Atlantis", "1234567890");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/country/i);
  });

  it("handles ranges (Germany 10–11 digits)", () => {
    expect(validatePhone("Germany", "1512345678901").ok).toBe(false); // 13
    const ok10 = validatePhone("Germany", "1512345678");
    const ok11 = validatePhone("Germany", "15123456789");
    expect(ok10.ok && ok11.ok).toBe(true);
  });

  it("covers every country in the table", () => {
    for (const [country, rule] of Object.entries(COUNTRY_PHONE_RULES)) {
      const digits = "9".repeat(rule.min);
      expect(validatePhone(country, digits).ok, country).toBe(true);
    }
  });
});
