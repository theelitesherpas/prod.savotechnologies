import type { ServiceDetail } from "@/constants/services-detail";

/* ------------------------------------------------------------------ */
/* Service schematics — the specimen plates. One authored blueprint    */
/* per service: hairline strokes that ink themselves in on reveal     */
/* (data-draw) and one pulsing accent node — the practice, drawn.      */
/* Square nodes only; the world's own grammar.                         */
/* ------------------------------------------------------------------ */

const draw = { pathLength: 1 } as const;

function WebSchematic() {
  return (
    <svg viewBox="0 0 160 120" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="h-full w-full">
      <rect x="28" y="18" width="104" height="78" data-draw {...draw} />
      <path d="M28 34h104" data-draw {...draw} />
      <path d="M34 24h2M40 24h2M46 24h2" strokeWidth="2" strokeLinecap="round" />
      <path d="M38 46h34M38 56h24" strokeLinecap="round" data-draw {...draw} />
      <rect x="94" y="42" width="30" height="24" data-draw {...draw} />
      <path d="M38 72h52" strokeLinecap="round" data-draw {...draw} />
      <path d="M38 84h40" strokeLinecap="round" data-draw {...draw} />
      <rect x="118" y="76" width="8" height="8" className="fill-accent stroke-none schem-pulse" />
      <path d="M112 80h-16" data-draw {...draw} />
    </svg>
  );
}

function MobileSchematic() {
  return (
    <svg viewBox="0 0 160 120" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="h-full w-full">
      <rect x="34" y="20" width="34" height="72" rx="4" data-draw {...draw} />
      <rect x="92" y="28" width="34" height="72" rx="4" data-draw {...draw} />
      <path d="M44 32h14M102 40h14" strokeLinecap="round" />
      <path d="M42 48h18M42 56h18M42 64h12" strokeLinecap="round" data-draw {...draw} />
      <path d="M100 56h18M100 64h18M100 72h12" strokeLinecap="round" data-draw {...draw} />
      <path d="M70 52h18M88 52l-5-4M88 52l-5 4" strokeLinecap="round" strokeLinejoin="round" data-draw {...draw} />
      <path d="M88 68H70M70 68l5-4M70 68l5 4" strokeLinecap="round" strokeLinejoin="round" data-draw {...draw} />
      <rect x="109" y="76" width="8" height="8" className="fill-accent stroke-none schem-pulse" />
    </svg>
  );
}

function DesignSchematic() {
  return (
    <svg viewBox="0 0 160 120" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="h-full w-full">
      <rect x="24" y="26" width="64" height="52" data-draw {...draw} />
      <rect x="72" y="42" width="64" height="52" data-draw {...draw} />
      <path d="M36 42h28M36 52h20M36 62h24" strokeLinecap="round" data-draw {...draw} />
      <path d="M84 58h28M84 68h18M84 78h22" strokeLinecap="round" data-draw {...draw} />
      <path d="M124 26l8 8-30 30-10 2 2-10 30-30Z" strokeLinejoin="round" data-draw {...draw} />
      <rect x="132" y="20" width="8" height="8" className="fill-accent stroke-none schem-pulse" />
    </svg>
  );
}

function CloudSchematic() {
  return (
    <svg viewBox="0 0 160 120" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="h-full w-full">
      <rect x="24" y="46" width="26" height="26" data-draw {...draw} />
      <rect x="67" y="46" width="26" height="26" data-draw {...draw} />
      <rect x="110" y="46" width="26" height="26" data-draw {...draw} />
      <path d="M50 59h17M93 59h17" data-draw {...draw} />
      <path d="M61 53l6 6-6 6M104 53l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 92h112" strokeLinecap="round" data-draw {...draw} />
      <path d="M123 59V30M123 30l-6 6M123 30l6 6" strokeLinecap="round" strokeLinejoin="round" data-draw {...draw} />
      <rect x="119" y="18" width="8" height="8" className="fill-accent stroke-none schem-pulse" />
    </svg>
  );
}

function DataSchematic() {
  return (
    <svg viewBox="0 0 160 120" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="h-full w-full">
      <path d="M32 20v80h104" strokeLinecap="round" data-draw {...draw} />
      <path d="M46 88V70M62 88V58M78 88V74M94 88V48M110 88V62" data-draw {...draw} />
      <path d="M46 52 66 38 86 44 108 26" strokeLinecap="round" strokeLinejoin="round" data-draw {...draw} />
      <path d="M100 26h8v8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="112" y="18" width="8" height="8" className="fill-accent stroke-none schem-pulse" />
      <path d="M124 88V36M124 36l-4 6M124 36l4 6" strokeLinecap="round" strokeLinejoin="round" data-draw {...draw} />
    </svg>
  );
}

