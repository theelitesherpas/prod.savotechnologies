/** Server-only runner. Dry-run unless --apply is explicitly supplied.
 * node --env-file=.env.production scripts/run-invoice-reminders.mjs --apply
 * Schedule every 15 min; the app enforces 9 AM IST, stages and deduplication.
 */
const secret = process.env.INVOICE_REMINDER_SECRET;
try {
  if (!secret || !/^[A-Za-z0-9_-]{32,256}$/.test(secret)) throw new Error("configuration");
  const base = new URL(process.env.INVOICE_REMINDER_BASE_URL || "http://127.0.0.1:4300");
  if (base.protocol !== "http:" || !["localhost", "127.0.0.1", "[::1]"].includes(base.hostname) || base.username || base.password || base.pathname !== "/" || base.search || base.hash) throw new Error("loopback required");
  const response = await fetch(new URL("/api/internal/invoice-reminders", base), {
    method: "POST", redirect: "error", signal: AbortSignal.timeout(600_000),
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: JSON.stringify({ apply: process.argv.includes("--apply") }),
  });
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error("job failed");
  // No tokens, recipient addresses, invoice contents or provider errors in logs.
  console.log(JSON.stringify({ event: "invoice_reminders.run", ...result }));
  if (result.status === "disabled" || result.failed > 0) process.exitCode = 1;
} catch {
  console.error("Invoice reminder job failed. Check the private scheduler configuration and server delivery records.");
  process.exitCode = 1;
}
