/**
 * Lightweight IP geolocation - free ip-api.com lookup with in-memory
 * caching (1 hour TTL). Falls back gracefully (null fields) when the
 * service is unreachable; analytics must never fail because geo lookup
 * is down.
 *
 * For high-traffic production, swap the fetch for a local MaxMind
 * GeoLite2 database (same interface, zero network calls).
 */

type GeoResult = {
  country: string | null;
  countryCode: string | null;
  city: string | null;
  region: string | null;
};

type CacheEntry = { data: GeoResult; expires: number };

const cache = new Map<string, CacheEntry>();
const TTL = 60 * 60 * 1000; // 1 hour
const MAX_CACHE = 2000;

export function lookupGeo(ip: string): Promise<GeoResult> {
  // Skip private/loopback IPs
  if (!ip || ip === "unknown" || ip.startsWith("127.") || ip.startsWith("10.") || ip.startsWith("192.168.") || ip === "::1" || ip.startsWith("fc") || ip.startsWith("fd")) {
    return Promise.resolve({ country: null, countryCode: null, city: null, region: null });
  }

  const cached = cache.get(ip);
  if (cached && cached.expires > Date.now()) {
    return Promise.resolve(cached.data);
  }

  return fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,countryCode,city,regionName`, {
    signal: AbortSignal.timeout(3000),
  })
    .then((r) => r.json())
    .then((d: { status?: string; country?: string; countryCode?: string; city?: string; regionName?: string }) => {
      const result: GeoResult =
        d.status === "success"
          ? {
              country: d.country ?? null,
              countryCode: d.countryCode ?? null,
              city: d.city ?? null,
              region: d.regionName ?? null,
            }
          : { country: null, countryCode: null, city: null, region: null };

      cache.set(ip, { data: result, expires: Date.now() + TTL });
      if (cache.size > MAX_CACHE) {
        const oldest = cache.keys().next().value;
        if (oldest) cache.delete(oldest);
      }
      return result;
    })
    .catch(() => ({ country: null, countryCode: null, city: null, region: null }));
}
