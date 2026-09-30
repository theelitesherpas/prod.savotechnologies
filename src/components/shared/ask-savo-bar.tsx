"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  INITIAL_SUGGESTIONS,
  answerQuestion,
  entryById,
  followUps,
  type AssistantEntry,
} from "@/lib/assistant";
import { CALLBACK_COUNTRIES, COUNTRY_PHONE_RULES, validatePhone } from "@/lib/phone";
import { track } from "@/lib/analytics";
import { cn, withBasePath } from "@/lib/utils";

/**
 * Savo Assistant — one continuous conversation, two modes (spec: Savo
 * Assistant + real-time human live chat).
 *
 *   Ask anything about Savo — or talk to our team now.
 *   [ Ask Savo AI ]  [ Talk to a Human ]
 *
 * MODE A · Savo AI — deterministic site-truth answers, persisted
 *   server-side on the visitor's thread.
 * MODE B · Human — a short conversational qualification (service, stage,
 *   requirement, timeline, budget, contact), a compact review, then a
 *   live-chat request with a 60s server-side acceptance window, SSE
 *   delivery of agent replies, graceful timeout → follow-up, and AI
 *   continuity afterwards. Cross-page and cross-visit: the thread is
 *   restored from the server on open.
 *
 * Visual language: the existing floating bar + glass frame, unchanged.
 */

/* ────────────────────────────── types ────────────────────────────── */

type ChatMsg =
  | { id: string; side: "user"; text: string; at: number }
  | { id: string; side: "assistant"; node: ReactNode; at: number }
  | {
      id: string;
      side: "server";
      kind: "visitor" | "ai" | "agent" | "system";
      body: string;
      senderName?: string | null;
      at: number;
    };

type Phase = "boot" | "welcome" | "ai" | "prechat" | "live" | "ended";

type Availability = { liveChatOpen: boolean; agentsOnline: boolean; responseWindowSec: number };

type Session = {
  conversation: { id: string; status: string; mode: string } | null;
  messages: { id: string; type: string; body: string; senderName: string | null; createdAt: string }[];
  availability: Availability;
  budgets: string[];
  phoneRequired: boolean;
};

/* Pre-chat qualification steps (spec §5) */
const SERVICES = [
  "New website", "Website redesign", "Mobile application", "AI / AI Agent", "AI Automation",
  "Custom Software", "SaaS Product", "UI/UX Design", "E-commerce", "SEO / AEO / GEO",
  "Existing project support", "Maintenance / Development Support", "Cloud / DevOps", "Other",
];
const STAGES = [
  "Just exploring an idea", "Planning requirements", "Have designs ready", "Development already started",
  "Have an existing product", "Need redesign / improvement", "Need urgent technical support",
];
const TIMELINES = ["As soon as possible", "Within a few weeks", "Within 1–3 months", "3+ months", "Just researching"];

const HANDOFF_LINE =
  "Of course. I'll collect a few details so the right person at Savo has some context before joining. What would you like to discuss?";

const WHATSAPP_URL = `https://wa.me/917502901234?text=${encodeURIComponent("Hi Savo! I have a question.")}`;

/* ───────────────────────── page/lead context ───────────────────────── */

function captureContext() {
  if (typeof window === "undefined") return null;
  try {
    const landingKey = "savo_landing";
    if (!sessionStorage.getItem(landingKey)) sessionStorage.setItem(landingKey, window.location.pathname);
    const landingPage = sessionStorage.getItem(landingKey) ?? window.location.pathname;
    const utm: Record<string, string> = {};
    new URLSearchParams(window.location.search).forEach((v, k) => {
      if (k.startsWith("utm_")) utm[k] = v.slice(0, 120);
    });
    return { landingPage, currentPage: window.location.pathname, referrer: document.referrer.slice(0, 300) || undefined, utm };
  } catch {
    return null;
  }
}

/* ─────────────────────────── component ─────────────────────────── */

