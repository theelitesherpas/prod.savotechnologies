import { Hero } from "@/sections/home/hero";
import { Introduction } from "@/sections/home/introduction";
import { CapabilityMarquee } from "@/sections/home/capability-marquee";
import { Services } from "@/sections/home/services";
import { AISystems } from "@/sections/home/ai-systems";
import { SelectedWork } from "@/sections/home/selected-work";
import { Methodology } from "@/sections/home/methodology";
import { Technology } from "@/sections/home/technology";
import { WhySavo } from "@/sections/home/why-savo";
import { Metrics } from "@/sections/home/metrics";
import { Industries } from "@/sections/home/industries";
import { Growth } from "@/sections/home/growth";
import { BrandStatement } from "@/sections/home/brand-statement";
import { FinalCTA } from "@/sections/home/final-cta";

/**
 * Savo Technologies — homepage narrative.
 *
 * Testimonials are intentionally absent: the brief forbids fabricated
 * quotes, and none have been supplied. Add a testimonials section only
 * when real, attributable client quotes exist.
 *
 * Metrics render as pending placeholders until verified figures arrive.
 */
export default function HomePage() {
  return (
    <>
      {/* 01 — Hero: what SAVO is, instantly */}
      <Hero />
      {/* 03 — Positioning: one partner from idea to scale */}
      <Introduction />
      {/* 04 — Capability divider */}
      <CapabilityMarquee />
      {/* 05 — The six disciplines */}
      <Services />
      {/* 06 — AI as serious engineering (ink chapter) */}
      <AISystems />
      {/* 07 — Proof, honestly staged */}
      <SelectedWork />
      {/* 08 — How ideas become products */}
      <Methodology />
      {/* 09 — Technology chosen for the problem */}
      <Technology />
      {/* 10 — Differentiators that mean something */}
      <WhySavo />
      {/* 11 — Impact, measured honestly (ink band) */}
      <Metrics />
      {/* 13 — Where the work applies */}
      <Industries />
      {/* 14 — Discoverability after launch */}
      <Growth />
      {/* 15 — Brand moment (ink chapter) */}
      <BrandStatement />
      {/* 16 — Conversion (vermilion chapter) */}
      <FinalCTA />
    </>
  );
}
