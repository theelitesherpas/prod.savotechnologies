#!/usr/bin/env node
/** Check ALREADY LOADED environment only. No .env reads, secrets printed, network or DB writes. */
const profile = process.argv[2] ?? "preview";
if (!["preview", "live"].includes(profile)) {
  console.error("Usage: node scripts/verify-runtime-env.mjs preview|live"); process.exit(2);
}
const e = process.env;
const issues = [];
const fail = code => issues.push(code);
const set = key => Boolean(e[key]?.trim());
const paired = (a, b) => set(a) === set(b);
if (!paired("NEXT_PUBLIC_RECAPTCHA_SITE_KEY", "RECAPTCHA_SECRET_KEY")) fail("CAPTCHA_KEYS_MUST_BE_PAIRED");
if (e.MAIL_DELIVERY_MODE && !["off", "live"].includes(e.MAIL_DELIVERY_MODE)) fail("MAIL_DELIVERY_MODE_INVALID");
if (!paired("MAIL_USER", "MAIL_PASS")) fail("SMTP_AUTH_MUST_BE_PAIRED");
if (e.MAIL_PORT && (!/^\d+$/.test(e.MAIL_PORT) || +e.MAIL_PORT < 1 || +e.MAIL_PORT > 65535)) fail("SMTP_PORT_INVALID");
if (e.MAIL_SECURE && !["true", "false"].includes(e.MAIL_SECURE)) fail("SMTP_SECURE_INVALID");
if (profile === "preview") {
  if (e.MAIL_DELIVERY_MODE === "live") fail("PREVIEW_LIVE_MAIL_FORBIDDEN");
  if (e.NEXT_PUBLIC_INDEXABLE === "true") fail("PREVIEW_INDEXING_FORBIDDEN");
} else {
  if (e.NODE_ENV !== "production") fail("LIVE_NODE_ENV_REQUIRED");
  if (e.NEXT_PUBLIC_CONTENT_MODE !== "production") fail("LIVE_PRODUCTION_CONTENT_REQUIRED");
  if (!set("ENQUIRY_IP_SALT") || e.ENQUIRY_IP_SALT.length < 32 || ["savo-dev-salt", "dev-salt", "local-development-salt"].includes(e.ENQUIRY_IP_SALT)) fail("LIVE_PRIVATE_SALT_REQUIRED");
  if (!["off", "live"].includes(e.MAIL_DELIVERY_MODE)) fail("LIVE_MAIL_MODE_EXPLICIT_REQUIRED");
  try {
    const db = new URL(e.DATABASE_URL);
    if (!["postgresql:", "postgres:"].includes(db.protocol) || !db.hostname || !db.pathname || db.pathname === "/") throw new Error();
    for (const name of ["connection_limit", "pool_timeout"]) {
      const value = db.searchParams.get(name);
      if (!value || !/^\d+$/.test(value) || !Number.isSafeInteger(+value) || +value < 1) fail(`LIVE_DB_${name.toUpperCase()}_REQUIRED`);
    }
  } catch { fail("LIVE_DATABASE_URL_REQUIRED"); }
}
if (e.MAIL_DELIVERY_MODE === "live") {
  if (!set("MAIL_HOST")) fail("LIVE_SMTP_HOST_REQUIRED");
  if (e.NODE_ENV !== "production" || e.NEXT_PUBLIC_CONTENT_MODE !== "production") fail("LIVE_MAIL_REQUIRES_PRODUCTION_RUNTIME_AND_CONTENT");
}
if (e.INVOICE_REMINDERS_ENABLED && !["true", "false"].includes(e.INVOICE_REMINDERS_ENABLED)) fail("INVOICE_REMINDERS_ENABLED_INVALID");
if (e.INVOICE_REMINDERS_ENABLED === "true") {
  if (!/^[A-Za-z0-9_-]{32,256}$/.test(e.INVOICE_REMINDER_SECRET || "")) fail("INVOICE_REMINDER_PRIVATE_SECRET_REQUIRED");
  if (e.MAIL_DELIVERY_MODE !== "live" || e.NODE_ENV !== "production" || e.NEXT_PUBLIC_CONTENT_MODE !== "production") fail("INVOICE_REMINDERS_REQUIRE_LIVE_MAIL");
  if (profile !== "live") fail("PREVIEW_AUTOMATIC_REMINDERS_FORBIDDEN");
}
if (issues.length) {
  console.error(`Runtime preflight (${profile}) failed: ${issues.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log(`Runtime preflight (${profile}) passed configuration checks only; delivery, DB capacity and ingress remain unverified.`);
}
