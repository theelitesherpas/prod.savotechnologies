"use client";

import { useMemo, useState } from "react";
import { sendCustomEmailAction, sendTemplatedEmailAction } from "@/app/admin/(protected)/email-templates/actions";
import { FormGuard } from "@/components/admin/form-guard";
import { SubmitButton } from "@/components/admin/form";
import { TEMPLATE_REGISTRY, RECIPIENT_LABEL, CATEGORY_ORDER, CATEGORY_LABEL } from "@/lib/mail/registry";
import { employeeVars } from "@/lib/employees";
import { shell } from "@/lib/mail/templates";
import { bodyToHtml } from "@/lib/mail/registry";
import { cn } from "@/lib/utils";

/**
 * Compose - two modes:
 *   · Template: pick any registry template (grouped by category), fill
 *     its variables, preview live, send with override + dept routing.
 *   · Blank: a one-off branded email from scratch.
 */
type EmployeeLite = {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  position: string;
  department: string;
  joiningDate: Date;
  probationEnds: Date | null;
  lastWorkingDay: Date | null;
  ctc: string | null;
  manager: string | null;
  location: string | null;
  leaves: { status: string; days: number }[];
};

export function ComposeForm({
  clients,
  employees,
  preselectEmployeeId,
  preselectTemplate,
  dept,
  preTo,
  preSubject,
}: {
  clients: { email: string; name: string }[];
  employees: EmployeeLite[];
  preselectEmployeeId?: string;
  preselectTemplate?: string;
  /** Scope to one department's templates (hr = HR/careers, hello = client). */
  dept?: "hr" | "hello";
  preTo?: string;
  preSubject?: string;
}) {
  const scoped = dept ? TEMPLATE_REGISTRY.filter((t) => t.dept === dept) : TEMPLATE_REGISTRY;
  const pool = scoped.length ? scoped : TEMPLATE_REGISTRY;
  const [mode, setMode] = useState<"template" | "blank">(dept === "hr" ? "template" : "template");
  const [templateKey, setTemplateKey] = useState(
    preselectTemplate && pool.some((t) => t.key === preselectTemplate) ? preselectTemplate : pool[0].key,
  );
  const [autofilledFrom, setAutofilledFrom] = useState<string | null>(null);
  const [to, setTo] = useState(() => preTo || (() => {
    const emp = preselectEmployeeId ? employees.find((em) => em.id === preselectEmployeeId) : undefined;
    return emp?.email ?? "";
  })());
  const [vars, setVars] = useState<Record<string, string>>(() => {
    const first = pool.find((t) => t.key === (preselectTemplate ?? pool[0].key)) ?? pool[0];
    const emp = preselectEmployeeId ? employees.find((em) => em.id === preselectEmployeeId) : undefined;
    return emp ? { ...first.vars, ...employeeVars(emp, emp.leaves) } : { ...first.vars };
  });
  const [subject, setSubject] = useState(preSubject ?? "");
  const [body, setBody] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const entry = pool.find((t) => t.key === templateKey) ?? pool[0];

  const resetVars = (key: string) => {
    setTemplateKey(key);
    const e = TEMPLATE_REGISTRY.find((t) => t.key === key);
    setVars(e ? { ...e.vars } : {});
  };
  const previewHtml = useMemo(() => {
    if (mode === "blank") {
      return shell({ preheader: subject.slice(0, 120), heading: "", bodyHtml: bodyToHtml(body || "…") });
    }
    const effective = { ...entry.vars, ...vars };
    return entry.default(effective).html;
  }, [mode, entry, vars, subject, body]);

  return (
    <div className="space-y-4">
      {/* Mode switch */}
      <div className="adm-card flex flex-wrap items-center gap-2 p-3">
        {dept === "hr" ? null : (
          <div className="flex rounded-lg border border-border p-0.5" role="group" aria-label="Compose mode">
            {(["template", "blank"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={cn(
                  "rounded-md px-3 py-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.08em] transition-colors",
                  mode === m ? "bg-foreground text-background" : "text-muted hover:text-foreground",
                )}
              >
                {m === "template" ? "From template" : "Blank email"}
              </button>
            ))}
          </div>
        )}
        <p className="t-caption ml-auto hidden text-muted sm:block">
          {mode === "template"
            ? "Templates send via their department (HR templates from hr@, site templates from hello@)."
            : "A one-off branded email from hello@."}
        </p>
      </div>

      {mode === "template" ? (
        <FormGuard action={sendTemplatedEmailAction} className="space-y-4">
          <input type="hidden" name="templateKey" value={templateKey} />

          {/* Template picker - grouped */}
          <div className="adm-card p-5">
            <label htmlFor="compose-template" className="adm-label mb-1.5 block">
              Template
            </label>
            <select
              id="compose-template"
              value={templateKey}
              onChange={(e) => resetVars(e.target.value)}
              className="adm-select"
            >
              {CATEGORY_ORDER.map((cat) => {
                const entries = pool.filter((t) => t.category === cat);
                if (!entries.length) return null;
                return (
                  <optgroup key={cat} label={CATEGORY_LABEL[cat]}>
                    {entries.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.label} - {RECIPIENT_LABEL[t.recipient]}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
            <p className="t-caption mt-2 text-muted">{entry.fires}.</p>
          </div>

          {/* Recipient */}
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

          {/* Variables */}
          <div className="adm-card p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <p className="adm-label">Details (variables)</p>
              <span className="ml-auto flex items-center gap-2">
                <label htmlFor="autofill-emp" className="t-caption text-muted">Autofill from employee</label>
                {dept && dept !== "hr" ? null : (
                <select
                  id="autofill-emp"
                  value={autofilledFrom ?? ""}
                  onChange={(e) => {
                    const emp = employees.find((em) => em.id === e.target.value);
                    if (!emp) {
                      setAutofilledFrom(null);
                      resetVars(templateKey);
                      return;
                    }
                    setAutofilledFrom(emp.id);
                    setTo(emp.email);
                    const entry2 = TEMPLATE_REGISTRY.find((t) => t.key === templateKey);
                    setVars({ ...(entry2?.vars ?? {}), ...employeeVars(emp, emp.leaves) });
                  }}
                  className="adm-select h-9 max-w-[16rem] py-1"
                >
                  <option value="">- manual -</option>
                  {employees.map((em) => (
                    <option key={em.id} value={em.id}>
                      {em.employeeCode} · {em.name}
                    </option>
                  ))}
                </select>
                )}
              </span>
            </div>
            {autofilledFrom ? (
              <p className="t-caption mb-3 rounded-md border border-accent/30 bg-accent/[0.05] px-3 py-2 text-muted">
                Fields filled from the employee record. Adjust anything below before sending.
              </p>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(entry.vars).map(([k, sample]) => (
                <div key={k} className={k.length > 40 ? "sm:col-span-2" : undefined}>
                  <label htmlFor={`var-${k}`} className="adm-label mb-1 block font-mono text-[0.6875rem] normal-case">
                    {k}
                  </label>
                  {sample.length > 60 || k === "openingsList" || k === "documents" || sample.includes("\n") ? (
                    <textarea
                      id={`var-${k}`}
                      name={`var_${k}`}
                      rows={3}
                      maxLength={500}
                      value={vars[k] ?? ""}
                      onChange={(e) => setVars((v) => ({ ...v, [k]: e.target.value }))}
                      placeholder={sample}
                      className="adm-textarea"
                    />
                  ) : (
                    <input
                      id={`var-${k}`}
                      name={`var_${k}`}
                      maxLength={200}
                      value={vars[k] ?? ""}
                      onChange={(e) => setVars((v) => ({ ...v, [k]: e.target.value }))}
                      placeholder={sample}
                      className="adm-input"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Preview + send */}
          <div className="adm-card p-5">
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              aria-expanded={showPreview}
              className="t-caption font-semibold text-accent transition-colors hover:underline"
            >
              {showPreview ? "Hide preview" : "Preview before sending"}
            </button>
            {showPreview ? (
              <div className="mt-3 overflow-hidden rounded-lg border border-border">
                <iframe title="Compose preview" sandbox="" srcDoc={previewHtml} className="h-96 w-full border-0 bg-[#f5f4f0]" />
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <SubmitButton label={`Send via ${entry.dept === "hr" ? "hr@" : "hello@"}`} pendingLabel="Sending…" />
            <p className="t-caption text-muted">Sends from {entry.dept === "hr" ? "hr@savotechnologies.com" : "hello@savotechnologies.com"}.</p>
          </div>
        </FormGuard>
      ) : (
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
              className="adm-input"
            />
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
            <p className="t-caption mb-2 text-muted">Plain text or HTML - the branded shell wraps it automatically.</p>
            <textarea
              id="compose-body"
              name="body"
              required
              rows={10}
              maxLength={20000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="adm-textarea"
              placeholder="Write the email your recipient will receive…"
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
                <iframe title="Compose preview" sandbox="" srcDoc={previewHtml} className="h-80 w-full border-0 bg-[#f5f4f0]" />
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <SubmitButton label="Send email" pendingLabel="Sending…" />
            <p className="t-caption text-muted">Sends from hello@savotechnologies.com.</p>
          </div>
        </FormGuard>
      )}
    </div>
  );
}
