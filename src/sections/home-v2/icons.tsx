/**
 * V2 ICON SET - clean white line icons (24 grid, 1.7 stroke) rendered
 * inside solid accent chips (border-radius 10px), the modern IT-services
 * icon style: red chip, white icon, consistent stroke weight throughout.
 */

export type IconName =
  | "code"
  | "mobile"
  | "layers"
  | "cloud"
  | "chart"
  | "bot"
  | "palette"
  | "megaphone"
  | "shield"
  | "compass"
  | "globe"
  | "spark";

const PATHS: Record<IconName, React.ReactNode> = {
  code: (
    <>
      <path d="M8 6 3 12l5 6" />
      <path d="m16 6 5 6-5 6" />
      <path d="m13.5 4.5-3 15" />
    </>
  ),
  mobile: (
    <>
      <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
      <path d="M10.5 18.5h3" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" />
    </>
  ),
  cloud: (
    <>
      <path d="M17.5 19H7a4.5 4.5 0 0 1-.96-8.9 6 6 0 0 1 11.7 1.4A4 4 0 0 1 17.5 19Z" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="M8 16v-5" />
      <path d="M13 16V8" />
      <path d="M18 16v-8" />
    </>
  ),
  bot: (
    <>
      <rect x="4.5" y="7.5" width="15" height="11" rx="3" />
      <path d="M12 7.5v-3" />
      <circle cx="12" cy="3.5" r="1" />
      <path d="M9 12.5v1.5" />
      <path d="M15 12.5v1.5" />
    </>
  ),
  palette: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18h1.8a2.2 2.2 0 0 0 0-4.4h-1.1a2.3 2.3 0 0 1 0-4.6h3.6A3.7 3.7 0 0 0 20 8.3C20 5.4 16.4 3 12 3Z" />
      <circle cx="7.8" cy="10.2" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="11" cy="7.2" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  megaphone: (
    <>
      <path d="m3 10.5 12.5-5.5v13L3 12.5v-2Z" />
      <path d="M3 10.5h2.5c1 0 1.8.8 1.8 1.8s-.8 1.7-1.8 1.7H3" />
      <path d="m18.5 9 2.5-1v7l-2.5-1" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 5.5v6c0 4.5 3 7.7 7 9.5 4-1.8 7-5 7-9.5v-6L12 3Z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5.2-5.2 2 2-5.2 5.2-2Z" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14.5 14.5 0 0 1 0 18 14.5 14.5 0 0 1 0-18Z" />
    </>
  ),
  spark: (
    <>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
    </>
  ),
};

/** The icon: white line work, sized by the parent chip. */
export function LineIcon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}

/** The chip: solid accent, 10px radius, white icon - their signature style. */
export function IconChip({
  name,
  size = "md",
  className = "",
}: {
  name: IconName;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dims = size === "sm" ? "h-10 w-10" : size === "lg" ? "h-14 w-14" : "h-12 w-12";
  const icon = size === "sm" ? "h-5 w-5" : size === "lg" ? "h-7 w-7" : "h-6 w-6";
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-[10px] bg-[#FF3333] text-white ${dims} ${className}`}
    >
      <LineIcon name={name} className={icon} />
    </span>
  );
}

/** Shared directional controls: the same stroke and grid across the homepage. */
export function ArrowIcon({ size = 16, direction = "right" }: { size?: number; direction?: "right" | "left" }) {
  return <svg aria-hidden="true" viewBox="0 0 14 14" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={direction === "left" ? { transform: "rotate(180deg)" } : undefined}><path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" /></svg>;
}

export function ChevronDownIcon({ size = 16 }: { size?: number }) {
  return <svg aria-hidden="true" viewBox="0 0 14 14" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m3 5 4 4 4-4" /></svg>;
}

/** Map the six service groups to icons. */
export const SERVICE_ICONS: Record<string, IconName> = {
  web: "code",
  mobile: "mobile",
  ai: "bot",
  software: "layers",
  design: "palette",
  growth: "megaphone",
};
