import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Step-up email verification for the payment-gateway settings page:
 * code hashing (never plaintext), grant signing/binding, challenge
 * consumption and attempt limits, admin-only + grant-gated actions,
 * mail-off fail-closed behaviour, and a page that renders NOTHING
 * sensitive before verification.
 */

const db = vi.hoisted(() => ({
  stepUpChallenge: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
  paymentGatewayConfig: { findUnique: vi.fn(), upsert: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
}));
const auth = vi.hoisted(() => ({ requireAdmin: vi.fn(), getAdminUser: vi.fn() }));
const auditLog = vi.hoisted(() => ({ audit: vi.fn() }));
const mail = vi.hoisted(() => ({ sendMail: vi.fn() }));
const cookieStore = vi.hoisted(() => ({
  value: undefined as string | undefined,
  set: vi.fn(),
  delete: vi.fn(),
  get: vi.fn(function (this: { value?: string }) { return this.value === undefined ? undefined : { value: this.value }; }),
}));

vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/auth", () => ({ requireAdmin: auth.requireAdmin, getAdminUser: auth.getAdminUser }));
vi.mock("@/lib/audit", () => ({ audit: auditLog.audit }));
vi.mock("@/lib/mail", () => ({ sendMail: mail.sendMail }));
vi.mock("@/lib/logger", () => ({ logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => cookieStore }));

const MASTER_KEY = Buffer.from("s".repeat(32)).toString("base64");
const PURPOSE = "payments-settings";
const adminUser = { id: "admin-otp-1", email: "owner@savo.test", name: "Owner", role: "admin" as const };

async function fresh() {
  vi.resetModules();
  vi.stubEnv("SECRETS_MASTER_KEY", MASTER_KEY);
  return {
    stepUp: await import("@/lib/step-up"),
    actions: await import("@/app/admin/(protected)/settings/payments/actions"),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  cookieStore.value = undefined;
  // Reset process-global caches (secret-box key, step-up rate limiter).
  for (const key of ["__savoSecretBoxKey", "__savoRazorpayConfigCache", "__savoRazorpayConfigEpoch", "__savoRateLimiterV2"]) {
    delete (globalThis as Record<string, unknown>)[key];
  }
  db.stepUpChallenge.create.mockResolvedValue({ id: "challenge-1" });
  db.stepUpChallenge.findFirst.mockResolvedValue(null);
  db.stepUpChallenge.update.mockResolvedValue({});
  db.stepUpChallenge.updateMany.mockResolvedValue({ count: 1 });
  db.paymentGatewayConfig.findUnique.mockResolvedValue(null);
  auth.requireAdmin.mockResolvedValue(adminUser);
  auth.getAdminUser.mockResolvedValue(adminUser);
  mail.sendMail.mockResolvedValue(true);
});

// ── primitives ──────────────────────────────────────────────────────────
describe("step-up primitives", () => {
  it("generates zero-padded 6-digit codes and stores only keyed hashes", async () => {
    const { stepUp } = await fresh();
    const code = stepUp.generateStepUpCode();
    expect(code).toMatch(/^[0-9]{6}$/);
    const hash = stepUp.hashCodeForStorage(PURPOSE, code);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toBe(stepUp.hashCodeForStorage(PURPOSE, code)); // deterministic
    expect(hash).not.toBe(stepUp.hashCodeForStorage("other-purpose", code)); // purpose-bound
    expect(hash).not.toContain(code);
  });

  it("binds grants to user + purpose + time and rejects tampering", async () => {
    const { stepUp } = await fresh();
    const grant = stepUp.signStepUpGrant(adminUser.id, PURPOSE);
    expect(stepUp.verifyStepUpGrantToken(grant.token, adminUser.id, PURPOSE)).toBe(true);
    expect(stepUp.verifyStepUpGrantToken(grant.token, "someone-else", PURPOSE)).toBe(false);
    expect(stepUp.verifyStepUpGrantToken(grant.token, adminUser.id, "other-purpose")).toBe(false);
    expect(stepUp.verifyStepUpGrantToken(`${grant.token.slice(0, -4)}beef`, adminUser.id, PURPOSE)).toBe(false);
    expect(stepUp.verifyStepUpGrantToken("garbage", adminUser.id, PURPOSE)).toBe(false);
    const expired = stepUp.signStepUpGrant(adminUser.id, PURPOSE, -1_000);
    expect(stepUp.verifyStepUpGrantToken(expired.token, adminUser.id, PURPOSE)).toBe(false);
    const farFuture = stepUp.signStepUpGrant(adminUser.id, PURPOSE, 60 * 60 * 1000);
    expect(stepUp.verifyStepUpGrantToken(farFuture.token, adminUser.id, PURPOSE)).toBe(false); // beyond policy TTL
  });

  it("masks the inbox for display without revealing the local part", async () => {
    const { stepUp } = await fresh();
    expect(stepUp.maskEmail("savotechnologies@hotmail.com")).toBe("s•••@hotmail.com");
    expect(stepUp.maskEmail("bad")).toBe("your registered email");
  });

  it("resolves the fixed security inbox and fails closed on an invalid one", async () => {
    const { stepUp } = await fresh();
    expect(stepUp.stepUpDestinationEmail()).toBeNull(); // unset → admin's own email
    vi.stubEnv("STEP_UP_EMAIL", " Savotechnologies@Hotmail.com ");
    expect(stepUp.stepUpDestinationEmail()).toBe("savotechnologies@hotmail.com");
    vi.stubEnv("STEP_UP_EMAIL", "not-an-email");
    expect(() => stepUp.stepUpDestinationEmail()).toThrow(/STEP_UP_EMAIL/);
  });
});

// ── challenge lifecycle ─────────────────────────────────────────────────
describe("challenge lifecycle", () => {
  it("creates a challenge, invalidating any previous active one, and never stores the code", async () => {
    const { stepUp } = await fresh();
    const created = await stepUp.createStepUpChallenge(adminUser.id, PURPOSE, adminUser.email);
    expect(created?.code).toMatch(/^[0-9]{6}$/);
    expect(db.stepUpChallenge.updateMany).toHaveBeenCalledWith({ where: { userId: adminUser.id, purpose: PURPOSE, consumedAt: null }, data: { consumedAt: expect.any(Date) } });
    const data = db.stepUpChallenge.create.mock.calls[0][0].data;
    expect(data.codeHash).toMatch(/^[0-9a-f]{64}$/);
    expect(data.codeHash).not.toContain(created!.code);
    expect(data.emailTo).toBe(adminUser.email);
    expect(data.expiresAt.getTime()).toBeGreaterThan(Date.now() + 9 * 60 * 1000);
  });

  it("accepts the correct code once, then reports no active challenge on replay", async () => {
    const { stepUp } = await fresh();
    const created = await stepUp.createStepUpChallenge(adminUser.id, PURPOSE, adminUser.email);
    db.stepUpChallenge.findFirst.mockResolvedValue({ id: "challenge-1", codeHash: stepUp.hashCodeForStorage(PURPOSE, created!.code), attempts: 0, expiresAt: new Date(Date.now() + 60_000), consumedAt: null });
    const ok = await stepUp.checkStepUpCode(adminUser.id, PURPOSE, created!.code);
    expect(ok).toEqual({ ok: true });
    expect(db.stepUpChallenge.updateMany).toHaveBeenCalledWith({ where: { id: "challenge-1" }, data: { consumedAt: expect.any(Date) } });
    db.stepUpChallenge.findFirst.mockResolvedValue(null); // consumed → none left
    expect(await stepUp.checkStepUpCode(adminUser.id, PURPOSE, created!.code)).toEqual({ ok: false, reason: "none" });
  });

  it("counts wrong attempts, reports the remainder and locks out after five", async () => {
    const { stepUp } = await fresh();
    const created = await stepUp.createStepUpChallenge(adminUser.id, PURPOSE, adminUser.email);
    const base = { id: "challenge-1", codeHash: stepUp.hashCodeForStorage(PURPOSE, created!.code), expiresAt: new Date(Date.now() + 60_000), consumedAt: null };
    db.stepUpChallenge.findFirst.mockResolvedValue({ ...base, attempts: 0 });
    expect(await stepUp.checkStepUpCode(adminUser.id, PURPOSE, "000000")).toEqual({ ok: false, reason: "wrong", remaining: 4 });
    expect(db.stepUpChallenge.update).toHaveBeenCalledWith({ where: { id: "challenge-1" }, data: { attempts: 1 } });
    db.stepUpChallenge.findFirst.mockResolvedValue({ ...base, attempts: 4 });
    expect(await stepUp.checkStepUpCode(adminUser.id, PURPOSE, "000000")).toEqual({ ok: false, reason: "locked" });
    expect(db.stepUpChallenge.updateMany).toHaveBeenCalledWith({ where: { id: "challenge-1" }, data: { consumedAt: expect.any(Date) } }); // burned
  });

  it("rejects expired codes and consumes them", async () => {
    const { stepUp } = await fresh();
    const created = await stepUp.createStepUpChallenge(adminUser.id, PURPOSE, adminUser.email);
    db.stepUpChallenge.findFirst.mockResolvedValue({ id: "challenge-1", codeHash: stepUp.hashCodeForStorage(PURPOSE, created!.code), attempts: 0, expiresAt: new Date(Date.now() - 1_000), consumedAt: null });
    expect(await stepUp.checkStepUpCode(adminUser.id, PURPOSE, created!.code)).toEqual({ ok: false, reason: "expired" });
    expect(db.stepUpChallenge.updateMany).toHaveBeenCalled();
  });
});

// ── actions ─────────────────────────────────────────────────────────────
describe("step-up actions", () => {
  it("sends a code to the signed-in admin's own email and audits it", async () => {
    const { actions } = await fresh();
    await expect(actions.sendStepUpCodeAction()).rejects.toThrow("REDIRECT:/admin/settings/payments?otp=sent");
    expect(mail.sendMail).toHaveBeenCalledTimes(1);
    const [to, template] = mail.sendMail.mock.calls[0];
    expect(to).toBe(adminUser.email);
    expect(template.subject).toMatch(/[0-9]{6}/);
    expect(template.html).toContain("Confirm it is you");
    expect(db.stepUpChallenge.create).toHaveBeenCalledTimes(1);
    expect(auditLog.audit.mock.calls[0][1]).toBe("stepup.send");
  });

  it("routes the code to the fixed STEP_UP_EMAIL security inbox when configured", async () => {
    vi.stubEnv("STEP_UP_EMAIL", "savotechnologies@hotmail.com");
    const { actions } = await fresh();
    await expect(actions.sendStepUpCodeAction()).rejects.toThrow("REDIRECT:/admin/settings/payments?otp=sent");
    expect(mail.sendMail.mock.calls[0][0]).toBe("savotechnologies@hotmail.com");
    expect(db.stepUpChallenge.create.mock.calls[0][0].data.emailTo).toBe("savotechnologies@hotmail.com");
  });

  it("refuses to send anywhere when STEP_UP_EMAIL is invalid", async () => {
    vi.stubEnv("STEP_UP_EMAIL", "not-an-email");
    const { actions } = await fresh();
    await expect(actions.sendStepUpCodeAction()).rejects.toThrow(/STEP_UP_EMAIL is set but/);
    expect(db.stepUpChallenge.create).not.toHaveBeenCalled();
    expect(mail.sendMail).not.toHaveBeenCalled();
  });

  it("fails closed when mail cannot be delivered on a non-development deployment", async () => {
    const { actions } = await fresh();
    mail.sendMail.mockResolvedValue(false); // MAIL_DELIVERY_MODE=off / not live
    await expect(actions.sendStepUpCodeAction()).rejects.toThrow(/code%20could%20not%20be%20sent/);
    expect(db.stepUpChallenge.deleteMany).toHaveBeenCalledWith({ where: { id: "challenge-1" } }); // no dangling code
  });

  it("keeps the challenge in development with an explicit dev-only fallback log", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { actions } = await fresh();
    mail.sendMail.mockResolvedValue(false);
    await expect(actions.sendStepUpCodeAction()).rejects.toThrow("REDIRECT:/admin/settings/payments?otp=sent");
    expect(db.stepUpChallenge.deleteMany).not.toHaveBeenCalled();
  });

  it("throttles repeated code requests", async () => {
    const { actions } = await fresh();
    for (let i = 0; i < 3; i++) await expect(actions.sendStepUpCodeAction()).rejects.toThrow("otp=sent");
    await expect(actions.sendStepUpCodeAction()).rejects.toThrow(/Too%20many%20code%20requests/);
  });

  it("verifies a correct code by minting a purpose-scoped HttpOnly grant cookie", async () => {
    const { actions, stepUp } = await fresh();
    const created = await stepUp.createStepUpChallenge(adminUser.id, PURPOSE, adminUser.email);
    db.stepUpChallenge.findFirst.mockResolvedValue({ id: "challenge-1", codeHash: stepUp.hashCodeForStorage(PURPOSE, created!.code), attempts: 0, expiresAt: new Date(Date.now() + 60_000), consumedAt: null });
    const form = new FormData(); form.set("code", created!.code);
    await expect(actions.verifyStepUpCodeAction(form)).rejects.toThrow("REDIRECT:/admin/settings/payments");
    expect(cookieStore.set).toHaveBeenCalledWith(`savo_stepup_${PURPOSE}`, expect.stringMatching(/^\d+\.[0-9a-f]{64}$/), expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/" }));
    expect(auditLog.audit.mock.calls.at(-1)![1]).toBe("stepup.verified");
  });

  it("redirects wrong codes with the remaining attempts and never hints the code", async () => {
    const { actions, stepUp } = await fresh();
    const created = await stepUp.createStepUpChallenge(adminUser.id, PURPOSE, adminUser.email);
    db.stepUpChallenge.findFirst.mockResolvedValue({ id: "challenge-1", codeHash: stepUp.hashCodeForStorage(PURPOSE, created!.code), attempts: 2, expiresAt: new Date(Date.now() + 60_000), consumedAt: null });
    const form = new FormData(); form.set("code", "314159");
    await expect(actions.verifyStepUpCodeAction(form)).rejects.toThrow(/Incorrect%20code.*2%20attempts%20remaining/);
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it("locks the page on demand by clearing the grant cookie", async () => {
    const { actions } = await fresh();
    await expect(actions.lockStepUpAction()).rejects.toThrow("REDIRECT:/admin/settings/payments?otp=locked");
    expect(cookieStore.delete).toHaveBeenCalledWith(`savo_stepup_${PURPOSE}`);
  });
});

// ── credential actions require a live grant ─────────────────────────────
describe("credential actions are step-up gated", () => {
  it("blocks save/verify/clear without a valid grant, before any data work", async () => {
    const { actions } = await fresh();
    const form = new FormData(); form.set("keyId", "rzp_live_ABCDEFGH1234"); form.set("keySecret", "live-secret-1234567890AB");
    await expect(actions.saveRazorpayConfigAction(form)).rejects.toThrow(/Email%20verification%20required/);
    await expect(actions.verifyRazorpayConfigAction()).rejects.toThrow(/Email%20verification%20required/);
    await expect(actions.clearRazorpayConfigAction()).rejects.toThrow(/Email%20verification%20required/);
    expect(db.paymentGatewayConfig.upsert).not.toHaveBeenCalled();
    expect(db.paymentGatewayConfig.deleteMany).not.toHaveBeenCalled();
  });

  it("allows the save with a valid grant", async () => {
    const { actions, stepUp } = await fresh();
    cookieStore.value = stepUp.signStepUpGrant(adminUser.id, PURPOSE).token;
    const form = new FormData(); form.set("keyId", "rzp_live_ABCDEFGH1234"); form.set("keySecret", "live-secret-1234567890AB");
    await expect(actions.saveRazorpayConfigAction(form)).rejects.toThrow("REDIRECT:/admin/settings/payments?saved=1");
    expect(db.paymentGatewayConfig.upsert).toHaveBeenCalledTimes(1);
  });

  it("rejects a grant minted for a different admin", async () => {
    const { actions, stepUp } = await fresh();
    cookieStore.value = stepUp.signStepUpGrant("another-admin", PURPOSE).token;
    const form = new FormData(); form.set("keyId", "rzp_live_ABCDEFGH1234"); form.set("keySecret", "live-secret-1234567890AB");
    await expect(actions.saveRazorpayConfigAction(form)).rejects.toThrow(/Email%20verification%20required/);
  });
});

// ── the page itself ─────────────────────────────────────────────────────
describe("payments settings page", () => {
  async function freshPage() {
    vi.resetModules();
    vi.stubEnv("SECRETS_MASTER_KEY", MASTER_KEY);
    const stepUp = await import("@/lib/step-up");
    const Page = (await import("@/app/admin/(protected)/settings/payments/page")).default;
    return { stepUp, Page };
  }
  const render = async (Page: (props: { searchParams: Promise<Record<string, string>> }) => Promise<React.ReactElement>, query: Record<string, string> = {}) =>
    renderToStaticMarkup(await Page({ searchParams: Promise.resolve(query) }));

  it("renders only the verification challenge before a grant — never gateway data", async () => {
    const { Page } = await freshPage();
    db.paymentGatewayConfig.findUnique.mockResolvedValue({ gateway: "razorpay", mode: "live", keyId: "rzp_live_SHOULDNOTRENDER", keySecretEnc: "v1.x", webhookSecretEnc: null, lastVerifiedAt: null, lastVerifyOk: null });
    const html = await render(Page);
    expect(html).toContain("verification required");
    expect(html).toContain("o•••@savo.test");
    expect(html).toContain("Send code");
    expect(html).not.toContain("rzp_live_SHOULDNOTRENDER");
    expect(html).not.toContain("Current configuration");
    expect(db.paymentGatewayConfig.findUnique).not.toHaveBeenCalled(); // zero data reads before verification
  });

  it("shows the code entry form after a send and keeps errors visible", async () => {
    const { Page } = await freshPage();
    const html = await render(Page, { otp: "sent", e: "Incorrect%20code" });
    expect(html).toContain("6-digit");
    expect(html).toContain(decodeURIComponent("Incorrect%20code"));
  });

  it("renders the full management surface once a valid grant is present", async () => {
    const { Page, stepUp } = await freshPage();
    cookieStore.value = stepUp.signStepUpGrant(adminUser.id, PURPOSE).token;
    const html = await render(Page, { saved: "1" });
    expect(html).toContain("Current configuration");
    expect(html).toContain("Email-verified");
    expect(html).toContain("Not configured");
  });

  it("shows the fixed security inbox on the challenge when configured", async () => {
    vi.stubEnv("STEP_UP_EMAIL", "savotechnologies@hotmail.com");
    const { Page } = await freshPage();
    const html = await render(Page);
    expect(html).toContain("security inbox");
    expect(html).toContain("s•••@hotmail.com");
    expect(html).toContain("hello@savotechnologies.com");
  });

  it("locks editors out entirely", async () => {
    const { Page } = await freshPage();
    const editor = { ...adminUser, role: "editor" as const };
    auth.requireAdmin.mockResolvedValue(editor);
    auth.getAdminUser.mockResolvedValue(editor); // requireAdminPage reads this
    await expect(render(Page)).rejects.toThrow(/denied|login/);
  });
});
