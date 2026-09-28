/**
 * Email Reply Poller — IMAP service that watches hr@ and hello@
 * mailboxes on Hostinger and imports replies into the admin panel.
 *
 * How it works:
 *   1. Every 60 seconds, connects to Hostinger IMAP (imap.hostinger.com)
 *   2. Checks both mailboxes for NEW (unseen) emails
 *   3. Posts each email to the local /api/email/inbound endpoint
 *   4. Marks the email as seen (so it's never imported twice)
 *   5. The existing inbound code stores it, matches it to the enquiry
 *      thread by sender email, and it appears in Admin → Emails
 *
 * Run under PM2 alongside the Next.js app:
 *   pm2 start scripts/email-poller.mjs --name savo-email-poller
 *
 * Environment variables (from .env.production):
 *   MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS      — hello@ mailbox
 *   MAIL_HR_USER, MAIL_HR_PASS                       — hr@ mailbox
 *   EMAIL_INBOUND_SECRET                             — webhook auth
 *   APP_PORT (default 4300)                          — local app port
 */

import { ImapFlow } from "imapflow";

const POLL_INTERVAL = 60 * 1000; // 60 seconds
const APP_PORT = process.env.APP_PORT || "4300";
const INBOUND_URL = `http://127.0.0.1:${APP_PORT}/api/email/inbound`;

const mailboxes = [
  {
    name: "hello",
    user: process.env.MAIL_USER || "hello@savotechnologies.com",
    pass: process.env.MAIL_PASS,
    dept: "hello",
  },
  {
    name: "hr",
    user: process.env.MAIL_HR_USER || "hr@savotechnologies.com",
    pass: process.env.MAIL_HR_PASS,
    dept: "hr",
  },
].filter((m) => m.pass);

const log = (msg, data) => {
  console.log(JSON.stringify({ ts: new Date().toISOString(), service: "email-poller", msg, ...data }));
};

async function pollMailbox(mailbox) {
  const client = new ImapFlow({
    host: process.env.IMAP_HOST || "imap.hostinger.com",
    port: 993,
    secure: true,
    auth: { user: mailbox.user, pass: mailbox.pass },
    logger: false,
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    let imported = 0;

    try {
      // Search for unseen messages
      const uids = await client.search({ seen: false });
      if (!uids || uids.length === 0) return;

      // Process up to 20 per cycle (safety cap)
      const batch = uids.slice(-20);

      for (const uid of batch) {
        const msg = await client.fetchOne(uid, {
          envelope: true,
          source: true,
          bodyStructure: true,
        });
        if (!msg) continue;

        const env = msg.envelope || {};
        const fromAddr = env.from?.[0]?.address || "";
        const fromName = env.from?.[0]?.name || "";
        const toAddr = env.to?.[0]?.address || mailbox.user;
        const subject = env.subject || "(no subject)";
        const messageId = env.messageId || "";

        // Extract body text (prefer text/plain, fallback to stripping HTML)
        let bodyText = "";
        let bodyHtml = null;
        if (msg.bodyStructure) {
          try {
            const { email } = await client.fetchOne(uid, { uid: true, envelope: true, source: true });
            if (email?.body?.text) bodyText = email.body.text;
          } catch {
            // fallback below
          }
        }

        // Simple source-based extraction fallback
        if (!bodyText && msg.source) {
          const source = msg.source.toString("utf-8");
          // Try to find text/plain part
          const ptMatch = source.match(/Content-Type:\s*text\/plain[\s\S]*?\r?\n\r?\n([\s\S]*?)(?:\r?\n--|\r?\n\.\r?\n|$)/i);
          if (ptMatch) bodyText = ptMatch[1].trim();
          // Or strip HTML tags
          if (!bodyText) {
            const htmlMatch = source.match(/Content-Type:\s*text\/html[\s\S]*?\r?\n\r?\n([\s\S]*?)(?:\r?\n--|\r?\n\.\r?\n|$)/i);
            if (htmlMatch) {
              bodyHtml = htmlMatch[1].trim();
              bodyText = bodyHtml
                .replace(/<style[\s\S]*?<\/style>/gi, "")
                .replace(/<script[\s\S]*?<\/script>/gi, "")
                .replace(/<br\s*\/?>/gi, "\n")
                .replace(/<\/p>/gi, "\n\n")
                .replace(/<[^>]+>/g, "")
                .trim();
            }
          }
        }

        // Skip if we have nothing useful
        if (!fromAddr || !fromAddr.includes("@")) {
          await client.messageFlagsAdd(uid, ["\\Seen"]);
          continue;
        }

        // Skip automated replies (out-of-office, bounces)
        if (/auto-reply|out of office|vacation|no.?reply|mailer-daemon|postmaster/i.test(subject)) {
          await client.messageFlagsAdd(uid, ["\\Seen"]);
          continue;
        }

        // POST to the existing inbound endpoint
        const payload = {
          from: fromName ? `${fromName} <${fromAddr}>` : fromAddr,
          to: toAddr,
          subject,
          text: bodyText || "(empty body)",
          html: bodyHtml || undefined,
          messageId,
        };

        const secret = process.env.EMAIL_INBOUND_SECRET;
        const url = secret ? `${INBOUND_URL}?secret=${secret}` : INBOUND_URL;

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch((err) => {
          log("post_failed", { error: String(err).slice(0, 100), from: fromAddr });
          return null;
        });

        if (res && res.ok) {
          imported++;
          log("imported", { from: fromAddr, subject: subject.slice(0, 50), dept: mailbox.dept });
        }

        // Mark as seen regardless (don't re-process)
        await client.messageFlagsAdd(uid, ["\\Seen"]);
      }
    } finally {
      lock.release();
    }

    if (imported > 0) log("cycle_done", { mailbox: mailbox.name, imported });
    await client.logout();
  } catch (err) {
    log("error", { mailbox: mailbox.name, error: String(err).slice(0, 200) });
    try { await client.logout(); } catch { /* ignore */ }
  }
}

async function main() {
  log("started", {
    mailboxes: mailboxes.map((m) => m.user),
    interval: `${POLL_INTERVAL / 1000}s`,
    inboundUrl: INBOUND_URL,
  });

  // Initial poll
  for (const mb of mailboxes) await pollMailbox(mb);

  // Poll on interval
  setInterval(async () => {
    for (const mb of mailboxes) await pollMailbox(mb);
  }, POLL_INTERVAL);
}

main().catch((err) => {
  log("fatal", { error: String(err) });
  process.exit(1);
});