export function AskSavoBar() {
  /* Bar visibility (scroll hysteresis) + window state */
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  /* Conversation state */
  const [phase, setPhase] = useState<Phase>("boot");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Session / live chat */
  const [session, setSession] = useState<Session | null>(null);
  const [convToken, setConvToken] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<string | null>(null); // waiting_for_agent | active | waiting_follow_up | closed…
  const [agentTyping, setAgentTyping] = useState(false);
  const [lateAccept, setLateAccept] = useState(false); // agent joins while the visitor is in AI mode (spec §33)
  const [endRequested, setEndRequested] = useState(false); // agent asked the visitor to confirm ending

  /* Pre-chat qualification */
  const [qService, setQService] = useState<string | null>(null);
  const [qStage, setQStage] = useState<string | null>(null);
  const [qRequirement, setQRequirement] = useState("");
  const [qTimeline, setQTimeline] = useState<string | null>(null);
  const [qBudget, setQBudget] = useState<string | null>(null);
  const [qStep, setQStep] = useState(0); // 0 service · 1 stage · 2 requirement · 3 timeline · 4 budget · 5 contact · 6 review
  const [cName, setCName] = useState("");
  const [cCountry, setCCountry] = useState("India");
  const [cPhone, setCPhone] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);

  const threadRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const idRef = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const esRef = useRef<EventSource | null>(null);
  const typingStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesRef = useRef<ChatMsg[]>([]);
  const phaseRef = useRef<Phase>(phase);
  useEffect(() => {
    messagesRef.current = messages;
    phaseRef.current = phase;
  }, [messages, phase]);

  const later = (fn: () => void, ms: number) => timersRef.current.push(setTimeout(fn, ms));
  const say = useCallback((node: ReactNode) => {
    idRef.current += 1;
    setMessages((m) => [...m, { id: `local-${idRef.current}`, side: "assistant", node, at: Date.now() }]);
  }, []);
  const sayServer = useCallback((msg: { kind: "visitor" | "ai" | "agent" | "system"; body: string; senderName?: string | null }) => {
    idRef.current += 1;
    setMessages((m) => [...m, { id: `srv-${msg.kind}-${idRef.current}-${Math.random().toString(36).slice(2, 7)}`, side: "server" as const, at: Date.now(), ...msg }]);
  }, []);

  /* ── Session bootstrap (availability + conversation restore) ── */
  const loadSession = useCallback(async () => {
    try {
      const res = await fetch(withBasePath("/api/live-chat/session"), { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as Session & { ok: boolean; conversation: ({ publicToken?: string } & Session["conversation"]) | null };
      setSession(data);
      if (data.conversation) {
        if (data.conversation.publicToken) setConvToken(data.conversation.publicToken);
        // Restore: render the stored thread plainly and land in the right phase.
        seenIdsRef.current = new Set(data.messages.map((m) => m.id));
        setMessages(
          data.messages.map((m) => ({
            id: m.id,
            side: "server" as const,
            kind: m.type as "visitor" | "ai" | "agent" | "system",
            body: m.body,
            senderName: m.senderName,
            at: new Date(m.createdAt).getTime(),
          })),
        );
        const status = data.conversation.status;
        if (status === "waiting_for_agent" || status === "active") {
          setLiveStatus(status);
          setPhase("live");
        } else if (status === "waiting_follow_up" || status === "visitor_left") {
          setLiveStatus(status);
          setPhase("live");
          sayServer({
            kind: "system",
            body: "Welcome back — your conversation with Savo is right where you left it.",
          });
        } else {
          setPhase("ai");
        }
      }
    } catch {
      /* offline-first: welcome screen still works, AI falls back */
    }
  }, [sayServer]);

  /* ── SSE subscription — connected whenever a live thread exists, so the
     visitor hears agent replies, accept/timeout transitions and late
     accepts even while continuing with Savo AI (spec §33). ── */
  useEffect(() => {
    if (phase !== "live" && phase !== "ai") {
      esRef.current?.close();
      esRef.current = null;
      return;
    }
    const url = convToken
      ? `${withBasePath("/api/live-chat/stream")}?token=${encodeURIComponent(convToken)}`
      : withBasePath("/api/live-chat/stream");
    const es = new EventSource(url);
    esRef.current = es;

    const onMessage = (raw: MessageEvent) => {
      try {
        const evt = JSON.parse(raw.data) as { message?: { id: string; type: string; body: string; senderName?: string | null } };
        const msg = evt.message;
        if (!msg || seenIdsRef.current.has(msg.id)) return;
        // In AI mode the client renders its own rich question/answer pair
        // after /ask — the server's plain-text echoes of the same turn would
        // double every message. Live SSE in AI mode only carries human-side
        // events (agent lines, system notes, late accepts). History on
        // restore still comes fully from /session.
        if (phaseRef.current === "ai" && (msg.type === "ai" || msg.type === "visitor")) {
          seenIdsRef.current.add(msg.id);
          return;
        }
        // Skip the echo of our own just-sent visitor message (optimistic copy).
        if (msg.type === "visitor") {
          const dup = messagesRef.current.some(
            (m) =>
              Math.abs(Date.now() - m.at) < 8000 &&
              ((m.side === "user" && m.text === msg.body) || (m.side === "server" && m.kind === "visitor" && m.body === msg.body)),
          );
          if (dup) {
            seenIdsRef.current.add(msg.id);
            return;
          }
        }
        seenIdsRef.current.add(msg.id);
        if (msg.type === "agent") setAgentTyping(false);
        setMessages((m) => [
          ...m,
          { id: msg.id, side: "server", kind: msg.type as "visitor" | "ai" | "agent" | "system", body: msg.body, senderName: msg.senderName, at: Date.now() },
        ]);
      } catch {
        /* ignore malformed */
      }
    };
    const onStatus = (raw: MessageEvent) => {
      try {
        const evt = JSON.parse(raw.data) as { status: string; agentName?: string | null; lateAccept?: boolean };
        setLiveStatus(evt.status);
        setAgentTyping(false);
        if (evt.status === "active") {
          track("ask_savo_live_accepted");
          // Visitor was elsewhere (AI mode after timeout) — offer the switch,
          // never yank the conversation away (spec §33).
          if (phaseRef.current !== "live") setLateAccept(true);
          else setLateAccept(false);
        }
        if (evt.status === "ai_only") setPhase("ai");
        // The team (or the system) closed the thread → show the proper ended
        // state: history stays visible, new conversations offered (never an
        // abrupt wipe).
        if (evt.status === "closed") {
          setLiveStatus("closed");
          setPhase("ended");
          setEndRequested(false);
        }
      } catch {
        /* ignore */
      }
    };
    const onEndRequest = (raw: MessageEvent) => {
      try {
        JSON.parse(raw.data) as { conversationId: string; agentName?: string | null };
        if (phaseRef.current === "live") setEndRequested(true);
      } catch {
        /* ignore */
      }
    };
    const onTyping = (raw: MessageEvent) => {
      try {
        const evt = JSON.parse(raw.data) as { who: string; typing: boolean };
        if (evt.who === "agent") setAgentTyping(evt.typing);
      } catch {
        /* ignore */
      }
    };

    es.addEventListener("message.new", onMessage as EventListener);
    es.addEventListener("status.changed", onStatus as EventListener);
    es.addEventListener("typing", onTyping as EventListener);
    es.addEventListener("end.requested", onEndRequest as EventListener);
    es.onerror = () => {
      /* EventSource auto-reconnects; nothing else to do */
    };
    return () => {
      es.close();
      esRef.current = null;
    };
  }, [phase, convToken]);

  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  /* ── Scroll hysteresis for the bar (unchanged behaviour) ── */
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 40) setDismissed(false);
      setVisible((v) => (y > 140 ? true : y < 40 ? false : v));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Esc collapses */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && document.activeElement?.closest("form[aria-label='Ask Savo']")) {
        e.preventDefault();
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  /* Click-outside minimizes (gesture must start and land outside) */
  useEffect(() => {
    if (!open) return;
    let downInside = false;
    const onPointerDown = (e: PointerEvent) => {
      downInside = frameRef.current?.contains(e.target as Node) ?? false;
    };
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target || downInside) return;
      if (frameRef.current?.contains(target)) return;
      if (target instanceof Element && target.closest('[role="dialog"]')) return;
      track("ask_savo_minimize_outside");
      setOpen(false);
      inputRef.current?.blur();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("click", onClick);
    };
  }, [open]);

  /* Thread pinned to the latest */
  useEffect(() => {
    const el = threadRef.current;
    if (el && open) el.scrollTop = el.scrollHeight;
  }, [messages, typing, agentTyping, open, qStep]);

  /* ── Window controls ── */
  function minimize() {
    track("ask_savo_minimize");
    setOpen(false);
    inputRef.current?.blur();
  }
  function closeWindow() {
    track("ask_savo_close");
    setDismissed(true);
    setOpen(false);
    inputRef.current?.blur();
  }
  function newChat() {
    track("ask_savo_reset");
    endConversationQuietly();
    resetToWelcome();
  }

  /* End the current thread server-side (visitor-side close) without
     waiting — the next message starts a fresh conversation. */
  function endConversationQuietly() {
    if (!convToken) return;
    void fetch(withBasePath("/api/live-chat/end"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: convToken }),
      keepalive: true,
    }).catch(() => undefined);
  }

  function resetToWelcome() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setTyping(false);
    setError(null);
    setInput("");
    seenIdsRef.current = new Set();
    setMessages([]);
    setConvToken(null);
    setLiveStatus(null);
    setLateAccept(false);
    setEndRequested(false);
    setQService(null);
    setQStage(null);
    setQRequirement("");
    setQTimeline(null);
    setQBudget(null);
    setQStep(0);
    setCName("");
    setCPhone("");
    setCEmail("");
    setConsent(false);
    setPhase("welcome");
  }

  /* End the current thread and land in the proper ended state: history
     stays visible, nothing wipes, and new conversations are offered. */
  function endChatLocally() {
    track("ask_savo_chat_ended");
    endConversationQuietly();
    setEndRequested(false);
    setLiveStatus("closed");
    setPhase("ended");
  }

  /* After an ended/reset conversation, Savo AI responds by default — a new
   * thread begins on the first message (owner rule #4). */
  function beginFreshAi(question?: string) {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setTyping(false);
    setError(null);
    setInput("");
    seenIdsRef.current = new Set();
    setMessages([]);
    setConvToken(null);
    setLiveStatus(null);
    setLateAccept(false);
    setEndRequested(false);
    setPhase("ai");
    if (question) void ask(question);
  }

  function beginFreshHuman() {
    beginFreshAi();
    setPhase("prechat");
    setQStep(0);
    sayServer({ kind: "ai", body: HANDOFF_LINE });
  }

  /* Visitor's answer to the agent's end-request. */
  async function answerEndRequest(accept: boolean) {
    setEndRequested(false);
    if (!convToken) return;
    if (accept) {
      endChatLocally();
    }
    try {
      await fetch(withBasePath("/api/live-chat/end-request"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: convToken, accept }),
      });
    } catch {
      /* best-effort */
    }
  }
  async function openIt() {
    if (open) return;
    track("ask_savo_open", { typed: false });
    setOpen(true);
    if (phase === "boot") {
      setPhase("welcome");
      await loadSession();
    }
  }

  /* ── Welcome actions ── */
  function startAi() {
    setPhase("ai");
    track("ask_savo_mode_ai");
  }
  function startHuman() {
    track("ask_savo_mode_human", { offline: !session?.availability.liveChatOpen });
    setPhase("prechat");
    setQStep(0);
    sayServer({ kind: "ai", body: HANDOFF_LINE });
  }

  /* ── AI mode: ask a question ── */
  async function ask(question: string) {
    const clean = question.trim();
    if (!clean || typing) return;
    track("ask_savo_question");
    idRef.current += 1;
    setMessages((m) => [...m, { id: `me-${idRef.current}`, side: "user", text: clean, at: Date.now() }]);
    setInput("");
    setError(null);
    setTyping(true);
    try {
      const res = await fetch(withBasePath("/api/live-chat/ask"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: clean, pageContext: captureContext() }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        conversationToken?: string;
        result?: { kind: string; entryId?: string; handoff?: boolean };
      };
      if (json.conversationToken) setConvToken(json.conversationToken);
      later(() => {
        setTyping(false);
        if (json.ok && json.result?.kind === "handoff") {
          setPhase("prechat");
          setQStep(0);
          sayServer({ kind: "ai", body: HANDOFF_LINE });
          return;
        }
        // The thread belongs to a human — the message went to the team.
        if (json.ok && json.result?.kind === "human_mode") {
          setPhase("live");
          sayServer({ kind: "system", body: "Your message was sent to the Savo team — they have this conversation." });
          return;
        }
        if (json.ok && json.result?.kind === "entry" && json.result.entryId) {
          const entry = entryById(json.result.entryId);
          if (entry) {
            track("ask_savo_answered", { entry: entry.id });
            say(<EntryAnswer entry={entry} onAsk={ask} onHuman={startHuman} />);
            return;
          }
        }
        if (json.ok && json.result?.kind === "miss") {
          const suggestions = ["build", "cost", "start", "ai", "industries", "careers"]
            .map((id) => entryById(id))
            .filter((e): e is AssistantEntry => !!e)
            .slice(0, 4);
          say(
            <div>
              <p>That one&apos;s beyond my verified notes — and I won&apos;t guess.</p>
              <p className="mt-2 text-muted">Try one of these, or talk to the team directly:</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {suggestions.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => ask(e.question)}
                    className="t-caption rounded-[4px] border border-foreground/20 px-2.5 py-1.5 text-muted transition-colors hover:border-accent/50 hover:text-foreground"
                  >
                    {e.question}
                  </button>
                ))}
                <button
                  onClick={startHuman}
                  className="t-caption rounded-[4px] border border-accent/40 px-2.5 py-1.5 text-accent transition-colors hover:border-accent"
                >
                  Talk to a Human
                </button>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track("ask_savo_whatsapp")}
                  className="t-caption rounded-[4px] border border-foreground/20 px-2.5 py-1.5 text-muted transition-colors hover:border-accent/40 hover:text-foreground"
                >
                  WhatsApp us
                </a>
              </div>
            </div>,
          );
          return;
        }
        say(<p className="text-muted">I couldn&apos;t reach my notes just now — please try again in a moment.</p>);
      }, 420);
    } catch {
      setTyping(false);
      // Deterministic local fallback keeps the assistant useful offline.
      const entry = answerQuestion(clean);
      if (entry) say(<EntryAnswer entry={entry} onAsk={ask} onHuman={startHuman} />);
      else
        say(
          <p className="text-muted">
            I&apos;m offline this second. Try again shortly, or email hello@savotechnologies.com.
          </p>,
        );
    }
  }

  /* ── Live thread: visitor message ── */
  async function sendLive(e?: FormEvent) {
    e?.preventDefault();
    const clean = input.trim();
    if (!clean || !convToken) return;
    setInput("");
    idRef.current += 1;
    setMessages((m) => [...m, { id: `live-me-${idRef.current}`, side: "user", text: clean, at: Date.now() }]);
    try {
      await fetch(withBasePath("/api/live-chat/message"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: convToken, text: clean }),
      });
    } catch {
      setError("Message may not have sent — check your connection and resend.");
    }
  }

  /* Visitor typing signal (debounced stop) */
  function signalTyping() {
    if (!convToken || phase !== "live") return;
    void fetch(withBasePath("/api/live-chat/typing"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: convToken, typing: true }),
    }).catch(() => undefined);
    if (typingStopRef.current) clearTimeout(typingStopRef.current);
    typingStopRef.current = setTimeout(() => {
      void fetch(withBasePath("/api/live-chat/typing"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: convToken, typing: false }),
      }).catch(() => undefined);
    }, 2500);
  }

  /* ── Pre-chat qualification submit ── */
  const phoneCheck = cCountry && cPhone ? validatePhone(cCountry, cPhone) : null;
  const canSubmitContact =
    cName.trim().length >= 2 &&
    (!session?.phoneRequired || (phoneCheck?.ok === true)) &&
    (!cEmail.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cEmail.trim())) &&
    consent;

  /* Validation with explicit feedback — the visitor always sees exactly
     what's missing instead of a dead button. */
  function contactProblem(): string | null {
    if (cName.trim().length < 2) return "Please share your name so we know who we're talking to.";
    if ((session?.phoneRequired ?? true) && (!cPhone.trim() || !phoneCheck || phoneCheck.ok !== true)) {
      return phoneCheck && !phoneCheck.ok ? phoneCheck.error : "A phone number is needed so the team can reach you if the chat disconnects.";
    }
    if (cEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cEmail.trim())) return "That email address doesn't look right — please check it.";
    if (!consent) return "Please confirm we may contact you about this enquiry.";
    return null;
  }

  async function startLiveChat() {
    if (sending) return;
    const problem = contactProblem();
    if (problem) {
      setError(problem);
      setQStep(5);
      return;
    }
    setSending(true);
    setError(null);
    track("ask_savo_live_request", { offline: !session?.availability.liveChatOpen });
    try {
      const res = await fetch(withBasePath("/api/live-chat/qualify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationToken: convToken,
          name: cName.trim(),
          country: cCountry,
          phone: cPhone.trim() || null,
          email: cEmail.trim() || null,
          service: qService,
          stage: qStage,
          requirement: qRequirement.trim() || null,
          timeline: qTimeline,
          budget: qBudget,
          consent: true,
          offline: !session?.availability.liveChatOpen,
          pageContext: captureContext(),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; conversationToken?: string; status?: string; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Something went wrong — please try again.");
        setSending(false);
        return;
      }
      if (json.conversationToken) setConvToken(json.conversationToken);
      setLiveStatus(json.status ?? "waiting_for_agent");
      setPhase("live");
      sayServer({ kind: "system", body: "Connecting you with the Savo team…" });
    } catch {
      setError("Network problem — please try again.");
    }
    setSending(false);
  }

  /* ── Derived UI state ── */
  const shown = (visible || open) && !dismissed;
  const liveOpen = session?.availability.liveChatOpen ?? false;
  const HUMAN_LABEL = "Talk to a Human"; // always available — offline handled inside the flow
  const isLiveThread = phase === "live" && (liveStatus === "waiting_for_agent" || liveStatus === "active");
  const waiting = liveStatus === "waiting_for_agent";
  const timedOut = liveStatus === "waiting_follow_up" || liveStatus === "visitor_left";
  const activeChat = liveStatus === "active";
  const fresh = phase === "boot" || phase === "welcome" || (phase === "ai" && messages.length === 0 && !typing);

  const placeholder = useMemo(() => {
    if (phase === "ended") return "Start a new conversation — Savo AI is ready…";
    if (phase === "prechat" && qStep === 2) return "Tell us briefly about your project or requirement…";
    if (phase === "live" && activeChat) return "Write to the Savo team…";
    if (phase === "live" && waiting) return "You can write while we connect you…";
    return fresh ? "Ask anything about Savo" : "What else can I help with?";
  }, [phase, qStep, activeChat, waiting, fresh]);
  void liveStatus;

  /* Bar submit */
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!open) {
      void openIt();
      if (input.trim()) {
        const q = input;
        later(async () => {
          setPhase("ai");
          await ask(q);
        }, 250);
      }
      return;
    }
    // Typing at the welcome screen just starts the AI conversation —
    // nobody has to pick a mode first.
    if (phase === "welcome" || phase === "boot") {
      if (input.trim()) {
        setPhase("ai");
        void ask(input);
      } else {
        setPhase("ai");
      }
      return;
    }
    // After an ended chat, typing starts a fresh AI conversation by default.
    if (phase === "ended") {
      beginFreshAi(input);
      return;
    }
    if (phase === "live" && convToken) void sendLive();
    else if (phase === "prechat" && qStep === 2) {
      if (input.trim()) {
        setQRequirement(input.trim());
        sayServer({ kind: "visitor", body: input.trim() });
        setInput("");
        setQStep(3);
      }
    } else {
      void ask(input);
    }
  }

  useEffect(() => {
    if (open && (phase === "prechat" || phase === "live" || phase === "ai")) inputRef.current?.focus();
  }, [open, phase, qStep]);

  /* ─────────────────────────── render ─────────────────────────── */

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div
        ref={frameRef}
        className={cn(
          "pointer-events-auto w-[min(44rem,calc(100%-1.5rem))] rounded-[14px] border border-foreground/10 bg-background p-[7px] shadow-[0_24px_70px_rgb(10_10_14/0.22)] transition-[transform,opacity] duration-500 ease-[var(--ease-out-expo)]",
          shown ? "translate-y-0 opacity-100" : "translate-y-[150%] opacity-0",
        )}
      >
        {/* Conversation window */}
        <div
          id="ask-savo-sheet"
          role="region"
          aria-label="Savo Assistant"
          inert={!open}
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-500 ease-[var(--ease-out-expo)]",
            open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden">
            <div
              className={cn(
                "flex h-[min(78dvh,36rem)] flex-col overflow-hidden rounded-t-[8px] border border-b-0 border-foreground/20 bg-white transition-[transform,opacity] duration-500 ease-[var(--ease-out-expo)] sm:h-[min(72dvh,36rem)]",
                open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
              )}
            >
              {/* Title bar */}
              <div className="flex items-center gap-2 border-b border-foreground/10 px-3 py-2.5 sm:px-4">
                <button
                  onClick={minimize}
                  aria-label="Minimize the Savo Assistant"
                  title="Minimize"
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-[4px] border border-foreground/15 text-muted transition-colors hover:border-accent hover:text-accent"
                >
                  <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                    <path d="M2.5 7h9" />
                  </svg>
                </button>

                <span aria-hidden="true" className="ml-1 flex h-4 w-4 shrink-0 items-center justify-center border border-accent/70">
                  <span className={cn("h-1.5 w-1.5 bg-accent", waiting && "animate-pulse")} />
                </span>
                <p className="t-h4 min-w-0 flex-1 truncate">
                  {isLiveThread ? "Savo Team" : "Ask Savo"}
                  {activeChat ? <span className="t-caption ml-2 text-muted">live</span> : null}
                </p>
                <p className="t-caption hidden shrink-0 text-muted sm:block">
                  {isLiveThread ? (waiting ? "connecting…" : "Savo specialist · live") : "Savo Assistant · instant answers"}
                </p>

                {(phase === "live" || phase === "ai") && (
                  <button
                    onClick={startHuman}
                    className="t-caption mr-1 shrink-0 rounded-[4px] border border-accent/40 px-2.5 py-1.5 text-accent transition-colors hover:border-accent"
                  >
                    {isLiveThread ? "Team" : "Human"}
                  </button>
                )}
                {phase === "live" ? (
                  <button
                    onClick={endChatLocally}
                    title="End this conversation"
                    className="t-caption mr-1 shrink-0 rounded-[4px] border border-foreground/20 px-2.5 py-1.5 text-muted transition-colors hover:border-error hover:text-error"
                  >
                    End
                  </button>
                ) : null}
                <button
                  onClick={newChat}
                  aria-label="Start a new chat"
                  title="New chat"
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-[4px] border border-foreground/15 text-muted transition-colors hover:border-accent hover:text-accent"
                >
                  <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 7A5 5 0 1 1 7 2c1.9 0 3.4 1 4.3 2.4" />
                    <path d="M11.6 1.8v2.8H8.8" />
                  </svg>
                </button>
                <button
                  onClick={closeWindow}
                  aria-label="Close the Savo Assistant"
                  title="Close"
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-[4px] border border-foreground/15 text-muted transition-colors hover:border-accent hover:text-accent"
                >
                  <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                    <path d="M3 3l8 8M11 3l-8 8" />
                  </svg>
                </button>
              </div>

              {/* Thread */}
              {/* data-lenis-prevent: the site's smooth-scroll library hijacks
                  wheel events page-wide — without this the thread can't scroll. */}
              <div ref={threadRef} aria-live="polite" data-lenis-prevent className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain [touch-action:pan-y] px-4 py-4">
                {/* Welcome hero (spec §1) */}
                {phase === "welcome" ? (
                  <div className="pt-2">
                    <p className="t-h4">Ask anything about Savo — or talk to our team now.</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={startAi}
                        className="inline-flex h-10 items-center rounded-[6px] border border-accent/50 bg-accent/[0.06] px-4 t-sm font-semibold text-accent transition-colors hover:border-accent"
                      >
                        Ask Savo AI
                      </button>
                      <button
                        onClick={startHuman}
                        className="inline-flex h-10 items-center rounded-[6px] border border-foreground/20 bg-white px-4 t-sm font-semibold text-foreground/80 transition-colors hover:border-accent hover:text-accent"
                      >
                        {HUMAN_LABEL}
                      </button>
                    </div>
                    <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Quick actions">
                      <li>
                        <Link href="/services" onClick={() => setOpen(false)} className="t-caption inline-block rounded-[4px] border border-foreground/20 px-2.5 py-1.5 text-muted transition-colors hover:border-accent/50 hover:text-foreground">
                          Explore Services
                        </Link>
                      </li>
                      <li>
                        <button onClick={startHuman} className="t-caption rounded-[4px] border border-foreground/20 px-2.5 py-1.5 text-muted transition-colors hover:border-accent/50 hover:text-foreground">
                          Discuss a Project
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => {
                            setPhase("ai");
                            void ask("How much does a project cost?");
                          }}
                          className="t-caption rounded-[4px] border border-foreground/20 px-2.5 py-1.5 text-muted transition-colors hover:border-accent/50 hover:text-foreground"
                        >
                          Estimate a Project
                        </button>
                      </li>
                      <li>
                        <a
                          href={WHATSAPP_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => track("ask_savo_whatsapp")}
                          className="t-caption inline-flex items-center gap-1.5 rounded-[4px] border border-foreground/20 px-2.5 py-1.5 text-muted transition-colors hover:border-accent/50 hover:text-foreground"
                        >
                          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Z" />
                            <path d="M9.3 8.6c.6 2.7 3.4 5.5 6.1 6.1l.9-1.6-2.2-1-.9.8c-1-.5-1.6-1.1-2.1-2.1l.8-.9-1-2.2-1.6.9Z" />
                          </svg>
                          WhatsApp us
                        </a>
                      </li>
                    </ul>
                    <p className="t-caption mt-5 text-muted">
                      {liveOpen
                        ? "Our team is around — type anything for Savo AI, or talk to a human for a live conversation."
                        : "Savo AI answers instantly, 24/7. The team is away right now — the human chat option takes a message and we get back to you."}
                    </p>
                  </div>
                ) : null}

                {messages.map((m) => (
                  <MessageRow key={m.id} msg={m} />
                ))}

                {typing || agentTyping ? (
                  <div className="flex justify-start" aria-label={agentTyping ? "Savo team is typing" : "Savo Assistant is typing"}>
                    <div className="flex gap-1.5 rounded-[6px] border border-foreground/10 bg-surface-2 px-4 py-3.5">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="h-1.5 w-1.5 animate-pulse bg-accent" style={{ animationDelay: `${i * 180}ms` }} />
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Waiting indicator (spec §9) */}
                {waiting ? (
                  <div className="flex items-center gap-2.5 rounded-[6px] border border-foreground/10 bg-surface-2 px-3.5 py-3" role="status">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                    </span>
                    <p className="t-sm text-muted">Connecting you with the Savo team…</p>
                  </div>
                ) : null}

                {/* Timeout → follow-up actions (the situation itself arrives as a
                    message from the server — no duplicated headline). The team
                    owns the thread until it ends; no AI offers mid-human-chat. */}
                {timedOut && phase === "live" ? (
                  <div className="rounded-[6px] border border-foreground/10 bg-surface-2 px-3.5 py-3">
                    <p className="t-caption text-muted">You can leave further messages here — the team reads everything when they reply.</p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      <button
                        onClick={endChatLocally}
                        className="t-caption rounded-[4px] border border-foreground/20 px-2.5 py-1.5 text-muted transition-colors hover:border-accent/40 hover:text-foreground"
                      >
                        End chat
                      </button>
                      <a href="mailto:hello@savotechnologies.com" className="t-caption rounded-[4px] border border-foreground/20 px-2.5 py-1.5 text-muted transition-colors hover:border-accent/50 hover:text-foreground">
                        Email us instead
                      </a>
                    </div>
                  </div>
                ) : null}

                {/* Late accept while the visitor continued with AI (spec §33) */}
                {lateAccept && phase === "ai" && liveStatus === "active" ? (
                  <div className="rounded-[6px] border border-accent/40 bg-accent/[0.05] px-3.5 py-3">
                    <p className="t-sm text-foreground/90">A member of the Savo team is now available. Would you like to switch to live chat?</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setLateAccept(false);
                          setPhase("live");
                          track("ask_savo_live_accepted");
                        }}
                        className="t-caption rounded-[4px] border border-accent/50 bg-accent/[0.06] px-2.5 py-1.5 font-semibold text-accent transition-colors hover:border-accent"
                      >
                        Connect Now
                      </button>
                      <button
                        onClick={() => setLateAccept(false)}
                        className="t-caption rounded-[4px] border border-foreground/20 px-2.5 py-1.5 text-muted transition-colors hover:border-accent/40 hover:text-foreground"
                      >
                        Continue with Savo AI
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Agent asked the visitor to confirm ending (consent flow) */}
                {endRequested && phase === "live" ? (
                  <div className="rounded-[6px] border border-accent/40 bg-accent/[0.05] px-3.5 py-3">
                    <p className="t-sm text-foreground/90">The Savo team asked: is everything resolved? Would you like to end this chat?</p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      <button
                        onClick={() => void answerEndRequest(true)}
                        className="t-caption rounded-[4px] border border-accent/50 bg-accent/[0.06] px-2.5 py-1.5 font-semibold text-accent transition-colors hover:border-accent"
                      >
                        Yes, all resolved — end chat
                      </button>
                      <button
                        onClick={() => void answerEndRequest(false)}
                        className="t-caption rounded-[4px] border border-foreground/20 px-2.5 py-1.5 text-muted transition-colors hover:border-accent/40 hover:text-foreground"
                      >
                        No, keep chatting
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Ended state — history preserved, new help offered */}
                {phase === "ended" ? (
                  <div className="rounded-[6px] border border-foreground/15 bg-surface-2 px-3.5 py-3.5">
                    <p className="t-sm font-semibold text-foreground/90">This conversation has ended.</p>
                    <p className="t-sm mt-1 text-muted">If you need further assistance, message us back — Savo AI is ready 24/7, and the team is one tap away.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => beginFreshAi()}
                        className="t-caption rounded-[4px] border border-accent/50 bg-accent/[0.06] px-2.5 py-1.5 font-semibold text-accent transition-colors hover:border-accent"
                      >
                        Chat with Savo AI
                      </button>
                      <button
                        onClick={beginFreshHuman}
                        className="t-caption rounded-[4px] border border-foreground/20 px-2.5 py-1.5 text-muted transition-colors hover:border-accent/40 hover:text-foreground"
                      >
                        Talk to a Human
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Pre-chat qualification steps (spec §5–7) */}
                {phase === "prechat" ? <QualifyPanel
                  step={qStep}
                  service={qService}
                  stage={qStage}
                  timeline={qTimeline}
                  budget={qBudget}
                  budgets={session?.budgets ?? []}
                  requirement={qRequirement}
                  contact={{ name: cName, country: cCountry, phone: cPhone, email: cEmail, consent }}
                  phoneCheck={phoneCheck?.ok === true}
                  phoneHint={phoneCheck && !phoneCheck.ok ? phoneCheck.error : null}
                  phoneRequired={session?.phoneRequired ?? true}
                  sending={sending}
                  canSubmit={canSubmitContact}
                  error={error}
                  onService={(s) => { setQService(s); setQStep(1); sayServer({ kind: "visitor", body: s }); }}
                  onStage={(s) => { setQStage(s); setQStep(2); sayServer({ kind: "visitor", body: s }); }}
                  onTimeline={(t) => { setQTimeline(t); setQStep(4); sayServer({ kind: "visitor", body: t }); }}
                  onSkipTimeline={() => { setQTimeline(null); setQStep(4); }}
                  onBudget={(b) => { setQBudget(b); setQStep(5); sayServer({ kind: "visitor", body: b }); }}
                  onSkipBudget={() => { setQBudget(null); setQStep(5); }}
                  onContact={{
                    setName: (v) => { setCName(v); if (error) setError(null); },
                    setCountry: (v) => { setCCountry(v); if (error) setError(null); },
                    setPhone: (v) => { setCPhone(v); if (error) setError(null); },
                    setEmail: (v) => { setCEmail(v); if (error) setError(null); },
                    setConsent: (v) => { setConsent(v); if (error) setError(null); },
                  }}
                  onStart={startLiveChat}
                /> : null}
              </div>

              {/* Suggestion chips (AI mode, fresh) */}
              {phase === "ai" && fresh ? (
                <ul className="flex flex-wrap gap-1.5 border-t border-foreground/10 px-4 py-3" aria-label="Suggested questions">
                  {INITIAL_SUGGESTIONS.map((id) => {
                    const e = entryById(id);
                    if (!e) return null;
                    return (
                      <li key={id}>
                        <button
                          onClick={() => ask(e.question)}
                          className="t-caption rounded-[4px] border border-foreground/20 px-2.5 py-1.5 text-muted transition-colors hover:border-accent/50 hover:text-foreground"
                        >
                          {e.question}
                        </button>
                      </li>
                    );
                  })}
                  <li>
                    <button
                      onClick={startHuman}
                      className="t-caption rounded-[4px] border border-accent/40 px-2.5 py-1.5 text-accent transition-colors hover:border-accent"
                    >
                      {HUMAN_LABEL}
                    </button>
                  </li>
                  <li>
                    <a
                      href={WHATSAPP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => track("ask_savo_whatsapp")}
                      className="t-caption rounded-[4px] border border-foreground/20 px-2.5 py-1.5 text-muted transition-colors hover:border-accent/50 hover:text-foreground"
                    >
                      WhatsApp us
                    </a>
                  </li>
                </ul>
              ) : null}
            </div>
          </div>
        </div>

        {/* The bar/composer — always visible, attached below the window */}
        <form
          onSubmit={submit}
          aria-label="Ask Savo"
          className={cn(
            "flex h-14 items-center gap-3 rounded-[8px] border border-foreground/20 bg-white pl-4 pr-2 transition-[border-color,border-radius] duration-500 ease-[var(--ease-out-expo)] focus-within:border-foreground/40",
            open && "rounded-t-none border-t-0",
          )}
        >
                <span aria-hidden="true" className="flex h-4 w-4 shrink-0 items-center justify-center border border-accent/70">
                  <span className={cn("h-1.5 w-1.5 bg-accent", (waiting || typing) && "animate-pulse")} />
                </span>

                <label htmlFor="ask-savo-input" className="sr-only">
                  {isLiveThread ? "Write to the Savo team" : "Ask anything about Savo"}
                </label>
                <input
                  ref={inputRef}
                  id="ask-savo-input"
                  type="text"
                  autoComplete="off"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    signalTyping();
                  }}
                  onFocus={openIt}
                  onClick={openIt}
                  placeholder={placeholder}
                  className="t-sm min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted"
                />

                <button
                  type="submit"
                  aria-label={isLiveThread ? "Send message" : "Ask Savo"}
                  aria-expanded={open}
                  aria-controls="ask-savo-sheet"
                  className="group/btn grid h-9 w-9 shrink-0 place-items-center rounded-[6px] border border-foreground/20 text-muted transition-colors duration-300 ease-[var(--ease-out-expo)] hover:border-accent hover:text-accent"
                >
                  <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3 w-3 transition-transform duration-300 group-hover/btn:-translate-y-[2px]" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M7 13V1M2.5 5.5 7 1l4.5 4.5" />
                  </svg>
                </button>
              </form>
              {error && phase !== "prechat" ? (
                <p role="alert" className="t-caption px-4 pb-3 text-error">
                  {error}
                </p>
              ) : null}
      </div>
    </div>
  );
}

