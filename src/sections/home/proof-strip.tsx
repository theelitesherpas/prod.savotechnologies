import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";
import { yearsInBusiness, COMPANY_FACTS } from "@/constants/company-facts";

/**
 * PROOF STRIP (master spec Part 111) - verified information, placed early.
 *
 * Typography and whitespace, not counter cards. Only facts that can be
 * asserted today render; scale figures (projects, clients) appear in the
 * honest pending state further down the page (Metrics), never here.
 */

export function ProofStrip() {
  const years = yearsInBusiness();
  const disciplines = (COMPANY_FACTS.expertiseGroups.value as string[]).length;

  const items = [
    { k: "Operating since", v: "2015" },
    { k: "Years in business", v: `${years}` },
    { k: "Disciplines", v: `${disciplines}` },
    { k: "Offices", v: "India · Switzerland" },
    { k: "Delivery", v: "Global, from Indore" },
  ];

  return (
    <section aria-label="Company facts" className="border-b border-border bg-surface">
      <div className="shell py-6 sm:py-8">
        <Reveal>
          <dl className="grid grid-cols-2 items-baseline gap-x-8 gap-y-5 sm:grid-cols-3 lg:grid-cols-6">
            {items.map((item, i) => (
              <div key={item.k} className={i === items.length - 1 ? "col-span-2 sm:col-span-1" : undefined}>
                <dt className="t-label text-muted">{item.k}</dt>
                <dd className="t-h4 mt-1 font-serif">{item.v}</dd>
              </div>
            ))}
            <div className="col-span-2 flex items-end justify-start sm:col-span-1 lg:justify-end">
              <Link
                href="/company-profile"
                className="t-label text-muted underline underline-offset-4 transition-colors hover:text-foreground"
              >
                Company profile ↗
              </Link>
            </div>
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
