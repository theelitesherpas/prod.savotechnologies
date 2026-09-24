# SAVO Technologies — Website (v6)

Premium homepage for SAVO Technologies — a technology and digital product
partner. **Phase 1: homepage only**, built as the foundation the rest of the
site (Services, Work, AI, Industries, About, Insights, Contact, Careers) will
extend without redesigning the base.

**Bold Brands. Built by Savo.**

## Stack

- **Next.js 16** (App Router, React Server Components, Turbopack)
- **TypeScript** (strict) · **Tailwind CSS v4** (CSS-first tokens)
- **PostgreSQL + Prisma** (project enquiries) · **Zod** validation
- Analytics event layer (GA4 — loads only when `NEXT_PUBLIC_GA_ID` is set)

## Getting started

```bash
# 1. PostgreSQL (role + database)
psql postgres -c "CREATE ROLE savo LOGIN PASSWORD 'savo_local_dev';"
psql postgres -c "CREATE DATABASE savo_v6 OWNER savo;"

# 2. Environment
cp .env.example .env   # then edit DATABASE_URL

# 3. Schema + run
npx prisma db push
npm install
npm run dev            # http://localhost:3000
```

Production build: `npm run build && npm start`.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npx prisma studio` | Inspect enquiries |
| `node scripts/verify.mjs` | Automated verification (overflow at 11 widths, fonts, a11y interactions, SEO endpoints). Start the server first (`BASE_URL` to override). |

## Architecture

```
src/
├── app/                  # layout (fonts, metadata, JSON-LD), page (composition),
│   │                     # globals.css (design tokens), api/enquiries (POST)
│   ├── robots.ts · sitemap.ts · icon.svg
├── components/
│   ├── ui/               # button, section shell, reveal, track-view
│   ├── layout/           # site-header, site-footer, footer-cta
│   └── shared/           # enquiry dialog (provider + drawer + form), brand mark
├── sections/home/        # hero (+canvas), introduction, marquee, services,
│                         # ai-systems, selected-work, methodology, technology,
│                         # why-savo, metrics, industries, growth,
│                         # brand-statement, final-cta
├── constants/            # site, services, content (single source of copy)
├── schemas/              # zod enquiry schema (shared client + server)
├── lib/                  # env, prisma, rate-limit, analytics, utils
```

`page.tsx` only composes sections; all copy lives in `src/constants/`.

## Enquiry pipeline

`Start a Project` (header / hero / services / CTA / footer) opens an accessible
drawer → `POST /api/enquiries` → Zod validation → honeypot + per-IP rate limit
(5/h) → Prisma → PostgreSQL (IP stored only as a salted hash).

## Security

CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS
(prod) via `next.config.ts`. Server-side validation only is trusted; env access
is typed (`src/lib/env.ts`).

## Content rules (non-negotiable)

- **Never fabricate**: testimonials (section omitted until real quotes exist),
  client names, metrics (rendered as verified-pending placeholders), awards,
  emails, social URLs.
- Selected-work cards are designed placeholders until real case studies arrive
  (`src/constants/content.ts` → `WORK_PLACEHOLDERS`).
- Future routes (Insights, Careers, legal pages) render as non-breaking
  placeholders — no empty pages.

## Imagery & infographics

All photography ships as optimized WebP in `public/images/` (lazy, sized,
`next/image`) and is held in the document's duotone treatment.

**Provenance** — all photos from Unsplash (Unsplash License, free for
commercial use, no attribution required):

| File | Source |
|---|---|
| `team.webp` | unsplash.com/photos/…9f0129c71c (team collaborating) |
| `studio.webp` | unsplash.com/photos/…f40138edfeb (design workspace) |
| `meeting.webp` | unsplash.com/photos/…757bb62b4baf (professionals reviewing work) |
| `code.webp` | unsplash.com/photos/…c5249f4df085 (engineering close-up) |
| `mobile.webp` | unsplash.com/photos/…90a1b58e7e9c (mobile product in hand) |
| `architecture.webp` | unsplash.com/photos/…c627a92ad1ab (corporate architecture, spare) |

Replace with genuine SAVO studio photography when available. Vector
infographics (service icons, AI pipeline, growth convergence diagram) are
hand-authored SVG in `src/sections/home/` — no icon library dependency.

## Navigation & footer (ported from version 1 — /newdesign)

The header and footer reproduce version 1's information architecture in the
v6 design system (version 1 itself is untouched):

- **Header**: AI mega-menu (AI Agents PRO, Generative AI, AI Consulting,
  Machine Learning + flagship card), Services (10 links + estimator card),
  Hire Resources (6 roles + rates card), Industries (10 sectors + card),
  Case Study, Careers, Contact Us (→ enquiry drawer).
- **Footer**: brand column + Services / Industries / Company / Quick Links,
  global presence strip, real contact details, callback form, compliance
  badges, legal.
- Future routes (`/services/*`, `/hire/*`, `/industries/*`, `/careers/,
  `/portal/`, `/privacy/`, `/terms/`) render the designed 404
  ("still in production") until built — architecture-ready without broken
  pages.
- Callback requests post to `/api/callback` (country-aware phone
  validation, honeypot, rate limit) and store in `project_enquiries` as
  `projectType: "Callback"`.

## Design system

See `DESIGN.md` (tokens, type scale, chapters, motion, do's & don'ts) and
`PRODUCT.md` (positioning, content rules). Design contract is embedded as the
first element of `<body>` in the built HTML.

## Before production

- [ ] Set `NEXT_PUBLIC_SITE_URL` to the real domain (canonical/OG/sitemap)
- [ ] Supply real metrics, case studies, email, social profiles
- [ ] Configure GA4 via `NEXT_PUBLIC_GA_ID` when analytics is approved
- [ ] Set a strong `ENQUIRY_IP_SALT`
- [ ] Run `node scripts/verify.mjs` against the deployed URL
