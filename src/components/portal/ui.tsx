import { cn } from "@/lib/utils";

/** Money from minor units (paise/cents) with the invoice currency. */
export function money(minor: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: minor % 100 === 0 ? 0 : 2,
    }).format(minor / 100);
  } catch {
    return `${currency} ${(minor / 100).toFixed(2)}`;
  }
}

const PROJECT_STATUS: Record<string, { label: string; cls: string }> = {
  planning: { label: "Planning", cls: "border-border text-muted" },
  in_progress: { label: "In progress", cls: "border-accent/50 text-accent" },
  review: { label: "In review", cls: "border-foreground/40 text-foreground/80" },
  delivered: { label: "Delivered", cls: "border-[rgb(30_122_63/0.5)] text-[rgb(30_122_63)]" },
  paused: { label: "Paused", cls: "border-border text-muted" },
  cancelled: { label: "Cancelled", cls: "border-border text-muted/60" },
};

const INVOICE_STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "border-border text-muted" },
  sent: { label: "Due", cls: "border-accent/50 text-accent" },
  overdue: { label: "Overdue", cls: "border-[rgb(179_38_30/0.5)] text-[rgb(179_38_30)]" },
  paid: { label: "Paid", cls: "border-[rgb(30_122_63/0.5)] text-[rgb(30_122_63)]" },
  cancelled: { label: "Cancelled", cls: "border-border text-muted/60" },
};

function Chip({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={cn("t-label shrink-0 rounded-[2px] border px-2 py-1", cls)}>{label}</span>
  );
}

export function StatusChip({ status }: { status: string }) {
  const s = PROJECT_STATUS[status] ?? { label: status, cls: "border-border text-muted" };
  return <Chip label={s.label} cls={s.cls} />;
}

export function InvoiceStatusChip({ status }: { status: string }) {
  const s = INVOICE_STATUS[status] ?? { label: status, cls: "border-border text-muted" };
  return <Chip label={s.label} cls={s.cls} />;
}

export function MilestoneChip({ status }: { status: string }) {
  const s =
    status === "done"
      ? { label: "Done", cls: "border-[rgb(30_122_63/0.5)] text-[rgb(30_122_63)]" }
      : status === "in_progress"
        ? { label: "Current", cls: "border-accent/50 text-accent" }
        : { label: "Upcoming", cls: "border-border text-muted" };
  return <Chip label={s.label} cls={s.cls} />;
}

/** Hairline progress rail with the accent fill. */
export function ProgressRail({ value, className }: { value: number; className?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label="Project progress" className={cn("h-1 w-full bg-surface-2", className)}>
      <div className="h-full bg-accent transition-[width] duration-500" style={{ width: `${v}%` }} />
    </div>
  );
}
