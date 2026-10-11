import { isPrivateSurface } from "@/lib/publication-policy";
import { BASE_PATH } from "@/lib/utils";

function publicPath(url: URL): string | null {
  if (!["http:", "https:"].includes(url.protocol)) return null;
  const path = BASE_PATH && (url.pathname === BASE_PATH || url.pathname.startsWith(`${BASE_PATH}/`))
    ? url.pathname.slice(BASE_PATH.length) || "/" : url.pathname;
  return isPrivateSurface(path.toLowerCase()) ? null : url.pathname;
}
/** Paths only: private tokens, query strings and fragments never enter analytics. */
export function publicTelemetryPath(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.length > 2048) return null;
  try { return publicPath(new URL(value, "https://telemetry.invalid")); } catch { return null; }
}
/** URL context only, never credentials/query/fragment; private contexts are omitted. */
export function publicTelemetryUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    const path = publicPath(url);
    return path ? `${url.origin}${path}` : null;
  } catch { return null; }
}
