import type { Metadata } from "next";
import Link from "next/link";
import { CAREERS_EMAIL, HIRING_STEPS } from "@/constants/careers";
import { getManagedRoles } from "@/lib/content-items";
import { Reveal } from "@/components/ui/reveal";
import { ApplicationForm } from "@/sections/careers/application-form";

/**
 * Apply - the application form with the role preselected via ?role=slug
 * (version-1 flow). Noindex: applications should enter through the
 * careers page, not search results.
 */

export const metadata: Metadata = {
  title: "Apply",
  description:
    "Apply for a role at Savo Technologies. One form, ten minutes, a personal reply within two business days.",
  robots: { index: false, follow: false },
};

function slugify(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export default async function CareersApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const ROLES = await getManagedRoles();
  const match = ROLES.find((r) => slugify(r.title) === (role ?? "").replace(/^\/|\/$/g, ""));
  const initialRole = match?.title;

  return (
    <>
      <section aria-labelledby="apply-heading" className="relative overflow-hidden">
        <div className="shell pb-16 pt-[calc(var(--nav-h)+4.5rem)] sm:pb-20">
          {/* Index rail */}
          <div aria-hidden="true" className="mb-12 flex items-center gap-4 sm:mb-14">
            <span className="t-label tnum text-muted">
              <Link href="/careers" className="transition-colors hover:text-foreground">
                Careers
              </Link>{" "}
             Apply
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="grid items-end gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <Reveal>
                <h1 id="apply-heading" className="t-dl">
                  {match ? `Apply: ${match.title}` : "Apply to join Savo."}
                </h1>
              </Reveal>
              <Reveal delay={120}>
                <p className="t-body-lg mt-6 max-w-xl text-muted">
                  {match
                    ? `${match.track} · ${match.exp} · ${match.band} · Full time, remote first across India.`
                    : "Pick the role that fits inside the form and tell us about yourself. Ten minutes, one form."}
                </p>
              </Reveal>
            </div>
          </div>

          <div className="mt-14 grid gap-10 lg:grid-cols-12">
            {/* Form */}
            <div className="lg:col-span-7">
              <Reveal delay={160}>
                <div className="border border-border bg-surface p-7 sm:p-10">
                  <ApplicationForm initialRole={initialRole} roles={ROLES} />
                </div>
              </Reveal>
            </div>

            {/* Aside, process + questions */}
            <aside className="lg:col-span-5 lg:pt-1" aria-label="Application process and contact">
              <Reveal delay={220} className="space-y-6">
                <div className="border border-border p-7 sm:p-8">
                  <div className="mb-5 flex items-center gap-3">
                    <span aria-hidden="true" className="h-2 w-2 bg-accent" />
                    <h2 className="t-h4">What happens next</h2>
                  </div>
                  <ol className="divide-y divide-border border-y border-border">
                    {HIRING_STEPS.map((step) => (
                      <li key={step.step} className="flex gap-5 py-4 first:pt-5 last:pb-5">
                        <span className="t-label tnum mt-1 shrink-0 text-accent">{step.step}</span>
                        <div>
                          <p className="t-sm font-semibold text-foreground">{step.title}</p>
                          <p className="t-caption mt-1 leading-relaxed text-muted">{step.text}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="chapter-ink border border-border bg-background p-7 text-foreground sm:p-8">
                  <div className="mb-4 flex items-center gap-3">
                    <span aria-hidden="true" className="h-2 w-2 bg-accent" />
                    <h2 className="t-h4">Questions first?</h2>
                  </div>
                  <p className="t-sm text-muted">
                    Write to{" "}
                    <a
                      href={`mailto:${CAREERS_EMAIL}`}
                      className="link-underline font-semibold text-foreground"
                    >
                      {CAREERS_EMAIL}
                    </a>{" "}
                    and a human replies, usually the same day.
                  </p>
                </div>
              </Reveal>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
