import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Payment-gateway credential storage: secret-box encryption, Razorpay config
 * resolution (DB row → encrypted, env fallback, fail-closed on tamper) and the
 * admin save/verify/clear actions (admin-only, masked audit, no secret echo).
 */

// ── shared mocks ────────────────────────────────────────────────────────
const db = vi.hoisted(() => ({
  findUnique: vi.fn(),
  upsert: vi.fn(),
  updateMany: vi.fn(),
  deleteMany: vi.fn(),
}));
const auth = vi.hoisted(() => ({ requireAdmin: vi.fn() }));
const auditLog = vi.hoisted(() => ({ audit: vi.fn() }));
const cookieStore = vi.hoisted(() => ({
  value: undefined as string | undefined,
  set: vi.fn(),
  delete: vi.fn(),
  get(this: { value?: string }) { return this.value === undefined ? undefined : { value: this.value }; },
}));

vi.mock("@/lib/prisma", () => ({ prisma: { paymentGatewayConfig: db } }));
vi.mock("@/lib/auth", () => ({ requireAdmin: auth.requireAdmin }));
vi.mock("@/lib/audit", () => ({ audit: auditLog.audit }));
vi.mock("@/lib/logger", () => ({ logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => cookieStore }));

const MASTER_KEY = Buffer.from("a".repeat(32)).toString("base64");
const OTHER_KEY = Buffer.from("b".repeat(32)).toString("base64");

const adminUser = { id: "admin-user-1", email: "admin@savo.test", name: "Admin", role: "admin" as const };
const editorUser = { id: "editor-user-1", email: "editor@savo.test", name: "Editor", role: "editor" as const };

async function freshConfig() {
  vi.resetModules();
  resetSecretBoxGlobal();
  vi.stubEnv("SECRETS_MASTER_KEY", MASTER_KEY);
  vi.stubEnv("RAZORPAY_KEY_ID", "");
  vi.stubEnv("RAZORPAY_KEY_SECRET", "");
  vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "");
  return await import("@/lib/razorpay-config");
}

/** The parsed master key is cached on globalThis and survives resetModules. */
function resetSecretBoxGlobal() {
  delete (globalThis as Record<string, unknown>).__savoSecretBoxKey;
  delete (globalThis as Record<string, unknown>).__savoRazorpayConfigCache;
  delete (globalThis as Record<string, unknown>).__savoRazorpayConfigEpoch;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  resetSecretBoxGlobal();
  cookieStore.value = undefined;
  db.findUnique.mockResolvedValue(null);
  db.upsert.mockResolvedValue({});
  db.updateMany.mockResolvedValue({ count: 1 });
  db.deleteMany.mockResolvedValue({ count: 1 });
  auth.requireAdmin.mockResolvedValue(adminUser);
});

// ── secret-box ──────────────────────────────────────────────────────────
describe("secret-box encryption", () => {
  it("round-trips a secret and never stores plaintext or a reusable ciphertext", async () => {
    vi.stubEnv("SECRETS_MASTER_KEY", MASTER_KEY);
    const { encryptSecret, decryptSecret } = await import("@/lib/secret-box");
    const secret = "rzp_live_SECRETVALUE123456";
    const a = encryptSecret(secret);
    const b = encryptSecret(secret);
    expect(a).not.toContain(secret);
    expect(a).not.toBe(b); // unique IV per encryption
    expect(decryptSecret(a)).toBe(secret);
    expect(decryptSecret(b)).toBe(secret);
  });

  it("rejects tampered ciphertext (GCM auth) and format garbage", async () => {
    vi.stubEnv("SECRETS_MASTER_KEY", MASTER_KEY);
    const { encryptSecret, decryptSecret } = await import("@/lib/secret-box");
    const a = encryptSecret("secret-value-abcdef");
    const parts = a.split(".");
    parts[3] = parts[3].slice(0, -2) + (parts[3].endsWith("AA") ? "BB" : "AA");
    expect(() => decryptSecret(parts.join("."))).toThrow();
    expect(() => decryptSecret("v2.xxx.yyy.zzz")).toThrow();
    expect(() => decryptSecret("not-a-secret-box-value")).toThrow();
  });

  it("fails closed without a master key or with a wrong-length key", async () => {
    vi.stubEnv("SECRETS_MASTER_KEY", "");
    const missing = await import("@/lib/secret-box");
    expect(missing.secretBoxConfigured()).toBe(false);
    expect(() => missing.encryptSecret("x")).toThrow(/SECRETS_MASTER_KEY/);
    vi.resetModules();
    vi.stubEnv("SECRETS_MASTER_KEY", Buffer.from("short").toString("base64"));
    const wrong = await import("@/lib/secret-box");
    expect(wrong.secretBoxConfigured()).toBe(false);
    expect(() => wrong.encryptSecret("x")).toThrow(/32 bytes/);
  });

  it("cannot unlock a secret encrypted under a different master key", async () => {
    vi.stubEnv("SECRETS_MASTER_KEY", MASTER_KEY);
    const first = await import("@/lib/secret-box");
    const stored = first.encryptSecret("payment-secret-9876543210");
    vi.resetModules();
    resetSecretBoxGlobal();
    vi.stubEnv("SECRETS_MASTER_KEY", OTHER_KEY);
    const second = await import("@/lib/secret-box");
    expect(() => second.decryptSecret(stored)).toThrow(/could not be unlocked/);
  });
});

