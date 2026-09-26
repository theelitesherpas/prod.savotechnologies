"use client";

import { useMemo, useState } from "react";
import { TEMPLATE_REGISTRY, RECIPIENT_LABEL, CATEGORY_ORDER, CATEGORY_LABEL, fillText, bodyToHtml, type TemplateEntry, type TemplateCategory } from "@/lib/mail/registry";
import { shell } from "@/lib/mail/templates";
import { saveTemplateAction, resetTemplateAction } from "@/app/admin/(protected)/email-templates/actions";
import { FormGuard } from "@/components/admin/form-guard";
import { SubmitButton, ConfirmButton } from "@/components/admin/form";
import { cn } from "@/lib/utils";

/**
 * Email template editor - pick a template, customise subject + body with
 * {{placeholders}}, watch a live preview, save the override (or reset to
 * the tested code default). Overrides render inside the same branded
 * shell, so custom emails stay on brand automatically.
 */

type Override = { key: string; subject: string; body: string };

/** Editable starter: the default email's text with sample values swapped
 *  for {{placeholders}}, so edits begin from something close to reality. */
function starterFor(entry: TemplateEntry): string {
  const rendered = entry.default(entry.vars).text;
  let out = rendered;
  for (const [name, sample] of Object.entries(entry.vars)) {
    out = out.split(sample).join(`{{${name}}}`);
  }
  return out.trim();
}

/** Default subject with sample values swapped for placeholders. */
function fillSubject(entry: TemplateEntry): string {
  let out = entry.default(entry.vars).subject;
  for (const [name, sample] of Object.entries(entry.vars)) {
    out = out.split(sample).join(`{{${name}}}`);
  }
  return out;
}

