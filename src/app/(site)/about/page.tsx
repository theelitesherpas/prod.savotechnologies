import type { Metadata } from "next";
import Image from "next/image";
import { absoluteUrl } from "@/lib/env";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/ui/reveal";
import { ImageReveal } from "@/components/ui/image-reveal";
import { DetailCta } from "@/components/shared/detail-cta";
import { OFFICES, SITE } from "@/constants/site";
import { cn, withBasePath } from "@/lib/utils";
import { openGraphFor } from "@/lib/seo";

/**
 * About — version-1 content (story, milestones, values, leadership)
 * rendered in the v6 document language. The team cards carry real
 * portraits; every claim is the company's own published story.
 */

const MILESTONES = [
  { year: "2016", t: "Two engineers, one promise", d: "Savo starts in a Jaipur office with a simple rule: every client talks to the people building their software." },
  { year: "2018", t: "First platform at scale", d: "A logistics platform crosses 5,000 daily users and stays up through its first peak season. The reliability playbook we still use is written that winter." },
  { year: "2020", t: "Remote, fully", d: "We go remote first and turn it into an advantage: senior engineers across India, one delivery standard, zero geography tax on clients." },
  { year: "2022", t: "AI practice begins", d: "The first production copilot ships for a healthcare client and deflects 70% of tier 1 queries. AI becomes a practice, not a pitch." },
  { year: "2024", t: "Across three regions", d: "Wallets in the GCC, banking dashboards in the UK, education for 200,000 students in India. Same model: matched in 48 hours, two week trial." },
  { year: "2026", t: "Still accountable", d: "Forty people, ten industries, one rule unchanged: you always know exactly who is building your software and why." },
];

const VALUES = [
  { t: "Say the hard thing early", d: "Bad news travels fastest here. A risk named in week one is a plan; the same risk named at launch is an apology." },
  { t: "Own the outcome", d: "We do not hand over code and disappear. We ship outcomes and stay reachable while they prove themselves." },
  { t: "Write it down", d: "Decisions live in documents, not memories. Every project can survive a team change without drama." },
  { t: "Boring where it counts", d: "Proven technology for the load bearing walls. Innovation budget spent where users can feel it." },
  { t: "Teach the client", d: "Success means you understand your system deeply enough to leave us. Most stay anyway, which is the point." },
  { t: "Craft is respect", d: "Accessible, fast, documented software is how we respect the people who use it and the ones who maintain it." },
];

const LEADERSHIP = [
  { name: "Aarav Mehta", role: "Founder & CEO", bio: "Ex fintech architect. Still reviews every proposal personally.", img: "/images/team/aarav.webp", in: "aarav-mehta", mail: "aarav@savotechnologies.com" },
  { name: "Priya Nair", role: "Head of Engineering", bio: "Runs the delivery standard. Has shipped platforms in all three regions we serve.", img: "/images/team/priya.webp", in: "priya-nair", mail: "priya@savotechnologies.com" },
  { name: "Rohan Desai", role: "Head of AI", bio: "Built our first production copilot. Believes guardrails are a feature, not a limit.", img: "/images/team/rohan.webp", in: "rohan-desai", mail: "rohan@savotechnologies.com" },
  { name: "Sara Khan", role: "Head of Design", bio: "Champions WCAG AA and research led product design across every engagement.", img: "/images/team/sara.webp", in: "sara-khan", mail: "sara@savotechnologies.com" },
];

const FACTS = [
  { v: "40+", l: "people" },
  { v: "200+", l: "projects shipped" },
  { v: "3", l: "regions served" },
  { v: "92%", l: "client retention" },
];

const DESCRIPTION = `About Savo Technologies: one accountable team engineering AI agents, web platforms and mobile apps since 2016. Our story, values, leadership and how we work.`;