// ── config resolution ───────────────────────────────────────────────────
describe("razorpay credential resolution", () => {
  it("derives mode from the key id prefix only", async () => {
    const { modeFromKeyId } = await freshConfig();
    expect(modeFromKeyId("rzp_live_ABCDEFGH1234")).toBe("live");
    expect(modeFromKeyId("rzp_test_ABCDEFGH1234")).toBe("test");
    expect(modeFromKeyId("rzp_other_ABCDEFGH1234")).toBeNull();
    expect(modeFromKeyId("live_ABCDEFGH1234")).toBeNull();
  });

  it("prefers the encrypted database row over environment credentials", async () => {
    const config = await freshConfig();
    const { encryptSecret } = await import("@/lib/secret-box");
    db.findUnique.mockResolvedValue({
      gateway: "razorpay", mode: "live", keyId: "rzp_live_DBKEY123456",
      keySecretEnc: encryptSecret("db-secret-value-1234567890"),
      webhookSecretEnc: encryptSecret("db-webhook-secret-1234567890"),
    });
    vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_ENVKEY12345");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "env-secret-value-1234567890");
    const resolved = await config.getRazorpayConfig();
    expect(resolved).toMatchObject({ mode: "live", keyId: "rzp_live_DBKEY123456", keySecret: "db-secret-value-1234567890", webhookSecret: "db-webhook-secret-1234567890", source: "database" });
  });

  it("falls back to environment credentials only when no row is stored", async () => {
    const config = await freshConfig();
    db.findUnique.mockResolvedValue(null);
    vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_ENVKEY12345");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "env-secret-value-1234567890");
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "env-webhook-1234567890ABC");
    const resolved = await config.getRazorpayConfig();
    expect(resolved).toMatchObject({ mode: "test", keyId: "rzp_test_ENVKEY12345", source: "environment" });
  });

  it("returns null when nothing is configured", async () => {
    const config = await freshConfig();
    expect(await config.getRazorpayConfig()).toBeNull();
  });

  it("fails closed on a tampered/unopenable stored row instead of using env credentials", async () => {
    await freshConfig();
    // Row encrypted under a DIFFERENT master key than the one now configured.
    vi.resetModules();
    resetSecretBoxGlobal();
    vi.stubEnv("SECRETS_MASTER_KEY", OTHER_KEY);
    const other = await import("@/lib/secret-box");
    const foreignCiphertext = other.encryptSecret("locked-away-secret-123456789");
    // Back to the current key set: the row cannot be unlocked with it.
    vi.resetModules();
    resetSecretBoxGlobal();
    vi.stubEnv("SECRETS_MASTER_KEY", MASTER_KEY);
    vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_ENVKEY12345");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "env-secret-value-1234567890");
    const { getRazorpayConfig: resolve } = await import("@/lib/razorpay-config");
    db.findUnique.mockResolvedValue({
      gateway: "razorpay", mode: "live", keyId: "rzp_live_DBKEY123456",
      keySecretEnc: foreignCiphertext,
      webhookSecretEnc: null,
    });
    await expect(resolve()).rejects.toThrow(/could not be unlocked/);
  });

  it("caches within TTL and refreshes after a save", async () => {
    const config = await freshConfig();
    const { encryptSecret } = await import("@/lib/secret-box");
    db.findUnique.mockResolvedValue(null);
    expect(await config.getRazorpayConfig()).toBeNull();
    db.findUnique.mockResolvedValue({
      gateway: "razorpay", mode: "test", keyId: "rzp_test_SECONDKEY12",
      keySecretEnc: encryptSecret("second-secret-value-12345678"),
      webhookSecretEnc: null,
    });
    expect(await config.getRazorpayConfig()).toBeNull(); // still cached as unconfigured
    await config.saveRazorpayConfig({ keyId: "rzp_test_SECONDKEY12", keySecret: "second-secret-value-12345678", webhookSecret: undefined, adminId: "admin-user-1" });
    expect(db.upsert).toHaveBeenCalled();
    const resolved = await config.getRazorpayConfig(); // cache invalidated by save
    expect(resolved).toMatchObject({ keyId: "rzp_test_SECONDKEY12", source: "database" });
  });

  it("save keeps the stored key secret when none is provided, but demands one when the key id changes", async () => {
    const config = await freshConfig();
    const { encryptSecret } = await import("@/lib/secret-box");
    db.findUnique.mockResolvedValue({
      gateway: "razorpay", mode: "live", keyId: "rzp_live_OLDKEY12345",
      keySecretEnc: encryptSecret("old-secret-value-1234567890"),
      webhookSecretEnc: encryptSecret("old-webhook-1234567890ABC"),
    });
    await config.saveRazorpayConfig({ keyId: "rzp_live_OLDKEY12345", keySecret: null, webhookSecret: undefined, adminId: "admin-user-1" });
    expect(db.upsert.mock.calls[0][0].update.keySecretEnc).toMatch(/^v1\./);
    expect(db.upsert.mock.calls[0][0].update.keySecretEnc).not.toContain("old-secret-value-1234567890");
    expect(db.upsert.mock.calls[0][0].update.webhookSecretEnc).toMatch(/^v1\./); // kept
    await expect(config.saveRazorpayConfig({ keyId: "rzp_live_NEWKEY12345", keySecret: null, webhookSecret: undefined, adminId: "admin-user-1" }))
      .rejects.toThrow(/Key ID changed/);
  });

  it("save can set and clear the webhook secret explicitly", async () => {
    const config = await freshConfig();
    const { encryptSecret } = await import("@/lib/secret-box");
    db.findUnique.mockResolvedValue(null);
    await config.saveRazorpayConfig({ keyId: "rzp_test_FRESHKEY1234", keySecret: "fresh-secret-1234567890", webhookSecret: "fresh-webhook-1234567890", adminId: "admin-user-1" });
    expect(db.upsert.mock.calls[0][0].create.webhookSecretEnc).toMatch(/^v1\./);
    db.findUnique.mockResolvedValue({
      gateway: "razorpay", mode: "test", keyId: "rzp_test_FRESHKEY1234",
      keySecretEnc: encryptSecret("fresh-secret-1234567890"),
      webhookSecretEnc: encryptSecret("fresh-webhook-1234567890"),
    });
    await config.saveRazorpayConfig({ keyId: "rzp_test_FRESHKEY1234", keySecret: null, webhookSecret: "", adminId: "admin-user-1" });
    expect(db.upsert.mock.calls[1][0].update.webhookSecretEnc).toBeNull();
  });

  it("status output never contains secret material", async () => {
    const config = await freshConfig();
    const { encryptSecret } = await import("@/lib/secret-box");
    db.findUnique.mockResolvedValue({
      gateway: "razorpay", mode: "live", keyId: "rzp_live_SENSITIVE123456789",
      keySecretEnc: encryptSecret("topsecret-value-1234567890AB"),
      webhookSecretEnc: encryptSecret("topsecret-webhook-1234567890"),
      lastVerifiedAt: new Date("2026-01-01T00:00:00Z"), lastVerifyOk: true,
    });
    const status = await config.razorpayStatus();
    const serialized = JSON.stringify(status);
    expect(serialized).not.toContain("topsecret");
    expect(serialized).not.toContain("v1.");
    expect(status.keyIdMasked).toBe("rzp_live_SEN…6789");
    expect(status.hasWebhookSecret).toBe(true);
    expect(status.configured).toBe(true);
  });
});