export function EmailTemplateEditor({ overrides }: { overrides: Override[] }) {
  const [activeKey, setActiveKey] = useState(TEMPLATE_REGISTRY[0].key);
  const [mode, setMode] = useState<"preview" | "edit">("preview");
  const entry = TEMPLATE_REGISTRY.find((e) => e.key === activeKey) ?? TEMPLATE_REGISTRY[0];
  const override = overrides.find((o) => o.key === activeKey);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  // Load editor fields when switching to a template (override if present,
  // otherwise the derived starter).
  if (loadedFor !== activeKey) {
    setLoadedFor(activeKey);
    setSubject(override?.subject ?? fillSubject(entry));
    setBody(override?.body ?? starterFor(entry));
  }

  const defaultTpl = useMemo(() => entry.default(entry.vars), [entry]);

  // Live preview of the override (sample values), wrapped in the shell.
  const overrideHtml = useMemo(() => {
    const html = bodyToHtml(fillText(body, entry.vars));
    return shell({ preheader: fillText(subject, entry.vars).slice(0, 120), heading: "", bodyHtml: html });
  }, [body, subject, entry]);

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
      {/* List - grouped by category */}
      <nav aria-label="Email templates" className="adm-card max-h-[78vh] overflow-y-auto p-2">
        {CATEGORY_ORDER.map((cat: TemplateCategory) => {
          const entries = TEMPLATE_REGISTRY.filter((e) => e.category === cat);
          if (!entries.length) return null;
          return (
            <div key={cat} className="mb-3 last:mb-0">
              <p className="adm-label px-3 pb-1.5 pt-2">{CATEGORY_LABEL[cat]}</p>
              <ul>
                {entries.map((e) => {
                  const has = overrides.some((o) => o.key === e.key);
                  return (
                    <li key={e.key}>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveKey(e.key);
                          setMode("preview");
                        }}
                        aria-current={e.key === activeKey ? "true" : undefined}
                        className={cn(
                          "w-full rounded-lg px-3 py-2.5 text-left transition-colors",
                          e.key === activeKey ? "bg-foreground text-background" : "hover:bg-foreground/[0.04]",
                        )}
                      >
                        <span className="block text-[0.8125rem] font-semibold">
                          {e.label}
                          {has ? (
                            <span
                              className={cn(
                                "ml-2 font-mono text-[0.625rem] uppercase",
                                e.key === activeKey ? "text-background/70" : "text-accent",
                              )}
                            >
                              custom
                            </span>
                          ) : null}
                        </span>
                        <span className={cn("t-caption block", e.key === activeKey ? "text-background/70" : "text-muted")}>
                          → {RECIPIENT_LABEL[e.recipient]}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Editor / preview */}
      <div className="min-w-0">
        <div className="adm-card mb-3 flex flex-wrap items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[0.9375rem] font-bold tracking-[-0.01em]">{entry.label}</h2>
            <p className="t-caption mt-1 text-muted">
              Fires: {entry.fires} · → {RECIPIENT_LABEL[entry.recipient]}
              {override ? " · customised" : " · code default"}
            </p>
          </div>
          <div className="flex rounded-lg border border-border p-0.5" role="group" aria-label="View mode">
            {(["preview", "edit"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={cn(
                  "rounded-md px-3 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.08em] transition-colors",
                  mode === m ? "bg-foreground text-background" : "text-muted hover:text-foreground",
                )}
              >
                {m === "preview" ? "Preview" : "Customise"}
              </button>
            ))}
          </div>
        </div>

        {mode === "preview" ? (
          <div>
            <div className="adm-card mb-3 px-4 py-3">
              <p className="font-mono text-[0.75rem] text-foreground">
                Subject: {override ? fillText(subject, entry.vars) : defaultTpl.subject}
                {override ? (
                  <span className="ml-2 font-sans text-[0.6875rem] font-semibold uppercase text-accent">custom</span>
                ) : null}
              </p>
            </div>
            <div className="adm-card overflow-hidden">
              <iframe
                key={`${entry.key}-${override ? "custom" : "default"}`}
                title={`${entry.label} preview`}
                sandbox=""
                srcDoc={override ? overrideHtml : defaultTpl.html}
                className="h-[560px] w-full border-0 bg-[#f5f4f0]"
              />
            </div>
            <p className="t-caption mt-2 text-muted">
              Sample data is shown; real sends use each customer&apos;s details. Choose{" "}
              <strong>Customise</strong> to edit this email.
            </p>
          </div>
        ) : (
          <FormGuard action={saveTemplateAction} className="space-y-4">
            <input type="hidden" name="key" value={entry.key} />
            <div className="adm-card p-4">
              <label htmlFor="tpl-subject" className="adm-label mb-1.5 block">
                Subject
              </label>
              <input
                id="tpl-subject"
                name="subject"
                required
                maxLength={300}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="adm-input"
              />
            </div>
            <div className="adm-card p-4">
              <label htmlFor="tpl-body" className="adm-label mb-1.5 block">
                Body
              </label>
              <p className="t-caption mb-2 text-muted">
                Plain text or HTML. Use the variables below - they fill automatically per send. The
                branded header/footer wrap every email automatically.
              </p>
              <textarea
                id="tpl-body"
                name="body"
                required
                rows={12}
                maxLength={20000}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="adm-textarea font-mono text-[0.8125rem]"
              />
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="t-caption text-muted">Insert:</span>
                {Object.keys(entry.vars).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setBody((b) => `${b}{{${v}}}`)}
                    className="t-caption rounded-md border border-border px-2 py-1 font-mono text-accent transition-colors hover:border-accent"
                  >
                    {`{{${v}}}`}
                  </button>
                ))}
              </div>
            </div>
            <div className="adm-card p-4">
              <p className="adm-label mb-2">Live preview (sample values)</p>
              <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
                <iframe
                  title={`${entry.label} live preview`}
                  sandbox=""
                  srcDoc={overrideHtml}
                  className="h-64 w-full border-0 bg-[#f5f4f0]"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <SubmitButton label="Save custom template" />
              {override ? (
                <form action={resetTemplateAction}>
                  <input type="hidden" name="key" value={entry.key} />
                  <ConfirmButton label="Reset to default" confirmLabel="Confirm reset" tone="quiet" />
                </form>
              ) : null}
              <p className="t-caption ml-auto text-muted">Saving replaces the default until reset.</p>
            </div>
          </FormGuard>
        )}
      </div>
    </div>
  );
}
