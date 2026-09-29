import type { ServiceDetail } from "@/constants/services-detail";

/* ------------------------------------------------------------------ */
/* Service doodles — the specimen plates that BUILD themselves.        */
/*                                                                     */
/* Each service gets a small staged choreography: the browser frame    */
/* inks in, the menu pops item by item, the hero slides up, text and   */
/* icons land — the craft of the service, performed. Pure CSS          */
/* (stroke draw / pop / grow, pathLength-normalised), staged with      */
/* animation-delay. Reduced motion renders the finished drawing.       */
/* Square nodes, hairlines, one vermilion accent: the house grammar.   */
/* ------------------------------------------------------------------ */

const draw = (d: number) =>
  ({
    className: "sd-draw",
    pathLength: 1,
    style: { animationDelay: `${d}s` },
  }) as const;

const pop = (d: number) =>
  ({
    className: "sd-pop",
    style: { animationDelay: `${d}s` },
  }) as const;

const grow = (d: number) =>
  ({
    className: "sd-grow",
    style: { animationDelay: `${d}s` },
  }) as const;

const flow = (d: number) =>
  ({
    className: "sd-flow",
    style: { animationDelay: `${d}s` },
  }) as const;

const accentPop = (d: number) =>
  ({
    className: "fill-accent stroke-none schem-pulse sd-pop",
    style: { animationDelay: `${d}s` },
  }) as const;

const ARRIVAL = (
  <g aria-hidden="true">
    {/* the ground the commuter rides along */}
    <path d="M8 106h144" {...draw(1.5)} />
    {/* the developer arrives by bicycle, wheels spinning */}
    <g className="sd-ride">
      <g className="sd-wheel">
        <circle cx="18" cy="98" r="8" />
        <path d="M12 98h12M18 92v12" strokeWidth="1" />
      </g>
      <g className="sd-wheel">
        <circle cx="46" cy="98" r="8" />
        <path d="M40 98h12M46 92v12" strokeWidth="1" />
      </g>
      <path d="M18 98l10-16h13l5 16M28 82l6 16" />
      <path d="M41 82l3-9h5" />
      <circle cx="43" cy="60" r="4.5" />
      <path d="M43 65l-6 8M39 67l8 6M37 73l-3 12 7 4" />
    </g>
  </g>
);

const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const };

/* ══ Web: a site assembles itself — frame, logo, menu, hero, sections ══ */
function WebDoodle() {
  return (
    <svg viewBox="0 0 160 120" {...S} aria-hidden="true" className="h-full w-full">
      {ARRIVAL}
      {/* browser frame + toolbar */}
      <rect x="22" y="14" width="116" height="92" {...draw(1.5)} />
      <path d="M22 30h116" {...draw(1.7)} />
      <path d="M28 22h2M35 22h2M42 22h2" strokeWidth={2} {...pop(1.9)} />
      {/* logo + menu items pop in, one by one */}
      <rect x="30" y="37" width="9" height="9" {...pop(2.2)} />
      <path d="M48 39h9M48 44h9" {...pop(2.4)} />
      <path d="M64 39h9M64 44h9" {...pop(2.55)} />
      <path d="M80 39h9M80 44h9" {...pop(2.7)} />
      {/* hero: headline lines slide, image block pops */}
      <path d="M30 60h30" strokeWidth={3} {...draw(3.0)} />
      <path d="M30 69h20" {...draw(3.2)} />
      <rect x="96" y="55" width="30" height="22" {...pop(3.4)} />
      {/* sections below: text lines draw, icons pop */}
      <path d="M30 84h42" {...draw(3.8)} />
      <path d="M30 92h30" {...draw(3.95)} />
      <rect x="108" y="84" width="7" height="7" {...pop(4.2)} />
      <rect x="119" y="84" width="7" height="7" {...pop(4.35)} />
      <rect x="130" y="84" width="7" height="7" {...pop(4.5)} />
      {/* the vermilion moment */}
      <rect x="141" y="16" width="8" height="8" {...accentPop(4.8)} />
    </svg>
  );
}

