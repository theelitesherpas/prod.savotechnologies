"use client";

import { useMemo, useState } from "react";
import { sendCustomEmailAction } from "@/app/admin/(protected)/email-templates/actions";
import { FormGuard } from "@/components/admin/form-guard";
import { SubmitButton } from "@/components/admin/form";
import { shell } from "@/lib/mail/templates";
import { bodyToHtml } from "@/lib/mail/registry";

/** Compose form — branded one-off email with live preview and a
 *  client-address picker from the portal roster. */
export function ComposeForm({ clients }: { clients: { email: string; name: string }[] }) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const html = useMemo(
    () => shell({ preheader: subject.slice(0, 120), heading: "", bodyHtml: bodyToHtml(body || "…" ) }),
    [subject, body],
  );

  return (
    <FormGuard action={sendCustomEmailAction} className="space-y-4">
      <div className="adm-card p-5">
        <label htmlFor="compose-to" className="adm-label mb-1.5 block">
          To
        </label>
        <input
          id="compose-to"
          name="to"
          type="email"
          required
          maxLength={160}
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="name@company.com"
          list="client-emails"
          className="adm-input"
        />
        {clients.length > 0 ? (
          <datalist id="client-emails">
            {clients.map((c) => (
              <option key={c.email} value={c.email}>
                {c.name}
              </option>
            ))}
          </datalist>
        ) : null}
      </div>

      <div className="adm-card p-5">
        <label htmlFor="compose-subject" className="adm-label mb-1.5 block">
          Subject
        </label>
        <input
          id="compose-subject"
          name="subject"
          required
          maxLength={300}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="adm-input"
        />
      </div>

      <div className="adm-card p-5">
        <label htmlFor="compose-body" className="adm-label mb-1.5 block">
          Message
        </label>
        <p className="t-caption mb-2 text-muted">
          Plain text or HTML — the branded header and footer wrap it automatically.
        </p>
        <textarea
          id="compose-body"
          name="body"
          required
          rows={10}
          maxLength={20000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="adm-textarea"
          placeholder="Write the email your customer will receive…"
        />
        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          aria-expanded={showPreview}
          className="t-caption mt-3 font-semibold text-accent transition-colors hover:underline"
        >
          {showPreview ? "Hide preview" : "Preview before sending"}
        </button>
        {showPreview ? (
          <div className="mt-3 overflow-hidden rounded-lg border border-border">
            <iframe
              title="Compose preview"
              sandbox=""
              srcDoc={html}
              className="h-80 w-full border-0 bg-[#f5f4f0]"
            />
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton label="Send email" pendingLabel="Sending…" />
        <p className="t-caption text-muted">
          Sent from {`${"hello@savotechnologies.com"}`} via the configured SMTP mailbox.
        </p>
      </div>
    </FormGuard>
  );
}
