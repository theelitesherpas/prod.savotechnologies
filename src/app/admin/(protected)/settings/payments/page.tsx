import { requireAdminPage } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { canonicalOrigin } from "@/lib/env";
import { razorpayStatus } from "@/lib/razorpay-config";
import { STEP_UP_PURPOSE_PAYMENTS, STEP_UP_GRANT_TTL_MS, stepUpVerified, maskEmail, stepUpDestinationEmail } from "@/lib/step-up";
import type { Metadata } from "next";
import { PageHeader, Notice, Chip, DangerZone, BackLink } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/form";
import { FormGuard } from "@/components/admin/form-guard";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { saveRazorpayConfigAction, verifyRazorpayConfigAction, clearRazorpayConfigAction, sendStepUpCodeAction, verifyStepUpCodeAction, lockStepUpAction } from "./actions";

export const metadata: Metadata = { title: "Payment gateway" };

/**
 * Razorpay credential management. ADMIN ROLE ONLY (editors are redirected) —
 * payment credentials are the most sensitive data in the panel — and the
 * page requires a fresh EMAIL STEP-UP grant before anything is queried or
 * rendered: no status, no forms, no gateway metadata without verification.
 * Secrets are AES-256-GCM encrypted at rest; the stored secret is never sent
 * back to the browser, so blank fields mean "keep the saved value".
 */

const webhookUrl = `${canonicalOrigin}/api/webhooks/razorpay`;

