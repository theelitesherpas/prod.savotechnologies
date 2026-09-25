# SAVO INPUT REQUIRED — blocking inputs before production launch

Everything Savo must supply (or explicitly approve) before flipping
`NEXT_PUBLIC_CONTENT_MODE=production` + `NEXT_PUBLIC_INDEXABLE=true`.
Items are ordered by blocking impact. See `DEMO_CONTENT_REPLACEMENT.md` for the full table.

## Must supply (production suppresses these until received)

1. **Verified company statistics** — projects delivered, clients supported,
   industries served, markets reached. (Production currently shows pending "…" slots.)
2. **Real case studies** — client name (or anonymized industry), sector, services, stack,
   and **client-approved metrics** with source/reference for each number, plus written
   publication permission per project.
3. **Team & leadership rosters** — names, roles, bios, photos, LinkedIn URLs, contact
   emails, with each person's consent to publish.
4. **Company timeline** — verified milestones (dates + events) if the About story section
   is to render in production.
5. **Regional presence confirmation** — for Switzerland, GCC, Australia, UK, US:
   physical office (verified address) or market/service presence (confirm wording).
6. **HQ street address & postal code** — Indore currently publishes city-level only.

## Must confirm (currently published as carried from version 1)

7. **Founding/incorporation year** — "2016" drives `foundingDate`, "since 2016" copy.
   Confirm the date and which one (founding vs incorporation) is public history.
8. **Contact channels** — `hello@savotechnologies.com`, `+91 75029 01234`,
   `careers@savotechnologies.com` (carried from v1; assumed approved).
9. **Hire-page process claims** — "matched in 48 hours", "two week paid trial",
   monthly rates (published v1 model; confirm still accurate).
10. **Social profile URLs** — footer links are platform homepages, deliberately excluded
    from schema `sameAs` until real URLs arrive.
11. **Registration identifiers** — CIN / GSTIN if they should appear publicly.

## Optional

12. Real client logos/brands for any "trusted by" strip (needs permissions).
13. Certifications actually held, if the trust strip should cite them.
14. Approved client testimonial(s) — quote, name, role, company.
15. GA measurement ID (`NEXT_PUBLIC_GA_ID`) for analytics.

## Launch checklist

- [ ] All blocking inputs above supplied or explicitly waived
- [ ] Demo rows replaced or consciously suppressed (production suppresses automatically)
- [ ] `NEXT_PUBLIC_CONTENT_MODE=production` set on the deployment
- [ ] `NEXT_PUBLIC_INDEXABLE=true` set **only** on savotechnologies.com
- [ ] `npm run build` green (content guard validates the production content set)
- [ ] Spot-check /about, /contact, /case-studies and JSON-LD for pending slots
