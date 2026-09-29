"use client";

/**
 * Live Chat inbox — a real-time three-column console (conversation list ·
 * thread · lead context) over SSE, with views/counters, search, agent
 * presence, quick replies, Savo AI Assist, internal notes, tags, lead
 * status, follow-ups and admin settings. On small screens the columns
 * become navigable steps: list → thread → details.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { LEAD_STATUS_LABELS } from "@/lib/livechat/summary";

/* ───────────────────────────── types ───────────────────────────── */

type Msg = { id: string; type: string; body: string; senderName: string | null; createdAt: string };

type Summary = {
  id: string;
  status: string;
  mode: string;
  service: string | null;
  stage: string | null;
  timeline: string | null;
  budget: string | null;
  leadName: string | null;
  leadEmail: string | null;
  leadPhoneMasked: string | null;
  leadPhone?: string | null;
  leadCountry: string | null;
  leadStatus: string;
  priority: string;
  assignedName: string | null;
  unreadForAgent: number;
  lastMessage: string | null;
  lastMessageAt: string;
  visitorOnline: boolean;
  createdAt: string;
};

type Detail = Summary & {
  requirement: string | null;
  aiSummary: string | null;
  context: { landingPage?: string; currentPage?: string; referrer?: string; utm?: Record<string, string> } | null;
  assignedId: string | null;
  followUpAt: string | null;
  humanRequestedAt: string | null;
  acceptedAt: string | null;
  tags: string[];
  messages: Msg[];
  events: { id: string; type: string; actorName: string | null; createdAt: string }[];
  previousConversations: { id: string; createdAt: string; status: string; service: string | null }[];
};

type Agent = { id: string; name: string; email: string; presence: string; manual: boolean };

type Settings = {
  businessHours: { enabled: boolean; timeZone: string; days: ({ start: string; end: string } | null)[] };
  budgets: string[];
  quickReplies: { label: string; body: string }[];
  phoneRequired: boolean;
  responseWindowSec: number;
};

type Bootstrap = {
  conversations: (Summary & { id: string })[];
  counts: Record<string, number>;
  agents: Agent[];
  settings: Settings;
  availability: { liveChatOpen: boolean; agentsOnline: { online: number; busy: number; away: number } };
  stats: { waitingNow: number; activeNow: number; agentsOnline: number; unassigned: number; followUpsPending: number; todayRequests: number; avgResponseSec: number | null };
};

const VIEWS: { key: string; label: string; countKey?: string }[] = [
  { key: "inbox", label: "Inbox", countKey: "inbox" },
  { key: "waiting", label: "Waiting", countKey: "waiting" },
  { key: "active", label: "Active", countKey: "active" },
  { key: "unassigned", label: "Unassigned", countKey: "unassigned" },
  { key: "mine", label: "Assigned to me" },
  { key: "followup", label: "Follow-up", countKey: "followup" },
  { key: "ai", label: "AI Conversations", countKey: "ai" },
  { key: "closed", label: "Closed", countKey: "closed" },
  { key: "all", label: "All", countKey: "all" },
];

const STATUS_CHIP: Record<string, string> = {
  ai_only: "AI",
  pre_chat: "Pre-chat",
  waiting_for_agent: "Waiting",
  active: "Active",
  waiting_follow_up: "Follow-up",
  visitor_left: "Visitor left",
  closed: "Closed",
  spam: "Spam",
};

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 45) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86400) return `${Math.floor(s / 3600)} h`;
  return `${Math.floor(s / 86400)} d`;
}

function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ───────────────────────────── app ───────────────────────────── */