/* ───────────────────────── message row ───────────────────────── */

function MessageRow({ msg }: { msg: ChatMsg }) {
  if (msg.side === "user") {
    return (
      <div className="flex justify-end">
        <p className="t-sm max-w-[85%] rounded-[6px] bg-foreground px-3.5 py-2.5 text-background">{msg.text}</p>
      </div>
    );
  }
  if (msg.side === "assistant") {
    return (
      <div className="flex justify-start">
        <div className="t-sm w-full max-w-[92%] rounded-[6px] border border-foreground/10 bg-surface-2 px-3.5 py-3 text-foreground/90">{msg.node}</div>
      </div>
    );
  }
  if (msg.kind === "system") {
    return (
      <p className="t-caption mx-auto w-fit max-w-[90%] rounded-full border border-foreground/10 bg-surface-2/60 px-3 py-1.5 text-center text-muted" role="status">
        {msg.body}
      </p>
    );
  }
  if (msg.kind === "agent") {
    return (
      <div className="flex justify-start">
        <div>
          <p className="t-caption mb-1 ml-1 text-muted">{msg.senderName ?? "Savo Team"}</p>
          <div className="t-sm max-w-[92%] whitespace-pre-wrap rounded-[6px] border border-accent/25 bg-accent/[0.05] px-3.5 py-2.5 text-foreground/90">{msg.body}</div>
        </div>
      </div>
    );
  }
  // visitor message restored from the server
  return (
    <div className="flex justify-end">
      <p className="t-sm max-w-[85%] rounded-[6px] bg-foreground px-3.5 py-2.5 text-background">{msg.body}</p>
    </div>
  );
}

