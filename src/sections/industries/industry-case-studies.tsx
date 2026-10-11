import * as React from "react";
import Image from "next/image";
import type { IndustryCaseSlot } from "@/content/industries/relationships";
import { resolveCaseImages } from "@/lib/case-study-schema";
import { caseImageSrc } from "@/lib/case-img";
import { SectorGlyph } from "./industry-dossier-art";
import { IndustryCaseFan, type CaseFanItem } from "./industry-case-fan";
import s from "./industry-case-fan.module.css";

/* Published dossiers retain their real links; sector-specific briefs and editorial images remain available alongside them. */
export function IndustryCaseStudies({ slots }: { slots: IndustryCaseSlot[] }) {
  const items: CaseFanItem[] = slots.map((slot, index) => {
    if (slot.kind === "published") {
      const study = slot.study;
      const image = study.nda ? null : resolveCaseImages(study).card;
      const title = study.nda ? "Confidential project" : study.title;
      return {
        id: study.slug, title, kind: "published", description: study.summary, href: `/case-studies/${study.slug}`,
        identity: !study.nda && study.displayClientName ? <span key={`${study.slug}-identity`}>{study.displayClientName}</span> : undefined,
        cover: image ? <Image key={`${study.slug}-image`} src={caseImageSrc(study.slug, "card", image.dataUrl)} alt={image.alt || `${title} project image`} fill sizes="(max-width: 768px) 82vw, (max-width: 1400px) 70vw, 1000px" unoptimized draggable={false} className={s.image} /> : <div key={`${study.slug}-cover`} className={s.fallbackCover}><span>{study.nda ? "Project imagery withheld" : "Published project dossier"}</span></div>,
      };
    }
    const c = slot.concept;
    return {
      id: `concept-${index}`, title: c.title, kind: "placeholder", description: c.text, identity: <SectorGlyph key={`concept-${index}-identity`} kind={c.layout} />,
      cover: c.image ? <Image key={`concept-${index}-image`} src={c.image} alt={c.imageAlt || `Editorial sector photograph for ${c.sector}, not project imagery`} fill sizes="(max-width: 768px) 82vw, (max-width: 1400px) 70vw, 1000px" draggable={false} className={s.image} style={{ objectPosition: `${20 + index * 15}% center` }} /> : <div key={`concept-${index}-cover`} className={s.fallbackCover}><SectorGlyph kind={c.layout} /></div>,
      brief: <div key={`concept-${index}-brief`} className={s.briefContent}><p>{c.text}</p><dl><div><dt>Sector</dt><dd>{c.sector}</dd></div><div><dt>Users</dt><dd>{c.audience}</dd></div><div><dt>Workflow</dt><dd>{c.workflow}</dd></div><div><dt>Goal</dt><dd>{c.objective}</dd></div></dl></div>,
    };
  });
  return <IndustryCaseFan key={items.map(item => item.id).join("|")} items={items} />;
}
