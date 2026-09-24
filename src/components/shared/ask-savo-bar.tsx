"use client";

import Link from "next/link";
import {
  useEffect,
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
import { useEnquiry } from "@/components/shared/enquiry-dialog";
import { track } from "@/lib/analytics";
import { cn, withBasePath } from "@/lib/utils";

/**
 * Ask Savo — a floating bar pinned to the bottom of every public page that
 * expands in place into the Savo Assistant: clicking (or focusing) the input
 * grows the conversation window directly above the bar, attached, inside a
 * broad glass frame. Deterministic FAQ answers over verified site truth;
 * unmatched questions hand off to a human instead of guessing. Window
 * controls: minimize (collapse), new chat (reset), close (dismiss until the
 * visitor returns to the page top). Clicking outside the frame minimizes
 * the window back to the bar. Book a call / WhatsApp reach humans.
 */

type Message =
  | { kind: "assistant"; id: number; node: ReactNode }
  | { kind: "user"; id: number; text: string };

const WHATSAPP_URL = `https://wa.me/917502901234?text=${encodeURIComponent(
  "Hi Savo! I have a question.",
)}`;

function Greeting() {
  return (
    <>
      <p>Hello: I&apos;m the Savo Assistant.</p>
      <p className="mt-2 text-muted">
        Instant answers about our services, process, offices and careers,
        straight from this site. Ask away, or pick a question:
      </p>
    </>
  );
}

export function AskSavoBar() {
  /* Bar visibility (scroll) + window state */
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  /* Conversation state */
  const [messages, setMessages] = useState<Message[]>(() => [
    { kind: "assistant", id: 0, node: <Greeting /> },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [emailCapture, setEmailCapture] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailState, setEmailState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const threadRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const idRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const { open: openEnquiry } = useEnquiry();

  const later = (fn: () => void, ms: number) => timerRef.current.push(setTimeout(fn, ms));
  const say = (node: ReactNode) =>
    setMessages((m) => [...m, { kind: "assistant", id: ++idRef.current, node }]);

  /* Hysteresis: appear past 140px of scroll, leave near the top. Returning
     to the top also un-dismisses a closed window. */
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

  useEffect(() => () => timerRef.current.forEach(clearTimeout), []);

  /* Esc collapses the window back to the bar */
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

  /* Clicking anywhere outside the assistant frame minimizes it back to the
     bar. The gesture must both start and land outside: a drag that begins
     inside the chat (selecting an answer, say) is ignored when its click
     bubbles from a common ancestor, and a drag that becomes a scroll never
     fires a click at all, so scrolling the page behind it keeps the window
     open. The enquiry drawer overlays the whole page, so clicks inside it
     are left alone. */
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

  /* Keep the thread pinned to the latest message */
  useEffect(() => {
    const el = threadRef.current;
    if (el && open) el.scrollTop = el.scrollHeight;
  }, [messages, typing, emailCapture, open]);

  /* Window controls */
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
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
    idRef.current = 0;
    setTyping(false);
    setEmailCapture(null);
    setEmail("");
    setEmailState("idle");
    setInput("");
    setMessages([{ kind: "assistant", id: 0, node: <Greeting /> }]);
  }
  function openIt() {
    if (!open) {
      track("ask_savo_open", { typed: false });
      setOpen(true);
    }
  }

  /* Asking — chips, Enter, or the bar's first submission */
  function ask(question: string) {
    const clean = question.trim();
    if (!clean || typing) return;
    track("ask_savo_question");
    setMessages((m) => [...m, { kind: "user", id: ++idRef.current, text: clean }]);
    setInput("");
    setEmailCapture(null);
    setTyping(true);

    const delay = 550 + Math.min(clean.length * 8, 450);
    later(() => {
      setTyping(false);
      const entry = answerQuestion(clean);
      if (entry) {
        track("ask_savo_answered", { entry: entry.id });
        say(<EntryAnswer entry={entry} onAsk={ask} />);
      } else {
        say(
          <>
            <p>I don&apos;t have a verified answer for that one yet: I won&apos;t guess.</p>
            <p className="mt-2 text-muted">
              Send it to the team and a senior consultant replies within one business day.
            </p>
          </>,
        );
        setEmailCapture(clean);
      }
    }, delay);
  }

  /* Bar submit: opening with a typed question asks it immediately */
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!open) {
      track("ask_savo_open", { typed: input.trim().length > 0 });
      setOpen(true);
      if (input.trim()) {
        const q = input;
        later(() => ask(q), 250);
      }
      return;
    }
    ask(input);
  }

  /* Human handoff — email capture posts into the enquiry pipeline */
  async function submitEmail(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (emailState === "sending") return;
    setEmailState("sending");
    track("ask_savo_handoff");
    try {
      const res = await fetch(withBasePath("/api/enquiries"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Ask Savo chat",
          email,
          projectType: "Something else",
          message: `${emailCapture ?? "Question from the Ask Savo chat"}, sent from the Savo Assistant.`,
          details: { form: "ask-savo" },
          website: "",
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (res.ok && json.ok) {
        setEmailState("sent");
        say(
          <p>
            Sent. <span className="text-muted">Watch {email}, a reply lands within one business day.</span>
          </p>,
        );
      } else {
        setEmailState("error");
      }
    } catch {
      setEmailState("error");
    }
  }

  const shown = (visible || open) && !dismissed;
  const fresh = messages.length <= 1 && !typing;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[calc(1rem+env(safe-area-inset-bottom))]">
      {/* Broad glass frame, the window and the bar live inside it */}
      <div
        ref={frameRef}
        className={cn(
          "pointer-events-auto w-[min(44rem,calc(100%-1.5rem))] rounded-[14px] border border-foreground/10 bg-background p-[7px] shadow-[0_24px_70px_rgb(10_10_14/0.22)] transition-[transform,opacity] duration-500 ease-[var(--ease-out-expo)]",
          shown ? "translate-y-0 opacity-100" : "translate-y-[150%] opacity-0",
        )}
      >
        {/* Conversation window, grows upward, attached to the bar */}
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
                "flex h-[min(72dvh,36rem)] flex-col overflow-hidden rounded-t-[8px] border border-b-0 border-foreground/20 bg-white transition-[transform,opacity] duration-500 ease-[var(--ease-out-expo)]",
                open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
              )}
            >
              {/* Title bar: minimize · identity · new chat + close */}
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
                  <span className="h-1.5 w-1.5 animate-pulse bg-accent" />
                </span>
                <p className="t-h4 min-w-0 flex-1 truncate">Ask Savo</p>
                <p className="t-caption hidden shrink-0 text-muted sm:block">Savo Assistant · instant answers</p>

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
              <div ref={threadRef} aria-live="polite" className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messages.map((m) =>
                  m.kind === "user" ? (
                    <div key={m.id} className="flex justify-end">
                      <p className="t-sm max-w-[85%] rounded-[6px] bg-foreground px-3.5 py-2.5 text-background">
                        {m.text}
                      </p>
                    </div>
                  ) : (
                    <div key={m.id} className="flex justify-start">
                      <div className="t-sm w-full max-w-[92%] rounded-[6px] border border-foreground/10 bg-surface-2 px-3.5 py-3 text-foreground/90">
                        {m.node}
                      </div>
                    </div>
                  ),
                )}

                {typing ? (
                  <div className="flex justify-start" aria-label="Savo Assistant is typing">
                    <div className="flex gap-1.5 rounded-[6px] border border-foreground/10 bg-surface-2 px-4 py-3.5">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="h-1.5 w-1.5 animate-pulse bg-accent"
                          style={{ animationDelay: `${i * 180}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Email capture for unmatched questions */}
                {emailCapture && emailState !== "sent" ? (
                  <form onSubmit={submitEmail} className="pt-1">
                    <div className="flex items-stretch border-b border-foreground/20 focus-within:border-accent">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        aria-label="Your email for the reply"
                        className="t-sm min-w-0 flex-1 bg-transparent py-2.5 text-foreground outline-none placeholder:text-muted"
                      />
                      <button
                        type="submit"
                        disabled={emailState === "sending"}
                        className="t-sm shrink-0 px-2 font-semibold text-accent transition-colors hover:text-accent-hover disabled:opacity-50"
                      >
                        {emailState === "sending" ? "Sending…" : "Send"}
                      </button>
                    </div>
                    {emailState === "error" ? (
                      <p role="alert" className="t-caption mt-2 text-error">
                        Could not send, try again, or email hello@savotechnologies.com directly.
                      </p>
                    ) : null}
                  </form>
                ) : null}
              </div>

              {/* Human actions, always one tap away */}
              <div className="flex flex-wrap gap-2 border-t border-foreground/10 px-4 py-3">
                <button
                  onClick={() => {
                    track("ask_savo_book_call");
                    openEnquiry("book-a-call");
                  }}
                  className="inline-flex h-9 items-center gap-2 rounded-[6px] border border-foreground/20 bg-white px-3.5 t-sm font-semibold text-foreground/80 transition-colors hover:border-accent hover:text-accent"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6.8 3.8 9 3.2c.7-.2 1.4.2 1.7.9l1 2.4c.2.6.1 1.3-.4 1.7l-1.3 1.2a12.6 12.6 0 0 0 4.6 4.6l1.2-1.3c.4-.5 1.1-.6 1.7-.4l2.4 1c.7.3 1.1 1 .9 1.7l-.6 2.2c-.2.7-.8 1.2-1.5 1.2C11.6 18.4 5.6 12.4 5.6 5.3c0-.7.5-1.3 1.2-1.5Z" />
                  </svg>
                  Book a call
                </button>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track("ask_savo_whatsapp")}
                  className="inline-flex h-9 items-center gap-2 rounded-[6px] border border-foreground/20 bg-white px-3.5 t-sm font-semibold text-foreground/80 transition-colors hover:border-accent hover:text-accent"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Z" />
                    <path d="M9.3 8.6c.6 2.7 3.4 5.5 6.1 6.1l.9-1.6-2.2-1-.9.8c-1-.5-1.6-1.1-2.1-2.1l.8-.9-1-2.2-1.6.9Z" />
                  </svg>
                  WhatsApp us
                </a>
              </div>

              {/* Suggestion chips sit right above the composer */}
              {fresh ? (
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
                      onClick={() => {
                        track("ask_savo_human");
                        openEnquiry("ask-savo", emailCapture ?? undefined);
                      }}
                      className="t-caption rounded-[4px] border border-accent/40 px-2.5 py-1.5 text-accent transition-colors hover:border-accent"
                    >
                      Talk to a human
                    </button>
                  </li>
                </ul>
              ) : null}
            </div>
          </div>
        </div>

        {/* The bar, the chat's composer when open (opens upward, arrow up) */}
        <form
          onSubmit={submit}
          aria-label="Ask Savo"
          className={cn(
            "flex h-14 items-center gap-3 rounded-[8px] border border-foreground/20 bg-white pl-4 pr-2 transition-[border-color,border-radius] duration-500 ease-[var(--ease-out-expo)] focus-within:border-foreground/40",
            open && "rounded-t-none border-t-0",
          )}
        >
          <span aria-hidden="true" className="flex h-4 w-4 shrink-0 items-center justify-center border border-accent/70">
            <span className="h-1.5 w-1.5 animate-pulse bg-accent" />
          </span>

          <label htmlFor="ask-savo-input" className="sr-only">
            Ask anything about Savo
          </label>
          <input
            ref={inputRef}
            id="ask-savo-input"
            type="text"
            autoComplete="off"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={openIt}
            onClick={openIt}
            placeholder={fresh ? "Ask anything about Savo" : "What else can I help with?"}
            className="t-sm min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted"
          />

          <button
            type="submit"
            aria-label="Ask Savo"
            aria-expanded={open}
            aria-controls="ask-savo-sheet"
            className="group/btn grid h-9 w-9 shrink-0 place-items-center rounded-[6px] border border-foreground/20 text-muted transition-colors duration-300 ease-[var(--ease-out-expo)] hover:border-accent hover:text-accent"
          >
            <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3 w-3 transition-transform duration-300 group-hover/btn:-translate-y-[2px]" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M7 13V1M2.5 5.5 7 1l4.5 4.5" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

/* An answer rendered in the thread: paragraphs, links, follow-up chips */
function EntryAnswer({
  entry,
  onAsk,
}: {
  entry: AssistantEntry;
  onAsk: (q: string) => void;
}) {
  const follow = followUps(entry);
  return (
    <div>
      {entry.paragraphs.map((p, i) => (
        <p key={i} className={i > 0 ? "mt-2" : undefined}>
          {p}
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
          </ul>
        </div>
      ) : null}
    </div>
  );
}