/* ══ Mobile: phones draw, app grids fill, content flows between ══ */
function MobileDoodle() {
  return (
    <svg viewBox="0 0 160 120" {...S} aria-hidden="true" className="h-full w-full">
      {ARRIVAL}
      <rect x="26" y="18" width="38" height="84" rx="4" {...draw(1.5)} />
      <path d="M26 30h38" {...draw(1.75)} />
      <rect x="32" y="36" width="26" height="16" {...pop(2.1)} />
      {[0, 1, 2].map((r) =>
        [0, 1].map((c) => (
          <rect key={`${r}${c}`} x={32 + c * 14} y={58 + r * 13} width="10" height="10" {...pop(2.3 + (r * 2 + c) * 0.18)} />
        )),
      )}
      <rect x="96" y="26" width="38" height="84" rx="4" {...draw(3.3)} />
      <path d="M96 38h38" {...draw(3.55)} />
      <path d="M102 46h24M102 54h18M102 62h22" {...draw(3.8)} />
      <rect x="102" y="72" width="26" height="14" {...pop(4.2)} />
      <path d="M102 94h16" {...draw(4.4)} />
      {/* sync arrows marching between the pair */}
      <path d="M70 50h20M90 50l-5-4M90 50l-5 4" {...flow(4.6)} />
      <path d="M90 70H70M70 70l5-4M70 70l5 4" {...flow(4.6)} />
      <rect x="139" y="96" width="8" height="8" {...accentPop(5.0)} />
    </svg>
  );
}

/* ══ UI/UX: artboards slide in, the pen draws a curve, swatches pop ══ */
function DesignDoodle() {
  return (
    <svg viewBox="0 0 160 120" {...S} aria-hidden="true" className="h-full w-full">
      {ARRIVAL}
      <rect x="18" y="22" width="60" height="48" {...draw(1.5)} />
      <path d="M30 36h26M30 45h18M30 54h22" {...draw(1.8)} />
      <rect x="84" y="38" width="58" height="48" {...draw(2.4)} />
      <path d="M96 52h28M96 61h18M96 70h24" {...draw(2.7)} />
      {/* the pen tool draws its curve */}
      <path d="M96 96c20-2 30-22 44-40" {...draw(3.3)} />
      <rect x="92" y="92" width="7" height="7" {...pop(4.0)} />
      <rect x="138" y="52" width="7" height="7" {...pop(4.15)} />
      {/* swatches pop, one two three */}
      <rect x="24" y="80" width="10" height="10" {...pop(4.3)} />
      <rect x="40" y="80" width="10" height="10" {...pop(4.45)} />
      <rect x="56" y="80" width="10" height="10" {...pop(4.6)} />
      <rect x="145" y="14" width="8" height="8" {...accentPop(4.9)} />
    </svg>
  );
}

/* ══ Cloud & DevOps: pipeline connects, arrows march, deploy lifts ══ */
function CloudDoodle() {
  return (
    <svg viewBox="0 0 160 120" {...S} aria-hidden="true" className="h-full w-full">
      {ARRIVAL}
      <rect x="20" y="52" width="26" height="26" {...pop(1.5)} />
      <rect x="67" y="52" width="26" height="26" {...pop(1.8)} />
      <rect x="114" y="52" width="26" height="26" {...pop(2.1)} />
      <path d="M46 65h21M93 65h21" {...flow(2.4)} />
      <path d="M33 52V34M33 34l-5 5M33 34l5 5" {...draw(2.9)} />
      <path d="M127 52V34M127 34l-5 5M127 34l5 5" {...draw(3.1)} />
      <path d="M20 92h120" {...draw(3.4)} />
      <path d="M33 78v14M80 78v14M127 78v14" {...draw(3.7)} />
      <path d="M74 46h12M80 46v-8" {...draw(4.2)} />
      <rect x="76" y="18" width="8" height="8" {...accentPop(4.6)} />
    </svg>
  );
}

