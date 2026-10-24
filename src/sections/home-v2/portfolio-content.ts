import type { CaseStudy } from "@/lib/case-study-schema";
import { caseDisciplines, resolveCaseImages } from "@/lib/case-study-schema";
import { caseImageSrc } from "@/lib/case-img";

export type HomePortfolioView = "web" | "mobile" | "ai";
export type HomePortfolioFeature = {
  name: string;
  href: string;
  image: { src: string; alt: string; width: number; height: number };
};
export type HomePortfolioFeatures = Partial<Record<HomePortfolioView, HomePortfolioFeature>>;

/** Input comes from getCaseStudies: active, Published, validated managed records.
 * Honor the existing "Featured on homepage" switch and admin ordering. Never
 * reuse a Web project in another discipline, or fill missing slots with concepts.
 * Only small public display props cross the client boundary, not image data/JSON.
 */
export function buildHomePortfolioFeatures(studies: CaseStudy[]): HomePortfolioFeatures {
  const features: HomePortfolioFeatures = {};
  for (const study of studies) {
    if (study.status !== "verified" || study.featured !== true || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(study.slug)) continue;
    const view = caseDisciplines(study).find((v): v is HomePortfolioView => v === "web" || v === "mobile" || v === "ai");
    if (!view) continue;
    if (features[view]) continue;
    // Gallery-only records do not have a supplied cover photo.
    if (!study.images?.cardWide && !study.images?.showcase && !study.images?.card && !study.heroImage) continue;
    const image = resolveCaseImages(study).cardWide;
    if (!image) continue;
    const name = study.displayClientName || (study.nda ? "Confidential project" : study.title);
    features[view] = {
      name,
      href: `/case-studies/${study.slug}`,
      image: { src: caseImageSrc(study.slug, "cardWide", image.dataUrl), alt: image.alt || `${name} cover`, width: image.width, height: image.height },
    };
  }
  return features;
}
