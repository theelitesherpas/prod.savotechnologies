"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The careers specimen - an animated code→UI loop, written in code (no gif).
 * One panel, one thing at a time: careers.js types itself out (writer's
 * rhythm, blinking cursor), holds, then the UI the code produces builds in
 * element by element (maker's rhythm), holds, and the loop restarts.
 *
 * Server-renders the fully written code (SSR/no-JS safe); the loop starts
 * only after mount and is disabled under prefers-reduced-motion.
 */

type Tok = { c?: string; t: string };

const CODE: Tok[][] = [
  [{ c: "text-muted", t: "// savo technologies is hiring" }],
  [
    { c: "text-accent", t: "const " },
    { c: "text-foreground", t: "you" },
    { t: " = {" },
  ],
  [
    { t: "  curious: " },
    { c: "text-accent", t: "true" },
    { t: "," },
  ],
  [
    { t: "  ships: " },
    { c: "text-foreground/85", t: '"weekly"' },
    { t: "," },
  ],
  [
    { t: "  ego: " },
    { c: "text-foreground/85", t: '"checked in"' },
    { t: "," },
  ],
  [{ t: "};" }],
  [],
  [
    { c: "text-accent", t: "if " },
    { t: "(you.curious) {" },
  ],
  [
    { t: "  " },
    { c: "text-accent", t: "const " },
    { t: "status = " },
    { c: "text-accent", t: "await " },
    { t: "join({" },
  ],
  [
    { t: "    team: " },
    { c: "text-foreground/85", t: '"savo"' },
    { t: ", role: ROLES.open," },
  ],
  [
    { t: "    mode: " },
    { c: "text-foreground/85", t: '"remote"' },
    { t: ", you," },
  ],
  [{ t: "  });" }],
  [
    { t: "}" },
    { c: "text-muted", t: "  // it renders →" },
  ],
];

type FlatTok = { c?: string; t: string; line: number; index: number; start: number; end: number };

/* Token boundaries, derived once at module scope (pure data, no render-time mutation) */
const FLAT: FlatTok[] = [];
{
  let pos = 0;
  CODE.forEach((line, li) => {
    line.forEach((tok, ti) => {
      const start = pos;
      pos += tok.t.length;
      FLAT.push({ ...tok, line: li, index: ti, start, end: pos });
    });
  });
}
const LINE_TOKS = CODE.map((_, li) => FLAT.filter((t) => t.line === li));
const TOTAL_CHARS = FLAT.length ? FLAT[FLAT.length - 1].end : 0;

/* Timings (ms) */
const TYPE_STEP = 14;
const CODE_HOLD = 1100;
const RESULT_HOLD = 4600;
const RESTART_HOLD = 600;

type Phase = "code" | "result";

function Cursor() {
  return (
    <span className="ml-0.5 inline-block h-[0.95em] w-[0.55em] translate-y-[0.15em] animate-pulse bg-accent" />
  );
}

export function CodeResultLoop() {
  const [typed, setTyped] = useState(TOTAL_CHARS);
  const [phase, setPhase] = useState<Phase>("code");
  const [cycle, setCycle] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let alive = true;
    const run = () => {
      if (!alive) return;
      // restart: clear the editor and type again
      setPhase("code");
      setTyped(0);
      let n = 0;
      const iv = setInterval(() => {
        if (!alive) {
          clearInterval(iv);
          return;
        }
        n += 1;
        setTyped(n);
        if (n >= TOTAL_CHARS) {
          clearInterval(iv);
          later(() => {
            if (!alive) return;
            setPhase("result");
            setCycle((c) => c + 1); // remount → build-in animations replay
            later(() => {
              if (!alive) return;
              setPhase("code");
              setTyped(TOTAL_CHARS); // show full code briefly before clearing
              later(run, RESTART_HOLD + CODE_HOLD - 200);
            }, RESULT_HOLD);
          }, CODE_HOLD);
        }
      }, TYPE_STEP);
    };
    // first cycle: code is already on screen (SSR), hold, then begin
    later(run, CODE_HOLD);

    return () => {
      alive = false;
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  /* Render the code up to `typed` characters - cursor rides the writing edge */
  const codePane = useMemo(() => {
    const done = typed >= TOTAL_CHARS;
    const cursorTok =
      typed === 0
        ? FLAT[0]
        : (FLAT.find((t) => typed - 1 >= t.start && typed - 1 < t.end) ?? null);

    const lines: ReactNode[] = CODE.map((_, li) => {
      const spans = LINE_TOKS[li].map((tok) => {
        if (typed <= tok.start) return null;
        const slice = tok.t.slice(0, typed - tok.start);
        return (
          <span key={tok.index} className={tok.c}>
            {slice}
            {cursorTok === tok && !done ? <Cursor /> : null}
          </span>
        );
      });
      return (
        <span key={li}>
          {spans}
          {"\n"}
        </span>
      );
    });

    return (
      <>
        {typed === 0 ? <Cursor /> : null}
        {lines}
        {done ? <Cursor /> : null}
      </>
    );
  }, [typed]);

  const showingResult = phase === "result";

  return (
    <div className="blueprint border border-border bg-surface" aria-hidden="true">
      {/* Editor chrome, tabs track the loop */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-baseline gap-5">
          <span
            className={cn(
              "t-label transition-colors duration-300",
              showingResult ? "text-muted" : "text-accent",
            )}
          >
            careers.js
          </span>
          <span
            className={cn(
              "t-label flex items-center gap-2 transition-colors duration-300",
              showingResult ? "text-accent" : "text-muted",
            )}
          >
            <span aria-hidden="true" className={`h-1.5 w-1.5 ${showingResult ? "bg-accent" : "bg-foreground/25"}`} />
            result
          </span>
        </div>
        <span className="t-caption text-muted">{showingResult ? "rendered ui" : "JavaScript"}</span>
      </div>

      {/* One place, one thing at a time */}
      <div className="relative min-h-[24rem]">
        {/* Code pane (in flow, sizes the panel) */}
        <div
          className={cn(
            "transition-[opacity,transform] duration-500 ease-[var(--ease-out-expo)]",
            showingResult && "pointer-events-none absolute inset-0 translate-y-2 opacity-0",
          )}
        >
          <pre className="t-sm overflow-x-auto px-5 py-5 leading-[1.9]">
            <code>{codePane}</code>
          </pre>
        </div>

        {/* Result pane, the UI the code renders, built in element by element */}
        <div
          className={cn(
            "transition-[opacity,transform] duration-500 ease-[var(--ease-out-expo)]",
            showingResult ? "relative opacity-100" : "pointer-events-none absolute inset-0 -translate-y-2 opacity-0",
          )}
        >
          <div className="px-5 py-5" key={cycle}>
            <div className="border border-border bg-surface-2 result-in">
              {/* Window chrome */}
              <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 result-in">
                <span className="flex gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground/25" />
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground/25" />
                  <span className="h-1.5 w-1.5 rounded-full bg-accent/70" />
                </span>
                <span className="t-caption ml-1.5 truncate text-muted">savo/careers/applied</span>
              </div>
              {/* Rendered content */}
              <div className="p-4">
                <div
                  className="flex items-center justify-between gap-3 result-in"
                  style={{ animationDelay: "120ms" }}
                >
                  <span className="flex items-center gap-2.5">
                    <svg viewBox="0 0 14 14" className="h-3.5 w-3.5 text-accent" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 7.5 5.5 11 12 3.5" />
                    </svg>
                    <span className="text-sm font-semibold text-foreground">Application received</span>
                  </span>
                  <span className="t-caption shrink-0 text-muted">you → savo · remote</span>
                </div>

                <ul className="mt-3.5 flex flex-wrap gap-1.5 result-in" style={{ animationDelay: "220ms" }} aria-hidden="true">
                  <li className="t-caption rounded-[2px] border border-border px-2 py-1 text-muted">curious ✓</li>
                  <li className="t-caption rounded-[2px] border border-border px-2 py-1 text-muted">ships weekly</li>
                  <li className="t-caption rounded-[2px] border border-border px-2 py-1 text-muted">ego checked in</li>
                </ul>

                <ol className="mt-4 hidden space-y-2 border-t border-border pt-3.5 sm:block result-in" style={{ animationDelay: "320ms" }}>
                  {["Technical conversation", "Meet the team", "Written offer"].map((step, i) => (
                    <li key={step} className="flex items-center gap-3">
                      <span className={`h-1.5 w-1.5 shrink-0 ${i === 0 ? "bg-accent" : "bg-foreground/25"}`} />
                      <span className="t-sm font-medium text-foreground/85">{step}</span>
                    </li>
                  ))}
                </ol>

                <p className="t-caption mt-4 flex items-center gap-2 border-t border-border pt-3.5 text-muted result-in" style={{ animationDelay: "420ms" }}>
                  <span className="h-1.5 w-1.5 shrink-0 bg-accent" />
                  Personal reply within 2 business days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
