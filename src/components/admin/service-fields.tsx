/**
 * Shared service create/edit fields — plain server-rendered form markup
 * in the operations-console control language (boxed adm-* controls).
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
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`title-${key}`} className="adm-label mb-1.5 block">
            Title
          </label>
          <input
            id={`title-${key}`}
            name="title"
            required
            minLength={2}
            maxLength={80}
            defaultValue={service?.title}
            className="adm-input"
          />
        </div>
        <div>
          <label htmlFor={`slug-${key}`} className="adm-label mb-1.5 block">
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
            className="adm-input font-mono text-[0.8125rem]"
          />
        </div>
      </div>

      <div>
        <label htmlFor={`summary-${key}`} className="adm-label mb-1.5 block">
          Summary (optional, for the future services index)
        </label>
        <textarea
          id={`summary-${key}`}
          name="summary"
          rows={2}
          maxLength={300}
          defaultValue={service?.summary}
          className="adm-textarea"
        />
      </div>

      <div className="flex flex-wrap items-end gap-8">
        <div>
          <label htmlFor={`order-${key}`} className="adm-label mb-1.5 block">
            Order
          </label>
          <input
            id={`order-${key}`}
            name="order"
            type="number"
            min={0}
            max={999}
            defaultValue={service?.order ?? 0}
            className="adm-input h-10 w-24"
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 pb-2 text-[0.875rem] font-medium text-foreground">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={service?.featured}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Featured
        </label>
        <label className="flex cursor-pointer items-center gap-2 pb-2 text-[0.875rem] font-medium text-foreground">
          <input
            type="checkbox"
            name="active"
            defaultChecked={service ? service.active : true}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Published
        </label>
      </div>
    </>
  );
}