export const metadata: Metadata = {
  title: "About Us",
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: openGraphFor({ title: "About Us | Savo Technologies", description: DESCRIPTION, url: "/about" }),
};

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": absoluteUrl("/about/#webpage"),
        url: absoluteUrl("/about"),
        name: "About Us | Savo Technologies",
        description: DESCRIPTION,
        isPartOf: { "@id": absoluteUrl("/#website") },
        about: { "@id": absoluteUrl("/#organization") },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "About", item: absoluteUrl("/about") },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ---------- Hero: the story ---------- */}
      <section aria-labelledby="about-heading" className="relative overflow-hidden">
        <div className="shell pb-20 pt-[calc(var(--nav-h)+4.5rem)] sm:pb-24">
          <div aria-hidden="true" className="mb-12 flex items-center gap-4 sm:mb-16">
            <span className="h-2 w-2 shrink-0 bg-accent" />
            <span className="t-label text-muted">About</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="grid items-end gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7">
              <Reveal>
                <h1 id="about-heading" className="t-statement max-w-[15ch]">
                  One team, accountable since 2016
                  <span aria-hidden="true" className="text-accent">.</span>
                </h1>
              </Reveal>
              <Reveal delay={120}>
                <p className="t-body-lg mt-8 max-w-xl text-muted">
                  {SITE.name} is forty engineers, designers and consultants
                  who believe software outsourcing should feel like an
                  in-house team that simply never sleeps.
                </p>
              </Reveal>
              <Reveal delay={200}>
                <p className="t-body mt-6 max-w-xl text-muted">
                  Savo Technologies, also known as Savo, is a software
                  development and technology company based in Indore, Madhya
                  Pradesh, India. The incorporated company operates as Savo
                  Technologies Private Limited. Ten years on, the founding rule
                  still holds: every engagement starts with a senior consultant,
                  every architecture is reviewed by a lead, and every client can
                  name the engineer who wrote the code they depend on.
                </p>
              </Reveal>
              <Reveal delay={260}>
                <dl className="mt-10 grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
                  {FACTS.map((f) => (
                    <div key={f.l} className="flex flex-col bg-background p-5">
                      <dd className="t-h1 tnum">{f.v}</dd>
                      <dt className="t-label order-2 mt-2 text-muted">{f.l}</dt>
                    </div>
                  ))}
                </dl>
              </Reveal>
            </div>

            {/* Story image */}
            <div className="lg:col-span-5">
              <Reveal delay={200}>
                <ImageReveal className="relative aspect-[4/5] overflow-hidden border border-border">
                  <Image
                    src={withBasePath("/images/team.webp")}
                    alt="The Savo team shipping a client platform"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 480px"
                    className="duotone object-cover"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[rgb(16_19_25/0.4)] to-transparent"
                  />
                </ImageReveal>
                <div className="mt-4 border-l-2 border-accent pl-4">
                  <p className="t-sm font-semibold">Jaipur to everywhere</p>
                  <p className="t-caption text-muted">Remote first since 2020, delivery standard unchanged.</p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Timeline: ink chapter ---------- */}
      <Section index="The Story" chapter="ink" labelledBy="story-heading">
        <SectionHeader
          id="story-heading"
          heading="Ten years, honestly told."
          lead={<>The milestones that shaped how we build, including the hard ones.</>}
        />
        <Reveal>
          <ol className="relative space-y-10 sm:space-y-12">
            <div aria-hidden="true" className="absolute bottom-2 left-[5px] top-2 w-px bg-border" />
            {MILESTONES.map((m, i) => (
              <li key={m.year} className={cn(i % 2 === 1 && "lg:ml-16")}>
                <div className="relative pl-8 sm:pl-10">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute left-0 top-[0.45rem] h-[11px] w-[11px] border border-border bg-surface",
                      i === MILESTONES.length - 1 && "border-accent",
                    )}
                  />
                  <div className="max-w-lg">
                    <p className="t-label tnum text-accent">{m.year}</p>
                    <h3 className="t-h3 mt-2">{m.t}</h3>
                    <p className="t-body mt-3 text-muted">{m.d}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </Section>

      {/* ---------- Values: sand band ---------- */}
      <Section index="How We Think" labelledBy="values-heading" className="bg-surface-2/60">
        <SectionHeader
          id="values-heading"
          heading="Six rules we actually enforce."
          lead={<>Values that show up in code reviews and status calls, not on posters.</>}
        />
        <Reveal>
          <ul className="grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
            {VALUES.map((v) => (
              <li key={v.t} className="flex flex-col gap-3.5 bg-background p-7">
                <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-accent" />
                <h3 className="t-h4 pt-1">{v.t}</h3>
                <p className="t-sm mt-auto text-muted">{v.d}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </Section>

      {/* ---------- Leadership: the team cards ---------- */}
      <Section index="Leadership" labelledBy="team-heading">
        <SectionHeader
          id="team-heading"
          heading="The people accountable to you."
          lead={<>Leadership that stays hands on, on your project, not just on the org chart.</>}
        />
        <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {LEADERSHIP.map((person, i) => (
            <li key={person.name}>
              <Reveal delay={i * 90}>
                <article className="group flex h-full flex-col border border-border bg-surface">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <Image
                      src={person.img}
                      alt={`${person.name}, ${person.role} at Savo Technologies`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                      className="duotone object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.03]"
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[rgb(16_19_25/0.35)] to-transparent"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="t-h4">{person.name}</h3>
                        <p className="t-label mt-1.5 text-accent">{person.role}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <a
                          href={`https://www.linkedin.com/in/${person.in}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${person.name} on LinkedIn`}
                          className="grid h-8 w-8 place-items-center border border-border text-muted transition-colors duration-300 hover:border-accent hover:text-accent"
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-3.5 w-3.5">
                            <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z" />
                          </svg>
                        </a>
                        <a
                          href={`mailto:${person.mail}`}
                          aria-label={`Email ${person.name}`}
                          className="grid h-8 w-8 place-items-center border border-border text-muted transition-colors duration-300 hover:border-accent hover:text-accent"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" className="h-3.5 w-3.5">
                            <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
                            <path d="m4.5 7.5 7.5 5.5 7.5-5.5" strokeLinecap="round" />
                          </svg>
                        </a>
                      </div>
                    </div>
                    <p className="t-sm mt-4 text-muted">{person.bio}</p>
                  </div>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
      </Section>

      {/* ---------- Presence: ink strip ---------- */}
      <Section index="Where We Are" chapter="ink" labelledBy="presence-heading">
        <SectionHeader
          id="presence-heading"
          heading="Where we are."
          lead={<>A distributed team with registered presence across regions, and one delivery standard everywhere.</>}
        />
        <Reveal>
          <ul className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {OFFICES.map((office) => (
              <li key={office.id} className="flex flex-col gap-2 bg-background p-7">
                <p className="t-label text-muted">{office.region}</p>
                {office.address.map((line) => (
                  <p key={line} className="t-sm font-medium text-foreground/90">{line}</p>
                ))}
                <p className="t-caption tnum mt-2 text-muted">{office.mobile}</p>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={140}>
          <p className="t-serif-italic mt-10 max-w-3xl text-muted">
            Bold Brands. Built by Savo.
          </p>
        </Reveal>
      </Section>

      <DetailCta
        headingId="about-cta-heading"
        heading="Work with the team you just met."
        lead="Start with a free scoping call, you will talk to one of the four people above. Every proposal is reviewed personally."
        location="about-cta"
        secondaryLabel="Join the Team"
        secondaryHref="/careers"
      />
    </>
  );
}
