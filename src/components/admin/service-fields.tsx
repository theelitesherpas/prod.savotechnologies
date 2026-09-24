/**
 * Shared service create/edit fields — plain server-rendered form markup,
 * works without client JavaScript.
 */
export function ServiceFields({
  service,
}: {
  service?: {
    title: string;
    slug: string;
    summary: string;
    order: number;
    featured: boolean;
    active: boolean;
  };
}) {
  const key = service?.slug ?? "new";
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`title-${key}`} className="t-label mb-1 block text-muted">
            Title
          </label>
          <input
            id={`title-${key}`}
            name="title"
            required
            minLength={2}
            maxLength={80}
            defaultValue={service?.title}
            className="h-10 w-full border border-border bg-transparent px-3 text-foreground outline-none focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor={`slug-${key}`} className="t-label mb-1 block text-muted">
            Slug (/services/…/)
          </label>
          <input
            id={`slug-${key}`}
            name="slug"
            required
            pattern="[a-z0-9-]+"
            minLength={2}
            maxLength={80}
            defaultValue={service?.slug}
            className="h-10 w-full border border-border bg-transparent px-3 text-foreground outline-none focus:border-accent"
          />
        </div>
      </div>

      <div>
        <label htmlFor={`summary-${key}`} className="t-label mb-1 block text-muted">
          Summary (optional, for the future services index)
        </label>
        <textarea
          id={`summary-${key}`}
          name="summary"
          rows={2}
          maxLength={300}
          defaultValue={service?.summary}
          className="w-full border border-border bg-transparent p-3 text-foreground outline-none focus:border-accent"
        />
      </div>

      <div className="flex flex-wrap items-end gap-6">
        <div>
          <label htmlFor={`order-${key}`} className="t-label mb-1 block text-muted">
            Order
          </label>
          <input
            id={`order-${key}`}
            name="order"
            type="number"
            min={0}
            max={999}
            defaultValue={service?.order ?? 0}
            className="h-10 w-20 border border-border bg-transparent px-3 text-foreground outline-none focus:border-accent"
          />
        </div>
        <label className="t-sm flex items-center gap-2 text-foreground/80">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={service?.featured ?? false}
            className="h-4 w-4 accent-[#e8490f]"
          />
          Featured
        </label>
        <label className="t-sm flex items-center gap-2 text-foreground/80">
          <input
            type="checkbox"
            name="active"
            defaultChecked={service?.active ?? true}
            className="h-4 w-4 accent-[#e8490f]"
          />
          Active (visible on site)
        </label>
      </div>
    </>
  );
}
