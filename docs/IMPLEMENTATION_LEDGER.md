# IMPLEMENTATION LEDGER — Master Specification (128 Parts)

Living tracker for the "Ultimate Website Leadership, Content, Proof and
Discoverability Master Specification". Status per part. The ledger is the
source of truth for what is done, what is next, and what is blocked on
Savo input (see `INFORMATION_REQUIRED_FROM_SAVO.md`).

Legend: ✅ done · 🟡 partial · ⬜ planned · ⛔ blocked on Savo input

## Strategy & audit

| Part | Topic | Status | Notes |
|------|-------|--------|-------|
| 1 | Central strategy (win through evidence, not volume) | ✅ | Governing principle of all v7 work |
| 2 | Preserve existing design advantage | ✅ | All new surfaces use existing tokens/chapters |
| 3 | No generic IT website patterns | ✅ | Typography-first components, no icon grids |
| 4 | Complete audit first | ✅ | Code-level + content audit complete (AUDIT_AND_GAP_REPORT.md); competitor crawl done for scorecard |
| 5 | Internal competitive scorecard | ✅ | `COMPETITIVE_SCORECARD.md` — 27 dimensions scored vs both references; raw evidence in tmp-benchmark/ (internal only) |

## Company truth

| Part | Topic | Status | Notes |
|------|-------|--------|-------|
| 6 | Centralized company facts | ✅ | `src/constants/company-facts.ts` — value+status+source+dates per fact |
| 7 | Eliminate fact inconsistencies | 🟡 | Registry exists; homepage proof strip, enterprise + profile consume it; remaining surfaces migrate incrementally |
| 8 | Claim verification system | ✅ | `src/constants/claims.ts` — 6 statuses, evidence, owner, dates |

## Case studies

| Part | Topic | Status | Notes |
|------|-------|--------|-------|
| 9 | Case studies as competitive advantage | ✅ | Architecture + demo exemplar live |
| 10 | Master structure | ✅ | `flagshipDossierSchema` + `FlagshipDossier` renderer |
| 11 | Project verification | ✅ | Restrained project-info block + verification links |
| 12 | NDA projects | ✅ | `nda` flag + withheld-identity treatment |
| 13 | Private evidence packs | ✅ | `docs/EVIDENCE_PACK_TEMPLATE.md` — folder structure, permissions-per-artifact, registry linkage |
| 14 | Case study levels | ✅ | flagship / standard / verified-entry in schema |
| 15 | Discovery & filtering | ✅ | `CaseExplorer` — discipline/industry/technology/platform/AI |
| 16 | Client proof | ✅ arch / ⛔ data | Component + registry live; renders nothing until permitted names arrive (A1/A2) |
| 17 | Testimonial system | ✅ arch / ⛔ data | Schema slot exists; quotes pending (A7) |
| 18 | Video client stories | ⬜ | Needs videos (E3) |
| 19 | Third-party trust | ✅ arch / ⛔ data | IndependentlyVerified component renders only with real profiles (C1) |
| 20 | Certifications & recognition | ✅ arch / ⛔ data | Typed registries with expiry-aware rendering (expired never show); empty until evidenced (C3/C4) |

## Trust & enterprise

| Part | Topic | Status | Notes |
|------|-------|--------|-------|
| 21 | Enterprise Trust Center | ✅ | `/trust` live |
| 22 | Ownership positioning | ✅ | "Your product remains yours." anchors /trust |
| 23 | Enterprise page | ✅ | `/enterprise` live |
| 24 | Company profile | ✅ | `/company-profile` printable, canonical-facts driven |
| 25 | About page depth | 🟡 | Philosophy (3 crafts) + "Built by specialists." shipped; leadership + timeline still need input (B9/B10) |
| 26 | Company timeline | ⛔ | Needs real milestones (B10) — never invented. Demo timeline is gated |
| 27 | Team credibility | ✅ arch | Expertise groups live on About; named seniors pending (B9) |

## Process

| Part | Topic | Status | Notes |
|------|-------|--------|-------|
| 28 | Delivery process depth | ✅ | Deliverables under each phase on homepage |
| 29 | Phase deliverables | ✅ | Per-phase deliverable lists |
| 30 | Project transparency | ✅ | "No black-box development." strip + portal claims |
| 31 | Client portal strength | 🟡 | Portal exists (milestones, invoices, meetings); roadmap for approvals/docs staging |
| 32 | Meeting workflow | ✅ | Full lifecycle already in platform |

