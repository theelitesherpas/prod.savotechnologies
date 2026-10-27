export default function AdminLoading() {
  return (
    <main aria-busy="true" aria-live="polite" className="space-y-6">
      <p className="sr-only">Loading admin page…</p>
      <div className="space-y-3">
        <div className="h-8 w-56 animate-pulse rounded-md bg-foreground/[0.08]" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded bg-foreground/[0.06]" />
      </div>
      <div className="adm-card min-h-40 animate-pulse p-5" />
      <div className="adm-card min-h-64 animate-pulse p-5" />
    </main>
  );
}
