---
name: SAVO Technologies
description: The engineering dossier — warm paper and sand bands, blue-black ink chapters, one vermilion signal; Source Serif 4 voice over Manrope UI, duotone photography, drawn vector infographics.
colors:
  paper: "#f7f5f0"
  paper-surface: "#fcfbf8"
  sand: "#ede9de"
  paper-ink: "#17171a"
  paper-muted: "#565449"
  ink-bg: "#101319"
  ink-surface: "#171b22"
  ink-surface-2: "#1f242d"
  ink-foreground: "#eef0f4"
  ink-muted: "#a3a8b3"
  vermilion: "#e8490f"
  vermilion-dark: "#d9480f"
  vermilion-hover-paper: "#b23a09"
  vermilion-hover-ink: "#ff7c4d"
  vermilion-bright: "#ff5a24"
  success: "#1e7a3f"
  warning: "#94660f"
  error: "#b3261e"
typography:
  display:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "clamp(2.75rem, 6.9vw, 6.2rem)"
    fontWeight: 590
    lineHeight: 1.03
    letterSpacing: "-0.015em"
  statement:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "clamp(2.4rem, 8.6vw, 5.9rem)"
    fontWeight: 590
    lineHeight: 1.05
  section-display:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "clamp(2.1rem, 4.5vw, 3.8rem)"
    fontWeight: 600
    lineHeight: 1.07
  headline-1:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "clamp(1.75rem, 3.1vw, 2.6rem)"
    fontWeight: 600
  headline-2:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "clamp(1.45rem, 2.2vw, 2rem)"
    fontWeight: 600
  subhead:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.125rem, 1.5vw, 1.3rem)"
    fontWeight: 700
  body:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.68
  body-large:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.0625rem, 1.35vw, 1.25rem)"
    lineHeight: 1.62
  body-small:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
  label:
    fontFamily: "Fragment Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    letterSpacing: "0.16em"
    textTransform: "uppercase"
  caption:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
  control:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
rounded:
  field: "2px"
  chip: "2px"
  node: "0px"
  browser-chrome-only: "focus ring 1px; scrollbar thumb 99px — browser surfaces, never components"
spacing:
  shell-inline: "clamp(1.25rem, 4.5vw, 4.5rem)"
  section-y: "clamp(5rem, 9vw, 9rem)"
  group: "1.75rem–2.25rem"
components:
  button-solid:
    backgroundColor: "{colors.paper-ink}"
    textColor: "{colors.paper}"
    rounded: "2px"
    height: "3.25rem"
    padding: "0 1.75rem"
  button-solid-hover:
    backgroundColor: "{colors.vermilion}"
    textColor: "{colors.paper}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.paper-ink}"
    rounded: "2px"
  field:
    backgroundColor: "transparent"
    textColor: "{colors.paper-ink}"
    rounded: "0px"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.paper-muted}"
    rounded: "2px"
    padding: "4px 10px"
---

# SAVO Technologies — Design System (v2)

## Overview

**World: the engineering dossier, bound in leather.** SAVO's surfaces read as
precision-authored technical documents with the warmth of a bound volume —
serif display type over a professional sans, warm paper and sand pages,
blue-black systems chapters, and one vermilion signal. The recurring mark is
the **square node** (brand mark, hero system, marquee separators, grid ticks,
metrics dash, favicon). Photography is real but held inside the document's
ink (duotone); infographics are hand-drawn vectors that ink themselves in on
scroll.

Chapters are token scopes — `:root` (paper), `.chapter-ink`, `.chapter-accent`
in `src/app/globals.css`. Components never hard-code chapter colors.

## Colors

- **Paper chapter**: `#f7f5f0` ground, `#17171a` ink, `#565449` muted (7:1),
  hairlines `rgb(23 23 26 / 0.13)`, accent `#d9480f` (3.95:1 — large/bold and
  marks only).
- **Sand band** (`--surface-secondary` `#ede9de`): the alternate section
  ground for Technology and Growth; muted text holds 6.3:1 on it.
- **Ink chapter**: blue-black `#101319` (richer than pure black), `#eef0f4`
  text, `#a3a8b3` muted (7.8:1), accent `#ff5a24` (5.97:1 — safe at small
  sizes on ink). Surfaces step lighter `#171b22` / `#1f242d`, never pure.
- **Vermilion chapter**: `#e8490f` ground with near-full ink text (4.75:1);
  muted stays ≥0.95 ink-alpha — hierarchy by size and weight, never tone.
- Status colors only for real states.

## Typography

Three voices, one document:

- **Source Serif 4** — the voice. Display and all headlines (`t-dxl`,
  `t-statement`, `t-dl`, `t-h1`, `t-h2`), sentence case, optical sizing on.
  Italic reserved for the brand line ("Bold Brands. Built by Savo.").
- **Manrope** — the interface. Sub-heads (`t-h3`, `t-h4`), body (`t-body-lg`,
  `t-body`, `t-sm`, `t-caption`), controls, wordmark (extrabold, tracking
  −0.03em).
