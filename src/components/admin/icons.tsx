/**
 * Admin icon set - hand-authored inline SVG on a 24px grid, 1.5px stroke,
 * square-node grammar (no rounded terminals), matching the site's
 * drawn-infographic language. Server- and client-safe (no hooks).
 */

export type AdminIconName =
  | "gauge"
  | "inbox"
  | "layers"
  | "grid"
  | "pen"
  | "briefcase"
  | "folder"
  | "crew"
  | "chip"
  | "bot"
  | "gear"
  | "userCog"
  | "trail"
  | "chevron"
  | "menu"
  | "close"
  | "external"
  | "arrowLeft"
  | "plus"
  | "search"
  | "trash"
  | "eyeOff"
  | "eye"
  | "up"
  | "down"
  | "import"
  | "check"
  | "alert"
  | "node"
  | "sun"
  | "moon"
  | "user"
  | "trend"
  | "chat";

const PATHS: Record<AdminIconName, React.ReactNode> = {
  gauge: (
    <>
      <path d="M4 13a8 8 0 0 1 16 0" />
      <path d="M12 13l4-4" />
      <path d="M2.5 13h2M19.5 13h2M12 3.5v2" />
    </>
  ),
  inbox: (
    <>
      <path d="M3.5 13v-3.5L7 4h10l3.5 5.5V13" />
      <path d="M3.5 13v5a1.5 1.5 0 0 0 1.5 1.5h14a1.5 1.5 0 0 0 1.5-1.5v-5" />
      <path d="M3.5 13H9l1 2.5h4l1-2.5h5.5" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3.5 20.5 8 12 12.5 3.5 8 12 3.5Z" />
      <path d="m3.5 12.5 8.5 4.5 8.5-4.5" />
      <path d="m3.5 16.5 8.5 4.5 8.5-4.5" />
    </>
  ),
  grid: (
    <>
      <path d="M4 4h6.5v6.5H4V4ZM13.5 4H20v6.5h-6.5V4ZM4 13.5h6.5V20H4v-6.5ZM13.5 13.5H20V20h-6.5v-6.5Z" />
    </>
  ),
  pen: (
    <>
      <path d="m15.5 4.5 4 4L8 20H4v-4L15.5 4.5Z" />
      <path d="m13.5 6.5 4 4" />
    </>
  ),
  briefcase: (
    <>
      <path d="M3.5 8.5h17V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V8.5Z" />
      <path d="M8.5 8.5v-2A1.5 1.5 0 0 1 10 5h4a1.5 1.5 0 0 1 1.5 1.5v2" />
      <path d="M3.5 13h17" />
    </>
  ),
  folder: (
    <>
      <path d="M3.5 6A1.5 1.5 0 0 1 5 4.5h4l2 2.5h8A1.5 1.5 0 0 1 20.5 8.5V18a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18V6Z" />
    </>
  ),
  crew: (
    <>
      <path d="M8.5 11.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M15.5 11.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M3 19c.5-3 2.5-4.5 5.5-4.5S13.5 16 14 19" />
      <path d="M14.5 14.7c2.5.2 4 1.7 4.5 4.3" />
    </>
  ),
  chip: (
    <>
      <path d="M8 8h8v8H8V8Z" />
      <path d="M5 10V8.5A1.5 1.5 0 0 1 6.5 7H8M16 7h1.5A1.5 1.5 0 0 1 19 8.5V10M19 14v1.5a1.5 1.5 0 0 1-1.5 1.5H16M8 17H6.5A1.5 1.5 0 0 1 5 15.5V14" />
      <path d="M10 5V3.5M14 5V3.5M10 20.5V19M14 20.5V19M5 10H3.5M5 14H3.5M20.5 10H19M20.5 14H19" />
    </>
  ),
  bot: (
    <>
      <path d="M7.5 9.5h9a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 17v-6a1.5 1.5 0 0 1 1.5-1.5Z" />
      <path d="M12 6v3.5" />
      <path d="M12 5.5a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z" />
      <path d="M10 13.5v1.5M14 13.5v1.5" />
    </>
  ),
  gear: (
    <>
      <path d="M5 4v16M12 4v16M19 4v16" />
      <path d="M2.5 8.5h5M9.5 14.5h5M16.5 6.5h5" />
    </>
  ),
  userCog: (
    <>
      <path d="M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M3 19.5c.5-3.5 3-5.5 6.5-5.5 1.2 0 2.3.2 3.2.7" />
      <circle cx="17" cy="16" r="3" />
      <path d="M17 12.8v1.1M17 18.1v1.1M13.9 14.7l1 .5M19.1 17.7l1 .5M13.9 19.3l1-.5M19.1 16.3l1-.5" />
    </>
  ),
  trail: (
    <>
      <path d="M4 5v14.5h16" />
      <path d="m7.5 15 3.5-6 3.5 3.5L20 5" />
    </>
  ),
  chevron: <path d="m6 9.5 6 6 6-6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  external: (
    <>
      <path d="M10 5H5v14h14v-5" />
      <path d="M13.5 4.5H20V11" />
      <path d="M20 4.5 11 13.5" />
    </>
  ),
  arrowLeft: <path d="M19 12H5m0 0 6-6m-6 6 6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m15.5 15.5 4.5 4.5" />
    </>
  ),
  trash: (
    <>
      <path d="M4.5 6.5h15" />
      <path d="M8.5 6.5v-1A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5v1" />
      <path d="M6.5 6.5 7.5 19a1.5 1.5 0 0 0 1.5 1.4h6a1.5 1.5 0 0 0 1.5-1.4l1-12.5" />
      <path d="M10 10.5v6M14 10.5v6" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M4 4l16 16" />
      <path d="M10.6 6.3A9.8 9.8 0 0 1 12 6.2c4.5 0 7.9 2.9 9.5 5.8-.5.9-1.2 1.9-2.1 2.8M6.7 8C4.9 9.2 3.6 10.8 2.5 12c1.6 2.9 5 5.8 9.5 5.8 1.3 0 2.5-.2 3.6-.7" />
      <path d="M9.9 10a2.9 2.9 0 0 0 4.1 4.1" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12C4.1 9.1 7.5 6.2 12 6.2s7.9 2.9 9.5 5.8c-1.6 2.9-5 5.8-9.5 5.8s-7.9-2.9-9.5-5.8Z" />
      <circle cx="12" cy="12" r="2.9" />
    </>
  ),
  up: <path d="m12 19-7-7 7-7M12 19V5" />,
  down: <path d="m12 5 7 7-7 7M12 5v14" />,
  import: (
    <>
      <path d="M12 15V3.5M12 15l-4-4M12 15l4-4" />
      <path d="M4.5 15v3A1.5 1.5 0 0 0 6 19.5h12a1.5 1.5 0 0 0 1.5-1.5v-3" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  alert: (
    <>
      <path d="M12 4 2.5 20h19L12 4Z" />
      <path d="M12 10v4.5M12 17.4v.6" />
    </>
  ),
  node: <path d="M5 5h14v14H5z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3 7 7M17 17l1.7 1.7M18.7 5.3 17 7M7 17l-1.7 1.7" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />,
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c.7-3.6 3.6-5.5 7.5-5.5s6.8 1.9 7.5 5.5" />
    </>
  ),
  trend: (
    <>
      <path d="m3.5 17 5.5-6 4 3.5 7.5-8.5" />
      <path d="M15 6h5v5" />
    </>
  ),
  chat: (
    <>
      <path d="M4 5.5h16v11H9l-5 4v-4H4v-11Z" />
      <path d="M8 10h8M8 13h5" />
    </>
  ),
};

export function AdminIcon({ name, className }: { name: AdminIconName; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
    >
      {PATHS[name]}
    </svg>
  );
}
