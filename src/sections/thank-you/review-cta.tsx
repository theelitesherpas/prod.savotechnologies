"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics";
import { GOOGLE_REVIEW_URL } from "@/constants/site";

/** The official Google "G" logomark at control scale. */
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

/**
 * The review CTA — opens Google's official review interface in a new tab.
 * Impressions and clicks are tracked; a click is never treated as a
 * published review. Honest invitation: optional, no star preselection,
 * no gating on sentiment.
 */
export function ReviewCta() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let seen = false;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !seen) {
            seen = true;
            track("thank_you_review_impression");
            io.disconnect();
          }
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="mt-10">
      <a
        href={GOOGLE_REVIEW_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("thank_you_review_click")}
        className="group/btn inline-flex h-[3.25rem] max-w-full items-center justify-center gap-3 rounded-[2px] bg-foreground px-7 text-base font-semibold tracking-[-0.01em] text-background transition-colors duration-300 ease-[var(--ease-out-expo)] hover:bg-accent hover:text-on-accent"
      >
        <GoogleMark className="h-[1.15rem] w-[1.15rem] shrink-0" />
        <span>Share your experience on Google</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 14 14"
          className="h-3 w-3 shrink-0 transition-transform duration-300 group-hover/btn:translate-x-[3px] group-hover/btn:-translate-y-[3px]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M4 2h8v8M12 2 2 12" />
        </svg>
      </a>
      <p className="t-caption mt-4 text-muted">
        Your review is completely optional and will open Google&rsquo;s official
        review page in a new tab.
      </p>
    </div>
  );
}
