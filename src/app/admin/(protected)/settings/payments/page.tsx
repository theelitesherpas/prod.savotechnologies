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
import { saveRazorpayConfigAction, verifyRazorpayConfigAction, clearRazorpayConfigAction, sendStepUpCodeAction, verifyStepUpCodeAction, lockStepUpAction, saveBankDetailsAction } from "./actions";
import { getBankDetails } from "@/lib/bank-details";
import { paypalStatus } from "@/lib/paypal-config";
import { recentPayPalCheckouts } from "@/lib/paypal-receipt";
import { gatewaySwitches } from "@/lib/payment-availability";
import { GatewaySwitch } from "@/components/admin/gateway-switch";
import { PayPalSettings } from "@/components/admin/paypal-settings";

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
  searchParams: Promise<{ saved?: string; verified?: string; cleared?: string; bankSaved?: string; paypalSaved?: string; paypalVerified?: string; paypalCleared?: string; paypalReconciled?: string; availabilitySaved?: string; otp?: string; e?: string }>;
}) {
  const user = await requireAdminPage("/admin/settings/payments");
  if (user.role !== "admin") {
    // requireAdminPage authorizes the section; payments is additionally admin-only.
    redirect("/admin?denied=Payment%20credentials%20are%20admin-only");
  }
  const [{ saved, verified, cleared, bankSaved, paypalSaved, paypalVerified, paypalCleared, paypalReconciled, availabilitySaved, otp, e }, granted] = await Promise.all([searchParams, stepUpVerified(user.id, STEP_UP_PURPOSE_PAYMENTS)]);
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
  const availability = await gatewaySwitches();
  const status = await razorpayStatus();
  const bank = await getBankDetails().catch(() => null);
  const paypal = await paypalStatus().catch(() => null);
  const paypalRecent = await recentPayPalCheckouts().catch(() => []);

  return (
    <div className="max-w-xl">
      <BackLink href="/admin/settings" label="Site settings" />
      <PageHeader
        title="Payment gateways"
        description="Manage Razorpay, PayPal and bank deposit in checkout order. Credentials are encrypted at rest and protected by email verification; stored secrets are never displayed again."
      />

      {availabilitySaved ? <Notice>Gateway availability updated. Existing invoices use the current available methods; credentials and payment history are retained.</Notice> : null}
      {!availability.readable ? <Notice kind="alert">Gateway availability could not be loaded. New portal payments are blocked until settings are available again.</Notice> : null}
      <p className="t-caption mb-5 text-muted">Switches control portal checkout, including older unpaid invoices. Already-started payments can still be confirmed. External payment links are managed separately in the provider account.</p>
      {paypalReconciled ? <Notice>PayPal evidence checked. Only completed, matching captures can mark an invoice paid; pending/review states remain unchanged.</Notice> : null}
      {paypalSaved ? <Notice>PayPal credentials saved and encrypted. Verify the connection, then test in sandbox.</Notice> : null}
      {paypalVerified ? <Notice>PayPal accepted OAuth authentication. Complete sandbox checkout testing before enabling live payments.</Notice> : null}
      {paypalCleared ? <Notice>PayPal credentials removed. Payment records were retained.</Notice> : null}
      {saved ? <Notice>Razorpay credentials saved and encrypted. Use “Verify connection” to test them against Razorpay.</Notice> : null}
      {verified ? <Notice>Razorpay accepted the credentials. The gateway is ready.</Notice> : null}
      {cleared ? <Notice>Stored Razorpay credentials were removed.</Notice> : null}
      {bankSaved ? <Notice>Bank transfer details saved. The Bank Deposit option on the client pay page is updated.</Notice> : null}
      {e ? <Notice kind="alert">{decodeURIComponent(e)}</Notice> : null}

      <nav aria-label="Payment settings sections" className="mb-6 flex flex-wrap gap-3 text-sm"><a href="#razorpay" className="inline-flex min-h-11 items-center underline">1. Razorpay</a><a href="#paypal" className="inline-flex min-h-11 items-center underline">2. PayPal</a><a href="#bank" className="inline-flex min-h-11 items-center underline">3. Bank deposit</a></nav>
      <h2 id="razorpay" className="mb-4 scroll-mt-24 text-xl font-semibold">Razorpay</h2>
      {availability.readable ? <GatewaySwitch provider="razorpay" state={availability.razorpay}/> : null}
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

      <FormGuard action={verifyRazorpayConfigAction} className="adm-card mt-6 flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
        <div><h3 className="text-sm font-semibold">Razorpay connection</h3><p className="t-caption mt-1 text-muted">Verify the saved Razorpay credentials after every change.</p></div>
        <SubmitButton label="Verify Razorpay connection" pendingLabel="Contacting Razorpay…"/>
      </FormGuard>
      <div className="adm-card mt-6 p-5 sm:p-6"><h3 className="mb-2 text-sm font-semibold">Razorpay webhook</h3><code className="block break-all rounded-lg border border-border bg-navy/[0.03] px-4 py-3 font-mono text-[0.8125rem]">{webhookUrl}</code><p className="t-caption mt-3 text-muted">Add this endpoint in the Razorpay dashboard using the same saved webhook secret. Subscribe to payment.captured and payment_link.paid. Only verified events can confirm an invoice.</p></div>
      {status.configured && status.source === "database" ? <div className="mt-6"><DangerZone title="Remove Razorpay credentials"><form action={clearRazorpayConfigAction}><ConfirmDialog label="Remove Razorpay credentials" title="Remove stored Razorpay credentials?" description="Razorpay payment creation and webhook verification stop. Existing invoice and payment records are retained." confirmLabel="Remove" tone="danger"/></form></DangerZone></div> : null}

      {paypal ? <PayPalSettings availability={availability.readable ? availability.paypal : undefined} status={paypal} recent={paypalRecent} webhookUrl={`${canonicalOrigin}/api/webhooks/paypal`}/> : <p id="paypal" role="alert" className="mt-6 text-sm text-error">PayPal configuration could not be read. Check local schema and encrypted secret storage; no fallback credentials are used.</p>}
      <h2 id="bank" className="mt-8 scroll-mt-24 text-xl font-semibold">Bank deposit</h2>
      {/* ── Bank transfer details (manual payment option) ───────── */}
      <FormGuard action={saveBankDetailsAction} className="adm-card mt-6 space-y-5 p-5 sm:p-6">
        <div>
          <p className="adm-label">Bank transfer details</p>
          <p className="t-caption mt-1 text-muted">
            Shown on the client pay page under the Bank Deposit option. Leave fields empty to omit them; clearing
            everything removes the option (clients are asked to contact the team instead).
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { name: "accountName", label: "Account name", value: bank?.accountName ?? "", ph: "Savo Technologies Private Limited" },
            { name: "bankName", label: "Bank name", value: bank?.bankName ?? "", ph: "e.g. HDFC Bank" },
            { name: "accountNumber", label: "Account number", value: bank?.accountNumber ?? "", ph: "502000XXXXXX" },
            { name: "ifsc", label: "IFSC (domestic)", value: bank?.ifsc ?? "", ph: "HDFC0000123" },
            { name: "swift", label: "SWIFT / BIC (international)", value: bank?.swift ?? "", ph: "HDFCINBB" },
            { name: "branch", label: "Branch", value: bank?.branch ?? "", ph: "Ahmedabad" },
          ].map(f => (
            <div key={f.name}>
              <label htmlFor={`bank-${f.name}`} className="adm-label mb-1.5 block">{f.label}</label>
              <input id={`bank-${f.name}`} name={f.name} maxLength={120} defaultValue={f.value} placeholder={f.ph} className="adm-input" autoComplete="off" />
            </div>
          ))}
        </div>
        <div>
          <label htmlFor="bank-instructions" className="adm-label mb-1.5 block">Payment reference instructions</label>
          <input id="bank-instructions" name="instructions" maxLength={400} defaultValue={bank?.instructions ?? ""} placeholder="Include the invoice number in the transfer reference. Payment is confirmed within one business day." className="adm-input" />
        </div>
        <SubmitButton label="Save bank details" pendingLabel="Saving…" />
      </FormGuard>

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

    </div>
  );
}
