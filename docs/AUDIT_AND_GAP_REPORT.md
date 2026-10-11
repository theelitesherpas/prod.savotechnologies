# AUDIT & GAP REPORT — savo.v7 (local)

Code-level audit performed 2026-10-02 against the Master Specification,
on the local v7 replica (54 canonical routes at audit time). External
competitive benchmarking (Part 5) requires a separate crawl of the live
landscape and is scheduled as its own session; it is not reproduced here.

## Strengths already in place (protect, don't rebuild)

- Sophisticated, coherent design system (paper/ink/vermilion chapters,
  serif/sans/mono hierarchy, restraint) — spec Part 2 satisfied by design.
- Honest content discipline: verified-vs-pending metrics, no fabricated
  testimonials, demo content gated from production, canonical-URL hygiene.
- Strong platform: admin panel, client portal, meetings lifecycle, live
  chat, HR portal, audit log, content lifecycle (draft→published).
- SEO base: canonical sitemap (verified-only case studies), explicit AI
  crawler policy, llms.txt + llms-full.txt, api-catalog, JSON-LD.

## Priority findings

### P0 — Critical (blocks the core promise of the spec)

1. **Case studies carry no real proof.** DB contained stale demo rows and
   test junk (`sample-project`, `gap-test-…`) — cleaned this session. Real
   engagements, metrics and approvals are required from Savo (items A1–A7).
   *Fixed structurally: flagship dossier architecture + levels + explorer.*
2. **Company scale figures unverified** (projects/clients/industries/
   markets) — rendered honestly as pending, but the proof strip and
   metrics cannot land until supplied (B4–B7).
3. **/trust wording must be confirmed against real contracts** (D1/D2) —
   the page states standard practice; Savo must confirm it matches their
   agreements before any production deployment.

### P1 — High (authority & conversion)

4. About page lacks leadership, timeline, team depth (B9/B10).
5. Third-party ratings absent (C1/C2) — never fabricated, links pending.
6. Service pages exist at good length but don't yet meet the Part 34
   question-standard (when-not-to-use, tradeoffs, related proof). Phase 3.
7. Industry pages good but shallower than the Part 54 standard (real
   operational workflows per sector). Phase 3.
8. AI pages cover capability; production-AI depth (Part 47: evals,
   guardrails, observability, cost) lands in the AI content pass.
9. Insights: 6 quality articles; clusters, expert authors (Part 63) and
   buyer guides (Part 64) pending.

### P2 — Medium (polish & operations)

10. Technology pages (Part 50) don't exist per-technology.
11. IndexNow (Part 75) — production deployment concern.
12. Admin editing UI for company facts/claims registries (currently
    code-first, deliberately).
13. Content inventory at URL level (Part 99).
14. Accessibility: formal WCAG 2.2 AA audit (contrast tokens documented,
    semantic components used throughout — needs an audit pass to certify).

### P3 — Growth (leadership horizon)

15. Original research program (Part 62).
16. Video client stories (Part 18).
17. Knowledge-graph-driven Ask Savo grounding (Part 81).
18. GitHub engineering presence (Part 107).

## Scorecard posture (internal, vs the two reference competitors)

Not reproduced publicly — internal benchmarking note only: Savo's design
system is already ahead of the reference set; the deficit was never
visual, it was **evidence** (case depth, named clients, third-party
ratings, leadership presence) and **enterprise trust surfaces** — both
now architected, pending verified input.
