import { requireAdminPage } from "@/lib/permissions";
import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { saveContactHeroAction } from "./actions";
import { ContactHeroForm } from "@/components/admin/contact-hero-form";
import { PageHeader, Notice } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Contact page" };

/**
 * Contact page management - content pieces of /contact that are not
 * collection items. Currently: the hero photo beside "Let's talk about
 * what's next." (SiteSetting-backed with coded fallbacks).
 */
export default async function ContactContentPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; e?: string }>;
}) {
  await requireAdminPage("/admin/content/contact");
  const [{ saved, e }, settings] = await Promise.all([searchParams, getSettings()]);

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Contact page"
        description="Content managed directly on the public contact page. Changes take effect on the next request - the photo is stored with its own content address, so visitors never see a stale crop."
      />

      {saved === "hero" ? <Notice>Contact photo saved. The public contact page regenerates on the next request.</Notice> : null}
      {e ? <Notice kind="alert">{decodeURIComponent(e)}</Notice> : null}

      <section className="adm-card space-y-5 p-5 sm:p-6">
        <div>
          <h2 className="text-[0.9375rem] font-bold text-foreground">Hero photo</h2>
          <p className="t-caption mt-1 text-muted">
            The photo beside “Let’s talk about what’s next.” on /contact. Uploads are cropped
            to the exact display slot (1050 × 600 px); leave the crop tool untouched to keep
            the current photo.
          </p>
        </div>
        <ContactHeroForm
          action={saveContactHeroAction}
          currentImage={settings.contactHeroImage}
          currentAlt={settings.contactHeroAlt}
        />
      </section>
    </div>
  );
}
