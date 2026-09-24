import type { Industry } from "@/constants/industries";

/* ------------------------------------------------------------------ */
/* Hand-drawn industry icons — one stroke weight (1.5), 28px grid,    */
/* authored in the same grammar as the service icon set. No fills,    */
/* square nodes where a mark is needed.                               */
/* ------------------------------------------------------------------ */

function IconHealthcare() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 8.5 14 4l10 4.5M5.5 8.5v13M22.5 8.5v13M9.5 12v6M18.5 12v6M5.5 21.5h17" />
      <path d="M9.5 15h9" />
    </svg>
  );
}

function IconFintech() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M11 21V10h11v11zM11 14.5h11" />
      <path d="M14 17.75h.01M17 17.75h.01" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 10v11" strokeLinecap="round" />
      <path d="M4 21.5h20" strokeLinecap="round" />
      <path d="M4.5 7.5 6 4.5l1.5 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconEcommerce() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M5 9h18l-1.5 14h-15L5 9Z" strokeLinejoin="round" />
      <path d="M10 9V7.5a4 4 0 0 1 8 0V9" />
      <path d="M10.5 13.5h7M10.5 17h4" strokeLinecap="round" />
    </svg>
  );
}

function IconLogistics() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2.5 7.5h13v11h-13zM15.5 11h5l4 4v3.5h-9" strokeLinejoin="round" />
      <path d="M2.5 18.5h2M9.5 18.5h2" strokeLinecap="round" />
      <path d="M7.5 21.5a2 2 0 1 0 0-.01M21.5 21.5a2 2 0 1 0 0-.01" />
      <path d="M6 11h6" strokeLinecap="round" />
    </svg>
  );
}

function IconRealEstate() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 24V9l8-5.5L20 9v15" strokeLinejoin="round" />
      <path d="M20 13h4v11H2" strokeLinejoin="round" />
      <path d="M9.5 24v-6h5v6" />
      <path d="M9 12h.01M14.5 12h.01" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconEducation() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 6.5c-2.4-1.9-5.4-2.4-9.5-2V21c4.1-.4 7.1.1 9.5 2 2.4-1.9 5.4-2.4 9.5-2V4.5c-4.1-.4-7.1.1-9.5 2Z" strokeLinejoin="round" />
      <path d="M14 6.5V23" />
      <path d="M7.5 8.5h.01M7.5 12h.01M7.5 15.5h.01" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconTravel() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 14.5 25 6l-6.5 15-2.5-6.5L3 14.5Z" strokeLinejoin="round" />
      <path d="m16 14.5 9-8.5" />
    </svg>
  );
}

function IconManufacturing() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 24V11l6 4v-4l6 4v-4l6 4V6.5h4V24H3Z" strokeLinejoin="round" />
      <path d="M7 20h.01M12 20h.01M17 20h.01M22 11h.01" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconGovernment() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3.5 10.5 14 4l10.5 6.5" strokeLinejoin="round" />
      <path d="M6 10.5v8M11.5 10.5v8M16.5 10.5v8M22 10.5v8" />
      <path d="M4 18.5h20M3 22h22" strokeLinecap="round" />
      <path d="M14 4V2" strokeLinecap="round" />
      <rect x="12.5" y="12" width="3" height="3" />
    </svg>
  );
}

function IconEnergy() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M16.5 2.5 7 15.5h5.5L11 25.5l10-13h-5.5l1-10Z" strokeLinejoin="round" />
      <path d="M3 25.5h22" strokeLinecap="round" />
    </svg>
  );
}

const INDUSTRY_ICONS: Record<Industry["id"], () => React.JSX.Element> = {
  healthcare: IconHealthcare,
  fintech: IconFintech,
  ecommerce: IconEcommerce,
  logistics: IconLogistics,
  "real-estate": IconRealEstate,
  education: IconEducation,
  travel: IconTravel,
  manufacturing: IconManufacturing,
  government: IconGovernment,
  energy: IconEnergy,
};

export function IndustryIcon({ id, className }: { id: Industry["id"]; className?: string }) {
  const Icon = INDUSTRY_ICONS[id];
  return <span className={className}>{Icon ? <Icon /> : null}</span>;
}
