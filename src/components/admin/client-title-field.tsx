import { CLIENT_TITLES } from "@/lib/client-name";

/** Native, optional selection; no default title or demographic assumptions. */
export function ClientTitleField({ value }: { value?: string | null }) {
  return <div>
    <label className="adm-label mb-1.5 block" htmlFor="cl-title">Title (optional)</label>
    <select id="cl-title" name="title" autoComplete="honorific-prefix" defaultValue={value ?? ""} className="adm-input w-full" aria-describedby="cl-title-help">
      <option value="">No title</option>
      {CLIENT_TITLES.map((title) => <option key={title} value={title}>{title}</option>)}
    </select>
    <p id="cl-title-help" className="t-caption mt-1.5 text-muted">Used in names and greetings. Leave blank if not provided by the client.</p>
  </div>;
}
