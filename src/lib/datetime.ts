/**
 * IST (Indian Standard Time) date formatting utilities.
 * All timestamps across the admin panel and emails display in IST
 * (Asia/Kolkata, UTC+5:30) regardless of the server's timezone.
 */

const IST = "Asia/Kolkata";

/** Format a date as "26 Sep 2026, 03:45 PM IST" */
export function fmtIST(d: Date | string | null | undefined): string {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    timeZone: IST,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }) + " IST";
}

/** Format a date as "26 Sep 2026" (date only, IST) */
export function fmtISTDate(d: Date | string | null | undefined): string {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    timeZone: IST,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Format a date as "26 Sep 2026, 03:45:12 PM IST" (with seconds) */
export function fmtISTFull(d: Date | string | null | undefined): string {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    timeZone: IST,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }) + " IST";
}

/** Relative time in IST context: "Just now", "5m ago", "2h ago", "3d ago" */
export function fmtRelative(d: Date | string | null | undefined): string {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "-";
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return fmtISTDate(date);
}

/** Today's date in IST as YYYY-MM-DD (for date input min values) */
export function todayIST(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: IST });
}