- **Fragment Mono** — measurement only (`t-label`): section indices, data,
  notes, chips of capabilities. Never body copy.

Statement sizes clamp down to 2.4rem so long words ("TECHNOLOGY") hold the
line at 320px. Body measure ≤ ~34rem; `.tnum` for figures.

## Layout

- `.shell` max-width 90rem, inline `clamp(1.25rem, 4.5vw, 4.5rem)`.
- Section rhythm `py-20 sm:py-28 lg:py-36`; **SectionHeader** standardizes
  every section opening: serif heading on the left rail (7 cols), lead copy
  right-aligned on the right rail (5 cols), shared baseline.
- Index rail opens each section (`NN — Name` mono + hairline) — narrative
  wayfinding, not decoration.
- Editorial 12-col grids; accordions and hairline rows instead of card grids;
  `gap-px` grids for metrics/growth; sticky rails (services index, AI
  pipeline, studio image) at `top-28`.

## Elevation & Depth

Flat, tonal depth — chapters, sand bands, surfaces and hairlines. Two
exceptions: the enquiry drawer's offset soft shadow
(`0 -24px 80px rgb(0 0 0 / 0.35)`) and photographic gradients over duotone
images. No halos, hard offsets, or gradient depth.

## Shapes

Radius is rare: 2px on buttons/fields/chips; 0 elsewhere. Square node motif
2–16px in every chapter. Icons are hand-authored inline SVG, 1.5px stroke on
a 28px grid (service set: browser, phone, node-circuit, stack, pen, trend).
Infographics use hairline strokes with `pathLength=1` draw-on-scroll.

## Imagery

Real photography, served as optimized WebP through `next/image` (lazy,
sized, `object-cover`). Every photo wears the **duotone** treatment
(grayscale + contrast + slight dim) so it belongs to the document; hover
eases toward full color. Bands reveal with a clip-path wipe while the photo
settles from 1.12 scale; cinematic bands drift with capped parallax (pointer
devices only). Case-study placeholders pair representative imagery with
wireframe overlays and an "In preparation" tag — never presented as clients.

## Admin panel (operations surface)

The admin is deliberately utilitarian — same tokens (paper/ink/vermilion,
`t-label`/`t-sm` typography, hairline borders, square corners) but applied as
a working interface: mono stat tiles, table rows, status chips, two-step
danger zones. No bespoke illustration or motion beyond hover states; it is
chrome for operators, not a chapter of the document.

## Components

- **Wordmark** — the official SAVO logo (ported from v1): single-color
  currentColor lockup, `SavoLogo` in `shared/savo-logo.tsx`; paper contexts
  fill ink, ink contexts fill paper.
- **Navigation (v1 architecture)** — AI mega (AI Services + flagship
  feature), Services / Hire Resources / Industries dropdowns (10/6/10 links
  + feature cards + "All …" link), Case Study, Careers, Contact Us (opens
  the enquiry drawer). Panels are full-width ink bars under the header with
  mono titles, indexed links, PRO chips, square-node feature art. Hover
  opens with a 160ms grace timer; click opens; Esc / outside / hover-leave
  closes. Mobile: full-screen ink menu with numbered accordion sections.
  Future routes resolve to the designed 404 ("still in production").
- **Footer (v1 architecture)** — brand column (logo, v1 statement, socials)
  + Services / Industries / Company / Quick Links columns; global presence
  strip (India HQ, USA, GCC, UK, Australia) + Talk to us (email/phone/
  portal); callback form (country-aware phone validation → /api/callback);
  compliance badges + © + legal.
- **Buttons** — solid (ink→vermilion hover), outline, `link-underline` text
  links; 2.75–3.25rem; arrow nudges +3px.
- **Fields** — baseline hairlines, accent focus, error caption; native
  select popup.
- **Accordion rows** (services) — index / icon / title / rotating plus;
  `grid-template-rows 0fr→1fr` panels; native button semantics.
- **Enquiry drawer / mobile menu** — focus trap, Esc, scroll lock, `inert`
  when closed.
- **Motion system** — reveals (26px rise, 0.9s expo-out), image mask wipes,
  vector line-draws (`data-draw`), marquee (52s), pipeline signal dot,
  methodology scroll progress, hero canvas orbit. All disabled under
  `prefers-reduced-motion`; content visible by default.

## Do's and Don'ts

- Do keep chapters as the only background mechanism; never hard-code chapter
  colors into components.
- Do keep the serif for voice and the sans for interface; mono measures.
- Do hold photography in duotone until hover; don't scatter full-color
  photos across paper chapters.
- Do use the square node where a mark is needed; no circles, gradients,
  glows, glass, or extra accent colors.
- Don't add eyebrows/kickers; the index rail is the only label instrument.
- Don't publish invented figures, quotes, clients, or claims — placeholders
  are the honest state until verified content arrives.
- Don't soften the vermilion moment; it is the page's single shout.
