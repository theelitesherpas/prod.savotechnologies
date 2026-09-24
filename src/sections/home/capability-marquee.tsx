import { MARQUEE_ITEMS } from "@/constants/services";

/** Slow capability divider — an ink strip of what SAVO does (decorative
 * repetition; the accessible source of the same information is the
 * services section). */
export function CapabilityMarquee() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="chapter-ink border-y border-border bg-background py-5" aria-hidden="true">
      <div className="marquee overflow-hidden">
        <div className="marquee-track">
          {[0, 1].map((copy) => (
            <ul
              key={copy}
              aria-hidden={copy === 1}
              className="flex shrink-0 items-center"
            >
              {items.map((item, i) => (
                <li key={`${copy}-${i}`} className="flex items-center">
                  <span
                    className="t-label whitespace-nowrap px-7 text-foreground/85"
                    style={{ letterSpacing: "0.22em" }}
                  >
                    {item}
                  </span>
                  <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-accent/80" />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}
