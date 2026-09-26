import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { saveSettingsAction } from "./actions";
import { PageHeader, Notice } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/form";
import { FormGuard } from "@/components/admin/form-guard";

export const metadata: Metadata = { title: "Site settings" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; e?: string }>;
}) {
  const [{ saved, e }, settings] = await Promise.all([searchParams, getSettings()]);

  return (
    <div className="max-w-xl">
      <PageHeader
        title="Site settings"
        description="These values override the coded defaults in the footer, contact links and Organization structured data. Saving regenerates public pages."
      />

      {saved ? <Notice>Settings saved. Public pages regenerate on the next request.</Notice> : null}
      {e ? <Notice kind="alert">{decodeURIComponent(e)}</Notice> : null}

      <FormGuard action={saveSettingsAction} className="adm-card space-y-6 p-5 sm:p-6">
        <div>
          <label htmlFor="contactEmail" className="adm-label mb-1.5 block">
            Contact email
          </label>
          <input
            id="contactEmail"
            name="contactEmail"
            type="email"
            required
            maxLength={160}
            defaultValue={settings.contactEmail}
            className="adm-input"
          />
        </div>

        <div>
          <label htmlFor="contactPhone" className="adm-label mb-1.5 block">
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
            className="adm-input"
          />
          <p className="t-caption mt-1.5 text-muted">
            Shown in the footer talk-to-us block, e.g. +91 75029 01234
          </p>
        </div>

        <div>
          <label htmlFor="announcement" className="adm-label mb-1.5 block">
            Announcement line (optional)
          </label>
          <input
            id="announcement"
            name="announcement"
            maxLength={180}
            defaultValue={settings.announcement ?? ""}
            placeholder="e.g. We are speaking at tech events this season - say hello."
            className="adm-input"
          />
          <p className="t-caption mt-1.5 text-muted">
            When set, a slim notice bar renders above the site header on every page. Leave
            empty to hide it.
          </p>
        </div>

        <div className="border-t border-border pt-5">
          <p className="adm-label mb-4">Company impact metrics</p>
          <p className="t-caption mb-4 text-muted">
            Rendered in the homepage impact band and the About facts. Publish only figures you can
            verify (policy §28) - a field left empty keeps the honest pending slot on the live site.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { name: "metricProjects", label: "Projects Delivered", value: settings.metrics.projectsDelivered, ph: "120+" },
              { name: "metricClients", label: "Clients Supported", value: settings.metrics.clientsSupported, ph: "45+" },
              { name: "metricIndustries", label: "Industries Served", value: settings.metrics.industriesServed, ph: "12+" },
              { name: "metricMarkets", label: "Markets Reached", value: settings.metrics.marketsReached, ph: "8+" },
            ].map((m) => (
              <div key={m.name}>
                <label htmlFor={m.name} className="adm-label mb-1.5 block">
                  {m.label}
                </label>
                <input
                  id={m.name}
                  name={m.name}
                  maxLength={12}
                  defaultValue={m.value}
                  placeholder={m.ph}
                  className="adm-input"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-5">
          <SubmitButton label="Save settings" />
        </div>
      </FormGuard>
    </div>
  );
}