function AiSchematic() {
  return (
    <svg viewBox="0 0 160 120" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="h-full w-full">
      <rect x="68" y="44" width="24" height="24" data-draw {...draw} />
      <rect x="72" y="48" width="16" height="16" className="fill-accent stroke-none schem-pulse" />
      <path d="M80 20v24M80 68v24M44 56h24M92 56h24" data-draw {...draw} />
      <rect x="70" y="8" width="20" height="20" data-draw {...draw} />
      <rect x="70" y="92" width="20" height="20" data-draw {...draw} />
      <rect x="34" y="46" width="20" height="20" data-draw {...draw} />
      <rect x="106" y="46" width="20" height="20" data-draw {...draw} />
      <path d="M132 24l8 8M140 16l-1 11-11 1" strokeLinecap="round" strokeLinejoin="round" data-draw {...draw} />
    </svg>
  );
}

function SoftwareSchematic() {
  return (
    <svg viewBox="0 0 160 120" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="h-full w-full">
      <path d="M80 18 128 40 80 62 32 40 80 18Z" data-draw {...draw} />
      <path d="m32 58 48 22 48-22" data-draw {...draw} />
      <path d="m32 76 48 22 48-22" strokeLinecap="round" data-draw {...draw} />
      <path d="M128 40V58" data-draw {...draw} />
      <rect x="124" y="36" width="8" height="8" className="fill-accent stroke-none schem-pulse" />
      <path d="M104 33l24-11" data-draw {...draw} />
    </svg>
  );
}

function MarketingSchematic() {
  return (
    <svg viewBox="0 0 160 120" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="h-full w-full">
      <rect x="24" y="50" width="20" height="20" data-draw {...draw} />
      <rect x="28" y="54" width="12" height="12" className="fill-accent stroke-none schem-pulse" />
      <path d="M48 60h20" data-draw {...draw} />
      <path d="M72 42v36M72 30v-6M72 96v-6" data-draw {...draw} />
      <path d="M60 30l12-12 12 12M60 90l12 12 12-12" strokeLinecap="round" strokeLinejoin="round" data-draw {...draw} />
      <path d="M84 60h20" data-draw {...draw} />
      <rect x="108" y="46" width="28" height="28" data-draw {...draw} />
      <path d="M116 58h12M116 64h8" strokeLinecap="round" data-draw {...draw} />
    </svg>
  );
}

function QaSchematic() {
  return (
    <svg viewBox="0 0 160 120" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="h-full w-full">
      <path d="M80 16 120 30v30c0 22-17 35-40 44-23-9-40-22-40-44V30L80 16Z" data-draw {...draw} />
      <path d="M62 52l12 12 26-26" strokeLinecap="round" strokeLinejoin="round" data-draw {...draw} />
      <rect x="76" y="76" width="8" height="8" className="fill-accent stroke-none schem-pulse" />
      <path d="M120 44h18M120 56h12" strokeLinecap="round" data-draw {...draw} />
    </svg>
  );
}

function ProductSchematic() {
  return (
    <svg viewBox="0 0 160 120" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="h-full w-full">
      <rect x="20" y="22" width="42" height="34" data-draw {...draw} />
      <rect x="20" y="66" width="42" height="34" data-draw {...draw} />
      <path d="M30 36h22M30 44h14M30 80h22M30 88h14" strokeLinecap="round" data-draw {...draw} />
      <path d="M66 39h24M66 39l-6-5M66 39l-6 5" strokeLinecap="round" strokeLinejoin="round" data-draw {...draw} />
      <path d="M66 83h24M66 83l-6-5M66 83l-6 5" strokeLinecap="round" strokeLinejoin="round" data-draw {...draw} />
      <rect x="96" y="42" width="44" height="36" data-draw {...draw} />
      <rect x="128" y="36" width="8" height="8" className="fill-accent stroke-none schem-pulse" />
      <path d="M104 54h24M104 62h16" strokeLinecap="round" data-draw {...draw} />
    </svg>
  );
}

const SCHEMATICS: Record<ServiceDetail["slug"], () => React.JSX.Element> = {
  "web-development": WebSchematic,
  "mobile-apps": MobileSchematic,
  "ui-ux": DesignSchematic,
  "cloud-devops": CloudSchematic,
  "data-analytics": DataSchematic,
  "ai-agent-development": AiSchematic,
  "custom-software": SoftwareSchematic,
  "digital-marketing": MarketingSchematic,
  "qa-testing": QaSchematic,
  "product-engineering": ProductSchematic,
};

export function ServiceSchematic({ slug }: { slug: ServiceDetail["slug"] }) {
  const Schematic = SCHEMATICS[slug];
  return Schematic ? <Schematic /> : null;
}
