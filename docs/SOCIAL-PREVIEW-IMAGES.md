# Owner-supplied social preview images

Prepared for v7.12.3 promotion; deployment is verified separately from source QA.

The site owner supplied sixteen PNGs in `Downloads/OG IMAGES`, named for their intended pages. Original bytes, filenames, embedded artwork and dimensions are preserved; no crop, redesign, recompression or body-image replacement. Each file is under 5 MiB. The homepage card is 1734×907; the other fifteen are 1731×909. Metadata reports these measured dimensions, not an invented 1200×630 crop.

## Mapping

| Supplied file | Page / section |
| --- | --- |
| savo-og-home.png | `/` |
| savo-og-who-we-are.png | `/about` (Who We Are) |
| savo-og-ai.png | `/ai-agents`, `/ai/*`, `/ai-agents/*`, `/services/ai-agent-development` |
| savo-og-careers.png | `/careers`, `/careers/apply` |
| savo-og-case-studies.png | `/case-studies` and published detail pages |
| savo-og-contact.png | `/contact` |
| savo-og-enterprise.png | `/enterprise` |
| savo-og-hire-resources.png | `/hire` and published role pages |
| savo-og-industries.png | `/industries` and industry detail pages |
| savo-og-insights.png | `/insights` and published article pages |
| savo-og-meetings.png | Private `/meeting/[token]` invitation/scheduling pages |
| savo-og-mobile-app-development.png | `/services/mobile-app-development` |
| savo-og-product-design.png | `/services/ui-ux-design` (Product & UX Design) |
| savo-og-services.png | `/services` and remaining service pages |
| savo-og-start-a-project.png | `/start-a-project` (`/start` redirects here) |
| savo-og-web-development.png | `/services/web-development` |

Dedicated service images take precedence over the general Services card. Matching respects URL path boundaries and accepts canonical absolute URLs, trailing slashes, queries and supported base-path hosting. Main navigation's AI destination is `/ai-agents`; no new `/ai` landing route is invented.

The supplied section art also replaces the former editorial-photo OG override on industry/article detail pages. Their on-page photographs, titles, article type, publication timestamps, canonical URLs and underlying content records remain unchanged. Explicit future `openGraphFor({ images })` choices still override the default mapping. Routes with no corresponding supplied image retain their existing generated page-aware fallback; the legacy `/share-image` endpoint remains available for old links.

## Implementation and privacy

- Public artwork: `public/images/og/`, with owner-provenance/hash/dimension sidecars.
- Generated registry: `src/constants/social-images.ts`.
- Route resolver: `src/lib/social-images.ts`; shared metadata integration: `src/lib/seo.ts`.
- Content-derived `?v=<12 hex characters>` image URLs give changed artwork a new cache key while retaining the owner's filenames.
- Open Graph and Twitter/X use the same image, alt and page title. Next's existing Twitter fallback is verified in actual crawler HTML. The private meeting route explicitly declares both images.
- Meeting artwork/metadata stays generic: invitation tokens, client names and query parameters never enter an image URL. Existing noindex/nofollow/nocache and no-referrer controls remain.
- No changes to visible layouts, email automation, applicant handling, permissions, indexing gates, metadata titles or descriptions.

Re-import replacement owner artwork with:

```sh
node scripts/import-social-images.mjs '/path/to/OG IMAGES'
```

The importer validates all sixteen inputs before writing, preserves PNG bytes, records SHA-256 and measured dimensions, and regenerates versioned asset metadata. Rights/provenance reflect the owner's supplied assets, not an independent copyright certification.

## Verification

- Lint, typecheck and production build passed.
- **1,952 tests passed / 16 skipped**, including every named mapping, section/alias precedence, file hashes/dimensions, private meeting metadata, article metadata, explicit-image overrides, path boundaries and base-path support.
- `scripts/verify-social-images.mjs`: **250 GET-only assertions** across 18 public paths, Twitterbot and Facebook crawler user agents, and all sixteen PNG responses. Checks cover one correct absolute OG/Twitter image, measured dimensions/alt, crawler head placement, title parity, MIME type and original served bytes. Private meeting metadata is additionally covered by existing mocked page tests and a source/privacy guard; no genuine meeting token is needed.
- All sixteen supplied artworks reviewed together in a private contact sheet. No new art was authored. No real application, email, meeting, CMS record or social-provider account was modified during QA.

Social platforms can cache previews of previously shared links. A new deployment does not itself force a provider to re-scrape an old page; use its sharing debugger/refresh mechanism when needed.