export function LiveChatApp({ me }: { me: { id: string; name: string; role: string } }) {
  const [view, setView] = useState("inbox");
  const [query, setQuery] = useState("");
  const [data, setData] = useState<Bootstrap | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [noteMode, setNoteMode] = useState(false);
  const [visitorTyping, setVisitorTyping] = useState(false);
  const [presence, setPresence] = useState("online");
  const [showSettings, setShowSettings] = useState(false);
  const [showAssist, setShowAssist] = useState(false);
  const [assistText, setAssistText] = useState<string | null>(null);
  const [mobilePane, setMobilePane] = useState<"list" | "thread">("list");
  const [toast, setToast] = useState<string | null>(null);

  const threadRef = useRef<HTMLDivElement | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const detailRef = useRef<Detail | null>(null);
  useEffect(() => {
    detailRef.current = detail;
  }, [detail]);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }, []);

  /* ── data loading ── */
  const loadBootstrap = useCallback(
    async (v = view, q = query) => {
      try {
        const res = await fetch(`/api/admin/live-chat/bootstrap?view=${encodeURIComponent(v)}&q=${encodeURIComponent(q)}`, { cache: "no-store" });
        const json = (await res.json()) as Bootstrap & { ok: boolean };
        if (json.ok) setData(json);
      } catch {
        /* retried by SSE counts.changed */
      }
    },
    [view, query],
  );

  const loadDetail = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/admin/live-chat/conversations/${id}`, { cache: "no-store" });
      const json = (await res.json()) as { ok: boolean; conversation?: Detail };
      if (json.ok && json.conversation) {
        setDetail(json.conversation);
        setDetail((d) => {
          if (d) return { ...d, unreadForAgent: 0 };
          return d;
        });
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    // Data fetch on view/query change — setState happens in the promise,
    // not synchronously in the effect body.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadBootstrap();
  }, [view, query, loadBootstrap]);

  const scheduleBootstrap = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => void loadBootstrap(), 400);
  }, [loadBootstrap]);

  /* ── SSE stream (messages across all conversations + counts) ── */
  useEffect(() => {
    const es = new EventSource("/api/admin/live-chat/stream");
    const onMessage = (raw: MessageEvent) => {
      try {
        const evt = JSON.parse(raw.data) as { conversationId: string; message: Msg };
        const open = detailRef.current?.id === evt.conversationId;
        if (evt.message?.type === "visitor") setVisitorTyping(false);
        if (open) {
          setDetail((d) => {
            if (!d || d.messages.some((m) => m.id === evt.message.id)) return d;
            return { ...d, messages: [...d.messages, evt.message] };
          });
          if (evt.message.type === "visitor") void fetch(`/api/admin/live-chat/conversations/${evt.conversationId}/action`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "mark-read" }) });
        }
        scheduleBootstrap();
      } catch {
        /* ignore */
      }
    };
    const onTyping = (raw: MessageEvent) => {
      try {
        const evt = JSON.parse(raw.data) as { conversationId: string; who: string; typing: boolean };
        if (evt.who === "visitor" && detailRef.current?.id === evt.conversationId) {
          setVisitorTyping(evt.typing);
          if (typingTimer.current) clearTimeout(typingTimer.current);
          if (evt.typing) typingTimer.current = setTimeout(() => setVisitorTyping(false), 6000);
        }
      } catch {
        /* ignore */
      }
    };
    const onStatus = () => {
      const id = detailRef.current?.id;
      if (id) void loadDetail(id);
      scheduleBootstrap();
    };
    es.addEventListener("message.new", onMessage as EventListener);
    es.addEventListener("typing", onTyping as EventListener);
    es.addEventListener("status.changed", onStatus as EventListener);
    es.addEventListener("summary.updated", onStatus as EventListener);
    es.addEventListener("conversation.new", onStatus as EventListener);
    es.addEventListener("counts.changed", scheduleBootstrap as unknown as EventListener);
    return () => es.close();
  }, [loadDetail, scheduleBootstrap]);

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [detail?.messages.length, visitorTyping]);

  /* ── actions ── */
  const select = useCallback(
    (id: string) => {
      setSelectedId(id);
      setDetail(null);
      setDraft("");
      setNoteMode(false);
      setAssistText(null);
      setMobilePane("thread");
      void loadDetail(id);
    },
    [loadDetail],
  );

  const action = useCallback(
    async (id: string, payload: Record<string, unknown>) => {
      try {
        const res = await fetch(`/api/admin/live-chat/conversations/${id}/action`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
        if (!res.ok || !json.ok) flash(json.error ?? "Action failed.");
        else {
          await loadDetail(id);
          scheduleBootstrap();
        }
        return json;
      } catch {
        flash("Network problem — try again.");
        return { ok: false };
      }
    },
    [flash, loadDetail, scheduleBootstrap],
  );

  const signalTyping = useCallback(
    (typing: boolean) => {
      const id = detail?.id;
      if (!id) return;
      void fetch(`/api/admin/live-chat/conversations/${id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ typing }),
      }).catch(() => undefined);
    },
    [detail?.id],
  );

  // Typing signal stops 2.5s after the last keystroke — never sticks on.
  useEffect(() => {
    if (!draft) return;
    const t = setTimeout(() => signalTyping(false), 2500);
    return () => clearTimeout(t);
  }, [draft, signalTyping]);

  const send = useCallback(
    async (body: string, note: boolean) => {
      const id = detail?.id;
      const clean = body.trim();
      if (!id || !clean) return;
      setDraft("");
      signalTyping(false);
      try {
        const res = await fetch(`/api/admin/live-chat/conversations/${id}/message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(note ? { note: true, body: clean } : { body: clean }),
        });
        const json = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: Msg; error?: string };
        if (!res.ok || !json.ok) flash(json.error ?? "Could not send.");
        else if (json.message) {
          setVisitorTyping(false);
          setDetail((d) => (d && !d.messages.some((m) => m.id === json.message!.id) ? { ...d, messages: [...d.messages, json.message!] } : d));
          scheduleBootstrap();
        }
      } catch {
        flash("Network problem — try again.");
      }
    },
    [detail?.id, flash, scheduleBootstrap, signalTyping],
  );

  const setPresenceStatus = useCallback(
    async (status: string) => {
      setPresence(status);
      await fetch("/api/admin/live-chat/presence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }).catch(() => undefined);
      scheduleBootstrap();
    },
    [scheduleBootstrap],
  );

  const aiAssist = useCallback(
    async (kind: string, text?: string) => {
      const id = detail?.id;
      if (!id) return;
      setAssistText("…");
      setShowAssist(true);
      try {
        const res = await fetch("/api/admin/live-chat/ai-assist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: id, kind, text }),
        });
        const json = (await res.json()) as { ok: boolean; suggestion?: string };
        setAssistText(json.ok ? (json.suggestion ?? "No suggestion.") : "AI assist unavailable.");
      } catch {
        setAssistText("AI assist unavailable.");
      }
    },
    [detail?.id],
  );

  const stats = data?.stats;

  /* ───────────────────────────── render ───────────────────────────── */

  return (
    <div className="flex h-[calc(100vh-var(--admin-top,4rem))] min-h-[32rem] flex-col">
      {/* Top strip: operational stats + presence + settings */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border bg-surface px-4 py-2.5">
        {stats ? (
          <>
            <Stat label="Waiting" value={stats.waitingNow} accent={stats.waitingNow > 0} />
            <Stat label="Active" value={stats.activeNow} />
            <Stat label="Agents online" value={stats.agentsOnline} />
            <Stat label="Unassigned" value={stats.unassigned} />
            <Stat label="Follow-ups" value={stats.followUpsPending} />
            <Stat label="Avg response today" value={stats.avgResponseSec != null ? `${stats.avgResponseSec}s` : "—"} />
            <Stat label="Requests today" value={stats.todayRequests} />
          </>
        ) : (
          <span className="t-caption text-muted">Loading live chat…</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <label className="t-caption text-muted" htmlFor="presence">
            My status
          </label>
          <select
            id="presence"
            value={presence}
            onChange={(e) => void setPresenceStatus(e.target.value)}
            className="t-caption rounded-[4px] border border-border bg-white px-2 py-1.5 outline-none focus:border-accent"
          >
            <option value="online">Online</option>
            <option value="busy">Busy</option>
            <option value="away">Away</option>
            <option value="offline">Offline</option>
          </select>
          {me.role === "admin" ? (
            <button onClick={() => setShowSettings((s) => !s)} className="t-caption rounded-[4px] border border-border px-2.5 py-1.5 text-muted transition-colors hover:border-accent hover:text-accent">
              Chat settings
            </button>
          ) : null}
        </div>
      </div>

      {showSettings && data ? <SettingsPanel settings={data.settings} onSaved={() => void loadBootstrap()} flash={flash} /> : null}

      {/* Three-column console */}
      <div className="grid min-h-0 flex-1 lg:grid-cols-[20rem_1fr_19rem]">
        {/* LEFT — views + list */}
        <aside className={cn("flex min-h-0 flex-col border-r border-border", mobilePane === "thread" && "hidden lg:flex")}>
          <div className="border-b border-border px-3 py-2.5">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, phone, message…"
              aria-label="Search conversations"
              className="t-sm w-full rounded-[4px] border border-border bg-white px-2.5 py-2 outline-none focus:border-accent"
            />
            <nav className="mt-2 flex flex-wrap gap-1" aria-label="Conversation views">
              {VIEWS.map((v) => {
                const count = v.countKey ? data?.counts[v.countKey] : undefined;
                return (
                  <button
                    key={v.key}
                    onClick={() => setView(v.key)}
                    aria-current={view === v.key}
                    className={cn(
                      "t-caption rounded-[4px] border px-2 py-1 transition-colors",
                      view === v.key ? "border-accent/50 bg-accent/[0.06] text-accent" : "border-border text-muted hover:border-accent/40 hover:text-foreground",
                    )}
                  >
                    {v.label}
                    {count != null && count > 0 ? <span className="ml-1 tnum opacity-80">{count}</span> : null}
                  </button>
                );
              })}
            </nav>
          </div>
          <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto" aria-label="Conversations">
            {(data?.conversations ?? []).map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => select(c.id)}
                  className={cn(
                    "w-full px-3 py-3 text-left transition-colors hover:bg-surface-2/60",
                    selectedId === c.id && "bg-surface-2",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", c.visitorOnline ? "bg-emerald-500" : "bg-border")} aria-label={c.visitorOnline ? "visitor online" : "visitor away"} />
                    <span className="t-sm min-w-0 flex-1 truncate font-semibold text-foreground/90">{c.leadName ?? "Anonymous visitor"}</span>
                    {c.priority === "high" ? <span className="t-caption shrink-0 text-accent" title="High priority">▲</span> : null}
                    {c.unreadForAgent > 0 ? (
                      <span className="t-caption tnum shrink-0 rounded-full bg-accent px-1.5 py-0.5 text-white">{c.unreadForAgent}</span>
                    ) : null}
                    <span className="t-caption shrink-0 text-muted">{timeAgo(c.lastMessageAt)}</span>
                  </div>
                  <p className="t-caption mt-1 truncate text-muted">{c.service ?? "—"}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={cn("t-caption rounded-[3px] border px-1.5 py-0.5", statusTone(c.status))}>{STATUS_CHIP[c.status] ?? c.status}</span>
                    <span className="t-caption min-w-0 flex-1 truncate text-muted">{c.lastMessage ?? ""}</span>
                    {c.assignedName ? <span className="t-caption shrink-0 text-muted">{c.assignedName.split(" ")[0]}</span> : null}
                  </div>
                </button>
              </li>
            ))}
            {data && data.conversations.length === 0 ? <li className="t-caption px-4 py-8 text-center text-muted">Nothing here right now.</li> : null}
          </ul>
        </aside>

        {/* CENTER — thread */}
        <section className={cn("flex min-h-0 flex-col", mobilePane === "list" && "hidden lg:flex")}>
          {detail ? (
            <>
              <header className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
                <button onClick={() => setMobilePane("list")} className="t-caption rounded-[4px] border border-border px-2 py-1 text-muted lg:hidden" aria-label="Back to conversations">
                  ← Inbox
                </button>
                <div className="min-w-0">
                  <p className="t-sm truncate font-semibold">{detail.leadName ?? "Anonymous visitor"}</p>
                  <p className="t-caption text-muted">
                    {STATUS_CHIP[detail.status] ?? detail.status}
                    {detail.assignedName ? ` · ${detail.assignedName}` : " · unassigned"}
                    {detail.mode === "ai" ? " · AI mode" : ""}
                  </p>
                </div>
                <div className="ml-auto flex flex-wrap items-center gap-1.5">
                  {(detail.status === "waiting_for_agent" || detail.status === "waiting_follow_up") && detail.assignedId !== me.id ? (
                    <ActionBtn onClick={() => void action(detail.id, { action: "accept" })} primary>
                      Accept
                    </ActionBtn>
                  ) : null}
                  <select
                    value={detail.assignedId ?? ""}
                    onChange={(e) => void action(detail.id, { action: "assign", agentId: e.target.value || null })}
                    aria-label="Assign to agent"
                    className="t-caption rounded-[4px] border border-border bg-white px-2 py-1.5 outline-none focus:border-accent"
                  >
                    <option value="">Unassigned</option>
                    {(data?.agents ?? []).map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                  <ActionBtn onClick={() => void action(detail.id, { action: "priority", priority: detail.priority === "high" ? "normal" : "high" })}>
                    {detail.priority === "high" ? "▲ High" : "Priority"}
                  </ActionBtn>
                  {detail.mode === "human" && detail.status === "active" ? (
                    <ActionBtn onClick={() => void action(detail.id, { action: "return-to-ai" })} title="Hand the conversation back to Savo AI">
                      Return to AI
                    </ActionBtn>
                  ) : null}
                  {detail.status !== "closed" && detail.status !== "spam" ? (
                    <ActionBtn onClick={() => void action(detail.id, { action: "close" })}>Close</ActionBtn>
                  ) : (
                    <ActionBtn onClick={() => void action(detail.id, { action: "reopen" })}>Reopen</ActionBtn>
                  )}
                  <ActionBtn onClick={() => void aiAssist("suggest")} title="Savo AI Assist — suggested replies">
                    ✦ AI Assist
                  </ActionBtn>
                  <details className="relative">
                    <summary className="t-caption cursor-pointer list-none rounded-[4px] border border-border px-2 py-1.5 text-muted transition-colors hover:border-accent hover:text-accent">More</summary>
                    <div className="absolute right-0 z-10 mt-1 w-48 rounded-[6px] border border-border bg-white p-1.5 shadow-lg">
                      <MenuBtn onClick={() => void aiAssist("digest")}>Regenerate AI summary</MenuBtn>
                      <MenuBtn onClick={() => void aiAssist("email")}>Draft follow-up email</MenuBtn>
                      <MenuBtn onClick={() => void action(detail.id, { action: "spam" })}>Mark spam</MenuBtn>
                      <MenuBtn danger onClick={() => void action(detail.id, { action: "block-visitor" })}>
                        Block visitor
                      </MenuBtn>
                    </div>
                  </details>
                </div>
              </header>

              {/* Thread */}
              <div ref={threadRef} className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain [touch-action:pan-y] bg-surface-2/40 px-4 py-4">
                {detail.messages.map((m) => (
                  <ThreadMessage key={m.id} msg={m} />
                ))}
                {visitorTyping ? (
                  <p className="t-caption text-muted" aria-label="Visitor is typing">
                    visitor is typing…
                  </p>
                ) : null}
                {showAssist && assistText ? (
                  <div className="rounded-[6px] border border-accent/30 bg-accent/[0.05] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="t-caption font-semibold text-accent">✦ Savo AI Assist — internal, never auto-sent</p>
                      <div className="flex gap-1.5">
                        <button onClick={() => setDraft(assistText)} className="t-caption rounded-[4px] border border-accent/40 px-2 py-1 text-accent">
                          Use as draft
                        </button>
                        <button onClick={() => setShowAssist(false)} className="t-caption rounded-[4px] border border-border px-2 py-1 text-muted">
                          Dismiss
                        </button>
                      </div>
                    </div>
                    <p className="t-sm mt-2 whitespace-pre-wrap text-foreground/85">{assistText}</p>
                  </div>
                ) : null}
              </div>

              {/* Quick replies + composer */}
              <div className="border-t border-border px-4 py-2.5">
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  {(data?.settings.quickReplies ?? []).map((qr) => (
                    <button
                      key={qr.label}
                      onClick={() => setDraft(qr.body)}
                      className="t-caption rounded-[4px] border border-border px-2 py-1 text-muted transition-colors hover:border-accent/40 hover:text-foreground"
                    >
                      {qr.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setNoteMode((n) => !n)}
                    className={cn("t-caption rounded-[4px] border px-2 py-1 transition-colors", noteMode ? "border-accent/50 bg-accent/[0.06] text-accent" : "border-border text-muted hover:text-foreground")}
                    aria-pressed={noteMode}
                  >
                    Internal note
                  </button>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void send(draft, noteMode);
                  }}
                  className={cn("flex items-end gap-2 rounded-[6px] border bg-white px-3 py-2", noteMode ? "border-accent/40" : "border-border")}
                >
                  <label htmlFor="chat-draft" className="sr-only">
                    {noteMode ? "Write an internal note" : "Reply to the visitor"}
                  </label>
                  <textarea
                    id="chat-draft"
                    value={draft}
                    rows={1}
                    onChange={(e) => {
                      setDraft(e.target.value);
                      signalTyping(e.target.value.length > 0);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void send(draft, noteMode);
                      }
                    }}
                    placeholder={noteMode ? "Internal note — the visitor never sees this…" : "Reply to the visitor…"}
                    className="t-sm max-h-32 min-h-[1.75rem] w-full flex-1 resize-none bg-transparent py-1 outline-none placeholder:text-muted"
                  />
                  <button type="submit" className="t-caption shrink-0 rounded-[4px] border border-accent/50 bg-accent/[0.06] px-3 py-1.5 font-semibold text-accent">
                    {noteMode ? "Save note" : "Send"}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="grid flex-1 place-items-center">
              <p className="t-caption text-muted">{mobilePane === "thread" ? "Loading conversation…" : "Select a conversation to start replying."}</p>
            </div>
          )}
        </section>

        {/* RIGHT — lead context */}
        <aside className={cn("min-h-0 overflow-y-auto border-l border-border px-4 py-4", mobilePane === "thread" ? "hidden xl:block" : "hidden lg:block")}>
          {detail ? <LeadPanel detail={detail} agents={data?.agents ?? []} action={action} flash={flash} aiAssist={aiAssist} /> : <p className="t-caption text-muted">No conversation selected.</p>}
        </aside>
      </div>

      {toast ? (
        <div role="status" className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-[6px] border border-border bg-white px-4 py-2 shadow-lg">
          <p className="t-caption">{toast}</p>
        </div>
      ) : null}
    </div>
  );
}

/* ─────────────────────────── small pieces ─────────────────────────── */

function statusTone(status: string): string {
  if (status === "waiting_for_agent") return "border-accent/40 text-accent";
  if (status === "active") return "border-emerald-500/40 text-emerald-600";
  if (status === "closed" || status === "spam") return "border-border text-muted";
  return "border-foreground/20 text-muted";
}

function Stat({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className={cn("t-sm tnum font-semibold", accent ? "text-accent" : "text-foreground/90")}>{value}</span>
      <span className="t-caption text-muted">{label}</span>
    </div>
  );
}

function ActionBtn({ children, onClick, primary, title }: { children: React.ReactNode; onClick: () => void; primary?: boolean; title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "t-caption shrink-0 rounded-[4px] border px-2 py-1.5 transition-colors",
        primary ? "border-accent/50 bg-accent/[0.06] font-semibold text-accent hover:border-accent" : "border-border text-muted hover:border-accent/40 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function MenuBtn({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={cn("t-caption block w-full rounded-[4px] px-2 py-1.5 text-left transition-colors hover:bg-surface-2", danger ? "text-error" : "text-foreground/80")}>
      {children}
    </button>
  );
}

function ThreadMessage({ msg }: { msg: Msg }) {
  if (msg.type === "system") {
    return <p className="t-caption mx-auto w-fit max-w-[90%] rounded-full border border-border bg-surface px-3 py-1 text-center text-muted">{msg.body}</p>;
  }
  if (msg.type === "internal_note") {
    return (
      <div className="mx-auto w-full max-w-[85%] rounded-[6px] border border-dashed border-accent/40 bg-accent/[0.04] px-3 py-2">
        <p className="t-caption font-semibold text-accent">Internal note · {msg.senderName ?? "agent"}</p>
        <p className="t-sm mt-1 whitespace-pre-wrap text-foreground/85">{msg.body}</p>
      </div>
    );
  }
  if (msg.type === "agent") {
    return (
      <div className="flex flex-col items-end">
        <p className="t-caption mr-1 text-muted">{msg.senderName ?? "Savo"}</p>
        <div className="t-sm max-w-[85%] whitespace-pre-wrap rounded-[6px] border border-accent/25 bg-accent/[0.06] px-3 py-2 text-foreground/90">{msg.body}</div>
        <p className="t-caption mt-0.5 mr-1 text-muted">{clock(msg.createdAt)}</p>
      </div>
    );
  }
  if (msg.type === "ai") {
    return (
      <div className="flex flex-col">
        <p className="t-caption ml-1 text-muted">Savo AI</p>
        <div className="t-sm max-w-[85%] whitespace-pre-wrap rounded-[6px] border border-border bg-white px-3 py-2 text-foreground/85">{msg.body}</div>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-start">
      <div className="t-sm max-w-[85%] whitespace-pre-wrap rounded-[6px] bg-foreground px-3 py-2 text-background">{msg.body}</div>
      <p className="t-caption mt-0.5 ml-1 text-muted">{clock(msg.createdAt)}</p>
    </div>
  );
}

/* ─────────────────────────── right panel ─────────────────────────── */

function LeadPanel({
  detail,
  action,
  flash,
  aiAssist,
}: {
  detail: Detail;
  agents: Agent[];
  action: (id: string, payload: Record<string, unknown>) => Promise<{ ok?: boolean }>;
  flash: (msg: string) => void;
  aiAssist: (kind: string, text?: string) => Promise<void>;
}) {
  const [tags, setTags] = useState(detail.tags.join(", "));
  const [followUp, setFollowUp] = useState(detail.followUpAt ? detail.followUpAt.slice(0, 16) : "");
  // Re-sync local editing state when the server data changes (derived-state
  // pattern — safe during render, no cascading effects).
  const [prevTags, setPrevTags] = useState(detail.tags);
  const [prevFollowUp, setPrevFollowUp] = useState(detail.followUpAt);
  if (detail.tags !== prevTags) {
    setPrevTags(detail.tags);
    setTags(detail.tags.join(", "));
  }
  if (detail.followUpAt !== prevFollowUp) {
    setPrevFollowUp(detail.followUpAt);
    setFollowUp(detail.followUpAt ? detail.followUpAt.slice(0, 16) : "");
  }

  const copy = (label: string, value?: string | null) => {
    if (!value) return;
    void navigator.clipboard?.writeText(value).then(
      () => flash(`${label} copied`),
      () => flash("Copy failed"),
    );
  };

  return (
    <div className="space-y-5">
      {/* Contact */}
      <section>
        <h3 className="t-caption mb-2 font-semibold uppercase tracking-wide text-muted">Contact</h3>
        <dl className="space-y-1.5">
          <Row k="Name" v={detail.leadName ?? "—"} onCopy={() => copy("Name", detail.leadName)} />
          <Row k="Phone" v={detail.leadPhone ?? detail.leadPhoneMasked ?? "—"} onCopy={() => copy("Phone", detail.leadPhone ?? detail.leadPhoneMasked)} />
          <Row k="Email" v={detail.leadEmail ?? "—"} onCopy={() => copy("Email", detail.leadEmail)} />
        </dl>
      </section>

      {/* Qualification */}
      <section>
        <h3 className="t-caption mb-2 font-semibold uppercase tracking-wide text-muted">Requirement</h3>
        <dl className="space-y-1.5">
          <Row k="Service" v={detail.service ?? "—"} />
          <Row k="Stage" v={detail.stage ?? "—"} />
          <Row k="Timeline" v={detail.timeline ?? "—"} />
          <Row k="Budget" v={detail.budget ?? "—"} />
        </dl>
        {detail.requirement ? <p className="t-sm mt-2 rounded-[6px] border border-border bg-white px-3 py-2 text-foreground/85">{detail.requirement}</p> : null}
      </section>

      {/* Lead status + follow-up */}
      <section>
        <h3 className="t-caption mb-2 font-semibold uppercase tracking-wide text-muted">Lead</h3>
        <div className="space-y-2">
          <div>
            <label className="t-caption text-muted" htmlFor="lead-status">
              Status
            </label>
            <select
              id="lead-status"
              value={detail.leadStatus}
              onChange={(e) => void action(detail.id, { action: "lead-status", leadStatus: e.target.value })}
              className="t-sm mt-1 w-full rounded-[4px] border border-border bg-white px-2 py-1.5 outline-none focus:border-accent"
            >
              {Object.entries(LEAD_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="t-caption text-muted" htmlFor="followup">
              Follow-up
            </label>
            <div className="mt-1 flex gap-1.5">
              <input
                id="followup"
                type="datetime-local"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                className="t-sm min-w-0 flex-1 rounded-[4px] border border-border bg-white px-2 py-1.5 outline-none focus:border-accent"
              />
              <button
                onClick={() => void action(detail.id, { action: "follow-up", followUpAt: followUp ? new Date(followUp).toISOString() : null })}
                className="t-caption shrink-0 rounded-[4px] border border-border px-2 py-1.5 text-muted hover:border-accent hover:text-accent"
              >
                Set
              </button>
            </div>
          </div>
          <div>
            <label className="t-caption text-muted" htmlFor="tags">
              Tags (comma separated)
            </label>
            <div className="mt-1 flex gap-1.5">
              <input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="t-sm min-w-0 flex-1 rounded-[4px] border border-border bg-white px-2 py-1.5 outline-none focus:border-accent"
              />
              <button
                onClick={() => void action(detail.id, { action: "tags", tags: tags.split(",").map((t) => t.trim()).filter(Boolean) })}
                className="t-caption shrink-0 rounded-[4px] border border-border px-2 py-1.5 text-muted hover:border-accent hover:text-accent"
              >
                Save
              </button>
            </div>
            {detail.tags.length > 0 ? (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {detail.tags.map((t) => (
                  <span key={t} className="t-caption rounded-[3px] border border-border px-1.5 py-0.5 text-muted">
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* AI summary */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="t-caption font-semibold uppercase tracking-wide text-muted">AI summary</h3>
          <button onClick={() => void aiAssist("digest")} className="t-caption text-accent hover:underline">
            Regenerate
          </button>
        </div>
        <p className="t-sm whitespace-pre-wrap rounded-[6px] border border-accent/25 bg-accent/[0.04] px-3 py-2 text-foreground/85">
          {detail.aiSummary ?? "No summary yet."}
        </p>
      </section>

      {/* Context */}
      <section>
        <h3 className="t-caption mb-2 font-semibold uppercase tracking-wide text-muted">Context</h3>
        <dl className="space-y-1.5">
          <Row k="Landing page" v={detail.context?.landingPage ?? "—"} />
          <Row k="Current page" v={detail.context?.currentPage ?? "—"} />
          <Row k="Referrer" v={detail.context?.referrer ?? "—"} />
          <Row k="Created" v={new Date(detail.createdAt).toLocaleString()} />
        </dl>
        {detail.context?.utm && Object.keys(detail.context.utm).length > 0 ? (
          <p className="t-caption mt-1.5 text-muted">UTM: {Object.entries(detail.context.utm).map(([k, v]) => `${k}=${v}`).join(" · ")}</p>
        ) : null}
        {detail.previousConversations.length > 0 ? (
          <p className="t-caption mt-1.5 text-muted">{detail.previousConversations.length} previous conversation(s)</p>
        ) : null}
      </section>
    </div>
  );
}

function Row({ k, v, onCopy }: { k: string; v: string; onCopy?: () => void }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="t-caption w-24 shrink-0 text-muted">{k}</dt>
      <dd className="t-sm min-w-0 flex-1 break-words text-foreground/90">{v}</dd>
      {onCopy && v !== "—" ? (
        <button onClick={onCopy} className="t-caption shrink-0 text-muted hover:text-accent" aria-label={`Copy ${k}`}>
          ⧉
        </button>
      ) : null}
    </div>
  );
}

/* ─────────────────────────── settings drawer ─────────────────────────── */

function SettingsPanel({ settings, onSaved, flash }: { settings: Settings; onSaved: () => void; flash: (m: string) => void }) {
  const [draft, setDraft] = useState<Settings>(settings);
  const [saving, setSaving] = useState(false);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/live-chat/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessHours: draft.businessHours,
          budgets: draft.budgets,
          quickReplies: draft.quickReplies,
          phoneRequired: draft.phoneRequired,
          responseWindowSec: draft.responseWindowSec,
        }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      flash(json.ok ? "Settings saved." : (json.error ?? "Save failed."));
      if (json.ok) onSaved();
    } catch {
      flash("Save failed.");
    }
    setSaving(false);
  }

  return (
    <div className="border-b border-border bg-surface-2/60 px-4 py-3">
      <div className="grid gap-4 md:grid-cols-3">
        {/* Business hours */}
        <fieldset>
          <legend className="t-caption mb-1.5 font-semibold text-foreground/80">Live-chat business hours</legend>
          <label className="t-caption flex items-center gap-2 text-muted">
            <input type="checkbox" checked={draft.businessHours.enabled} onChange={(e) => setDraft({ ...draft, businessHours: { ...draft.businessHours, enabled: e.target.checked } })} />
            Restrict live chat to hours below
          </label>
          <div className="mt-1.5 space-y-1">
            {days.map((d, i) => (
              <div key={d} className="flex items-center gap-1.5">
                <span className="t-caption w-8 text-muted">{d}</span>
                <input
                  type="time"
                  value={draft.businessHours.days[i]?.start ?? ""}
                  onChange={(e) => {
                    const days2 = [...draft.businessHours.days];
                    days2[i] = e.target.value && days2[i] ? { ...days2[i]!, start: e.target.value } : e.target.value ? { start: e.target.value, end: "19:00" } : null;
                    setDraft({ ...draft, businessHours: { ...draft.businessHours, days: days2 } });
                  }}
                  className="t-caption w-[5.5rem] rounded-[4px] border border-border bg-white px-1.5 py-1"
                  aria-label={`${d} start`}
                />
                <input
                  type="time"
                  value={draft.businessHours.days[i]?.end ?? ""}
                  onChange={(e) => {
                    const days2 = [...draft.businessHours.days];
                    days2[i] = e.target.value && days2[i] ? { ...days2[i]!, end: e.target.value } : e.target.value ? { start: "10:00", end: e.target.value } : null;
                    setDraft({ ...draft, businessHours: { ...draft.businessHours, days: days2 } });
                  }}
                  className="t-caption w-[5.5rem] rounded-[4px] border border-border bg-white px-1.5 py-1"
                  aria-label={`${d} end`}
                />
              </div>
            ))}
          </div>
        </fieldset>

        {/* Budgets + toggles */}
        <div>
          <label className="t-caption mb-1.5 block font-semibold text-foreground/80" htmlFor="budgets">
            Pre-chat budget options (one per line)
          </label>
          <textarea
            id="budgets"
            rows={5}
            value={draft.budgets.join("\n")}
            onChange={(e) => setDraft({ ...draft, budgets: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean) })}
            className="t-caption w-full rounded-[4px] border border-border bg-white px-2 py-1.5 outline-none focus:border-accent"
          />
          <label className="t-caption mt-2 flex items-center gap-2 text-muted">
            <input type="checkbox" checked={draft.phoneRequired} onChange={(e) => setDraft({ ...draft, phoneRequired: e.target.checked })} />
            Phone number required for live chat
          </label>
          <label className="t-caption mt-1.5 flex items-center gap-2 text-muted">
            Response window
            <input
              type="number"
              min={30}
              max={600}
              value={draft.responseWindowSec}
              onChange={(e) => setDraft({ ...draft, responseWindowSec: Number(e.target.value) })}
              className="t-caption w-16 rounded-[4px] border border-border bg-white px-1.5 py-1"
            />
            seconds
          </label>
        </div>

        {/* Quick replies */}
        <div>
          <label className="t-caption mb-1.5 block font-semibold text-foreground/80" htmlFor="quickreplies">
            Quick replies (label: body, one per entry)
          </label>
          <textarea
            id="quickreplies"
            rows={9}
            value={draft.quickReplies.map((q) => `${q.label}: ${q.body}`).join("\n")}
            onChange={(e) =>
              setDraft({
                ...draft,
                quickReplies: e.target.value
                  .split("\n")
                  .map((line) => {
                    const idx = line.indexOf(":");
                    if (idx < 1) return null;
                    return { label: line.slice(0, idx).trim(), body: line.slice(idx + 1).trim() };
                  })
                  .filter((q): q is { label: string; body: string } => !!q && !!q.label && !!q.body),
              })
            }
            className="t-caption w-full rounded-[4px] border border-border bg-white px-2 py-1.5 outline-none focus:border-accent"
          />
        </div>
      </div>
      <button onClick={() => void save()} disabled={saving} className="t-caption mt-2 rounded-[4px] border border-accent/50 bg-accent/[0.06] px-3 py-1.5 font-semibold text-accent disabled:opacity-50">
        {saving ? "Saving…" : "Save chat settings"}
      </button>
    </div>
  );
}
