import Image from "next/image";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeader } from "@/components/ui/section-header";
import { CONTACT_TEAM } from "@/constants/contact";
import { IS_DEMO } from "@/lib/content-mode";

/**
 * "The people who answer" - DEMO team content (invented members with
 * placeholder portraits and LinkedIn slugs that may not be Savo-controlled).
 * Renders in demo mode so the layout stays complete for design review;
 * suppressed in production until Savo supplies the real team roster.
 * DEMO - REPLACE BEFORE PRODUCTION (see DEMO_CONTENT_REPLACEMENT.md)
 */
export function Team() {
  if (!IS_DEMO) return null;

  return (
    <Section id="team" index="Team" labelledBy="team-heading">
      <SectionHeader
        id="team-heading"
        heading="The people who answer."
        lead="No account managers relaying messages. The faces below are who you talk to, from first call to final release."
      />

      <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {CONTACT_TEAM.map((member, i) => (
          <Reveal as="li" key={member.name} delay={(i % 3) * 90}>
            <article className="group">
              <div className="relative aspect-[4/5] overflow-hidden border border-border">
                <Image
                  src={member.image}
                  alt={`${member.name}, ${member.role} at Savo Technologies`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                  className="photo object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.03]"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[rgb(16_19_25/0.45)] to-transparent"
                />
                <p className="t-label absolute bottom-4 left-4 text-white/85">
                  {member.role}
                </p>
              </div>
              <div className="mt-5 flex items-start justify-between gap-4 border-b border-border pb-5">
                <h3 className="t-h3">{member.name}</h3>
                <div className="flex shrink-0 gap-2">
                  <a
                    href={`https://www.linkedin.com/in/${member.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${member.name} on LinkedIn`}
                    className="flex h-9 w-9 items-center justify-center border border-border text-muted transition-colors duration-300 hover:border-accent hover:text-accent"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-[13px] w-[13px]">
                      <path d="M4.2 7.2v9H1.4v-9h2.8ZM4.4 4.6a1.6 1.6 0 1 1-3.2 0 1.6 1.6 0 0 1 3.2 0ZM15 9.1c-.4-1.3-1.5-2.1-3-2.1-1.1 0-1.9.5-2.4 1.2V7.2H6.9v9h2.8v-4.8c0-1.1.6-1.9 1.6-1.9.9 0 1.4.6 1.4 1.9v4.8H15.5v-5.3c0-1-.3-2-.5-2.6Z" />
                    </svg>
                  </a>
                  <a
                    href="mailto:hello@savotechnologies.com"
                    aria-label={`Email ${member.name}`}
                    className="flex h-9 w-9 items-center justify-center border border-border text-muted transition-colors duration-300 hover:border-accent hover:text-accent"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-[13px] w-[13px]">
                      <rect x="3.5" y="5.5" width="17" height="13" rx="2.2" />
                      <path d="m4.5 7.5 7.5 5.5 7.5-5.5" />
                    </svg>
                  </a>
                </div>
              </div>
              <p className="t-sm mt-4 text-muted">{member.bio}</p>
            </article>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
