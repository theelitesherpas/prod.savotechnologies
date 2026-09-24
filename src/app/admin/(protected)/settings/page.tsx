import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { saveSettingsAction } from "./actions";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; e?: string }>;
}) {
  const [{ saved, e }, settings] = await Promise.all([searchParams, getSettings()]);

  return (
    <div className="max-w-xl">
      <h1 className="t-h3 mb-2">Site settings</h1>
      <p className="t-sm mb-8 text-muted">
        These values override the defaults in the footer, contact links and
        Organization structured data. Saving regenerates public pages.
      </p>

      {saved ? (
        <p role="status" className="t-sm mb-4 border border-border bg-foreground/[0.03] px-3 py-2">
          Settings saved.
        </p>
      ) : null}
      {e ? (
        <p role="alert" className="t-sm mb-4 border border-accent/40 bg-accent/5 px-3 py-2 text-accent">
          {decodeURIComponent(e)}
        </p>
      ) : null}

      <form action={saveSettingsAction} className="space-y-5 border border-border bg-background p-5">
        <div>
          <label htmlFor="contactEmail" className="t-label mb-1 block text-muted">
            Contact email
          </label>
          <input
            id="contactEmail"
            name="contactEmail"
            type="email"
            required
            maxLength={160}
            defaultValue={settings.contactEmail}
            className="h-10 w-full border border-border bg-transparent px-3 text-foreground outline-none focus:border-accent"
          />
        </div>

        <div>
          <label htmlFor="contactPhone" className="t-label mb-1 block text-muted">
            Contact phone (display form)
          </label>
          <input
            id="contactPhone"
            name="contactPhone"
            type="tel"
            required
            minLength={7}
            maxLength={24}
            defaultValue={settings.contactPhone}
            className="h-10 w-full border border-border bg-transparent px-3 text-foreground outline-none focus:border-accent"
          />
          <p className="t-caption mt-1.5 text-muted">
            Shown in the footer talk-to-us block, e.g. +91 75029 01234
          </p>
        </div>

        <button
          type="submit"
          className="h-10 bg-foreground px-5 text-sm font-semibold text-background transition-colors hover:bg-accent hover:text-on-accent"
        >
          Save settings
        </button>
      </form>
    </div>
  );
}
