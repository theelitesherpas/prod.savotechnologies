"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { GOOGLE_REVIEW_URL, SITE } from "@/constants/site";
import { CAREERS_EMAIL } from "@/constants/careers";

/**
 * ReviewInviteModal — the Google review invitation shown on the /thank-you
 * confirmation after a verified submission (contact, careers, project
 * brief, enquiry drawer). The confirmation stays the priority: the
 * invitation opens only after the hero has settled (~2s), once per visitor
 * per session, and closes quietly via Esc, the close control, or a
 * backdrop tap. No "maybe later" nag that implies we'll keep asking.
 *
 * Full dialog idiom of the site (Esc, focus trap, scroll lock, aria-modal),
 * quiet motion, mobile-first panel. Also reusable as a controlled
 * component for meaningful moments (completed projects, support
 * resolutions) that a host surface decides to open.
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function lockScroll(lock: boolean) {
  const root = document.documentElement;
  if (lock) {
    const sw = window.innerWidth - root.clientWidth;
    root.style.overflow = "hidden";
    if (sw > 0) root.style.paddingRight = `${sw}px`;
  } else {
    root.style.overflow = "";
    root.style.paddingRight = "";
  }
}

/** The official Google "G" logomark, used at control scale. */
function GoogleMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 18 18" className={className}>
      <path
        fill="#4285F4"
        d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.4673-.806 5.9564-2.18l-2.9087-2.2581c-.8059.54-1.8368.859-3.0477.859-2.344 0-4.3282-1.5831-5.036-3.7104H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71c-.18-.54-.2823-1.1168-.2823-1.71s.1023-1.17.2823-1.71V4.9582H.9573C.3477 6.1732 0 7.5477 0 9s.3477 2.8268.9573 4.0418L3.964 10.71z"
      />
      <path
        fill="#EA4335"
        d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.426 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29c.7077-2.1273 2.6918-3.7105 5.036-3.7105z"
      />
    </svg>
  );
}

