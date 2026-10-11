import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ upsert: vi.fn(), findUnique: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { mailSuppress: { upsert: m.upsert, findUnique: m.findUnique } } }));
vi.mock("@/lib/mail/unsubscribe", () => ({ unsubscribeSig: (email: string) => `sig-${email}` }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));

import { POST } from "@/app/api/email/unsubscribe/route";
import { unsubscribeAction } from "@/app/(site)/unsubscribe/actions";
import UnsubscribePage from "@/app/(site)/unsubscribe/page";

const email = "person@example.test";
const sig = `sig-${email}`;
const render = (node: React.ReactElement) => renderToStaticMarkup(node);
const formData = () => { const data = new FormData(); data.set("email", email); data.set("sig", sig); return data; };

beforeEach(() => {
  vi.clearAllMocks();
  m.upsert.mockResolvedValue({ email });
  m.findUnique.mockResolvedValue(null);
});

describe("unsubscribe preference persistence", () => {
  it("returns a retryable error when one-click suppression cannot be stored", async () => {
    m.upsert.mockRejectedValueOnce(new Error("synthetic database failure"));
    const response = await POST(new Request(`https://example.test/api/email/unsubscribe?email=${encodeURIComponent(email)}&sig=${encodeURIComponent(sig)}`, { method: "POST" }));
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("does not redirect the confirmation action to a false success after a write failure", async () => {
    m.upsert.mockRejectedValueOnce(new Error("synthetic database failure"));
    await expect(unsubscribeAction(formData()))
      .rejects.toThrow(`REDIRECT:/unsubscribe?error=save&email=${encodeURIComponent(email)}&sig=${encodeURIComponent(sig)}`);
  });

  it("redirects to a verifiable success state after the preference is saved", async () => {
    await expect(unsubscribeAction(formData()))
      .rejects.toThrow(`REDIRECT:/unsubscribe?done=1&email=${encodeURIComponent(email)}&sig=${encodeURIComponent(sig)}`);
    expect(m.upsert).toHaveBeenCalledWith({
      where: { email }, update: { reason: "user" }, create: { email, reason: "user" },
    });
  });

  it("does not display an unsubscribe success for a forged or unsaved done URL", async () => {
    const html = render(await UnsubscribePage({ searchParams: Promise.resolve({ email, sig, done: "1" }) }));
    expect(html).toContain("We couldn’t verify the unsubscribe");
    expect(html).not.toContain("You are unsubscribed.");
  });

  it("confirms only a signed preference that exists in the database", async () => {
    m.findUnique.mockResolvedValueOnce({ email, reason: "user" });
    const html = render(await UnsubscribePage({ searchParams: Promise.resolve({ email, sig, done: "1" }) }));
    expect(html).toContain("You are unsubscribed.");
    expect(html).toContain(email);
  });

  it("keeps the confirmation form available with an accessible recovery message", async () => {
    const html = render(await UnsubscribePage({ searchParams: Promise.resolve({ email, sig, error: "save" }) }));
    expect(html).toContain('role="alert"');
    expect(html).toContain("We couldn’t save your preference");
    expect(html).toContain("try again");
  });
});
