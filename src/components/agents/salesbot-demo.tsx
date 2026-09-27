"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * SalesBot live demo - a conversational console plus the agent's live
 * telemetry: intent per turn, extracted slots, lead score and the final
 * CRM-ready handoff brief. The telemetry panel is the proof this is a
 * running engine, not a scripted chat.
 */

type Turn = { role: "user" | "bot"; text: string };

type DemoState = {
  sessionId: string | null;
  stage: string;
  intent: string;
  slots: { need: string | null; budget: string | null; timeline: string | null; services: string[] };
  score: number;
  label: string;
  suggestions: string[];
  brief: { need: string; services: { title: string; why: string }[]; budget: string; timeline: string; leadLabel: string; summary: string } | null;
};

const STAGE_LABEL: Record<string, string> = {
  greet: "Greeting",
  discover: "Need discovery",
  "qualify-budget": "Budget qualification",
  "qualify-timeline": "Timeline qualification",
  recommend: "Recommendation",
  qna: "Q&A (guarded)",
  brief: "Handoff brief",
};

const INITIAL: DemoState = {
  sessionId: null,
  stage: "greet",
  intent: "-",
  slots: { need: null, budget: null, timeline: null, services: [] },
  score: 0,
  label: "Cold",
  suggestions: ["Hi - what can you do?", "We need a new website", "How does this demo work?"],
  brief: null,
};

