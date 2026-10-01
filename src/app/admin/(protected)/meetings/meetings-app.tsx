"use client";

/**
 * Meetings dashboard — admin panel design language.
 * List view, create drawer, detail with client link sharing, calendar.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

/* ───────────────────────── types ───────────────────────── */

type Meeting = {
  id: string; reference: string; clientName: string; clientCompany: string;
  title: string; meetingType: string; durationMin: number; locationType: string;
  status: string; preferredDate: string | null; preferredTime: string | null;
  confirmedDate: string | null; confirmedTime: string | null;
  assignedTo: string | null; createdAt: string;
};

type MeetingDetail = Meeting & {
  tokenPlain: string;
  agenda: string; clientPhone: string | null; clientEmail: string | null;
  locationAddress: string | null; meetingUrl: string | null; notes: string | null;
  availableDates: string[]; availableFrom: string; availableTo: string;
  allowSuggest: boolean; autoConfirm: boolean;
  altDate: string | null; altTime: string | null; locationPreference: string | null;
  clientAddress: string | null; attendeeCount: number;
  clientNotes: string | null; specialReqs: string | null;
  expiresAt: string | null; internalNotes: string | null; createdBy: string;
  attendees: { name: string; email: string | null; role: string | null }[];
  activity: { id: string; type: string; actorName: string | null; createdAt: string }[];
  ics: string | null;
};

type ClientOption = { id: string; name: string; company: string; email: string };

function localToday(): string {
  const t = new Date();
  return t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0");
}

const STATUS_CHIP: Record<string, string> = {
  draft: "border-border text-muted",
  awaiting_client: "border-amber-500/40 text-amber-600 bg-amber-500/[0.04]",
  availability_received: "border-blue-500/40 text-blue-600 bg-blue-500/[0.04]",
  confirmed: "border-emerald-500/40 text-emerald-600 bg-emerald-500/[0.04]",
  reschedule_requested: "border-orange-500/40 text-orange-600 bg-orange-500/[0.04]",
  completed: "border-border text-muted",
  cancelled: "border-red-500/40 text-red-500 bg-red-500/[0.04]",
  expired: "border-border text-muted",
};

const MEETING_TYPES = [
  { value: "in_person", label: "In-Person Meeting" },
  { value: "video", label: "Video Meeting" },
  { value: "phone", label: "Phone Call" },
  { value: "office_visit", label: "Office Visit" },
  { value: "client_office", label: "Client Office" },
  { value: "custom", label: "Custom" },
];

const DURATIONS = [15, 30, 45, 60, 90];

const LOCATIONS = [
  { value: "savo_office", label: "Savo Technologies Office" },
  { value: "client_office", label: "Client Office" },
  { value: "google_meet", label: "Google Meet" },
  { value: "zoom", label: "Zoom" },
  { value: "teams", label: "Microsoft Teams" },
  { value: "phone", label: "Phone" },
  { value: "custom", label: "Custom Location" },
];