export function ReviewInviteModal({
  open,
  onClose,
  contact,
  journey = "project",
}: {
  open: boolean;
  onClose: () => void;
  /** Journey-specific contact shown in the invitation. Defaults to the
   *  main Savo line; careers contexts pass the HR desk. */
  contact?: { email: string; phone: string; phoneE164: string };
  /** Shapes the first paragraph: clients review working with us,
 *      applicants review their experience with the hiring team. */
  journey?: "careers" | "project";
}) {
  const c = contact ?? {
    email: SITE.email,
    phone: SITE.phone,
    phoneE164: SITE.phoneE164,
  };
  const intro =
    journey === "careers"
      ? "Thank you for applying to Savo Technologies. If you have a couple of minutes, a short Google review about your experience with our hiring team helps other candidates know what to expect. Good or critical, we read every single one."
      : "Thank you for choosing Savo Technologies. If you have a couple of minutes, a Google review in your own words tells other businesses what it's really like to work with us, good or critical. We read every single one.";
  const panelRef = useRef<HTMLDivElement | null>(null);
  /* Portal-mount guard without setState-in-effect: false on the server
     and during hydration, true on the client after mount. */
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!open) return;
    lockScroll(true);
    track("review_invite_open");
    panelRef.current?.querySelector<HTMLElement>("button")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        track("review_invite_dismiss");
        onClose();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      lockScroll(false);
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      inert={!open}
      className={cn(
        "fixed inset-0 z-[110]",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
    >
      {/* Backdrop */}
      <div
        onClick={() => {
          track("review_invite_dismiss");
          onClose();
        }}
        className={cn(
          "absolute inset-0 bg-[rgb(10_10_12/0.55)] backdrop-blur-[3px] transition-opacity duration-500 ease-[var(--ease-out-expo)]",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      {/* Panel */}
      <div className="absolute inset-0 flex items-end justify-center p-4 sm:items-center">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-invite-title"
          aria-describedby="review-invite-body"
          className={cn(
            "max-h-[88dvh] w-full max-w-[28rem] overflow-y-auto border border-border bg-background px-7 py-9 text-foreground shadow-[0_24px_80px_rgb(10_10_14/0.3)] transition-all duration-500 ease-[var(--ease-out-expo)] sm:px-10 sm:py-11",
            open
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-3 scale-[0.97] opacity-0",
          )}
        >
          <div className="flex items-start justify-between gap-6">
            <div aria-hidden="true" className="flex items-center gap-3">
              <span className="h-2 w-2 bg-accent" />
              <span className="t-label text-muted">Your experience matters</span>
            </div>
            <button
              type="button"
              onClick={() => {
                track("review_invite_dismiss");
                onClose();
              }}
              aria-label="Close review invitation"
              className="t-label mt-0.5 shrink-0 border border-border px-3 py-2 text-muted transition-colors hover:border-foreground hover:text-foreground"
            >
              ESC ✕
            </button>
          </div>

          <h2 id="review-invite-title" className="t-h2 mt-6">
            Your experience means a lot to us.
          </h2>
          <div id="review-invite-body" className="mt-4 space-y-4">
            <p className="t-sm text-muted">{intro}</p>
            <p className="t-sm text-muted">
              If anything makes it difficult, we&rsquo;re here for that too.
              The link won&rsquo;t open, you&rsquo;re not sure what to write, or
              you&rsquo;d rather talk to us first: reach out, and someone from
              our team will personally help you through it.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-4">
            <a
              href={GOOGLE_REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("review_invite_accept")}
              className="inline-flex h-[3.25rem] items-center justify-center gap-3 rounded-[2px] bg-foreground px-7 text-base font-semibold tracking-[-0.01em] text-background transition-colors duration-300 ease-[var(--ease-out-expo)] hover:bg-accent hover:text-on-accent"
            >
              <GoogleMark className="h-[1.15rem] w-[1.15rem]" />
              Write a Google Review
              <svg
                aria-hidden="true"
                viewBox="0 0 14 14"
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path d="M4 2h8v8M12 2 2 12" />
              </svg>
            </a>
            <p className="t-caption text-center text-muted">
              Rather talk first?{" "}
              <a
                href={`mailto:${c.email}`}
                className="link-underline font-semibold text-foreground"
              >
                {c.email}
              </a>{" "}
              ·{" "}
              <a
                href={`tel:${c.phoneE164}`}
                className="link-underline font-semibold text-foreground"
              >
                {c.phone}
              </a>
            </p>
            <p className="t-caption text-center text-muted">
              Optional, always. It opens Google&rsquo;s official review page in
              a new tab.
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/**
 * The auto-invitation for the /thank-you page. Opens once, ~2s after a
 * verified submission lands, so the confirmation hero is seen first. The
 * once-per-session guard (sessionStorage) means a refresh or a second
 * submission in the same session never prompts again; the generic state
 * (no verified reference) never prompts at all.
 */
export function ThankYouReviewInvite({
  journey,
}: {
  journey: "careers" | "project" | "generic";
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (journey === "generic") return;
    try {
      if (sessionStorage.getItem("savo_review_invite_shown")) return;
    } catch {
      // Storage unavailable (private mode): still invite, just this once.
    }
    const t = setTimeout(() => {
      setOpen(true);
      try {
        sessionStorage.setItem("savo_review_invite_shown", "1");
      } catch {
        /* best effort */
      }
    }, 2200);
    return () => clearTimeout(t);
  }, [journey]);

  const contact =
    journey === "careers"
      ? { email: CAREERS_EMAIL, phone: SITE.hrPhone, phoneE164: SITE.hrPhoneE164 }
      : undefined;

  return (
    <ReviewInviteModal
      open={open}
      onClose={() => setOpen(false)}
      contact={contact}
      journey={journey === "careers" ? "careers" : "project"}
    />
  );
}
