import type { ServiceDetail } from "@/constants/services-detail";

/* ------------------------------------------------------------------ */
/* Service icons - one stroke weight (1.5), 28px grid. The six core    */
/* marks carry over from the homepage set; four new ones extend it.    */
/* ------------------------------------------------------------------ */

function IconWeb() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="5" width="22" height="18" />
      <path d="M3 10h22" />
      <path d="M6.5 7.75h.01M9.5 7.75h.01" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 15h8M7 18.5h5" strokeLinecap="round" />
    </svg>
  );
}

function IconMobile() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="8" y="3" width="12" height="22" rx="2.5" />
      <path d="M12.5 5.75h3" strokeLinecap="round" />
      <path d="M11 11h6M11 14.5h6M11 18h3.5" strokeLinecap="round" />
      <path d="M13 21.75h2" strokeLinecap="round" />
    </svg>
  );
}

function IconDesign() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 24 6.5 15.5 19 3l6 6L13.5 21.5 4 24Z" strokeLinejoin="round" />
      <path d="m15.5 6.5 6 6" />
      <path d="M6.5 15.5 12 21" strokeLinecap="round" />
    </svg>
  );
}

function IconCloud() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M7 20h13a4.5 4.5 0 0 0 .5-8.97A6 6 0 0 0 9 9.5 4.5 4.5 0 0 0 7 20Z" strokeLinejoin="round" />
      <path d="M11 16.5h.01M14 16.5h.01M17 16.5h.01" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconData() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3.5" y="4.5" width="9" height="7" />
      <rect x="15.5" y="4.5" width="9" height="7" />
      <rect x="3.5" y="16.5" width="9" height="7" />
      <rect x="15.5" y="16.5" width="9" height="7" />
      <path d="M6.5 8.5h.01M18.5 8.5h.01M6.5 20.5h.01M18.5 20.5h.01" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconAI() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="11" y="11" width="6" height="6" />
      <path d="M14 3v5M14 20v5M3 14h5M20 14h5" />
      <rect x="11.75" y="3.75" width="4.5" height="4.5" />
      <rect x="11.75" y="19.75" width="4.5" height="4.5" />
      <rect x="3.75" y="11.75" width="4.5" height="4.5" />
      <rect x="19.75" y="11.75" width="4.5" height="4.5" />
    </svg>
  );
}

function IconSoftware() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 4 24 9.5 14 15 4 9.5 14 4Z" />
      <path d="m4 14 10 5.5L24 14" />
      <path d="m4 18.5 10 5.5 10-5.5" strokeLinecap="round" />
    </svg>
  );
}

function IconGrowth() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 24h20" strokeLinecap="round" />
      <path d="M5 19h5v5H5zM12 13h5v11h-5zM19 6h5v18h-5z" />
      <path d="m6 10 6-4 5 3 6-6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.5 3H23v4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconQA() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M5 5l7.5 7.5M5 5v4M5 5h4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m10.5 17.5 5-5" strokeLinecap="round" />
      <rect x="12.5" y="15.5" width="10" height="8" />
      <path d="M12.5 23.5h10" strokeLinecap="round" />
      <path d="M16.5 19.75h.01M18.75 19.75h.01" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconProduct() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3.5" y="3.5" width="9" height="9" />
      <rect x="15.5" y="3.5" width="9" height="9" className="fill-accent" stroke="none" />
      <rect x="3.5" y="15.5" width="9" height="9" />
      <path d="M20 15.5v9M15.5 20h9" strokeLinecap="round" />
    </svg>
  );
}

const SERVICE_ICON_MAP: Record<ServiceDetail["slug"], () => React.JSX.Element> = {
  "web-development": IconWeb,
  "mobile-app-development": IconMobile,
  "ui-ux-design": IconDesign,
  "cloud-devops": IconCloud,
  "data-analytics": IconData,
  "ai-agent-development": IconAI,
  "custom-software-development": IconSoftware,
  "digital-marketing": IconGrowth,
  "qa-testing": IconQA,
  "product-engineering": IconProduct,
};

export function ServiceIcon({
  slug,
  className,
}: {
  slug: ServiceDetail["slug"];
  className?: string;
}) {
  const Icon = SERVICE_ICON_MAP[slug];
  return <span className={className}>{Icon ? <Icon /> : null}</span>;
}