/* ══ Data: axes draw, bars grow, the trend line rides up ══ */
function DataDoodle() {
  return (
    <svg viewBox="0 0 160 120" {...S} aria-hidden="true" className="h-full w-full">
      {ARRIVAL}
      <path d="M28 18v84h110" {...draw(1.5)} />
      <rect x="40" y="72" width="12" height="30" {...grow(2.0)} />
      <rect x="60" y="58" width="12" height="44" {...grow(2.25)} />
      <rect x="80" y="66" width="12" height="36" {...grow(2.5)} />
      <rect x="100" y="44" width="12" height="58" {...grow(2.75)} />
      <rect x="120" y="52" width="12" height="50" {...grow(3.0)} />
      <path d="M46 62 66 48 86 54 106 32 126 38" {...draw(3.6)} />
      <rect x="102" y="26" width="7" height="7" {...pop(4.3)} />
      <path d="M40 106v4M60 106v4M80 106v4M100 106v4M120 106v4" {...draw(4.4)} />
      <rect x="145" y="18" width="8" height="8" {...accentPop(4.7)} />
    </svg>
  );
}

/* ══ AI Agent: the core wakes, satellites pop, links flow ══ */
function AiDoodle() {
  return (
    <svg viewBox="0 0 160 120" {...S} aria-hidden="true" className="h-full w-full">
      {ARRIVAL}
      <rect x="66" y="48" width="28" height="28" {...pop(1.5)} />
      <rect x="72" y="54" width="16" height="16" {...accentPop(1.9)} />
      <path d="M80 22v26M80 76v26M40 62h26M94 62h26" {...flow(2.3)} />
      <rect x="70" y="10" width="20" height="20" {...pop(2.8)} />
      <rect x="70" y="90" width="20" height="20" {...pop(3.0)} />
      <rect x="18" y="52" width="20" height="20" {...pop(3.2)} />
      <rect x="122" y="52" width="20" height="20" {...pop(3.4)} />
      <path d="M56 44 70 30M56 80l14 14M104 44 90 30M104 80 90 94" {...draw(3.9)} />
      <path d="M46 18h10M46 24h6" {...draw(4.4)} />
      <path d="M112 96h10M112 102h6" {...draw(4.55)} />
    </svg>
  );
}

/* ══ Custom Software: modules assemble into one system ══ */
function SoftwareDoodle() {
  return (
    <svg viewBox="0 0 160 120" {...S} aria-hidden="true" className="h-full w-full">
      {ARRIVAL}
      <rect x="34" y="20" width="22" height="22" {...pop(1.5)} />
      <rect x="104" y="20" width="22" height="22" {...pop(1.7)} />
      <rect x="34" y="78" width="22" height="22" {...pop(1.9)} />
      <rect x="104" y="78" width="22" height="22" {...pop(2.1)} />
      {/* the modules slide toward the core */}
      <path d="M56 31h20M104 31H84" {...flow(2.5)} />
      <path d="M56 89h20M104 89H84" {...flow(2.7)} />
      <path d="M45 42v36M115 42v36" {...draw(3.0)} />
      <rect x="69" y="47" width="22" height="26" {...pop(3.4)} />
      <path d="M74 54h12M74 60h12M74 66h7" {...draw(3.8)} />
      <rect x="145" y="90" width="8" height="8" {...accentPop(4.3)} />
    </svg>
  );
}

/* ══ Digital Marketing & SEO: the query, the results, the rise ══ */
function MarketingDoodle() {
  return (
    <svg viewBox="0 0 160 120" {...S} aria-hidden="true" className="h-full w-full">
      {ARRIVAL}
      {/* search bar draws, magnifier pops */}
      <rect x="22" y="18" width="84" height="16" {...draw(1.5)} />
      <path d="M116 18a10 10 0 1 1-0.1 0Z" {...draw(1.8)} />
      <path d="M124 26l8 8" {...draw(2.1)} />
      {/* results pop in sequence */}
      <rect x="28" y="44" width="52" height="8" {...pop(2.4)} />
      <rect x="28" y="58" width="40" height="8" {...pop(2.6)} />
      <rect x="28" y="72" width="46" height="8" {...pop(2.8)} />
      {/* the audience dots connect to the megaphone */}
      <path d="M96 48l18 8-18 8v-16Z" {...pop(3.3)} />
      <path d="M122 60c4-6 4-14 0-18M128 64c6-8 6-20 0-26" {...draw(3.7)} />
      <path d="M22 106h116" {...draw(4.1)} />
      <path d="M28 102 48 88 68 94 88 78 108 82 128 66" {...draw(4.4)} />
      <rect x="132" y="60" width="8" height="8" {...accentPop(4.9)} />
    </svg>
  );
}

