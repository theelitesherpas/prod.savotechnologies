#!/usr/bin/env node
/**
 * ── PRODUCTION BUILD GUARD (demo content policy) ────────────────────────────
 *
 * Runs as a prebuild step. Enforces the demo/verified content separation:
 *
 *  1. CONTENT_MODE consistency
 *     - NEXT_PUBLIC_CONTENT_MODE=production requires an explicit opt-in;
 *       anything else is "demo" (the safe default).
 *     - Demo builds must be noindex: NEXT_PUBLIC_INDEXABLE=true together
 *       with demo mode fails the build.
 *
 *  2. Demo containment
 *     - Files carrying `status: "demo"` / DEMO markers may live only under
 *       src/content/demo/ (the centralized registry).
 *     - src/content/demo may be imported ONLY by modules that gate it
 *       through src/lib/content-mode.ts (they must reference IS_DEMO /
 *       CONTENT_MODE / demoRecord / productionSafe).
 *
 *  3. Production-critical placeholder sweep
 *     - In production mode, company-identity constants must not carry
 *       explicit REPLACE_BEFORE_PRODUCTION markers.
 *
 * Exit code 1 blocks the build with a clear report.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const SRC = join(ROOT, "src");
const DEMO_DIR = join(SRC, "content", "demo");
const MODE = process.env.NEXT_PUBLIC_CONTENT_MODE === "production" ? "production" : "demo";
const INDEXABLE = process.env.NEXT_PUBLIC_INDEXABLE === "true";

const errors = [];
const notes = [];

// ── 1. Mode consistency ──────────────────────────────────────────────────────
if (MODE === "demo" && INDEXABLE) {
  errors.push(
    "Demo build with NEXT_PUBLIC_INDEXABLE=true — demo content must never be indexable. " +
      "Unset NEXT_PUBLIC_INDEXABLE or set NEXT_PUBLIC_CONTENT_MODE=production."
  );
}
notes.push(`CONTENT_MODE=${MODE}${INDEXABLE ? " (indexable)" : " (noindex)"}`);

// ── helpers ──────────────────────────────────────────────────────────────────
function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (/\.(ts|tsx)$/.test(name)) acc.push(p);
  }
  return acc;
}

const demoMarker = /status:\s*"demo"|DEMO\s+—\s+REPLACE BEFORE PRODUCTION|DEMO TESTIMONIAL|DEMO DATA/i;
const gateRef = /IS_DEMO|CONTENT_MODE|demoRecord|productionSafe/;

// ── 2. Demo containment ──────────────────────────────────────────────────────
const srcFiles = walk(SRC);
let demoRecords = 0;

for (const file of srcFiles) {
  const rel = relative(ROOT, file);
  const text = readFileSync(file, "utf8");
  const inDemoDir = file.startsWith(DEMO_DIR);
  if (!demoMarker.test(text)) continue;

  if (inDemoDir) {
    demoRecords += (text.match(/status:\s*"demo"/g) ?? []).length;
    continue;
  }

  // Outside src/content/demo — allowed only for the gate module itself and
  // modules that route through it (constants re-export gated data).
  if (rel === join("src", "lib", "content-mode.ts")) continue;

  if (!gateRef.test(text)) {
    errors.push(
      `${rel}: carries demo content markers but never references the CONTENT_MODE gate ` +
        `(IS_DEMO / demoRecord / productionSafe). Move the data into src/content/demo/ and gate it.`
    );
  } else {
    notes.push(`${rel}: gated demo consumer (ok)`);
  }
}

// Imports of the demo registry must be gated consumers.
for (const file of srcFiles) {
  const rel = relative(ROOT, file);
  if (file.startsWith(DEMO_DIR)) continue;
  const text = readFileSync(file, "utf8");
  if (!/@\/content\/demo/.test(text)) continue;
  if (!gateRef.test(text)) {
    errors.push(
      `${rel}: imports @/content/demo without the CONTENT_MODE gate — demo data would render unconditionally.`
    );
  }
}

// ── 3. Production placeholder sweep ─────────────────────────────────────────
if (MODE === "production") {
  const criticalDirs = [join(SRC, "constants"), join(SRC, "content")];
  for (const dir of criticalDirs) {
    for (const file of walk(dir)) {
      const text = readFileSync(file, "utf8");
      if (/REPLACE_BEFORE_PRODUCTION/.test(text)) {
        errors.push(
          `${relative(ROOT, file)}: REPLACE_BEFORE_PRODUCTION marker present in a production build — ` +
            `replace the demo value or keep the build in demo mode.`
        );
      }
    }
  }
  if (demoRecords === 0) notes.push("No demo records found (clean production content set).");
}

// ── report ───────────────────────────────────────────────────────────────────
for (const n of notes) console.log(`  · ${n}`);
if (errors.length) {
  console.error(`\n✖ Content guard failed (${errors.length}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`✔ Content guard passed — ${demoRecords} demo record(s) centralized, mode=${MODE}.`);
