"use client";

type Action = () => Promise<void>;

export function EmployeeSignOut({ action }: { action: Action }) {
  return (
    <form action={action}>
      <button
        type="submit"
        className="inline-flex h-9 items-center rounded-md border border-border px-3.5 text-[0.75rem] font-bold text-muted transition-colors hover:border-foreground/30 hover:text-foreground"
      >
        Sign out
      </button>
    </form>
  );
}
