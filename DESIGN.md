---
name: SAVO Technologies
description: Premium engineering-document world — warm paper and deep ink chapters, one vermilion signal, square-node motif, width-axis grotesk.
colors:
  paper: "#f5f4f0"
  paper-surface: "#fbfaf7"
  paper-surface-2: "#ebe9e2"
  paper-ink: "#17171a"
  paper-muted: "#5b5a53"
  ink-bg: "#0e0e11"
  ink-surface: "#16161b"
  ink-surface-2: "#1e1e25"
  ink-foreground: "#f1f0eb"
  ink-muted: "#a09f97"
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
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.3rem, 8vw, 6.6rem)"
    fontWeight: 790
    lineHeight: 0.95
    letterSpacing: "-0.03em"
    fontVariation: "wdth 112–113%"
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.55rem, 5.4vw, 4.6rem)"
    fontWeight: 690–740
    lineHeight: 0.99–1.06
    letterSpacing: "-0.026em"
    fontVariation: "wdth 105–108%"
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  body-large:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.125rem, 1.5vw, 1.3125rem)"
    lineHeight: 1.55
  label:
    fontFamily: "Fragment Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    letterSpacing: "0.16em"
    textTransform: "uppercase"
rounded:
  field: "2px"
  chip: "2px"
  node: "0px"
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

# SAVO Technologies — Design System

## Overview

**World: the engineering document.** SAVO's surfaces read as precision-authored
technical dossiers — a premium product studio's taste expressed through an
engineering company's instruments: hairline rules, mono data labels, an index
rail, and one vermilion signal color. The recurring mark is the **square
node** (brand mark, hero system, marquee separators, grid ticks, metrics dash,
favicon) — a motif that reads as "system" the way a circle reads as "bubble".

The page alternates **chapters**: warm paper (strategy, design, human voice),
deep ink (systems, AI, metrics, footer), and one full vermilion moment (final
conversion). Chapters are token scopes — components inherit automatically.
Scene logic: a printed dossier under studio light, not a dark dashboard.

## Colors

Token scopes in `src/app/globals.css` — `:root` (paper), `.chapter-ink`,
`.chapter-accent`. Semantic tokens (`--background`, `--foreground`, `--surface`,
`--surface-secondary`, `--muted`, `--border`, `--accent`, `--accent-hover`,
`--on-accent`, `--success`, `--warning`, `--error`) swap per chapter; components
never hard-code chapter colors.

- **Paper chapter**: `#f5f4f0` ground, `#17171a` ink text, `#5b5a53` muted
  (6.3:1), hairlines `rgb(23 23 26 / 0.14)`. Accent `#d9480f` (3.9:1 — large or
  bold text and marks only).
- **Ink chapter**: `#0e0e11` ground, `#f1f0eb` text, `#a09f97` muted (7.3:1),
  accent `#ff5a24` (6.2:1). Surfaces are one and two steps lighter, never pure.
- **Vermilion chapter**: `#e8490f` ground, near-full ink `#16130f` text (4.75:1);
  secondary text stays ≥0.95 ink-alpha for 4.5:1 — hierarchy comes from size and
  weight, never from lowering tone on this ground.
- Status colors are reserved for real states (form errors, success); never
  decorative.

## Typography

One family, two registers. **Archivo variable** (self-hosted via next/font,
width axis 62–125) carries all text; **Fragment Mono** is the measurement
voice — indices, data, notes, microcopy, never body copy.

- **Statement moments only** (hero, brand statement, final CTA, footer
  wordmark): uppercase, `wdth 112–113%`, weight 790, tracking −0.03em, one
  vermilion period.
- **Section headings**: sentence case, `wdth 105–110%`, weight 690–740, tight.
- Scale utilities: `.t-dxl`, `.t-statement`, `.t-dl`, `.t-h1`–`.t-h4`,
  `.t-body-lg`, `.t-body`, `.t-sm`, `.t-label`, `.t-caption`. Statement floor
  (2.3rem) keeps long words like "TECHNOLOGY" inside a 320px shell.
- Body measure stays ≤ ~34rem; indices and figures use `.tnum` tabular numerals.

## Layout

- `.shell`: max-width 90rem, inline padding `clamp(1.25rem, 4.5vw, 4.5rem)`.
- Section rhythm: `py-20 sm:py-28 lg:py-36`; more space above headings than
  below; tight groups, generous separation.
- **Index rail**: each narrative section opens with `NN — Name` in mono plus a
  hairline — the document's wayfinding (the homepage tells a numbered story by
  brief). Not a decorative eyebrow elsewhere.
- 12-column editorial grids with offset copy columns; accordions and row lists
  replace card grids; hairline `divide`/`gap-px` grids for metrics/growth.
- Sticky sub-elements (services index, AI pipeline) at `top-28`.

## Elevation & Depth

Flat, tonal depth: chapters, surfaces and hairlines carry hierarchy. One
elevated surface exists — the enquiry drawer (`0 -24px 80px rgb(0 0 0 / 0.35)`,
offset + soft blur). No halos, no hard offset shadows, no gradient depth.

## Shapes

Radius is a rare event: 2px on buttons, fields and chips; 0 everywhere else —
nodes, ticks, panels are square. The square node motif (2–16px) is the brand
signature and appears in every chapter. Icons are authored inline SVG, 1.5px
stroke, arrows and plus-marks only.

## Components

- **Buttons** — solid (ink→vermilion on hover), outline (hairline→full border),
  text links with `link-underline` (offset .28em, hairline→current). Height
  2.75–3.25rem, sentence case, arrow nudges +3px on hover.
- **Fields** — document style: transparent, baseline hairline only, accent
   underline on focus, error underline + caption. Selects keep native popup.
- **Chips** — mono/hairline tags for capabilities; text-muted on border.
- **Accordion rows** (services) — index / title / rotating plus-mark; panel
  opens via `grid-template-rows 0fr→1fr`; native button headers,
  `aria-expanded`/`aria-controls`.
- **Enquiry drawer** — right panel ≥sm, bottom sheet below; ink chapter scope;
  focus trap, Esc, scroll lock with scrollbar compensation, `inert` when
  closed.
- **Mobile menu** — full-screen ink chapter, clip-path wipe, staggered link
  entrance, mono indices, focus trap, `inert` when closed.
- **Motion** — one system: `reveal` entrances (26px rise, 0.9s expo-out,
  IO-gated, stagger ≤220ms), marquee (52s linear), pipeline signal dot (6.5s),
  methodology scroll progress, canvas orbit. All disabled under
  `prefers-reduced-motion`; content visible by default (`.js` guard).

## Do's and Don'ts

- Do keep chapters as the only background mechanism; never place a paper-styled
  component on ink by hard-coding colors.
- Do reserve uppercase-expanded for statement moments; everything else stays
  sentence case.
- Do use Fragment Mono only for measurement (indices, data, labels) — never
  body copy.
- Do use the square node where a mark is needed; don't introduce circles,
  gradients, glows, glass, or extra colors.
- Don't add eyebrows/kickers above headings; the index rail is the only label
  instrument.
- Don't publish invented figures, quotes, clients, or claims — placeholders are
  the honest state until verified content arrives.
- Don't soften the vermilion moment; it is the page's single shout.
