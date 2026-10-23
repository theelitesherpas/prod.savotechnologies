import type { Metadata } from "next";
import Link from "next/link";
import { openGraphFor } from "@/lib/seo";
import { CAREERS_EMAIL, GENERAL_APPLICATION, roleSlug, toPublicRole } from "@/constants/careers";
import { getManagedRoles } from "@/lib/content-items";
import { ClosingArrow } from "@/components/shared/closing-cta";
import { ApplicationForm } from "@/sections/careers/application-form";
import s from "@/sections/careers/careers.module.css";

const DESCRIPTION = "Introduce yourself to Savo Technologies. Share your skills, experience and the work you want to do.";
export const metadata: Metadata = {
  title: "Apply", description: DESCRIPTION,
  openGraph: openGraphFor({ title: "Apply | Savo Technologies", description: DESCRIPTION, url: "/careers/apply" }),
  robots: { index: false, follow: false },
};
export default async function CareersApplyPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const { role } = await searchParams;
  const roles = await getManagedRoles();
  const publicRoles = roles.map(toPublicRole);
  const requested = typeof role === "string" ? role.replace(/^\/|\/$/g, "") : "";
  const match = publicRoles.find(item => roleSlug(item.title) === requested);
  const initialRole = role === roleSlug(GENERAL_APPLICATION) ? GENERAL_APPLICATION : match?.title ?? GENERAL_APPLICATION;
  if (requested && requested !== roleSlug(GENERAL_APPLICATION) && !match) return <div className={s.page} data-careers-page="apply"><section className={s.applyIntro}><div className={s.rail}><h1>This opening is unavailable.</h1><p>Choose another current opening or send a general application.</p><div className={s.heroActions}><a href="/careers#openings" className={s.primary}>View open roles</a><Link href="/careers/apply?role=general-application" className={s.secondary}>General application</Link></div></div></section></div>;
  return <div className={s.page} data-careers-page="apply">
    <section className={s.applyIntro} aria-labelledby="apply-heading"><div className={s.rail}>
      <a href="/careers#openings" className={s.backLink}><ClosingArrow /> Back to jobs</a>
      <h1 id="apply-heading">Your application.</h1>
      <p>Complete the form below. Review your selected role before submitting.</p>
    </div></section>
    <section className={s.applyBody} aria-label="Your application"><div className={s.rail}><div className={s.applyWorkspace}>
      <div className={s.workspaceBar}><span className={s.workspaceMark} aria-hidden="true">S</span><span>Your application</span><span className={s.path}>/careers/apply</span></div>
      <aside className={s.applySidebar} aria-label="Application guide"><div>
        <nav aria-label="Application sections"><Link href="#your-details"><ClosingArrow /> Your details</Link><Link href="#availability"><ClosingArrow /> Skills & availability</Link><Link href="#your-work"><ClosingArrow /> Your work</Link></nav>
        <h2>Before you send</h2><ul><li>Check your contact details.</li><li>Make shared links accessible.</li><li>Keep confidential work private.</li></ul>
        <h2>Need a hand?</h2><p>Ask HR about the role or your application.</p><a href={`mailto:${CAREERS_EMAIL}`}>{CAREERS_EMAIL}</a>
      </div></aside>
      <div className={s.applyCanvas}><ApplicationForm key={initialRole} initialRole={initialRole} roles={publicRoles} />
        <a href={`mailto:${CAREERS_EMAIL}`} className={s.mobileHelp}>Need help? Email HR</a>
        <noscript><p>JavaScript is needed to submit this form. You can also email HR at <a href={`mailto:${CAREERS_EMAIL}`}>{CAREERS_EMAIL}</a>.</p></noscript>
      </div>
    </div></div></section>
  </div>;
}
