"use client";

/**
 * Admin mailbox - Inbox / Sent / Compose in one interactive surface.
 *
 * Three-pane layout in the admin design language: folder rail (compose,
 * inbox with unread count, sent, department filter), the message list
 * (search, unread dots, dept chips, IST timestamps) and the reading pane
 * (sandboxed HTML preview, plain-text fallback, quick actions). Compose
 * slides into the reading pane with a template selector grouped by
 * department: Clients (hello@) and HR (hr@), categories inside each.
 */

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ConfirmButton } from "@/components/admin/form";
import { FormGuard } from "@/components/admin/form-guard";
import { markReadAction, markUnreadAction, deleteReplyAction } from "@/app/admin/(protected)/emails/actions";
import { TEMPLATE_REGISTRY, bodyToHtml } from "@/lib/mail/registry";
import { shell } from "@/lib/mail/templates";
import {
  sendTemplatedEmailAction,
  sendCustomEmailAction,
} from "@/app/admin/(protected)/email-templates/actions";

export type MailboxReply = {
  id: string;
  fromEmail: string;
  fromName: string | null;
  dept: string;
  subject: string;
  bodyText: string | null;
  bodyHtml: string | null;
  isRead: boolean;
  createdAt: string;
};

export type MailboxSent = {
  id: string;
  toEmail: string;
  toName: string | null;
  dept: string;
  subject: string;
  html: string;
  templateKey: string | null;
  sentBy: string | null;
  createdAt: string;
};

export type MailboxTemplate = {
  key: string;
  label: string;
  dept: "hello" | "hr";
  category: string;
  vars: Record<string, string>;
};

const TEMPLATES_CUSTOM_KEY = "__custom__";

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function fullIST(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }) + " IST";
}

const DeptChip = ({ dept }: { dept: string }) => (
  <span
    className={cn(
      "t-caption shrink-0 rounded-[4px] border px-1.5 py-px font-semibold",
      dept === "hr" ? "border-accent/40 text-accent" : "border-border text-muted",
    )}
  >
    {dept === "hr" ? "HR" : "Client"}
  </span>
);

