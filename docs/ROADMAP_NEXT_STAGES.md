# NEXT STAGES — Planned Roadmap (savo.v7)

Written after Session 2 (Part 34 exemplars + Part 49 depth). This file is
the standing plan: what comes next, in order, and what each stage needs.
Update it as stages complete. The full 128-part status lives in
`IMPLEMENTATION_LEDGER.md`; Savo inputs live in
`INFORMATION_REQUIRED_FROM_SAVO.md`.

────────────────────────────────────────────────────────────────────────

## STAGE 1 — Service pages to the Part 34 standard  ✅ COMPLETE (Session 4)
All 10 services carry the judgment layer (whenNeeded / whenNot /
architecture / integrations / security / quality / afterLaunch /
relatedWork). Verified rendering on every /services/[slug] page.

## STAGE 2 — Industry depth to the Part 54 standard  ✅ COMPLETE (Session 5)
All 10 atlas industries carry challenges, operational workflows
(real-estate at full Part 55 depth), technology, integrations,
security and honest AI opportunities. Verified rendering on every
/industries/[slug] page.

## STAGE 3 — Competitive scorecard (Part 5)  ✅ COMPLETE (Session 6)
Both reference competitors crawled and scored across all 27 Part 5
dimensions → `docs/COMPETITIVE_SCORECARD.md` (INTERNAL ONLY; evidence
in `tmp-benchmark/`). Key finding: Savo's only deficits are data-blocked
(proof/clients/ratings), architecture and content lead on every spec
priority.

## STAGE 4 — Remaining insights program (Parts 60–65)  ✅ COMPLETE (Session 7)
13 new articles (22 total): all remaining comparison guides and all
buyer guides. FAQPage schema verified across all detail page types.
Cross-links wired (trust → source-code-ownership guide, services →
related reading).

## STAGE 5 — Ask Savo grounding + conversion  ← NEXT UP
- [ ] Ground the assistant over the registries (company facts, claims,
      case studies, services) so answers distinguish
      verified/published/unknown and never hallucinate
- [ ] Human handoff carries conversation context (Part 84) — chat
      infrastructure exists; wire the lead payload
- [ ] Persona journeys (Part 85) and progressive form stages (Part 88)
- [ ] Admin editing UI for facts/claims/recognition registries

## STAGE 5 — Ask Savo grounding + conversion  ✅ COMPLETE (Session 8)
Knowledge expanded to 45+ entries: per-industry project discovery
(Part 83), engagement models, insights. Keyword topology fixed with
tests (159 passing). Persona journeys mapped (docs) + quick-paths
strip on /enterprise. Part 84 handoff verified as already built.

### Stage-5 follow-ups (small, next session)
- [ ] Main enquiry drawer → staged progressive disclosure (Part 88)
- [ ] Admin editing UI for facts/claims/recognition registries

## STAGE 6 — Go-live preparation (when you say GO)
- [ ] Verify /trust wording against real contracts (D1/D2) — REQUIRED
- [ ] Real case studies replacing demo dossier (needs A3–A6) — REQUIRED
      for production content mode
- [ ] Accessibility audit pass (Part 93), performance measurement
      (Part 91–92), final 5-perspective QA (Part 119)
- [ ] Production env: IndexNow key (Part 75), GSC/Bing verification
      (Parts 76–77), analytics baseline (Part 114)
- [ ] Migration plan v6 → v7 deployment (no live changes until approved)

## ONGOING — as Savo inputs arrive
Every ⛔ item unlocks as data lands (see the tracker):
clients+logos → ClientProof renders · testimonials → case-study bands ·
ratings → IndependentlyVerified · certifications → Recognition ·
leadership/timeline → About depth · metrics → proof strip & Metrics

## Blocked-by-design (never do)
- Fabricated clients/metrics/reviews/certifications (Part 117)
- Programmatic city×service spam (Part 105)
- Public competitor comparisons (Part 5 is internal only)

────────────────────────────────────────────────────────────────────────
Session log: S1 foundations+pages · S2 spec-gap fill · S3 service
exemplars + automation depth + this roadmap. Backups:
`savo.v7-backup-0{1,2}-*.tar.gz` (03 to follow Stage 1 completion).