// ── admin actions ───────────────────────────────────────────────────────
describe("payment settings actions", () => {
  async function freshActions() {
    vi.resetModules();
    vi.stubEnv("SECRETS_MASTER_KEY", MASTER_KEY);
    // Guarded actions require a live step-up grant for this admin.
    const { signStepUpGrant, STEP_UP_PURPOSE_PAYMENTS } = await import("@/lib/step-up");
    cookieStore.value = signStepUpGrant(adminUser.id, STEP_UP_PURPOSE_PAYMENTS).token;
    return await import("@/app/admin/(protected)/settings/payments/actions");
  }
  const saveForm = (fields: Record<string, string>) => {
    const form = new FormData();
    for (const [k, v] of Object.entries(fields)) form.set(k, v);
    return form;
  };

  it("is admin-only: editors are redirected away", async () => {
    const actions = await freshActions();
    auth.requireAdmin.mockResolvedValue(editorUser);
    await expect(actions.saveRazorpayConfigAction(saveForm({ keyId: "rzp_test_VALIDKEY1234", keySecret: "valid-secret-1234567890" })))
      .rejects.toThrow("REDIRECT:/admin?denied=Payment%20credentials%20are%20admin-only");
    await expect(actions.verifyRazorpayConfigAction()).rejects.toThrow("REDIRECT:/admin?denied=Payment%20credentials%20are%20admin-only");
    await expect(actions.clearRazorpayConfigAction()).rejects.toThrow("REDIRECT:/admin?denied=Payment%20credentials%20are%20admin-only");
  });

  it("rejects malformed key ids and short secrets with safe messages", async () => {
    const actions = await freshActions();
    await expect(actions.saveRazorpayConfigAction(saveForm({ keyId: "rzp_live_", keySecret: "valid-secret-1234567890" })))
      .rejects.toThrow(/REDIRECT:\/admin\/settings\/payments\?e=/);
    await expect(actions.saveRazorpayConfigAction(saveForm({ keyId: "rzp_test_VALIDKEY1234", keySecret: "short" })))
      .rejects.toThrow(/e=/);
    await expect(actions.saveRazorpayConfigAction(saveForm({ keyId: "rzp_test_VALIDKEY1234", keySecret: "valid-secret-1234567890", webhookSecret: "short" })))
      .rejects.toThrow(/e=/);
  });

  it("saves valid credentials, stores ciphertext and audits only masked metadata", async () => {
    const actions = await freshActions();
    await expect(actions.saveRazorpayConfigAction(saveForm({ keyId: "rzp_live_GoodKey123456", keySecret: "live-secret-1234567890AB", webhookSecret: "live-webhook-1234567890AB" })))
      .rejects.toThrow("REDIRECT:/admin/settings/payments?saved=1");
    expect(db.upsert).toHaveBeenCalledTimes(1);
    const data = db.upsert.mock.calls[0][0];
    expect(data.create.keyId).toBe("rzp_live_GoodKey123456");
    expect(data.create.mode).toBe("live");
    expect(data.create.keySecretEnc).toMatch(/^v1\./);
    expect(data.create.keySecretEnc).not.toContain("live-secret-1234567890AB");
    expect(data.create.webhookSecretEnc).not.toContain("live-webhook-1234567890AB");
    const auditArgs = auditLog.audit.mock.calls[0];
    const auditBlob = JSON.stringify(auditArgs);
    expect(auditBlob).not.toContain("live-secret-1234567890AB");
    expect(auditBlob).not.toContain("live-webhook-1234567890AB");
    expect(auditArgs[1]).toBe("razorpay.config.save");
    expect(auditArgs[4]).toMatchObject({ mode: "live", keySecretUpdated: true, webhookSecret: "updated" });
  });

  it("verifies credentials against the live API and records the outcome", async () => {
    const actions = await freshActions();
    const { encryptSecret } = await import("@/lib/secret-box");
    db.findUnique.mockResolvedValue({
      gateway: "razorpay", mode: "test", keyId: "rzp_test_VERIFYKEY12",
      keySecretEnc: encryptSecret("verify-secret-1234567890A"),
      webhookSecretEnc: null,
    });
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(actions.verifyRazorpayConfigAction()).rejects.toThrow("REDIRECT:/admin/settings/payments?verified=1");
    expect(fetchMock).toHaveBeenCalledWith("https://api.razorpay.com/v1/payment_links?count=1", expect.objectContaining({ method: "GET" }));
    const authHeader = fetchMock.mock.calls[0][1].headers.Authorization;
    expect(authHeader).toBe(`Basic ${Buffer.from("rzp_test_VERIFYKEY12:verify-secret-1234567890A").toString("base64")}`);
    expect(db.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ lastVerifyOk: true }) }));
  });

  it("reports rejected credentials as an actionable error without echoing the secret", async () => {
    const actions = await freshActions();
    const { encryptSecret } = await import("@/lib/secret-box");
    db.findUnique.mockResolvedValue({
      gateway: "razorpay", mode: "live", keyId: "rzp_live_BADKEY12345",
      keySecretEnc: encryptSecret("bad-secret-1234567890AB"),
      webhookSecretEnc: null,
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 401 })));
    await expect(actions.verifyRazorpayConfigAction())
      .rejects.toThrow("REDIRECT:/admin/settings/payments?e=Razorpay%20rejected%20these%20credentials");
  });

  it("clears stored credentials through the danger-zone action", async () => {
    const actions = await freshActions();
    await expect(actions.clearRazorpayConfigAction()).rejects.toThrow("REDIRECT:/admin/settings/payments?cleared=1");
    expect(db.deleteMany).toHaveBeenCalledWith({ where: { gateway: "razorpay" } });
    expect(auditLog.audit.mock.calls[0][1]).toBe("razorpay.config.clear");
  });
});