export function Mailbox({
  replies,
  sent,
  templates,
  notice,
  error,
}: {
  replies: MailboxReply[];
  sent: MailboxSent[];
  templates: MailboxTemplate[];
  notice?: string;
  error?: string;
}) {
  const [folder, setFolder] = useState<"inbox" | "sent">("inbox");
  const [deptFilter, setDeptFilter] = useState<"all" | "hello" | "hr">("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [composeDept, setComposeDept] = useState<"hello" | "hr">("hello");
  const [composeTo, setComposeTo] = useState("");
  const [readIds, setReadIds] = useState<Set<string>>(
    () => new Set(replies.filter((r) => r.isRead).map((r) => r.id)),
  );

  const unread = replies.filter((r) => !readIds.has(r.id)).length;

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (s: string) => !q || s.toLowerCase().includes(q);
    if (folder === "inbox") {
      return replies
        .filter((r) => (deptFilter === "all" || r.dept === deptFilter) && match(`${r.fromEmail} ${r.fromName ?? ""} ${r.subject}`))
        .map((r) => ({
          id: r.id,
          dept: r.dept,
          subject: r.subject,
          unread: !readIds.has(r.id),
          from: r.fromName ? `${r.fromName} · ${r.fromEmail}` : r.fromEmail,
          snippet: (r.bodyText ?? "").replace(/\s+/g, " ").slice(0, 90),
          createdAt: r.createdAt,
        }));
    }
    return sent
      .filter((s) => (deptFilter === "all" || s.dept === deptFilter) && match(`${s.toEmail} ${s.subject} ${s.templateKey ?? ""}`))
      .map((s) => ({
        id: s.id,
        dept: s.dept,
        subject: s.subject,
        unread: false,
        from: `To ${s.toName ? `${s.toName} · ` : ""}${s.toEmail}`,
        snippet: s.templateKey ? `Template · ${s.templateKey}` : "Custom email",
        createdAt: s.createdAt,
      }));
  }, [folder, deptFilter, query, replies, sent, readIds]);

  const activeReply = folder === "inbox" ? replies.find((r) => r.id === selected) : undefined;
  const activeSent = folder === "sent" ? sent.find((s) => s.id === selected) : undefined;

  const openMessage = (id: string) => {
    setSelected(id);
    setComposing(false);
    const reply = replies.find((r) => r.id === id);
    if (reply && !readIds.has(reply.id)) {
      setReadIds((prev) => new Set(prev).add(id));
      const fd = new FormData();
      fd.set("id", id);
      void markReadAction(fd);
    }
  };

  const startCompose = (to = "", dept: "hello" | "hr" = composeDept) => {
    setComposeTo(to);
    setComposeDept(dept);
    setComposing(true);
    setSelected(null);
  };

  const grouped = useMemo(() => {
    const pool = templates.filter((t) => t.dept === composeDept);
    const byCat = new Map<string, MailboxTemplate[]>();
    for (const t of pool) {
      const list = byCat.get(t.category) ?? [];
      list.push(t);
      byCat.set(t.category, list);
    }
    return [...byCat.entries()];
  }, [templates, composeDept]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="t-caption text-muted">
          {folder === "inbox" ? `${list.length} message${list.length === 1 ? "" : "s"}` : `${list.length} sent`} · {unread} unread
        </p>
        <button
          type="button"
          onClick={() => startCompose("")}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-accent px-5 text-[0.875rem] font-semibold text-on-accent shadow-sm transition-colors hover:bg-accent-hover"
        >
          <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M10 4v12M4 10h12" />
          </svg>
          Compose
        </button>
      </div>

      {(notice || error) && (
        <div
          role="status"
          className={cn(
            "mb-4 flex items-center gap-3 rounded-lg border px-5 py-3.5 text-[0.9375rem] font-semibold shadow-sm",
            error
              ? "border-error/40 bg-error/[0.08] text-error"
              : "border-success/40 bg-success/[0.08] text-success",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              error ? "bg-error/15" : "bg-success/15",
            )}
          >
            {error ? (
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M10 5v6M10 14.5v.01" />
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m4 10.5 4 4 8-9" />
              </svg>
            )}
          </span>
          {error ?? notice}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[190px_320px_minmax(0,1fr)]">
        {/* ── Folder rail ─────────────────────────────── */}
        <aside className="space-y-1.5" aria-label="Mail folders">
          {([
            ["inbox", `Inbox${unread ? ` · ${unread}` : ""}`],
            ["sent", "Sent"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setFolder(key);
                setSelected(null);
                setComposing(false);
              }}
              className={cn(
                "flex h-10 w-full items-center justify-between rounded-lg border px-3.5 text-[0.875rem] font-semibold transition-colors",
                folder === key
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted hover:border-foreground/40 hover:text-foreground",
              )}
            >
              {key === "inbox" ? "Inbox" : "Sent"}
              {key === "inbox" && unread > 0 ? (
                <span className="tnum rounded-full bg-accent px-1.5 text-[0.6875rem] font-bold text-on-accent">{unread}</span>
              ) : null}
            </button>
          ))}

          <div className="pt-3">
            <p className="adm-label mb-2 px-1">Mailbox</p>
            {([
              ["all", "All"],
              ["hello", "Clients · hello@"],
              ["hr", "HR · hr@"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setDeptFilter(key)}
                className={cn(
                  "block w-full rounded-lg px-3.5 py-2 text-left text-[0.8125rem] font-medium transition-colors",
                  deptFilter === key ? "bg-accent/10 text-accent" : "text-muted hover:bg-surface-2/60 hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </aside>

        {/* ── Message list ────────────────────────────── */}
        <div className="adm-card flex max-h-[78vh] flex-col overflow-hidden">
          <div className="border-b border-border p-3">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${folder === "inbox" ? "inbox" : "sent mail"}…`}
              aria-label="Search mail"
              className="adm-input h-9"
            />
          </div>
          <ul className="adm-rail divide-y divide-border overflow-y-auto">
            {list.length === 0 ? (
              <li className="p-6 text-center text-[0.8125rem] text-muted">
                {query ? "Nothing matches the search." : folder === "inbox" ? "No inbound mail yet. Replies land here automatically." : "No sent mail yet."}
              </li>
            ) : (
              list.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => openMessage(m.id)}
                    className={cn(
                      "flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors",
                      selected === m.id && !composing ? "bg-accent/[0.06]" : "hover:bg-surface-2/60",
                    )}
                  >
                    <span className="flex w-full items-center gap-2">
                      <span aria-hidden="true" className={cn("h-2 w-2 shrink-0 rounded-full", m.unread ? "bg-accent" : "bg-transparent")} />
                      <span className={cn("min-w-0 flex-1 truncate text-[0.8125rem]", m.unread ? "font-bold text-foreground" : "font-medium text-foreground/80")}>
                        {m.from}
                      </span>
                      <span className="t-caption tnum shrink-0 text-muted">{timeAgo(m.createdAt)}</span>
                    </span>
                    <span className={cn("truncate pl-4 text-[0.8125rem]", m.unread ? "font-semibold text-foreground" : "text-foreground/75")}>
                      {m.subject}
                    </span>
                    <span className="flex items-center gap-2 pl-4">
                      <span className="t-caption min-w-0 flex-1 truncate text-muted">{m.snippet}</span>
                      <DeptChip dept={m.dept} />
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* ── Reading pane / Compose ──────────────────── */}
        <div className="adm-card min-h-[50vh] max-h-[78vh] overflow-y-auto">
          {composing ? (
            <ComposePanel
              dept={composeDept}
              setDept={setComposeDept}
              to={composeTo}
              setTo={setComposeTo}
              grouped={grouped}
              onDone={() => setComposing(false)}
            />
          ) : activeReply ? (
            <article className="p-5 sm:p-6">
              <header className="border-b border-border pb-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h2 className="text-[1.0625rem] font-bold leading-snug text-foreground">{activeReply.subject}</h2>
                  <DeptChip dept={activeReply.dept} />
                </div>
                <p className="t-caption text-muted">
                  From <span className="font-semibold text-foreground/80">{activeReply.fromName ?? activeReply.fromEmail}</span>{" "}
                  <span className="text-muted">· {activeReply.fromEmail}</span>
                </p>
                <p className="t-caption mt-1 text-muted">{fullIST(activeReply.createdAt)}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startCompose(activeReply.fromEmail, activeReply.dept === "hr" ? "hr" : "hello")}
                    className="inline-flex h-9 items-center rounded-lg bg-accent px-3.5 text-[0.8125rem] font-semibold text-on-accent transition-colors hover:bg-accent-hover"
                  >
                    Reply
                  </button>
                  <form action={markUnreadAction}>
                    <input type="hidden" name="id" value={activeReply.id} />
                    <button type="submit" className="inline-flex h-9 items-center rounded-lg border border-border px-3.5 text-[0.8125rem] font-semibold text-muted transition-colors hover:border-foreground/40 hover:text-foreground">
                      Mark unread
                    </button>
                  </form>
                  <form action={deleteReplyAction}>
                    <input type="hidden" name="id" value={activeReply.id} />
                    <ConfirmButton label="Delete" confirmLabel="Really delete?" />
                  </form>
                </div>
              </header>
              {activeReply.bodyHtml ? (
                <iframe
                  title="Email preview"
                  sandbox=""
                  srcDoc={activeReply.bodyHtml}
                  className="mt-4 h-[46vh] w-full rounded-lg border border-border bg-white"
                />
              ) : (
                <p className="mt-4 whitespace-pre-wrap break-words text-[0.875rem] leading-relaxed text-foreground/85">
                  {activeReply.bodyText ?? "(empty message)"}
                </p>
              )}
              {activeReply.bodyHtml && activeReply.bodyText ? (
                <details className="mt-3">
                  <summary className="t-caption cursor-pointer text-muted">View plain text</summary>
                  <p className="mt-2 whitespace-pre-wrap break-words text-[0.8125rem] leading-relaxed text-muted">{activeReply.bodyText}</p>
                </details>
              ) : null}
            </article>
          ) : activeSent ? (
            <article className="p-5 sm:p-6">
              <header className="border-b border-border pb-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h2 className="text-[1.0625rem] font-bold leading-snug text-foreground">{activeSent.subject}</h2>
                  <DeptChip dept={activeSent.dept} />
                </div>
                <p className="t-caption text-muted">
                  To <span className="font-semibold text-foreground/80">{activeSent.toName ?? activeSent.toEmail}</span>{" "}
                  <span className="text-muted">· {activeSent.toEmail}</span>
                </p>
                <p className="t-caption mt-1 text-muted">
                  {fullIST(activeSent.createdAt)}
                  {activeSent.sentBy ? ` · by ${activeSent.sentBy}` : ""}
                  {activeSent.templateKey ? ` · template: ${activeSent.templateKey}` : " · custom"}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startCompose(activeSent.toEmail, activeSent.dept === "hr" ? "hr" : "hello")}
                    className="inline-flex h-9 items-center rounded-lg bg-accent px-3.5 text-[0.8125rem] font-semibold text-on-accent transition-colors hover:bg-accent-hover"
                  >
                    Write again
                  </button>
                </div>
              </header>
              <iframe
                title="Sent email preview"
                sandbox=""
                srcDoc={activeSent.html}
                className="mt-4 h-[46vh] w-full rounded-lg border border-border bg-white"
              />
            </article>
          ) : (
            <div className="flex h-full min-h-[40vh] flex-col items-center justify-center gap-3 p-8 text-center">
              <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-muted">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3.5" y="5.5" width="17" height="13" rx="2.2" />
                  <path d="m4.5 7.5 7.5 5.5 7.5-5.5" />
                </svg>
              </span>
              <p className="text-[0.875rem] font-semibold text-foreground">Select a message to read it</p>
              <p className="t-caption max-w-xs text-muted">
                Inbound replies arrive automatically; every email sent from the panel is logged in Sent.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Compose panel with categorized template selector ───────────── */

function ComposePanel({
  dept,
  setDept,
  to,
  setTo,
  grouped,
  onDone,
}: {
  dept: "hello" | "hr";
  setDept: (d: "hello" | "hr") => (void);
  to: string;
  setTo: (v: string) => void;
  grouped: [string, MailboxTemplate[]][];
  onDone: () => void;
}) {
  const [templateKey, setTemplateKey] = useState<string>(grouped[0]?.[1][0]?.key ?? TEMPLATES_CUSTOM_KEY);
  const [vars, setVars] = useState<Record<string, string>>({});
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const isCustom = templateKey === TEMPLATES_CUSTOM_KEY;
  const entry = useMemo(
    () => grouped.flatMap(([, ts]) => ts).find((t) => t.key === templateKey),
    [grouped, templateKey],
  );

  /* Live preview - the exact email that will be sent (same machinery as
     the compose page: registry default with the current variables). */
  const previewHtml = useMemo(() => {
    if (isCustom) return shell({ preheader: subject.slice(0, 120), heading: "", bodyHtml: bodyToHtml(body || "…") });
    const reg = TEMPLATE_REGISTRY.find((t) => t.key === templateKey);
    if (!reg) return "";
    return reg.default({ ...reg.vars, ...vars }).html;
  }, [isCustom, templateKey, vars, subject, body]);

  const switchTemplate = (key: string) => {
    setTemplateKey(key);
    setVars({});
    const next = grouped.flatMap(([, ts]) => ts).find((t) => t.key === key);
    if (next) {
      // prefill compose vars with registry sample values for speed
      const seeded: Record<string, string> = {};
      for (const [k, v] of Object.entries(next.vars)) seeded[k] = v;
      setVars(seeded);
    }
  };

  return (
    <FormGuard action={isCustom ? sendCustomEmailAction : sendTemplatedEmailAction} className="space-y-4 p-5 sm:p-6" validate={() => []}>
      <input type="hidden" name="back" value="/admin/emails" />
      {!isCustom ? <input type="hidden" name="templateKey" value={templateKey} /> : null}
      {isCustom ? <input type="hidden" name="dept" value={dept} /> : null}

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[1.0625rem] font-bold text-foreground">New email</h2>
        <button type="button" onClick={onDone} className="t-caption font-semibold text-muted transition-colors hover:text-foreground">
          Close ✕
        </button>
      </div>

      {/* Department */}
      <div>
        <p className="adm-label mb-1.5">Send from</p>
        <div className="flex gap-2">
          {([
            ["hello", "Clients · hello@"],
            ["hr", "HR · hr@"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setDept(key);
                setTemplateKey(TEMPLATES_CUSTOM_KEY);
              }}
              aria-pressed={dept === key}
              className={cn(
                "inline-flex h-9 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border px-3 text-[0.8125rem] font-semibold transition-colors",
                dept === key ? "border-foreground bg-foreground text-background" : "border-border text-muted hover:border-foreground/40",
              )}
            >
              {key === "hello" ? (
                <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 5.5h14v9H3z" /><path d="m3.5 6.5 6.5 4.5 6.5-4.5" />
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="10" cy="7" r="3.2" /><path d="M4 16.5c1.2-2.8 3.4-4 6-4s4.8 1.2 6 4" />
                </svg>
              )}
              {label}
            </button>
          ))}
        </div>
        <p className="t-caption mt-1.5 text-muted">
          {dept === "hello" ? "hello@savotechnologies.com · client and general mail" : "hr@savotechnologies.com · careers and employee mail"}
        </p>
      </div>

      {/* Template selector, grouped by category within the department */}
      <div>
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <label className="adm-label" htmlFor="mb-template">Template</label>
          <span className="t-caption text-muted">grouped by {dept === "hello" ? "client" : "HR"} category</span>
        </div>
        <select
            id="mb-template"
            className="adm-select w-full"
            value={templateKey}
            onChange={(e) => switchTemplate(e.target.value)}
          >
            {grouped.map(([cat, ts]) => (
              <optgroup key={cat} label={cat}>
                {ts.map((t) => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}
              </optgroup>
            ))}
            <optgroup label="Write your own">
              <option value={TEMPLATES_CUSTOM_KEY}>Custom email</option>
            </optgroup>
          </select>
        </div>

      {/* To */}
      <div>
        <label className="adm-label mb-1.5 block" htmlFor="mb-to">To</label>
        <input
          id="mb-to"
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

      {/* Template variables (prefilled with sample values) */}
      {entry && Object.keys(entry.vars).length > 0 ? (
        <div className="rounded-lg border border-border p-3">
          <p className="adm-label mb-2">Template details</p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {Object.keys(entry.vars).map((k) => (
              <div key={k} className={k === "focus" || k === "whySavo" || k === "message" ? "sm:col-span-2" : ""}>
                <label className="adm-label mb-1 block" htmlFor={`var-${k}`}>{k}</label>
                {k === "focus" || k === "whySavo" || k === "message" ? (
                  <textarea
                    id={`var-${k}`}
                    name={`var_${k}`}
                    value={vars[k] ?? ""}
                    onChange={(e) => setVars((p) => ({ ...p, [k]: e.target.value }))}
                    className="adm-textarea min-h-16 w-full"
                  />
                ) : (
                  <input
                    id={`var-${k}`}
                    name={`var_${k}`}
                    value={vars[k] ?? ""}
                    onChange={(e) => setVars((p) => ({ ...p, [k]: e.target.value }))}
                    className="adm-input"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Custom fields */}
      {isCustom ? (
        <div className="space-y-3">
          <div>
            <label className="adm-label mb-1.5 block" htmlFor="mb-subject">Subject</label>
            <input id="mb-subject" name="subject" required maxLength={160} value={subject} onChange={(e) => setSubject(e.target.value)} className="adm-input" />
          </div>
          <div>
            <label className="adm-label mb-1.5 block" htmlFor="mb-body">Message</label>
            <textarea id="mb-body" name="body" required className="adm-textarea min-h-40 w-full" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write the email. Blank lines become paragraphs; lines starting with - become bullet points." />
          </div>
        </div>
      ) : null}

      {/* Preview + send */}
      <div className="rounded-lg border border-border">
        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          aria-expanded={showPreview}
          className="flex h-10 w-full items-center justify-between px-4 text-[0.8125rem] font-semibold text-muted transition-colors hover:text-foreground"
        >
          {showPreview ? "Hide preview" : "Preview before sending"}
          <svg viewBox="0 0 14 14" aria-hidden="true" className={cn("h-3 w-3 transition-transform duration-300", showPreview && "rotate-90")} fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M5 3l4 4-4 4" />
          </svg>
        </button>
        {showPreview ? (
          <div className="border-t border-border p-2">
            <iframe title="Compose preview" sandbox="" srcDoc={previewHtml} className="h-96 w-full rounded-md border-0 bg-[#f5f4f0]" />
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-3 pt-1">
        <SendButton />
        <Link href="/admin/email-templates" className="t-caption font-semibold text-muted transition-colors hover:text-foreground">
          Manage templates →
        </Link>
      </div>
    </FormGuard>
  );
}

/** Submit button with sending state: shows spinner + "Sending…" while the
 *  server action runs, then the page redirects with the success notice. */
function SendButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-5 text-[0.875rem] font-semibold text-on-accent shadow-sm transition-colors hover:bg-accent-hover disabled:pointer-events-none disabled:opacity-70",
        pending && "bg-accent/80",
      )}
    >
      {pending ? (
        <>
          <span aria-hidden="true" className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Sending…
        </>
      ) : (
        <>
          Send email
          <svg viewBox="0 0 14 14" aria-hidden="true" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
          </svg>
        </>
      )}
    </button>
  );
}
