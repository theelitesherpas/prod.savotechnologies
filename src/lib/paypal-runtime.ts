import "server-only";
import { headers } from "next/headers";
import type { PayPalConfig } from "@/lib/paypal-config";
import { paypalLiveAllowed, paypalSandboxAllowed } from "@/lib/paypal-policy";
const productionHosts = ["savotechnologies.com", "www.savotechnologies.com"];
/** UI inspection only. Never use this to authorize create/capture. */
export async function paypalLocalPreview(): Promise<boolean> {
  try {
    const host = (await headers()).get("host") || "";
    return ["localhost", "127.0.0.1", "[::1]"].includes(new URL(`http://${host}`).hostname);
  } catch { return false; }
}
/** Both configuration AND the actual HTTP host gate money. Copied production
 * env cannot enable live captures on loopback, nor local env enable sandbox
 * credits on the production host. Forwarded host input is not trusted. */
export async function paypalCheckoutEnabled(config: PayPalConfig): Promise<boolean> {
  if (config.mode === "live" && (!paypalLiveAllowed() || !config.verified || !config.webhookId)) return false;
  if (config.mode === "sandbox" && !paypalSandboxAllowed()) return false;
  let host: string;
  try { host = ((await headers()).get("host") || "").toLowerCase(); }
  catch { return config.mode === "sandbox" && process.env.NODE_ENV === "test"; }
  if (config.mode === "live") return productionHosts.includes(host);
  try {
    const actual = new URL(`http://${host}`);
    if (productionHosts.includes(actual.hostname)) return false;
    if (["localhost", "127.0.0.1", "[::1]"].includes(actual.hostname)) return true;
    const configured = new URL(process.env.NEXT_PUBLIC_SITE_URL || "");
    return actual.host === configured.host && process.env.PAYPAL_SANDBOX_PAYMENTS_ENABLED === "true" && process.env.NEXT_PUBLIC_CONTENT_MODE !== "production";
  } catch { return false; }
}
