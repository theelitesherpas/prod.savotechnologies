import { expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ lookup: vi.fn(), createTransport: vi.fn(), logger: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { mailSuppress: { findUnique: m.lookup }, sentEmail: { create: vi.fn() } } }));
vi.mock("@/lib/mail/delivery-policy", () => ({ liveMailAllowed: () => true }));
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), warn: m.logger, error: vi.fn() } }));
vi.mock("@/lib/mail/registry", () => ({
  templateEntry: () => ({ recipient: "customer", dept: "hello", default: () => ({ subject: "Synthetic", html: "fixture", text: "fixture" }) }),
  fillText: (s: string) => s,
  bodyToHtml: (s: string) => s,
  bodyToText: (s: string) => s,
}));
vi.mock("@/lib/mail/unsubscribe", () => ({ withSignedUnsubscribe: (template: unknown) => template }));
vi.mock("nodemailer", () => ({ default: { createTransport: m.createTransport } }));

import { sendMail, sendTemplateNow } from "@/lib/mail";

it("fails closed instead of sending customer mail when the suppression lookup fails", async () => {
  m.lookup.mockRejectedValueOnce(new Error("synthetic database outage"));
  sendTemplateNow("customerFixture", "person@example.test", { name: "Synthetic" });
  await vi.waitFor(() => expect(m.lookup).toHaveBeenCalledWith({ where: { email: "person@example.test" } }));
  expect(m.logger).toHaveBeenCalledWith("mail.suppression_check_failed", { templateKey: null });
  expect(m.createTransport).not.toHaveBeenCalled();
});

it("applies the same suppression gate to direct template sends", async () => {
  m.lookup.mockRejectedValueOnce(new Error("synthetic database outage"));
  m.createTransport.mockClear();
  await expect(sendMail("person@example.test", {
    subject: "Synthetic", html: "fixture", text: "fixture", unsubscribeEmail: "person@example.test",
  })).resolves.toBe(false);
  expect(m.createTransport).not.toHaveBeenCalled();
});