## Services / industries / AI / technology

| Part | Topic | Status | Notes |
|------|-------|--------|-------|
| 33 | Service architecture | 🟡 | 10 services live; spec's full map assessed — no invented services |
| 34 | Service page standard | ✅ | All 10 services carry the full standard: fit/when-not judgment, architecture, integrations, security, quality, after-launch, proven-by links |
| 35 | Content may be rewritten freely | ✅ | Policy adopted |
| 36–43 | Writing standards (human voice, no clichés, judgment, say no, concise) | ✅ | Applied in all new copy; audit pass for legacy copy in Phase 3 |
| 44 | Helpful-before-selling content | ✅ | 22 articles: decision guides, buyer guides, honest education — reader learns even without contacting Savo |
| 45 | Decision/comparison guides | ✅ | All 9 shipped: Flutter vs native, RAG vs fine-tuning, Next.js vs SPA, custom vs SaaS, build vs buy, monolith vs microservices, PostgreSQL vs NoSQL, web vs mobile, AI agent vs workflow |
| 46–47 | AI positioning + production AI | ✅ | Production AI section on /ai-agents: grounding, guardrails, evals, observability, cost, fallbacks |
| 48 | AI agents page depth | ✅ | Mechanics (agent vs chatbot, tools, authorization, memory, retrieval, approval, failures, evaluation) + where agents are NOT useful + related-work links |
| 49 | AI automation | ✅ | Custom practice page: workflow categories (incl. appointments, lead qualification, triage), human-review governance, platform judgment |
| 50 | Technology authority | ✅ | /technology — six families with why + where-it-fits |
| 51 | Architecture authority | ✅ | Architecture judgment grid on /technology (modular-first, API-first, events, caching, multi-tenancy, migrations) |
| 52 | "Designed beautifully. Engineered seriously." | ✅ | Homepage ink section with nine engineering qualities |
| 53–55 | Industry authority + standards | ✅ | All 10 industries: real challenges, operational workflows (real-estate at full Part 55 depth), technology, integrations, security, honest AI opportunities, cross-links |

## Global & insights

| Part | Topic | Status | Notes |
|------|-------|--------|-------|
| 56 | Engagement models | ✅ | /enterprise models with honest tradeoffs |
| 57 | Post-launch | ✅ | "Launch isn't the finish line." homepage section |
| 58 | Global delivery accuracy | ✅ | Presence model (hq/office/market) enforced in facts registry |
| 59 | International content rules | ✅ | No city spam; location pages only for real offices |
| 60 | Insights as publication | ✅ | 22 articles across four clusters (AI, Engineering, Delivery, Design) |
| 61–63 | Originality, research, expert authors | 🟡 | Author model exists in schema; authors + research Phase 6 |
| 64–65 | Buyer guides / problem-based content | ✅/⬜ | All 7 buyer guides live (choosing a company, evaluating AI, mobile questions, discovery, code ownership, fixed vs dedicated, proposal review); problem-based pages remain Phase 6 |

## Search & machines

| Part | Topic | Status | Notes |
|------|-------|--------|-------|
| 66 | SEO foundation | ✅ | Canonical, sitemap, robots, metadata, OG all in place |
| 67 | Search intent classification | 🟡 | Applied to new pages; legacy pass Phase 4 |
| 68 | Keywords inform, not control | ✅ | Writing standard |
| 69 | Entity SEO | ✅ | Brand hierarchy documented (site.ts); sameAs verified profiles |
| 70 | Structured data | ✅ | Organization/WebSite/Breadcrumb/WebPage; Article/Person expand with authors |
| 71 | AEO | ✅ | HomeFaq + llms.txt answer the Part 71 questions directly |
| 72 | GEO | ✅ | Machine-readable HTML, semantic structure, llms.txt + llms-full.txt (refreshed with buyer-track pages + insights publication) |
| 73 | AI crawler policy | ✅ | Explicit allow list in robots.ts (GPTBot, OAI-SearchBot, ClaudeBot…) |
| 74 | Sitemaps | ✅ | Canonical-only; new routes added |
| 75 | IndexNow | ⬜ | Needs key + deployment (production concern, not local) |
| 76–78 | GSC / Bing / log analysis | ⬜ | Production operations, post-launch |
| 79 | Machine readability | ✅ | Facts in semantic HTML, never canvas/images |
| 80 | Savo knowledge graph | 🟡 | Registries (facts/claims/case schema) are the nodes; graph layer Phase 6 |
| 81–84 | Ask Savo (grounded, discovery, handoff, no hallucination) | ✅ | Deterministic retrieval over 45+ knowledge entries incl. per-industry project discovery (Part 83 pattern); unknown → human handoff with qualification + context (Part 84 was already built); no-hallucination enforced by design + tests |