/* ══ QA & Testing: the bug runs, the loupe finds it, the checks land ══ */
function QaDoodle() {
  return (
    <svg viewBox="0 0 160 120" {...S} aria-hidden="true" className="h-full w-full">
      {ARRIVAL}
      {/* the bug scuttles in */}
      <rect x="30" y="26" width="12" height="12" className="sd-crawl" style={{ animationDelay: "0.2s" }} />
      <path d="M30 30l-8-6M30 34l-8 6M42 30l8-6M42 34l8 6" {...draw(1.9)} />
      {/* the loupe draws and finds it */}
      <path d="M96 20a18 18 0 1 1-0.1 0Z" {...draw(2.4)} />
      <path d="M110 34l12 12" strokeWidth={2} {...draw(2.9)} />
      <rect x="30" y="26" width="12" height="12" className="fill-accent stroke-none sd-pop" style={{ animationDelay: "2s" }} />
      {/* checks land one by one */}
      <path d="M24 66l6 6 10-12" strokeWidth={2} {...draw(3.9)} />
      <path d="M24 88l6 6 10-12" strokeWidth={2} {...draw(4.2)} />
      <path d="M52 72h44M52 80h30M52 94h38" {...draw(4.5)} />
      <rect x="132" y="60" width="8" height="8" {...accentPop(5.0)} />
    </svg>
  );
}

/* ══ Product Engineering: the blueprint frames the assembled product ══ */
function ProductDoodle() {
  return (
    <svg viewBox="0 0 160 120" {...S} aria-hidden="true" className="h-full w-full">
      {ARRIVAL}
      <path d="M18 18h124v84H18Z" {...draw(1.5)} />
      <path d="M18 32h124M32 18v84" {...draw(1.75)} />
      {/* parts arrive */}
      <rect x="42" y="42" width="18" height="18" {...pop(2.2)} />
      <path d="M42 48h18M48 42v18" {...draw(2.4)} />
      <rect x="68" y="42" width="18" height="18" {...pop(2.6)} />
      <path d="M68 48h18M74 42v18" {...draw(2.8)} />
      <rect x="94" y="42" width="18" height="18" {...pop(3.0)} />
      <path d="M94 48h18M100 42v18" {...draw(3.2)} />
      {/* they assemble into the product */}
      <path d="M42 72h18M68 72h18M94 72h18" {...draw(3.6)} />
      <rect x="42" y="80" width="70" height="12" {...pop(4.0)} />
      <path d="M120 42v50M120 92l-5-5M120 92l5-5" {...draw(4.4)} />
      <rect x="140" y="20" width="8" height="8" {...accentPop(4.8)} />
    </svg>
  );
}

const DOODLES: Record<ServiceDetail["slug"], () => React.ReactElement> = {
  "web-development": WebDoodle,
  "mobile-app-development": MobileDoodle,
  "ui-ux-design": DesignDoodle,
  "cloud-devops": CloudDoodle,
  "data-analytics": DataDoodle,
  "ai-agent-development": AiDoodle,
  "custom-software-development": SoftwareDoodle,
  "digital-marketing": MarketingDoodle,
  "qa-testing": QaDoodle,
  "product-engineering": ProductDoodle,
};

export function ServiceDoodle({ slug }: { slug: ServiceDetail["slug"] }) {
  const Doodle = DOODLES[slug];
  return Doodle ? <Doodle /> : null;
}
