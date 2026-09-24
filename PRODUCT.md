# PRODUCT.md — SAVO Technologies (savo.v6)

> Inferred entirely from the client's master brief (no interview was possible in this
> environment). Assumptions are labeled `[assumption]`.

## What this is
Phase one of the official SAVO Technologies website: **the homepage only**, built as
the foundation the rest of the site (Services, Work, Industries, About, AI, Insights,
Contact, Careers) will later extend. SAVO is positioned as **a technology and digital
product partner — not a development agency**: strategy → design → technology →
intelligence → growth, under one team.

## Company truth (from brief)
- Services: websites, web apps, mobile apps, custom software, SaaS, AI / AI agents /
  agentic systems, generative AI, automation, UI/UX & product design, eCommerce,
  digital marketing, SEO / AEO / GEO, performance marketing, cloud & backend,
  API integrations, consulting, product strategy, maintenance.
- Brand line: **Bold Brands. Built by Savo.** (exact capitalization)
- Writing style: confident, short, precise, modern, intelligent, human. No
  corporate filler ("world-class", "cutting-edge", "revolutionize").

## Hard content rules (non-negotiable)
- **Never fabricate**: testimonials, client logos, metrics, awards, certifications,
  email addresses, social URLs, project results.
- Testimonials section stays hidden until real quotes exist.
- Metrics render as clearly-marked pending placeholders.
- Selected work renders as designed placeholders until real case studies arrive.
- No fake claims of any kind.

## Audience & mode
- Surface mode: **Persuade** (homepage = marketing surface; the visitor decides and acts).
- Audience: founders, product leaders, marketing leads and enterprises evaluating a
  serious partner for websites, mobile products, SaaS, custom software and AI systems —
  international, English-language.
- Primary action: **Start a Project** (opens the enquiry form → PostgreSQL).
- The visitor must understand within seconds: what SAVO builds, why it differs from an
  ordinary agency, that design and engineering are both first-class, that AI is a real
  engineering capability, and how to start.

## Surface structure (pinned by brief)
Navigation → Hero → Positioning → Capability divider → Core services (6 groups) →
AI & intelligent systems → Selected work → Methodology (5 steps) → Technology
ecosystem → Why SAVO → Impact metrics (placeholders) → [Testimonials: omitted until
real quotes exist] → Industries → Growth / discoverability (SEO·AEO·GEO) → Brand
statement → Final CTA → Footer (global, reusable).

## Technology (pinned by brief)
Next.js (App Router, RSC-first) · TypeScript strict · Tailwind CSS · Prisma +
PostgreSQL (project enquiries) · Zod validation · rate limiting · honeypot anti-spam ·
security headers · JSON-LD (Organization, WebSite) · analytics event layer (GA4-ready,
loaded only when configured).

## Non-goals for this phase
- No other pages/routes; future nav links use non-breaking placeholders.
- No admin, no CMS, no auth.

## Assumptions
- `[assumption]` Local PostgreSQL on :5432 (present on this machine) serves the
  enquiry store in development; production connection comes from env.
- `[assumption]` No email address, phone or social handles exist yet — none are
  rendered; placeholders are marked for replacement.
- `[assumption]` Visual world chosen from the brief's own pinned aesthetic
  (premium · minimal · editorial · technical · restrained): "the engineering
  document" — see DESIGN.md at finish.
