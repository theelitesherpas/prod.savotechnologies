# CONTENT QUALITY GATE (master spec Parts 100–103)

Run before publishing any page, article or case study. A "no" on any
line means rewrite, not launch.

## The gate (Part 100)

- [ ] Does this page solve a real information need?
- [ ] Does it demonstrate Savo expertise specifically (not generically)?
- [ ] Is the content original — ours, from our work and judgment?
- [ ] Could this page belong to another agency after swapping the name?
      (If yes: rewrite.)
- [ ] Does every claim carry evidence or an honest pending state?
- [ ] Is it accurate (names, dates, technologies, figures)?
- [ ] Is it genuinely useful to a buyer or engineer?
- [ ] Does it sound human? Read it aloud (Part 102) — homepage, About,
      core services, case studies and CTAs especially.
- [ ] Can a crawler extract the facts (semantic HTML, no canvas-only)?
- [ ] Can an AI system answer "what does this page say about X" from it?
- [ ] Would a senior buyer respect it?

## AI-writing pattern check (Part 101)

Flag and rewrite if present as a pattern:

- Repeated em/en dashes or hyphenated constructions (Part 38)
- "not just X but Y" · "from X to Y" · "whether you are" · "At Savo,"
- Predictable three-item lists; uniform paragraph lengths
- Excessive headings or adjectives; repeated inspirational closers
- Banned clichés: unlock the power, leverage, cutting edge, seamless,
  empower, one-stop, game changer, next-generation, in today's rapidly…

## Link check (Part 103)

- [ ] Internal links point somewhere that genuinely helps the next step
- [ ] No orphaned pages: every new page is linked from at least one
      relevant surface (nav, footer, cross-link, llms.txt)

## Machine surfaces

- [ ] Metadata + canonical set; JSON-LD matches visible content
- [ ] llms.txt entry added/updated for new public pages
- [ ] Sitemap includes the URL (canonical, indexable only)
- [ ] Analytics events wired where the page carries key CTAs
