import type { Metadata } from "next";
import Link from "next/link";
import { CAREERS_EMAIL, GENERAL_APPLICATION, roleSlug, toPublicRole } from "@/constants/careers";
import { getManagedRoles } from "@/lib/content-items";
import { ClosingArrow } from "@/components/shared/closing-cta";
import { ApplicationForm } from "@/sections/careers/application-form";
import s from "@/sections/careers/careers.module.css";

export const metadata: Metadata = {
  title: "Apply", description: "Introduce yourself to Savo Technologies. Share your skills, experience and the work you want to do.",
  robots: { index: false, follow: false },
};
export default async function CareersApplyPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const { role } = await searchParams;
  const roles = await getManagedRoles();
  const publicRoles = roles.map(toPublicRole);
  const match = publicRoles.find(item => roleSlug(item.title) === (role ?? "").replace(/^\/|\/$/g, ""));
  const initialRole = role === roleSlug(GENERAL_APPLICATION) ? GENERAL_APPLICATION : match?.title;
  return <div className={s.page} data-careers-page="apply">
    <section className={s.applyIntro} aria-labelledby="apply-heading"><div className={s.rail}>
      <Link href="/careers" className={s.backLink}><ClosingArrow /> Back to careers</Link>
      <h1 id="apply-heading">Introduce yourself.</h1>
      <p>{match ? `Apply for ${match.title}. Tell us about your experience and what you would bring to the role.` : "Tell us about your skills and the work you want to do. A short introduction is enough."}</p>
    </div></section>
    <section className={s.applyBody} aria-label="Your application"><div className={s.rail}><div className={s.applyWorkspace}>
      <div className={s.workspaceBar}><span className={s.workspaceMark} aria-hidden="true">S</span><span>Your application</span><span className={s.path}>/careers/apply</span></div>
      <aside className={s.applySidebar} aria-label="Application guide"><div>
        <nav aria-label="Application sections"><Link href="#your-details"><ClosingArrow /> Your details</Link><Link href="#availability"><ClosingArrow /> Skills & availability</Link><Link href="#your-work"><ClosingArrow /> Your work</Link></nav>
        <h2>Before you send</h2><ul><li>Check your contact details.</li><li>Make shared links accessible.</li><li>Keep confidential work private.</li></ul>
        <h2>Need a hand?</h2><p>Ask HR about the role or your application.</p><a href={`mailto:${CAREERS_EMAIL}`}>{CAREERS_EMAIL}</a>
      </div></aside>
      <div className={s.applyCanvas}><ApplicationForm initialRole={initialRole} roles={publicRoles} />
        <noscript><p>JavaScript is needed to submit this form. You can also email HR at <a href={`mailto:${CAREERS_EMAIL}`}>{CAREERS_EMAIL}</a>.</p></noscript>
      </div>
    </div></div></section>
  </div>;
}
