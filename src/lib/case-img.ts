/**
 * Cache-busting URL builder for case-study images served by /api/cs-img.
 * The stamp is the data URL's base64 tail — any re-encode or re-upload
 * changes it, which produces a new URL and busts the browser cache.
 * Identical images keep their URL and stay cached forever.
 */
export function caseImageSrc(slug: string, key: string, dataUrl: string): string {
  const stamp = dataUrl.slice(-10).replace(/[^a-zA-Z0-9]/g, "").slice(-8) || String(dataUrl.length);
  return `/api/cs-img?s=${encodeURIComponent(slug)}&k=${key}&v=${stamp}`;
}
