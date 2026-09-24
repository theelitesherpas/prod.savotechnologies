#!/usr/bin/env node
/**
 * IndexNow notifier (optional — Bing and participating engines; Google is
 * not part of IndexNow).
 *
 * Pings IndexNow for public canonical URLs when they are created, meaningfully
 * updated or deleted. Reads the production sitemap and submits every URL once;
 * intended to be run on demand after a release (e.g. from CI or manually):
 *
 *   INDEXNOW_KEY=<key> node scripts/indexnow.mjs            # full sitemap
 *   INDEXNOW_KEY=<key> node scripts/indexnow.mjs /about /contact  # specific
 *
 * The key file must also be served at /<key>.txt — add the key to public/
 * when you enable this. Do not schedule aggressive automated runs without
 * real content changes; the protocol is for genuine updates.
 */

const ORIGIN = "https://savotechnologies.com";
const ENDPOINT = "https://api.indexnow.org/indexnow";

const key = process.env.INDEXNOW_KEY;
if (!key) {
  console.error("IndexNow: set INDEXNOW_KEY to enable. Exiting without pinging.");
  process.exit(0);
}

const args = process.argv.slice(2);

let urls = args.map((p) => `${ORIGIN}${p.startsWith("/") ? p : `/${p}`}`);

if (urls.length === 0) {
  const res = await fetch(`${ORIGIN}/sitemap.xml`);
  if (!res.ok) {
    console.error(`IndexNow: could not read sitemap (${res.status}).`);
    process.exit(1);
  }
  const xml = await res.text();
  urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
}

const res = await fetch(ENDPOINT, {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: "savotechnologies.com", key, keyLocation: `${ORIGIN}/${key}.txt`, urlList: urls }),
});

console.log(`IndexNow: submitted ${urls.length} URL(s) — HTTP ${res.status}.`);
if (res.status === 202) console.log("IndexNow: accepted (key validation pending).");