export default async function PaymentsSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; verified?: string; cleared?: string; otp?: string; e?: string }>;
}) {
  const user = await requireAdminPage("/admin/settings/payments");
  if (user.role !== "admin") {
    // requireAdminPage authorizes the section; payments is additionally admin-only.
    redirect("/admin?denied=Payment%20credentials%20are%20admin-only");
  }
  const [{ saved, verified, cleared, otp, e }, granted] = await Promise.all([searchParams, stepUpVerified(user.id, STEP_UP_PURPOSE_PAYMENTS)]);
  // Fixed security inbox when configured; otherwise the signed-in admin's own email.
  let destination = user.email, fixedInbox = false;
  try {
    const configured = stepUpDestinationEmail();
    if (configured) { destination = configured; fixedInbox = true; }
  } catch {
    // Invalid STEP_UP_EMAIL: display the account inbox; the send action
    // surfaces the configuration error honestly when a code is requested.
  }

  // ── Unverified: challenge UI only. No gateway data is read or rendered. ──
  if (!granted) {
    return (
      <div className="max-w-xl">
        <BackLink href="/admin/settings" label="Site settings" />
        <PageHeader
          title="Payment gateway — verification required"
          description="Payment credentials are protected by email verification. A one-time code is sent to your admin account's registered address; the code works once and expires in 10 minutes."
        />

        {otp === "locked" ? <Notice>Verification locked. Request a new code to continue.</Notice> : null}
        {e ? <Notice kind="alert">{decodeURIComponent(e)}</Notice> : null}

        <FormGuard action={sendStepUpCodeAction} className="adm-card space-y-5 p-5 sm:p-6">
          <div>
            <p className="adm-label mb-1.5">Step 1 — request a code</p>
            <p className="t-caption text-muted">
              {fixedInbox
                ? <>The code is emailed to your registered security inbox (<span className="font-semibold">{maskEmail(destination)}</span>) — sent from hello@savotechnologies.com.</>
                : <>The code is emailed to your signed-in admin account (<span className="font-semibold">{maskEmail(destination)}</span>).
                If that inbox is not yours, sign in with the correct admin account first.</>}
            </p>
          </div>
          <SubmitButton label={otp === "sent" ? "Resend code" : "Send code to my email"} pendingLabel="Sending…" />
        </FormGuard>

        {otp === "sent" ? (
          <FormGuard action={verifyStepUpCodeAction} className="adm-card mt-6 space-y-5 p-5 sm:p-6">
            <div>
              <label htmlFor="code" className="adm-label mb-1.5 block">
                Step 2 — enter the 6-digit code
              </label>
              <input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                pattern="[0-9]{6}"
                minLength={6}
                maxLength={6}
                placeholder="••••••"
                className="adm-input max-w-[12rem] text-center font-mono text-lg tracking-[0.35em]"
              />
              <p className="t-caption mt-1.5 text-muted">
                Sent to {maskEmail(destination)} · expires in 10 minutes · single use. Verification stays valid for
                {" "}{Math.round(STEP_UP_GRANT_TTL_MS / 60_000)} minutes.
              </p>
            </div>
            <SubmitButton label="Verify and continue" pendingLabel="Verifying…" />
          </FormGuard>
        ) : null}
      </div>
    );
  }

  // ── Verified: full management surface. ──────────────────────────────────
  const status = await razorpayStatus();

  return (
    <div className="max-w-xl">
      <BackLink href="/admin/settings" label="Site settings" />
      <PageHeader
        title="Payment gateway — Razorpay"
        description="Credentials used to create payment links for client invoices and to verify payment webhooks. Secrets are encrypted at rest and never displayed again after saving."
      />

      {saved ? <Notice>Razorpay credentials saved and encrypted. Use “Verify connection” to test them against Razorpay.</Notice> : null}
      {verified ? <Notice>Razorpay accepted the credentials. The gateway is ready.</Notice> : null}
      {cleared ? <Notice>Stored Razorpay credentials were removed.</Notice> : null}
      {e ? <Notice kind="alert">{decodeURIComponent(e)}</Notice> : null}

      {/* ── Status ─────────────────────────────────────────────── */}
      <div className="adm-card mb-6 p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <p className="adm-label mr-auto">Current configuration</p>
          <Chip tone="success" mono>Email-verified</Chip>
          {status.configured ? (
            <>
              <Chip tone={status.mode === "live" ? "success" : "default"} mono>{status.mode === "live" ? "Live mode" : "Test mode"}</Chip>
              <Chip tone="muted" mono>{status.source === "database" ? "Stored here" : "Environment"}</Chip>
            </>
          ) : (
            <Chip tone="muted" mono>Not configured</Chip>
          )}
        </div>
        {status.configured ? (
          <dl className="space-y-2 text-[0.8438rem]">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">Key ID</dt>
              <dd className="font-mono text-[0.8125rem]">{status.keyIdMasked}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">Key Secret</dt>
              <dd className="font-semibold">Saved &amp; encrypted</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">Webhook secret</dt>
              <dd className="font-semibold">{status.hasWebhookSecret ? "Saved & encrypted" : "Not set"}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">Last verification</dt>
              <dd>
                {status.lastVerifiedAt ? (
                  status.lastVerifyOk ? (
                    <Chip tone="success" mono>Verified</Chip>
                  ) : (
                    <Chip tone="warning" mono>Failed</Chip>
                  )
                ) : (
                  <span className="text-muted">Never</span>
                )}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="t-caption text-muted">
            No Razorpay credentials are configured yet. Paste the Key ID and Key Secret below — the mode
            (test/live) is detected automatically from the Key ID.
          </p>
        )}
        {!status.secretBoxConfigured ? (
          <p className="mt-4 rounded-lg border border-error/25 bg-error/[0.05] px-4 py-3 text-[0.8125rem] font-medium text-error">
            Secret storage is locked: set <span className="font-mono">SECRETS_MASTER_KEY</span> in the server
            environment (base64, 32 bytes) and restart before saving credentials here.
          </p>
        ) : null}
      </div>

      {/* ── Save form ──────────────────────────────────────────── */}
      <FormGuard action={saveRazorpayConfigAction} className="adm-card space-y-6 p-5 sm:p-6">
        <div>
          <label htmlFor="keyId" className="adm-label mb-1.5 block">
            Key ID
          </label>
          <input
            id="keyId"
            name="keyId"
            type="text"
            required
            autoComplete="off"
            spellCheck={false}
            maxLength={80}
            pattern="rzp_(test|live)_[A-Za-z0-9]{6,64}"
            placeholder="rzp_live_XXXXXXXXXXXXXX"
            className="adm-input font-mono"
          />
          <p className="t-caption mt-1.5 text-muted">
            Razorpay Dashboard → Settings → API Keys. Test keys start with{" "}
            <span className="font-mono">rzp_test_</span>, live keys with <span className="font-mono">rzp_live_</span>.
          </p>
        </div>

        <div>
          <label htmlFor="keySecret" className="adm-label mb-1.5 block">
            Key Secret
          </label>
          <input
            id="keySecret"
            name="keySecret"
            type="password"
            autoComplete="new-password"
            minLength={16}
            maxLength={128}
            placeholder={status.configured && status.source === "database" ? "•••• saved — leave blank to keep ••••" : "Paste the Key Secret"}
            className="adm-input font-mono"
          />
          <p className="t-caption mt-1.5 text-muted">
            {status.configured && status.source === "database"
              ? "The stored secret is never shown. Leave blank to keep it; paste a new value to replace it (required when the Key ID changes)."
              : "Shown once by Razorpay when the key pair is generated. If you lost it, generate a new key pair in the Razorpay dashboard."}
          </p>
        </div>

        <div>
          <label htmlFor="webhookSecret" className="adm-label mb-1.5 block">
            Webhook secret (optional, recommended)
          </label>
          <input
            id="webhookSecret"
            name="webhookSecret"
            type="password"
            autoComplete="new-password"
            minLength={16}
            maxLength={128}
            placeholder={status.hasWebhookSecret ? "•••• saved — leave blank to keep ••••" : "Paste the webhook signing secret"}
            className="adm-input font-mono"
          />
          <p className="t-caption mt-1.5 text-muted">
            Razorpay Dashboard → Settings → Webhooks. Required to confirm invoice payments automatically;
            leave blank to keep the saved value.
          </p>
          {status.hasWebhookSecret ? (
            <label className="mt-3 flex items-center gap-2.5 text-[0.8125rem] font-medium text-muted">
              <input type="checkbox" name="clearWebhookSecret" className="h-4 w-4" />
              Remove the stored webhook secret
            </label>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
          <SubmitButton label="Save credentials" pendingLabel="Encrypting & saving…" />
          <p className="t-caption text-muted">Encrypted with AES-256-GCM before it touches the database.</p>
        </div>
      </FormGuard>

      {/* ── Verify ─────────────────────────────────────────────── */}
      <FormGuard action={verifyRazorpayConfigAction} className="adm-card mt-6 flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
        <div>
          <p className="adm-label">Connection test</p>
          <p className="t-caption mt-1 text-muted">
            Calls Razorpay with the saved credentials and records the result. Verify after every change.
          </p>
        </div>
        <SubmitButton label="Verify connection" pendingLabel="Contacting Razorpay…" />
      </FormGuard>

      {/* ── Webhook setup ──────────────────────────────────────── */}
      <div className="adm-card mt-6 p-5 sm:p-6">
        <p className="adm-label mb-2">Webhook endpoint (paste into the Razorpay dashboard)</p>
        <code className="block break-all rounded-lg border border-border bg-navy/[0.03] px-4 py-3 font-mono text-[0.8125rem]">{webhookUrl}</code>
        <ul className="t-caption mt-3 list-disc space-y-1.5 pl-5 text-muted">
          <li>In Razorpay → Settings → Webhooks, add this URL and set the same secret you saved above.</li>
          <li>Subscribe to the <span className="font-mono">payment_link.paid</span> and <span className="font-mono">payment_link.cancelled</span> events.</li>
          <li>The endpoint is inactive until the webhook secret is saved and the payment-link feature is live.</li>
        </ul>
      </div>

      {/* ── Session controls + danger zone ─────────────────────── */}
      <FormGuard action={lockStepUpAction} className="adm-card mt-6 flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
        <div>
          <p className="adm-label">Lock this page</p>
          <p className="t-caption mt-1 text-muted">
            Ends the email-verified session now. The next visit asks for a fresh code.
          </p>
        </div>
        <SubmitButton label="Lock now" pendingLabel="Locking…" compact />
      </FormGuard>

      {status.configured && status.source === "database" ? (
        <div className="mt-6">
          <DangerZone title="Remove stored credentials">
            <form action={clearRazorpayConfigAction}>
              <ConfirmDialog
                label="Remove Razorpay credentials"
                title="Remove stored credentials?"
                description="Payment links and webhook verification stop working immediately. Invoices keep their records; nothing is deleted from Razorpay."
                confirmLabel="Remove"
                tone="danger"
              />
            </form>
          </DangerZone>
        </div>
      ) : null}
    </div>
  );
}
