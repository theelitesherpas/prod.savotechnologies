import { expect, it } from "vitest";
import { scriptJson } from "@/lib/script-json";
it("keeps structured data values unchanged while preventing script-element breakout", () => {
  const value = { name: '</script><script>alert("fixture")</script>', description: '<!-- & > \u2028 \u2029', amount: 123, nested: ["ordinary public data"] };
  const encoded = scriptJson(value);
  expect(encoded).not.toMatch(/[<>&\u2028\u2029]/);
  expect(encoded).toContain("\\u003c/script");
  expect(JSON.parse(encoded)).toEqual(value);
});
it("serializes null and undefined safely without executable fragments", () => {
  expect(scriptJson(null)).toBe("null"); expect(scriptJson(undefined)).toBe("null");
});
it("does not alter currencies, ordinary text, links or Unicode names", () => {
  const value = { price: "9.00", currency: "USD", name: "Savo · ग्राहक", url: "https://savotechnologies.com/?a=1&b=2" };
  expect(JSON.parse(scriptJson(value))).toEqual(value);
});
