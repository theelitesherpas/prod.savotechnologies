import { afterEach, expect, it, vi } from "vitest";
const h = vi.hoisted(() => ({ host: "localhost:4326" }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ host: h.host, "x-forwarded-host": "savotechnologies.com" }) }));
import { paypalCheckoutEnabled, paypalLocalPreview } from "@/lib/paypal-runtime";
import type { PayPalConfig } from "@/lib/paypal-config";
const config: PayPalConfig = { mode: "live", verified: true, clientId: "synthetic", clientSecret: "synthetic", merchantId: "MERCHANT12345", webhookId: "synthetic", fingerprint: "synthetic" };
afterEach(() => vi.unstubAllEnvs());
it("keeps loopback UI inspection separate from permission to charge", async () => {
 h.host = "localhost:3000"; expect(await paypalLocalPreview()).toBe(true); expect(await paypalCheckoutEnabled(config)).toBe(false);
 h.host = "127.0.0.1:4326"; expect(await paypalLocalPreview()).toBe(true);
 for (const host of ["savotechnologies.com", "www.savotechnologies.com", "localhost.attacker.invalid", "preview.example.invalid"]) { h.host = host; expect(await paypalLocalPreview()).toBe(false); }
});
it("requires the actual production HTTP host even when production env is copied to a local preview", async () => {
 vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("NEXT_PUBLIC_CONTENT_MODE", "production"); vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://savotechnologies.com"); vi.stubEnv("PAYPAL_LIVE_PAYMENTS_ENABLED", "true");
 h.host = "localhost:4326"; expect(await paypalCheckoutEnabled(config)).toBe(false);
 h.host = "savotechnologies.com"; expect(await paypalCheckoutEnabled(config)).toBe(true);
 expect(await paypalCheckoutEnabled({ ...config, verified: false })).toBe(false);
 expect(await paypalCheckoutEnabled({ ...config, webhookId: null })).toBe(false);
 vi.stubEnv("PAYPAL_LIVE_PAYMENTS_ENABLED", "false"); expect(await paypalCheckoutEnabled(config)).toBe(false);
});
it("does not credit sandbox money on the canonical production environment", async () => {
 vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("NEXT_PUBLIC_CONTENT_MODE", "production"); vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://savotechnologies.com"); h.host = "savotechnologies.com";
 expect(await paypalCheckoutEnabled({ ...config, mode: "sandbox" })).toBe(false);
 vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000"); expect(await paypalCheckoutEnabled({ ...config, mode: "sandbox" })).toBe(false); h.host = "localhost:3000"; expect(await paypalCheckoutEnabled({ ...config, mode: "sandbox" })).toBe(true);
});
