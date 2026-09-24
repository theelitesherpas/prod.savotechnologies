/** Shared industry create/edit fields (no featured flag — services only). */
export function IndustryFields({
  industry,
}: {
  industry?: { title: string; slug: string; summary: string; order: number; active: boolean };
}) {
  const key = industry?.slug ?? "new";
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
            defaultValue={industry?.title}
            className="adm-input"
          />
        </div>
        <div>
          <label htmlFor={`slug-${key}`} className="adm-label mb-1.5 block">
            Slug (/industries/…/)
          </label>
          <input
            id={`slug-${key}`}
            name="slug"
            required
            pattern="[a-z0-9-]+"
            minLength={2}
            maxLength={80}
            defaultValue={industry?.slug}
            className="adm-input font-mono text-[0.8125rem]"
          />
        </div>
      </div>

      <div>
        <label htmlFor={`summary-${key}`} className="adm-label mb-1.5 block">
          Summary (optional)
        </label>
        <textarea
          id={`summary-${key}`}
          name="summary"
          rows={2}
          maxLength={300}
          defaultValue={industry?.summary}
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
            defaultValue={industry?.order ?? 0}
            className="adm-input h-10 w-24"
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 pb-2 text-[0.875rem] font-medium text-foreground">
          <input
            type="checkbox"
            name="active"
            defaultChecked={industry ? industry.active : true}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Published
        </label>
      </div>
    </>
  );
}