/* ─────────────────── pre-chat qualification panel ─────────────────── */

type QualifyProps = {
  step: number;
  service: string | null;
  stage: string | null;
  timeline: string | null;
  budget: string | null;
  budgets: string[];
  requirement: string;
  contact: { name: string; country: string; phone: string; email: string; consent: boolean };
  phoneCheck: boolean;
  phoneHint: string | null;
  phoneRequired: boolean;
  sending: boolean;
  canSubmit: boolean;
  error: string | null;
  onService: (s: string) => void;
  onStage: (s: string) => void;
  onTimeline: (s: string) => void;
  onSkipTimeline: () => void;
  onBudget: (s: string) => void;
  onSkipBudget: () => void;
  onContact: {
    setName: (v: string) => void;
    setCountry: (v: string) => void;
    setPhone: (v: string) => void;
    setEmail: (v: string) => void;
    setConsent: (v: boolean) => void;
  };
  onStart: () => void;
};

function Chips({ options, onPick, accentFirst }: { options: string[]; onPick: (o: string) => void; accentFirst?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o, i) => (
        <button
          key={o}
          onClick={() => onPick(o)}
          className={cn(
            "t-caption rounded-[4px] border px-2.5 py-1.5 transition-colors",
            accentFirst && i === 0
              ? "border-accent/40 text-accent hover:border-accent"
              : "border-foreground/20 text-muted hover:border-accent/50 hover:text-foreground",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function QualifyPanel(p: QualifyProps) {
  const rule = COUNTRY_PHONE_RULES[p.contact.country];
  return (
    <div className="rounded-[8px] border border-foreground/15 bg-surface-2/50 p-3.5">
      {/* Q1 — service */}
      {p.step === 0 ? (
        <fieldset>
          <legend className="t-sm mb-2.5 font-semibold text-foreground/90">What would you like to discuss with Savo?</legend>
          <Chips options={SERVICES} onPick={p.onService} />
        </fieldset>
      ) : null}

      {/* Q2 — stage */}
      {p.step === 1 ? (
        <fieldset>
          <legend className="t-sm mb-2.5 font-semibold text-foreground/90">Where are you currently with the project?</legend>
          <Chips options={STAGES} onPick={p.onStage} />
        </fieldset>
      ) : null}

      {/* Q3 — requirement: composer handles free text; hint here */}
      {p.step === 2 ? (
        <p className="t-sm text-muted">Tell us briefly about your project or requirement — type in the box below.</p>
      ) : null}

      {/* Q4 — timeline (optional) */}
      {p.step === 3 ? (
        <fieldset>
          <legend className="t-sm mb-2.5 font-semibold text-foreground/90">When are you hoping to start?</legend>
          <Chips options={TIMELINES} onPick={p.onTimeline} />
          <button onClick={p.onSkipTimeline} className="t-caption mt-2.5 text-muted underline decoration-foreground/20 underline-offset-4 transition-colors hover:text-foreground">
            Skip this question
          </button>
        </fieldset>
      ) : null}

      {/* Q5 — budget (optional) */}
      {p.step === 4 ? (
        <fieldset>
          <legend className="t-sm mb-2.5 font-semibold text-foreground/90">Do you have an approximate budget in mind?</legend>
          <Chips options={p.budgets.length > 0 ? p.budgets : ["Not sure yet", "Prefer to discuss"]} onPick={p.onBudget} />
          <button onClick={p.onSkipBudget} className="t-caption mt-2.5 text-muted underline decoration-foreground/20 underline-offset-4 transition-colors hover:text-foreground">
            Skip this question
          </button>
        </fieldset>
      ) : null}

      {/* Contact + consent (spec §6, §41) */}
      {p.step === 5 ? (
        <div className="space-y-2.5">
          <p className="t-sm font-semibold text-foreground/90">Where can the Savo team reach you?</p>
          <input
            value={p.contact.name}
            onChange={(e) => p.onContact.setName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
            aria-label="Your name"
            className="t-sm w-full rounded-[6px] border border-foreground/20 bg-white px-3 py-2.5 outline-none transition-colors focus:border-accent"
          />
          <div className="flex gap-2">
            <select
              value={p.contact.country}
              onChange={(e) => p.onContact.setCountry(e.target.value)}
              aria-label="Country code"
              className="t-sm w-[9.5rem] shrink-0 rounded-[6px] border border-foreground/20 bg-white px-2 py-2.5 outline-none transition-colors focus:border-accent"
            >
              {CALLBACK_COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {COUNTRY_PHONE_RULES[c].flag} {COUNTRY_PHONE_RULES[c].dial} {c.length > 18 ? `${c.slice(0, 17)}…` : c}
                </option>
              ))}
            </select>
            <input
              value={p.contact.phone}
              onChange={(e) => p.onContact.setPhone(e.target.value)}
              placeholder={p.phoneRequired ? `Phone (${rule ? rule.min === rule.max ? rule.min : `${rule.min}–${rule.max}` : ""} digits)` : "Phone (optional)"}
              inputMode="tel"
              autoComplete="tel-national"
              aria-label="Phone number"
              aria-invalid={!!p.contact.phone && !p.phoneCheck}
              className="t-sm min-w-0 flex-1 rounded-[6px] border border-foreground/20 bg-white px-3 py-2.5 outline-none transition-colors focus:border-accent aria-[invalid=true]:border-error"
            />
          </div>
          <input
            value={p.contact.email}
            onChange={(e) => p.onContact.setEmail(e.target.value)}
            placeholder="Email (optional)"
            type="email"
            autoComplete="email"
            aria-label="Email address, optional"
            className="t-sm w-full rounded-[6px] border border-foreground/20 bg-white px-3 py-2.5 outline-none transition-colors focus:border-accent"
          />
          <label className="t-caption flex cursor-pointer items-start gap-2 text-muted">
            <input
              type="checkbox"
              checked={p.contact.consent}
              onChange={(e) => p.onContact.setConsent(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[var(--accent,#c2410c)]"
            />
            <span>
              By continuing, you agree that Savo may contact you regarding this enquiry.{" "}
              <Link href="/privacy-policy" className="underline decoration-foreground/20 underline-offset-2 hover:text-foreground">
                Privacy Policy
              </Link>
            </span>
          </label>
          <button
            onClick={p.onStart}
            disabled={p.sending}
            className="inline-flex h-10 w-full items-center justify-center rounded-[6px] border border-accent/50 bg-accent/[0.06] px-4 t-sm font-semibold text-accent transition-colors hover:border-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {p.sending ? "Starting live chat…" : "Start Live Chat"}
          </button>
          {p.error ? (
            <p role="alert" className="t-caption text-error">
              {p.error}
            </p>
          ) : null}
          {p.contact.phone && !p.phoneCheck && !p.error ? (
            <p className="t-caption text-error" role="alert">
              {p.phoneHint}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}


/* ─────────────────── rich AI answer (existing grammar) ─────────────────── */

function EntryAnswer({
  entry,
  onAsk,
  onHuman,
}: {
  entry: AssistantEntry;
  onAsk: (q: string) => void;
  onHuman: () => void;
}) {
  const follow = followUps(entry);
  return (
    <div>
      {entry.paragraphs.map((para, i) => (
        <p key={i} className={i > 0 ? "mt-2" : undefined}>
          {para}
        </p>
      ))}
      {entry.links && entry.links.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {entry.links.map((l) => (
            <li key={l.href + l.label}>
              <Link href={l.href} className="t-sm font-semibold text-accent link-underline">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {follow.length > 0 ? (
        <div className="mt-3 border-t border-foreground/10 pt-3">
          <p className="t-caption mb-2 text-muted">What else can I help with?</p>
          <ul className="flex flex-wrap gap-1.5">
            {follow.map((f) => (
              <li key={f.id}>
                <button
                  onClick={() => onAsk(f.question)}
                  className="t-caption rounded-[4px] border border-foreground/20 px-2.5 py-1.5 text-muted transition-colors hover:border-accent/50 hover:text-foreground"
                >
                  {f.question}
                </button>
              </li>
            ))}
            <li>
              <button
                onClick={onHuman}
                className="t-caption rounded-[4px] border border-accent/40 px-2.5 py-1.5 text-accent transition-colors hover:border-accent"
              >
                Talk to a human
              </button>
            </li>
            <li>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("ask_savo_whatsapp")}
                className="t-caption rounded-[4px] border border-foreground/20 px-2.5 py-1.5 text-muted transition-colors hover:border-accent/50 hover:text-foreground"
              >
                WhatsApp us
              </a>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}
