import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

// GET-only metadata/artwork checks. No applications, emails, meetings or CMS writes.
const base = process.env.BASE_URL ?? 'http://localhost:4340';
const origin = process.env.NEXT_PUBLIC_CANONICAL_ORIGIN ?? 'https://savotechnologies.com';
const checks = [], responses = [];
const check = (ok, label) => { assert(ok, label); checks.push(label); };
const routes = [
  ['/', 'home'], ['/about', 'who-we-are'], ['/ai-agents', 'ai'],
  ['/careers', 'careers'], ['/case-studies', 'case-studies'], ['/contact', 'contact'],
  ['/enterprise', 'enterprise'], ['/hire', 'hire-resources'], ['/industries', 'industries'],
  ['/insights', 'insights'], ['/services/mobile-app-development', 'mobile-app-development'],
  ['/services/ui-ux-design', 'product-design'], ['/services', 'services'],
  ['/start-a-project', 'start-a-project'], ['/services/web-development', 'web-development'],
  ['/careers/apply?role=general-application', 'careers'],
  ['/services/cloud-devops', 'services'], ['/services/ai-agent-development', 'ai'],
];
const agents = ['Twitterbot/1.0', 'facebookexternalhit/1.1'];
const decode = value => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'");
function tags(html) {
  const values = new Map();
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = Object.fromEntries([...match[0].matchAll(/([\w:-]+)="([^"]*)"/g)].map(item => [item[1], decode(item[2])]));
    const key = attrs.property ?? attrs.name;
    if (key && attrs.content !== undefined) values.set(key, [...(values.get(key) ?? []), attrs.content]);
  }
  return values;
}
for (const agent of agents) {
  for (const [path, slug] of routes) {
    const response = await fetch(`${base}${path}`, { headers: { 'user-agent': agent }, signal: AbortSignal.timeout(60000) });
    const html = await response.text(), meta = tags(html), file = `savo-og-${slug}.png`;
    const card = JSON.parse(readFileSync(`public/images/og/${file}.json`, 'utf8'));
    const expected = `${origin}/images/og/${file}?v=${card.sha256.slice(0, 12)}`;
    const label = `${agent}: ${path}`;
    check(response.status === 200, `${label}: HTTP 200`);
    check(meta.get('og:image')?.length === 1 && meta.get('og:image')?.[0] === expected, `${label}: correct sole Open Graph image`);
    check(meta.get('twitter:image')?.length === 1 && meta.get('twitter:image')?.[0] === expected, `${label}: matching Twitter image`);
    check(meta.get('og:image:width')?.[0] === String(card.width) && meta.get('og:image:height')?.[0] === String(card.height), `${label}: measured artwork dimensions`);
    check(meta.get('og:image:alt')?.[0] === card.alt && meta.get('twitter:card')?.[0] === 'summary_large_image', `${label}: image alt and large-image card`);
    check(tags(html.slice(0, html.indexOf('</head>'))).get('og:image')?.[0] === expected && meta.get('twitter:title')?.[0] === meta.get('og:title')?.[0], `${label}: crawler head metadata and Twitter title parity`);
    responses.push({ path, agent, status: response.status, image: expected });
  }
}
for (const file of readdirSync('public/images/og').filter(name => name.endsWith('.png'))) {
  const card = JSON.parse(readFileSync(`public/images/og/${file}.json`, 'utf8'));
  const response = await fetch(`${base}/images/og/${file}?v=${card.sha256.slice(0, 12)}`, { signal: AbortSignal.timeout(60000) });
  const bytes = Buffer.from(await response.arrayBuffer());
  check(response.status === 200 && response.headers.get('content-type')?.includes('image/png'), `${file}: public PNG is crawlable`);
  check(createHash('sha256').update(bytes).digest('hex') === card.sha256, `${file}: original owner PNG bytes served`);
}
const meetingSource = readFileSync('src/app/(site)/meeting/[token]/page.tsx', 'utf8');
check(meetingSource.includes('ownerSocialImage("meeting")') && !meetingSource.includes('/images/meeting-og.png'), 'private meeting preview uses supplied generic meeting artwork');
check(meetingSource.includes('robots: { index: false, follow: false, nocache: true }') && meetingSource.includes('referrer: "no-referrer"'), 'meeting preview privacy controls retained');
const report = process.env.SMOKE_REPORT ?? 'tmp/og-images/metadata-report.json';
mkdirSync(dirname(report), { recursive: true });
writeFileSync(report, JSON.stringify({ base, checks, responses, methods: ['GET'], productionDataWritten: false, createdAt: new Date().toISOString() }, null, 2), { mode: 0o600 });
console.log(`${checks.length} GET-only social-image checks passed across ${routes.length} routes, two crawler agents and all 16 PNGs.`);