export function SalesbotDemo() {
  const [turns, setTurns] = useState<Turn[]>([
    {
      role: "bot",
      text: "SalesBot ready. Say hello, describe what you're looking to build, or ask me anything about Savo - pricing, process, tech, AI. Everything I extract appears live in the agent telemetry on the right.",
    },
  ]);
  const [state, setState] = useState<DemoState>(INITIAL);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [started, setStarted] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, busy]);

  const send = async (raw: string) => {
    const message = raw.trim();
    if (!message || busy) return;
    setBusy(true);
    setStarted(true);
    setTurns((t) => [...t, { role: "user", text: message }]);
    setInput("");
    try {
      const res = await fetch("/api/agents/salesbot/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: state.sessionId, message }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "error");
      await new Promise((r) => setTimeout(r, 320 + Math.random() * 280));
      setTurns((t) => [...t, { role: "bot", text: data.reply }]);
      setState({
        sessionId: data.sessionId,
        stage: data.stage,
        intent: data.intent,
        slots: data.slots,
        score: data.leadScore,
        label: data.leadLabel,
        suggestions: data.suggestions ?? [],
        brief: data.brief ?? null,
      });
    } catch {
      setTurns((t) => [...t, { role: "bot", text: "Something slipped on the wire - try that again." }]);
    } finally {
      setBusy(false);
    }
  };

  const restart = () => {
    setTurns([{ role: "bot", text: "Session cleared. What are you looking to build or solve?" }]);
    setState(INITIAL);
    setStarted(false);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* ── Conversation console ─────────────────────────── */}
      <div className="lg:col-span-7">
        <div className="flex h-[34rem] flex-col overflow-hidden rounded-[2px] border border-border bg-background">
          <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center border border-border bg-ink text-ink-fg">
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 5.5h12v7H9l-3.5 3v-3H4z" />
                </svg>
              </span>
              <div>
                <p className="text-[0.8125rem] font-bold text-foreground">Savo SalesBot · live demo</p>
                <p className="t-caption text-muted">deterministic engine · session {state.sessionId ? state.sessionId.slice(0, 6) : "new"}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={restart}
              className="t-caption rounded-lg border border-border px-2.5 py-1.5 font-semibold text-muted transition-colors hover:border-foreground/40 hover:text-foreground"
            >
              Reset
            </button>
          </div>

          <div ref={logRef} className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5" aria-live="polite">
            {turns.map((t, i) => (
              <div key={i} className={cn("flex", t.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-[4px] px-3.5 py-2.5 text-[0.8438rem] leading-relaxed",
                    t.role === "user"
                      ? "bg-foreground text-background"
                      : "border border-border bg-surface text-foreground/90",
                  )}
                >
                  {t.text}
                </div>
              </div>
            ))}
            {busy ? (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-[4px] border border-border bg-surface px-3.5 py-3">
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" style={{ animationDelay: `${d * 160}ms` }} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {state.suggestions.length > 0 && !busy ? (
            <div className="flex flex-wrap gap-2 border-t border-border px-4 py-2.5">
              {state.suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="t-caption rounded-[2px] border border-border px-2.5 py-1.5 text-muted transition-colors hover:border-accent hover:text-accent"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="flex gap-2 border-t border-border p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe what you're building, or ask about pricing, process, tech…"
              aria-label="Message SalesBot"
              maxLength={1000}
              className="h-11 flex-1 rounded-lg border border-border bg-surface px-3.5 text-[0.875rem] text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-accent px-4 text-[0.8438rem] font-bold text-on-accent transition-colors hover:bg-accent-hover disabled:pointer-events-none disabled:opacity-50"
            >
              Send
              <svg viewBox="0 0 14 14" aria-hidden="true" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* ── Agent telemetry ─────────────────────────────── */}
      <div className="lg:col-span-5">
        <div className="space-y-4">
          <div className="rounded-[2px] border border-border bg-surface p-5">
            <p className="t-label mb-4 text-muted">Agent telemetry · live</p>

            <div className="space-y-3.5 text-[0.8125rem]">
              <Row label="Stage" value={STAGE_LABEL[state.stage] ?? state.stage} mono />
              <Row label="Last intent" value={state.intent} mono />
              <Row
                label="Lead score"
                value={
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-24 overflow-hidden rounded-full bg-border">
                      <span
                        className={cn("block h-full rounded-full transition-all duration-500", state.score >= 70 ? "bg-error" : state.score >= 40 ? "bg-warning" : "bg-muted")}
                        style={{ width: `${state.score}%` }}
                      />
                    </span>
                    <span className="tnum font-mono text-[0.75rem] text-muted">{state.score}/100 · {state.label}</span>
                  </span>
                }
              />
            </div>

            <div className="mt-4 border-t border-border pt-4">
              <p className="t-label mb-2.5 text-muted">Extracted slots</p>
              <dl className="space-y-2 text-[0.8125rem]">
                <Slot k="Need" v={state.slots.need} />
                <Slot k="Budget" v={state.slots.budget} />
                <Slot k="Timeline" v={state.slots.timeline} />
                <div className="flex items-start gap-3">
                  <dt className="w-20 shrink-0 font-mono text-[0.6875rem] uppercase tracking-wider text-muted">Services</dt>
                  <dd className="min-w-0">
                    {state.slots.services.length ? (
                      <span className="flex flex-wrap gap-1.5">
                        {state.slots.services.map((s) => (
                          <span key={s} className="rounded-[2px] border border-accent/40 px-2 py-0.5 text-[0.6875rem] font-semibold text-accent">
                            {s}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="text-muted/60">awaiting input…</span>
                    )}
                  </dd>
                </div>
              </dl>
              {!started ? <p className="t-caption mt-3 text-muted/70">Slots fill as the conversation progresses - watch them change with each message.</p> : null}
            </div>
          </div>

          {state.brief ? (
            <div className="rounded-[2px] border border-accent/40 bg-surface p-5">
              <p className="t-label mb-3 text-accent-strong">CRM handoff brief · generated</p>
              <dl className="space-y-2.5 text-[0.8125rem]">
                <BriefRow k="Need" v={state.brief.need} />
                <div>
                  <dt className="font-mono text-[0.6875rem] uppercase tracking-wider text-muted">Recommended</dt>
                  <dd className="mt-1 space-y-1.5">
                    {state.brief.services.map((s) => (
                      <p key={s.title} className="rounded-[2px] border border-border px-2.5 py-1.5">
                        <span className="font-semibold text-foreground">{s.title}</span>
                        <span className="block text-muted">{s.why}</span>
                      </p>
                    ))}
                  </dd>
                </div>
                <BriefRow k="Budget" v={state.brief.budget} />
                <BriefRow k="Timeline" v={state.brief.timeline} />
                <BriefRow k="Lead" v={`${state.score}/100 · ${state.brief.leadLabel}`} />
              </dl>
              <p className="t-caption mt-3 border-t border-border pt-3 text-muted">{state.brief.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <Link
                  href="/start"
                  className="inline-flex h-10 items-center rounded-lg bg-foreground px-4 text-[0.8438rem] font-bold text-background transition-colors hover:bg-accent hover:text-on-accent"
                >
                  Hand off to a consultant →
                </Link>
                <button
                  type="button"
                  onClick={restart}
                  className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-[0.8438rem] font-semibold text-muted transition-colors hover:border-foreground/40 hover:text-foreground"
                >
                  Run it again
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-[2px] border border-dashed border-border p-5">
              <p className="t-label mb-2 text-muted">Handoff brief</p>
              <p className="t-caption text-muted">
                When qualification completes, SalesBot assembles the structured brief a CRM receives on the live deployment: need, matched services, budget band, timeline and the lead score, with the full transcript attached.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const Row = ({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-muted">{label}</span>
    <span className={cn("min-w-0 truncate font-semibold text-foreground", mono && "font-mono text-[0.75rem]")}>{value}</span>
  </div>
);

const Slot = ({ k, v }: { k: string; v: string | null }) => (
  <div className="flex items-start gap-3">
    <dt className="w-20 shrink-0 font-mono text-[0.6875rem] uppercase tracking-wider text-muted">{k}</dt>
    <dd className={cn("min-w-0 break-words", v ? "text-foreground" : "text-muted/60")}>{v ?? "awaiting input…"}</dd>
  </div>
);

const BriefRow = ({ k, v }: { k: string; v: string }) => (
  <div className="flex items-start gap-3">
    <dt className="w-20 shrink-0 font-mono text-[0.6875rem] uppercase tracking-wider text-muted">{k}</dt>
    <dd className="min-w-0 break-words text-foreground/90">{v}</dd>
  </div>
);
