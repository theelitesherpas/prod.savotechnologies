import Link from "next/link";
import { cn } from "@/lib/utils";
import { AdminIcon, type AdminIconName } from "./icons";
import { ENQUIRY_STATUS_META, type EnquiryStatus } from "@/lib/enquiry-status";

/**
 * Admin presentation primitives — NextAdmin-style operations language:
 * white rounded cards with soft shadows, pill badges with soft tints,
 * modern sans headings, vermilion reserved for primary actions and
 * attention states.
 */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[1.375rem] font-bold leading-tight tracking-[-0.015em] text-foreground">
          {title}
        </h1>
        {description ? <p className="mt-1.5 max-w-2xl text-[0.875rem] leading-relaxed text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatTile({
  label,
  value,
  href,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  href?: string;
  hint?: string;
  icon?: AdminIconName;
  accent?: boolean;
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p
          className={cn(
            "tnum text-[1.875rem] font-bold leading-none tracking-[-0.02em]",
            accent ? "text-accent" : "text-foreground",
          )}
        >
          {value}
        </p>
        {icon ? (
          <span
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              accent ? "bg-accent/10 text-accent" : "bg-foreground/[0.05] text-muted",
            )}
          >
            <AdminIcon name={icon} className="h-5 w-5" />
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-[0.8125rem] font-semibold text-foreground/80">{label}</p>
      {hint ? <p className="mt-0.5 text-[0.75rem] text-muted">{hint}</p> : null}
    </>
  );
  return href ? (
    <Link href={href} className="adm-card block p-5 transition-colors duration-200 hover:border-foreground/25">
      {inner}
    </Link>
  ) : (
    <div className="adm-card p-5">{inner}</div>
  );
}

type ChipTone = "default" | "accent" | "success" | "warning" | "muted";

const chipTones: Record<ChipTone, string> = {
  default: "bg-foreground/[0.06] text-foreground/75",
  accent: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  muted: "bg-foreground/[0.04] text-muted",
};

export function Chip({
  children,
  tone = "default",
  mono = false,
}: {
  children: React.ReactNode;
  tone?: ChipTone;
  mono?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold leading-none",
        mono && "font-mono uppercase tracking-[0.06em]",
        chipTones[tone],
      )}
    >
      {children}
    </span>
  );
}

const enquiryChipTone: Record<EnquiryStatus, ChipTone> = {
  new: "accent",
  in_progress: "default",
  closed: "muted",
  archived: "muted",
};

export function EnquiryStatusChip({ status }: { status: string }) {
  const known = (["new", "in_progress", "closed", "archived"] as const).includes(status as EnquiryStatus);
  if (!known) return <Chip tone="muted">{status}</Chip>;
  const s = status as EnquiryStatus;
  return (
    <Chip tone={enquiryChipTone[s]}>
      <span
        aria-hidden="true"
        className={cn(
          "block h-[6px] w-[6px] rounded-full",
          s === "new" ? "bg-accent" : s === "in_progress" ? "bg-foreground/60" : "bg-muted/70",
        )}
      />
      {ENQUIRY_STATUS_META[s].label}
    </Chip>
  );
}

export function Notice({
  kind = "status",
  children,
}: {
  kind?: "status" | "alert";
  children: React.ReactNode;
}) {
  return (
    <div
      role={kind === "alert" ? "alert" : "status"}
      className={cn(
        "mb-6 flex items-start gap-2.5 rounded-lg border px-4 py-3 text-[0.875rem] font-medium",
        kind === "status"
          ? "border-success/20 bg-success/[0.06] text-foreground/85"
          : "border-error/25 bg-error/[0.05] text-error",
      )}
    >
      <AdminIcon name={kind === "status" ? "check" : "alert"} className={cn("mt-0.5 h-4 w-4 shrink-0", kind === "status" && "text-success")} />
      <span>{children}</span>
    </div>
  );
}

export function EmptyState({
  title,
  message,
  actions,
}: {
  title: string;
  message: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="adm-card px-6 py-14 text-center">
      <span
        aria-hidden="true"
        className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent"
      >
        <AdminIcon name="node" className="h-5 w-5" />
      </span>
      <h2 className="mb-1.5 text-[1.0625rem] font-bold tracking-[-0.01em] text-foreground">{title}</h2>
      <p className="mx-auto mb-6 max-w-md text-[0.875rem] leading-relaxed text-muted">{message}</p>
      {actions ? <div className="flex flex-wrap items-center justify-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** Bordered back-link used above detail pages. */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-5 inline-flex items-center gap-2 text-[0.8125rem] font-semibold text-muted transition-colors hover:text-foreground"
    >
      <AdminIcon name="arrowLeft" className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}

/** Two-step danger zone wrapper. */
export function DangerZone({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-error/25 bg-error/[0.03] p-5">
      <h2 className="mb-3 text-[0.8125rem] font-bold uppercase tracking-[0.04em] text-error">{title}</h2>
      {children}
    </div>
  );
}