## Conversion & ops

| Part | Topic | Status | Notes |
|------|-------|--------|-------|
| 85 | Conversion journeys | ✅ | docs/CONVERSION_JOURNEYS.md maps all 8 personas; persona quick-paths strip on /enterprise |
| 86 | Contextual CTAs | ✅ | "Talk to a senior consultant", "Company profile", dossier CTAs |
| 87 | Executive CTA | ✅ | /enterprise closing section verbatim concept |
| 88 | Progressive forms | 🟡 | Ask Savo Mode B is 6-step conversational qualification; main enquiry drawer remains single-panel (follow-up) |
| 89 | Analytics events | ✅ | case_study_viewed / case_study_completed (dwell beacons) / case_filter / case_study_open wired; taxonomy in analytics.ts |
| 90 | Business metrics | ⬜ | Analytics admin exists; qualified-lead views Phase 5 |
| 91–92 | Performance | ✅ | RSC-first, GSAP-light, budgets enforced by design; measurement Phase 4 |
| 93 | Accessibility | 🟡 | AA contrast tokens documented; full audit Phase 4 |
| 94 | Mobile experience | ✅ | Responsive components throughout |
| 95–96 | Security & legal | 🟡 | Platform hardening exists (rate limits, captcha, sessions); wording review D1–D3 |
| 97 | Admin & CMS | 🟡 | Facts/claims/case-studies manageable in code + admin; admin editing for new registries Phase 5 |
| 98 | Proof dashboard | ✅ | `/admin/proof` live |
| 99 | Content inventory | ✅ | `/admin/content-inventory` — lifecycle, author, review dates per item |
| 100–103 | Content quality gates | ✅ | `docs/CONTENT_QUALITY_GATE.md` (gate checklist + AI-pattern scan + link checks + machine surfaces); read-aloud on key copy |
| 104–105 | Topical clusters / no spam | ✅ | Policy; cluster build-out Phase 3 |
| 106–109 | Research/PR/GitHub/governance | ⬜→🟡 | Governance cadence attached to registries; research Phase 6 |

## Homepage & measurement

| Part | Topic | Status | Notes |
|------|-------|--------|-------|
| 110 | Homepage architecture | ✅ | Full spec flow: proof strip, client-proof slot, enterprise-trust band, global delivery, insights, process+deliverables, FAQs, final CTA |
| 111 | Proof strip | ✅ | Typography + whitespace; verified facts only |
| 112 | Proof not promises | ✅ | Editorial connector section |
| 113 | Footer IA | ✅ | Enterprise column added (5 groups) |
| 114–115 | Baseline & measurement | ⬜ | Production analytics, post-launch |
| 116 | Information required tracker | ✅ | `INFORMATION_REQUIRED_FROM_SAVO.md` |
| 117 | Zero fabrication | ✅ | Enforced in registries, dashboards and copy |
| 118 | Implementation phases | ✅ | Phase 1 largely done; Phase 2 architecture done, data pending |
| 119–127 | QA perspectives, tests, philosophy | 🟡 | Applied continuously; formal QA pass before go-live |

## Where this leaves us

- **Phase 1 (Truth & Cleanup):** ✅ registries + cleanup of stale DB demo rows
- **Phase 2 (Proof & Trust):** architecture ✅ — content ⛔ on Savo inputs A1–A7
- **Phase 3 (Content & Authority):** next major build phase, unblocked
- **Phase 4–6:** scheduled per roadmap