function sLabel(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function fDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function fTime(t: string | null): string {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

/* ───────────────────────── main ───────────────────────── */

export function MeetingsApp({ me }: { me: { id: string; name: string; role: string } }) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<MeetingDetail | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [createdLink, setCreatedLink] = useState<string | null>(null);

  const flash = useCallback((msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/meetings", { cache: "no-store" });
      const json = (await res.json()) as { ok: boolean; meetings?: Meeting[] };
      if (json.ok && json.meetings) setMeetings(json.meetings);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  const loadDetail = useCallback(async (id: string) => {
    setSelected(id); setDetail(null);
    try {
      const res = await fetch(`/api/admin/meetings/${id}`, { cache: "no-store" });
      const json = (await res.json()) as { ok: boolean; meeting?: MeetingDetail };
      if (json.ok && json.meeting) setDetail(json.meeting);
    } catch { /* ignore */ }
  }, []);

  const action = useCallback(async (id: string, act: string, data?: object) => {
    const res = await fetch(`/api/admin/meetings/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: act, ...data }),
    });
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; token?: string };
    if (json.ok) { await loadDetail(id); await load(); }
    return json;
  }, [load, loadDetail]);

  const filtered = useMemo(() => meetings.filter((m) => {
    if (filterStatus && m.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return m.clientName.toLowerCase().includes(q) || m.clientCompany.toLowerCase().includes(q) || m.title.toLowerCase().includes(q) || m.reference.toLowerCase().includes(q);
    }
    return true;
  }), [meetings, filterStatus, search]);

  const counts = useMemo(() => ({
    upcoming: meetings.filter((m) => ["awaiting_client", "availability_received", "confirmed", "reschedule_requested"].includes(m.status)).length,
    awaiting: meetings.filter((m) => m.status === "awaiting_client").length,
    confirmed: meetings.filter((m) => m.status === "confirmed").length,
    completed: meetings.filter((m) => m.status === "completed").length,
  }), [meetings]);

  if (selected && detail) {
    return <DetailView detail={detail} onBack={() => { setSelected(null); setDetail(null); }} action={action} flash={flash} onDeleted={() => { setSelected(null); setDetail(null); void load(); }} />;
  }

  return (
    <div>
      <PageHeader title="Meetings" description="Schedule, track and manage client meetings with secure scheduling links." />

      {/* Link created banner */}
      {createdLink ? <LinkBanner link={createdLink} onClose={() => setCreatedLink(null)} /> : null}

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatTile label="Upcoming" value={counts.upcoming} />
        <StatTile label="Awaiting Response" value={counts.awaiting} />
        <StatTile label="Confirmed" value={counts.confirmed} />
        <StatTile label="Completed" value={counts.completed} />
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search client, company, ref…" className="adm-input h-9 w-56" />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="adm-select h-9 w-44">
          <option value="">All statuses</option>
          {Object.keys(STATUS_CHIP).map((s) => <option key={s} value={s}>{sLabel(s)}</option>)}
        </select>
        <button onClick={() => setView(view === "list" ? "calendar" : "list")} className="adm-btn-secondary h-9 px-3 text-[0.8125rem]">
          {view === "list" ? "📅 Calendar View" : "☰ List View"}
        </button>
        <button
          onClick={() => setShowCreate(true)}
          className="ml-auto inline-flex h-12 items-center gap-2 rounded-xl border border-accent bg-accent px-6 text-[0.9375rem] font-bold text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:brightness-110 active:scale-[0.98]"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4" />
          </svg>
          Schedule Meeting
        </button>
      </div>

      {/* Content */}
      {view === "calendar" ? (
        <CalendarView meetings={filtered} onSelect={loadDetail} />
      ) : (
        <div className="adm-card overflow-hidden">
          <table className="adm-hairline-table w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-[0.75rem] font-semibold text-muted">Ref</th>
                <th className="px-4 py-3 text-[0.75rem] font-semibold text-muted">Client</th>
                <th className="px-4 py-3 text-[0.75rem] font-semibold text-muted">Meeting</th>
                <th className="hidden px-4 py-3 text-[0.75rem] font-semibold text-muted sm:table-cell">Date & Time</th>
                <th className="px-4 py-3 text-[0.75rem] font-semibold text-muted">Status</th>
                <th className="px-4 py-3 text-right text-[0.75rem] font-semibold text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-[0.8125rem] text-muted">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-[0.8125rem] text-muted">No meetings yet. Click &ldquo;+ Schedule Meeting&rdquo; to create one.</td></tr>
              ) : filtered.map((m) => (
                <tr key={m.id} className="cursor-pointer transition-colors hover:bg-surface-2/50" onClick={() => loadDetail(m.id)}>
                  <td className="px-4 py-3 font-mono text-[0.6875rem] text-muted">{m.reference}</td>
                  <td className="px-4 py-3">
                    <p className="text-[0.8125rem] font-semibold">{m.clientName}</p>
                    {m.clientCompany ? <p className="text-[0.75rem] text-muted">{m.clientCompany}</p> : null}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[0.8125rem] font-medium">{m.title}</p>
                    <p className="text-[0.75rem] text-muted">{fTime(m.confirmedTime ?? m.preferredTime)} · {m.durationMin} min</p>
                  </td>
                  <td className="hidden px-4 py-3 text-[0.8125rem] sm:table-cell">
                    {fDate(m.confirmedDate ?? m.preferredDate)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-[0.6875rem] font-semibold", STATUS_CHIP[m.status] ?? "border-border text-muted")}>
                      {sLabel(m.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => loadDetail(m.id)} className="text-[0.8125rem] font-semibold text-accent hover:underline">View</button>
                      <button onClick={() => loadDetail(m.id)} className="text-[0.8125rem] font-semibold text-muted hover:text-accent">Edit</button>
                      <button
                        onClick={async () => {
                          if (!confirm(`Delete "${m.title}" (${m.reference}) for ${m.clientName}?\nThis cannot be undone.`)) return;
                          const res = await fetch(`/api/admin/meetings/${m.id}`, { method: "DELETE" });
                          const json = await res.json();
                          if (json.ok) { flash("Meeting deleted."); void load(); }
                          else flash(json.error ?? "Failed.");
                        }}
                        className="text-[0.8125rem] font-semibold text-red-500 hover:text-red-600 hover:underline"
                      >Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate ? <CreateDrawer onClose={() => setShowCreate(false)} onCreated={(link) => { setCreatedLink(link); void load(); }} flash={flash} me={me} /> : null}
      {toast ? <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-border bg-white px-4 py-2 text-[0.8125rem] shadow-lg">{toast}</div> : null}
    </div>
  );
}

/* ───────────────────────── link banner ───────────────────────── */

function LinkBanner({ link, onClose }: { link: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { void navigator.clipboard?.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const waMsg = encodeURIComponent(`Hello, as discussed, please use the link below to select your preferred date and time for our meeting:\n\n${link}`);
  return (
    <div className="mb-6 rounded-xl border-2 border-accent/40 bg-accent/[0.04] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[0.875rem] font-bold text-accent">✓ Meeting Created — Share this link with your client</p>
          <div className="mt-2 flex items-center gap-2">
            <input readOnly value={link} className="w-full rounded-lg border border-accent/30 bg-white px-3 py-2.5 font-mono text-[0.8125rem] text-foreground" onFocus={(e) => e.target.select()} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={copy} className={cn("inline-flex h-9 items-center gap-2 rounded-lg border px-4 text-[0.8125rem] font-semibold transition-colors", copied ? "border-emerald-500 bg-emerald-500/[0.08] text-emerald-600" : "border-accent/50 bg-accent/[0.06] text-accent hover:bg-accent/[0.1]")}>
              {copied ? "✓ Copied!" : "📋 Copy Link"}
            </button>
            <a href={`https://wa.me/?text=${waMsg}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#25D366]/60 bg-[#25D366]/[0.06] px-4 text-[0.8125rem] font-semibold text-[#128C4A] transition-colors hover:bg-[#25D366]/[0.12]">
              Share via WhatsApp
            </a>
          </div>
        </div>
        <button onClick={onClose} className="text-[0.8125rem] text-muted hover:text-foreground">✕</button>
      </div>
    </div>
  );
}

/* ───────────────────────── stat tile ───────────────────────── */

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="adm-card p-4">
      <p className="text-[1.75rem] font-bold text-foreground">{value}</p>
      <p className="mt-0.5 text-[0.75rem] text-muted">{label}</p>
    </div>
  );
}

/* ───────────────────────── create drawer ───────────────────────── */

function CreateDrawer({ onClose, onCreated, flash, me }: { onClose: () => void; onCreated: (link: string) => void; flash: (m: string) => void; me: { id: string; name: string } }) {
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [form, setForm] = useState({
    clientId: "", clientName: "", clientCompany: "", clientPhone: "", clientEmail: "",
    title: "", agenda: "", meetingType: "in_person", durationMin: 60,
    locationType: "savo_office", locationAddress: "", meetingUrl: "",
    availableDates: [] as string[], availableFrom: "10:00", availableTo: "18:00",
    allowSuggest: true, autoConfirm: false, expiresDays: 7,
  });

  useEffect(() => {
    fetch("/api/admin/meetings?clients=1").then((r) => r.json()).then((j) => {
      if (j.ok && j.clients) setClients(j.clients);
    }).catch(() => undefined);
  }, []);

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  const selectClient = (id: string) => {
    const c = clients.find((x) => x.id === id);
    if (c) setForm((f) => ({ ...f, clientId: id, clientName: c.name, clientCompany: c.company, clientEmail: c.email }));
    else set("clientId", "");
  };

  const submit = async () => {
    if (!form.clientName.trim()) return flash("Client name is required.");
    if (!form.title.trim()) return flash("Meeting title is required.");
    setSaving(true);
    const res = await fetch("/api/admin/meetings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, createdBy: me.id, createdByName: me.name }),
    });
    const json = (await res.json()) as { ok: boolean; meeting?: { token: string; reference: string }; error?: string };
    setSaving(false);
    if (json.ok && json.meeting) {
      onCreated(`${window.location.origin}/meeting/${json.meeting.reference}`);
      onClose();
    } else flash(json.error ?? "Failed to create.");
  };

  const isOnline = ["google_meet", "zoom", "teams"].includes(form.locationType);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-2xl rounded-2xl border border-border bg-white shadow-2xl" role="dialog" aria-label="Schedule Meeting">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-[1.125rem] font-bold">Schedule Meeting</h2>
          <p className="mt-0.5 text-[0.8125rem] text-muted">Create a meeting request and generate a secure scheduling link for your client.</p>
        </div>

        <div className="space-y-5 p-6">
          {/* Client */}
          <fieldset className="rounded-xl border border-border p-4">
            <legend className="px-2 text-[0.75rem] font-semibold text-muted">Client Information</legend>
            {clients.length > 0 ? (
              <div className="mb-3">
                <label className="adm-label mb-1 block">Select existing client</label>
                <select value={form.clientId} onChange={(e) => selectClient(e.target.value)} className="adm-select w-full">
                  <option value="">— New client —</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.company}</option>)}
                </select>
              </div>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="adm-label mb-1 block">Name *</label><input value={form.clientName} onChange={(e) => set("clientName", e.target.value)} className="adm-input w-full" /></div>
              <div><label className="adm-label mb-1 block">Company</label><input value={form.clientCompany} onChange={(e) => set("clientCompany", e.target.value)} className="adm-input w-full" /></div>
              <div><label className="adm-label mb-1 block">Phone</label><input value={form.clientPhone} onChange={(e) => set("clientPhone", e.target.value)} type="tel" className="adm-input w-full" /></div>
              <div><label className="adm-label mb-1 block">Email</label><input value={form.clientEmail} onChange={(e) => set("clientEmail", e.target.value)} type="email" className="adm-input w-full" /></div>
            </div>
          </fieldset>

          {/* Meeting */}
          <fieldset className="rounded-xl border border-border p-4">
            <legend className="px-2 text-[0.75rem] font-semibold text-muted">Meeting Details</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="adm-label mb-1 block">Meeting Title *</label><input value={form.title} onChange={(e) => set("title", e.target.value)} className="adm-input w-full" placeholder="e.g. Project Kickoff Discussion" /></div>
              <div className="sm:col-span-2"><label className="adm-label mb-1 block">Agenda</label><textarea value={form.agenda} onChange={(e) => set("agenda", e.target.value)} rows={2} className="adm-input w-full resize-none" placeholder="What will be discussed?" /></div>
              <div>
                <label className="adm-label mb-1 block">Meeting Type</label>
                <select value={form.meetingType} onChange={(e) => set("meetingType", e.target.value)} className="adm-select w-full">{MEETING_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
              </div>
              <div>
                <label className="adm-label mb-1 block">Duration</label>
                <select value={form.durationMin} onChange={(e) => set("durationMin", Number(e.target.value))} className="adm-select w-full">{DURATIONS.map((d) => <option key={d} value={d}>{d} minutes</option>)}</select>
              </div>
              <div>
                <label className="adm-label mb-1 block">Location</label>
                <select value={form.locationType} onChange={(e) => set("locationType", e.target.value)} className="adm-select w-full">{LOCATIONS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}</select>
              </div>
              {isOnline ? (
                <div><label className="adm-label mb-1 block">Meeting URL</label><input value={form.meetingUrl} onChange={(e) => set("meetingUrl", e.target.value)} className="adm-input w-full" placeholder="https://meet.google.com/…" /></div>
              ) : form.locationType !== "phone" ? (
                <div><label className="adm-label mb-1 block">Address</label><input value={form.locationAddress} onChange={(e) => set("locationAddress", e.target.value)} className="adm-input w-full" /></div>
              ) : null}
            </div>
          </fieldset>

          {/* Availability */}
          <fieldset className="rounded-xl border border-border p-4">
            <legend className="px-2 text-[0.75rem] font-semibold text-muted">Available Dates & Hours</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              <div><label className="adm-label mb-1 block">From</label><input type="time" value={form.availableFrom} onChange={(e) => set("availableFrom", e.target.value)} className="adm-input w-full" /></div>
              <div><label className="adm-label mb-1 block">To</label><input type="time" value={form.availableTo} onChange={(e) => set("availableTo", e.target.value)} className="adm-input w-full" /></div>
              <div><label className="adm-label mb-1 block">Link expires (days)</label><input type="number" min={1} max={30} value={form.expiresDays} onChange={(e) => set("expiresDays", Number(e.target.value))} className="adm-input w-full" /></div>
            </div>
            <div className="mt-3">
              <label className="adm-label mb-1 block">Available dates (click to add)</label>
              <div className="flex flex-wrap gap-2">
                {form.availableDates.filter((d) => d >= localToday()).map((d) => (
                  <button key={d} type="button" onClick={() => set("availableDates", form.availableDates.filter((x) => x !== d))} className="rounded-md border border-accent/40 bg-accent/[0.06] px-2.5 py-1 text-[0.75rem] font-medium text-accent">{fDate(d)} ✕</button>
                ))}
                <input type="date" min={localToday()} onChange={(e) => { if (e.target.value && e.target.value >= localToday() && !form.availableDates.includes(e.target.value)) set("availableDates", [...form.availableDates, e.target.value].sort()); e.target.value = ""; }} className="adm-input h-8 w-36 text-[0.75rem]" />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-[0.8125rem]"><input type="checkbox" checked={form.allowSuggest} onChange={(e) => set("allowSuggest", e.target.checked)} className="h-3.5 w-3.5 accent-[var(--accent)]" />Allow client to suggest another date</label>
              <label className="flex items-center gap-2 text-[0.8125rem]"><input type="checkbox" checked={form.autoConfirm} onChange={(e) => set("autoConfirm", e.target.checked)} className="h-3.5 w-3.5 accent-[var(--accent)]" />Auto-confirm available slots</label>
            </div>
          </fieldset>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button onClick={onClose} className="adm-btn-secondary h-10 px-5">Cancel</button>
            <button onClick={() => void submit()} disabled={saving} className="inline-flex h-12 items-center gap-2 rounded-xl border border-accent bg-accent px-6 text-[0.9375rem] font-bold text-white shadow-lg transition-all hover:brightness-110 disabled:opacity-50">
            {saving ? "Creating…" : "Create Meeting & Get Link"}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── detail view ───────────────────────── */

function DetailView({ detail, onBack, action, flash, onDeleted }: {
  detail: MeetingDetail;
  onBack: () => void;
  action: (id: string, act: string, data?: object) => Promise<{ ok?: boolean; token?: string; error?: string }>;
  flash: (m: string) => void;
  onDeleted: () => void;
}) {
  const [internalNotes, setInternalNotes] = useState(detail.internalNotes ?? "");
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const meetingLink = detail.reference ? `${typeof window !== "undefined" ? window.location.origin : ""}/meeting/${detail.reference}` : "";
  const waMsg = encodeURIComponent(`Hello ${detail.clientName}, as discussed, please use the link below to select your preferred date and time for our meeting:\n\n${meetingLink}`);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button onClick={onBack} className="adm-btn-secondary h-9 px-3 text-[0.8125rem]">← Back to Meetings</button>
        <div className="min-w-0 flex-1">
          <h1 className="text-[1.375rem] font-bold tracking-tight">{detail.title}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[0.875rem] text-muted">
            <span className="font-mono text-[0.75rem]">{detail.reference}</span>
            <span className="text-border">|</span>
            <span className="font-semibold text-foreground">{detail.clientName}</span>
            {detail.clientCompany ? <><span className="text-border">|</span><span>{detail.clientCompany}</span></> : null}
            {detail.clientEmail ? <><span className="text-border">|</span><span>{detail.clientEmail}</span></> : null}
          </div>
        </div>
        <span className={cn("rounded-full border px-3 py-1 text-[0.75rem] font-semibold", STATUS_CHIP[detail.status])}>{sLabel(detail.status)}</span>
      </div>

      {/* Client scheduling link — prominent */}
      {meetingLink ? (
        <div className="mb-6 rounded-2xl border-2 border-accent/40 bg-accent/[0.03] p-6 shadow-sm">
          <p className="mb-1 text-[0.875rem] font-bold text-accent">🔗 Client Scheduling Link</p>
          <p className="mb-3 text-[0.75rem] text-muted">Share this link with your client so they can pick a date and time.</p>
          <div className="flex flex-wrap items-center gap-2">
            <input readOnly value={meetingLink} className="min-w-0 flex-1 rounded-lg border border-accent/30 bg-white px-3 py-2.5 font-mono text-[0.8125rem]" onFocus={(e) => e.target.select()} />
            <button onClick={() => { void navigator.clipboard?.writeText(meetingLink); flash("Link copied to clipboard."); }} className="adm-btn-primary h-10 px-4 text-[0.8125rem]">📋 Copy</button>
            <a href={`https://wa.me/?text=${waMsg}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center rounded-lg border border-[#25D366]/60 bg-[#25D366]/[0.06] px-4 text-[0.8125rem] font-semibold text-[#128C4A]">WhatsApp</a>
          </div>
        </div>
      ) : null}

      {/* Actions */}
      {/* Action buttons — clear, visible, color-coded */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {detail.status === "draft" && (
          <button onClick={() => void action(detail.id, "send").then(() => flash("Invitation sent."))}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-accent bg-accent px-5 text-[0.875rem] font-bold text-white shadow-md transition-all hover:brightness-110">
            📧 Send Invitation
          </button>
        )}
        {detail.status === "availability_received" && (
          <button onClick={() => void action(detail.id, "confirm").then((r) => flash(r.ok ? "Meeting confirmed." : r.error ?? "Failed."))}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-emerald-500 bg-emerald-500 px-5 text-[0.875rem] font-bold text-white shadow-md transition-all hover:brightness-110">
            ✓ Confirm Meeting
          </button>
        )}
        {["confirmed", "availability_received"].includes(detail.status) && (
          <button onClick={() => void action(detail.id, "reschedule").then(() => flash("Reschedule requested."))}
            className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-orange-400/60 bg-orange-50 px-5 text-[0.875rem] font-semibold text-orange-600 transition-all hover:bg-orange-100">
            🔄 Request Reschedule
          </button>
        )}
        {detail.status === "confirmed" && (
          <button onClick={() => void action(detail.id, "complete").then(() => flash("Marked completed."))}
            className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-blue-400/60 bg-blue-50 px-5 text-[0.875rem] font-semibold text-blue-600 transition-all hover:bg-blue-100">
            ✓ Mark Completed
          </button>
        )}
        {!["completed", "cancelled"].includes(detail.status) && (
          <button onClick={() => void action(detail.id, "cancel").then(() => flash("Cancelled."))}
            className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-red-400/60 bg-red-50 px-5 text-[0.875rem] font-semibold text-red-600 transition-all hover:bg-red-100">
            ✕ Cancel Meeting
          </button>
        )}
        {detail.ics ? (
          <a href={`data:text/calendar;charset=utf-8,${encodeURIComponent(detail.ics)}`} download={`${detail.reference}.ics`}
            className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-border bg-surface-2/50 px-5 text-[0.875rem] font-semibold text-foreground transition-all hover:border-accent/40 hover:text-accent">
            📅 Add to Calendar
          </a>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="adm-card p-6">
          <h2 className="adm-label mb-4">Client Information</h2>
          <dl className="space-y-2 text-[0.8125rem]">
            <Row k="Name" v={detail.clientName} />
            <Row k="Company" v={detail.clientCompany || "—"} />
            <Row k="Phone" v={detail.clientPhone ?? "—"} />
            <Row k="Email" v={detail.clientEmail ?? "—"} />
          </dl>
        </section>

        <section className="adm-card p-6">
          <h2 className="adm-label mb-4">Meeting Details</h2>
          <dl className="space-y-2 text-[0.8125rem]">
            <Row k="Title" v={detail.title} />
            <Row k="Type" v={MEETING_TYPES.find((t) => t.value === detail.meetingType)?.label ?? detail.meetingType} />
            <Row k="Duration" v={`${detail.durationMin} minutes`} />
            <Row k="Location" v={detail.locationAddress ?? LOCATIONS.find((l) => l.value === detail.locationType)?.label ?? detail.locationType} />
            {detail.meetingUrl ? <Row k="URL" v={detail.meetingUrl} /> : null}
          </dl>
        </section>

        <section className="adm-card p-6">
          <h2 className="adm-label mb-4">Client Response</h2>
          {detail.preferredDate ? (
            <dl className="space-y-2 text-[0.8125rem]">
              <Row k="Date" v={fDate(detail.preferredDate)} />
              <Row k="Time" v={fTime(detail.preferredTime)} />
              {detail.altDate ? <Row k="Alternative" v={`${fDate(detail.altDate)} ${fTime(detail.altTime)}`} /> : null}
              {detail.locationPreference ? <Row k="Location Pref" v={detail.locationPreference} /> : null}
              <Row k="Attendees" v={String(detail.attendeeCount)} />
              {detail.attendees.map((a, i) => <Row key={i} k={`  ${a.name}`} v={a.email ?? a.role ?? ""} />)}
              {detail.clientNotes ? <Row k="Notes" v={detail.clientNotes} /> : null}
            </dl>
          ) : <p className="text-[0.8125rem] text-muted">Client has not responded yet.</p>}
        </section>

        <section className="adm-card p-5">
          <h2 className="adm-label mb-4">Internal (not visible to client)</h2>
          <textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} rows={3} className="adm-input w-full resize-none" placeholder="Internal notes…" />
          <button onClick={() => void action(detail.id, "notes", { internalNotes })} className="adm-btn-secondary mt-2 h-9 px-3 text-[0.8125rem]">Save Notes</button>

          <h3 className="adm-label mb-2 mt-5">Activity</h3>
          <ul className="space-y-1.5">
            {detail.activity.map((a) => (
              <li key={a.id} className="flex items-baseline gap-2 text-[0.75rem]">
                <span className="h-1 w-1 shrink-0 rounded-full bg-accent" />
                <span className="font-medium">{a.type.replace(/_/g, " ")}</span>
                {a.actorName ? <span className="text-muted">by {a.actorName}</span> : null}
                <span className="ml-auto text-muted">{new Date(a.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Edit drawer */}
      {showEdit ? (
        <EditDrawer
          detail={detail}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); }}
          action={action}
          flash={flash}
        />
      ) : null}

      {/* Delete confirmation */}
      {showDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
            <div className="border-b border-border bg-red-50 px-6 py-4">
              <h3 className="text-[1.0625rem] font-bold text-red-600">Delete this meeting?</h3>
            </div>
            <div className="p-6">
              <p className="text-[0.875rem] text-muted">
                <strong>{detail.title}</strong> ({detail.reference}) for {detail.clientName} will be permanently deleted.
                This cannot be undone. The scheduling link will stop working immediately.
              </p>
              <div className="mt-5 flex gap-2.5">
                <button onClick={() => setShowDelete(false)} className="flex-1 rounded-xl border-2 border-border py-3 text-[0.9375rem] font-semibold text-muted transition-colors hover:text-foreground">Cancel</button>
                <button
                  onClick={async () => {
                    setDeleting(true);
                    const res = await fetch(`/api/admin/meetings/${detail.id}`, { method: "DELETE" });
                    const json = await res.json();
                    setDeleting(false);
                    if (json.ok) { flash("Meeting deleted."); onDeleted(); }
                    else flash(json.error ?? "Failed to delete.");
                  }}
                  disabled={deleting}
                  className="flex-1 rounded-xl border border-red-500 bg-red-500 py-3 text-[0.9375rem] font-bold text-white transition-all hover:brightness-110 disabled:opacity-50"
                >
                  {deleting ? "Deleting…" : "Delete Permanently"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ───────────────────────── edit drawer ───────────────────────── */

function EditDrawer({ detail, onClose, onSaved, action, flash }: {
  detail: MeetingDetail;
  onClose: () => void;
  onSaved: () => void;
  action: (id: string, act: string, data?: object) => Promise<{ ok?: boolean; error?: string }>;
  flash: (m: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    clientName: detail.clientName,
    clientCompany: detail.clientCompany,
    clientPhone: detail.clientPhone ?? "",
    clientEmail: detail.clientEmail ?? "",
    title: detail.title,
    agenda: detail.agenda,
    meetingType: detail.meetingType,
    durationMin: detail.durationMin,
    locationType: detail.locationType,
    locationAddress: detail.locationAddress ?? "",
    meetingUrl: detail.meetingUrl ?? "",
    availableDates: detail.availableDates,
    availableFrom: detail.availableFrom,
    availableTo: detail.availableTo,
    allowSuggest: detail.allowSuggest,
    autoConfirm: detail.autoConfirm,
  });

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.clientName.trim()) return flash("Client name is required.");
    if (!form.title.trim()) return flash("Meeting title is required.");
    setSaving(true);
    const r = await action(detail.id, "edit", form);
    setSaving(false);
    if (r.ok) { flash("Meeting updated. Link unchanged."); onSaved(); }
    else flash(r.error ?? "Failed to update.");
  };

  const isOnline = ["google_meet", "zoom", "teams"].includes(form.locationType);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-2xl rounded-2xl border border-border bg-white shadow-2xl" role="dialog" aria-label="Edit Meeting">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-[1.125rem] font-bold">Edit Meeting</h2>
            <p className="mt-0.5 text-[0.8125rem] text-muted">Reference {detail.reference} stays the same, the scheduling link is unchanged.</p>
          </div>
          <button onClick={onClose} className="text-[0.8125rem] text-muted hover:text-foreground">Close</button>
        </div>

        <div className="space-y-5 p-6">
          <fieldset className="rounded-xl border border-border p-4">
            <legend className="px-2 text-[0.75rem] font-semibold text-muted">Client Information</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="adm-label mb-1 block">Name *</label><input value={form.clientName} onChange={(e) => set("clientName", e.target.value)} className="adm-input w-full" /></div>
              <div><label className="adm-label mb-1 block">Company</label><input value={form.clientCompany} onChange={(e) => set("clientCompany", e.target.value)} className="adm-input w-full" /></div>
              <div><label className="adm-label mb-1 block">Phone</label><input value={form.clientPhone} onChange={(e) => set("clientPhone", e.target.value)} type="tel" className="adm-input w-full" /></div>
              <div><label className="adm-label mb-1 block">Email</label><input value={form.clientEmail} onChange={(e) => set("clientEmail", e.target.value)} type="email" className="adm-input w-full" /></div>
            </div>
          </fieldset>

          <fieldset className="rounded-xl border border-border p-4">
            <legend className="px-2 text-[0.75rem] font-semibold text-muted">Meeting Details</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="adm-label mb-1 block">Title *</label><input value={form.title} onChange={(e) => set("title", e.target.value)} className="adm-input w-full" /></div>
              <div className="sm:col-span-2"><label className="adm-label mb-1 block">Agenda</label><textarea value={form.agenda} onChange={(e) => set("agenda", e.target.value)} rows={2} className="adm-input w-full resize-none" /></div>
              <div>
                <label className="adm-label mb-1 block">Type</label>
                <select value={form.meetingType} onChange={(e) => set("meetingType", e.target.value)} className="adm-select w-full">{MEETING_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
              </div>
              <div>
                <label className="adm-label mb-1 block">Duration</label>
                <select value={form.durationMin} onChange={(e) => set("durationMin", Number(e.target.value))} className="adm-select w-full">{DURATIONS.map((d) => <option key={d} value={d}>{d} minutes</option>)}</select>
              </div>
              <div>
                <label className="adm-label mb-1 block">Location</label>
                <select value={form.locationType} onChange={(e) => set("locationType", e.target.value)} className="adm-select w-full">{LOCATIONS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}</select>
              </div>
              {isOnline ? (
                <div><label className="adm-label mb-1 block">Meeting URL</label><input value={form.meetingUrl} onChange={(e) => set("meetingUrl", e.target.value)} className="adm-input w-full" /></div>
              ) : form.locationType !== "phone" ? (
                <div><label className="adm-label mb-1 block">Address</label><input value={form.locationAddress} onChange={(e) => set("locationAddress", e.target.value)} className="adm-input w-full" /></div>
              ) : null}
            </div>
          </fieldset>

          <fieldset className="rounded-xl border border-border p-4">
            <legend className="px-2 text-[0.75rem] font-semibold text-muted">Available Dates & Hours</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="adm-label mb-1 block">From</label><input type="time" value={form.availableFrom} onChange={(e) => set("availableFrom", e.target.value)} className="adm-input w-full" /></div>
              <div><label className="adm-label mb-1 block">To</label><input type="time" value={form.availableTo} onChange={(e) => set("availableTo", e.target.value)} className="adm-input w-full" /></div>
            </div>
            <div className="mt-3">
              <label className="adm-label mb-1 block">Available dates</label>
              <div className="flex flex-wrap gap-2">
                {form.availableDates.map((d) => (
                  <button key={d} type="button" onClick={() => set("availableDates", form.availableDates.filter((x) => x !== d))} className="rounded-md border border-accent/40 bg-accent/[0.06] px-2.5 py-1 text-[0.75rem] font-medium text-accent">{fDate(d)} ✕</button>
                ))}
                <input type="date" onChange={(e) => { if (e.target.value && !form.availableDates.includes(e.target.value)) set("availableDates", [...form.availableDates, e.target.value].sort()); e.target.value = ""; }} className="adm-input h-8 w-36 text-[0.75rem]" />
              </div>
            </div>
          </fieldset>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button onClick={onClose} className="adm-btn-secondary h-10 px-5">Cancel</button>
            <button onClick={() => void save()} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-xl border border-accent bg-accent px-5 text-[0.9375rem] font-bold text-white transition-all hover:brightness-110 disabled:opacity-50">
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── calendar ───────────────────────── */

function CalendarView({ meetings, onSelect }: { meetings: Meeting[]; onSelect: (id: string) => void }) {
  const [month, setMonth] = useState(new Date());
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const startPad = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const byDate = useMemo(() => {
    const map = new Map<string, Meeting[]>();
    for (const m of meetings) {
      const d = m.confirmedDate ?? m.preferredDate;
      if (!d) continue;
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(m);
    }
    return map;
  }, [meetings]);

  return (
    <div className="adm-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="adm-btn-secondary h-8 px-3 text-[0.8125rem]">←</button>
        <h2 className="text-[1rem] font-bold">{month.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</h2>
        <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="adm-btn-secondary h-8 px-3 text-[0.8125rem]">→</button>
      </div>
      <div className="grid grid-cols-7 gap-px border border-border bg-border">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="bg-surface-2 p-2 text-center text-[0.6875rem] font-semibold text-muted">{d}</div>
        ))}
        {Array.from({ length: startPad }).map((_, i) => <div key={`p${i}`} className="min-h-[5rem] bg-background" />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const ds = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayMeetings = byDate.get(ds) ?? [];
          const isToday = ds === new Date().toISOString().slice(0, 10);
          return (
            <div key={day} className={cn("min-h-[5rem] bg-background p-1.5", isToday && "bg-accent/[0.04]")}>
              <p className={cn("mb-1 text-[0.6875rem] font-semibold", isToday ? "text-accent" : "text-muted")}>{day}</p>
              {dayMeetings.map((m) => (
                <button key={m.id} onClick={() => onSelect(m.id)} className="mb-1 block w-full truncate rounded px-1.5 py-0.5 text-left text-[0.6875rem] font-medium hover:bg-accent/[0.08]" title={`${m.clientName} — ${m.title}`}>
                  {fTime(m.confirmedTime ?? m.preferredTime)} {m.clientName.split(" ")[0]}
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/40 py-2 last:border-0">
      <dt className="shrink-0 text-[0.8125rem] text-muted">{k}</dt>
      <dd className="min-w-0 flex-1 break-words text-right text-[0.9375rem] font-semibold text-foreground">{v}</dd>
    </div>
  );
}
