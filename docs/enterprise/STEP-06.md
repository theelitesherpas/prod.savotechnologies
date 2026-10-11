# Step 06 — scope selected published-content reads

**Targeted query optimization only; no production readiness or scale certification.** The audit remains open at provisional **4/10**. No deployment, database migration, production read, mail, or provider access occurred. See [assessment](./ASSESSMENT.md) and [runtime/release prerequisites](./RUNTIME-OPERATIONS.md).

## Changes

- Case-study detail and image lookup now use one `findFirst` query for the validated slug, restricted to active Published `case-studies` records. This avoids scanning/decoding the entire image-bearing collection for consumers that only need one row. Collection readers and ordering/content behavior remain unchanged.
- Insights metadata lookup now uses one `findFirst` query for the validated slug, restricted to active Published `insights` records. Existing sanitization, slug filtering, metadata and publication rules are shared with the existing article mapper.
- Missing database, invalid slug, missing row and query failures fail closed to the existing not-found/empty behavior; warnings omit record data and credential details.

## Verification and limits

- Full local suite: **1,237 tests / 85 files passed**. Added mocked-query tests verify the exact publication predicates, query projection, invalid-slug behavior, and unchanged collection-reader behavior.
- `npm run typecheck` passes. `npm run lint` exits successfully with 0 errors / 21 warnings (existing warnings documented in Step 05).
- Isolated production-content/nonindexable build passes with `DATABASE_URL=''` and mail delivery disabled. Next.js still warns that the middleware convention is deprecated.
- These are unit/build checks, not query plans or load tests. The case-study page still reads the published collection to assemble its related cards, and the Insights detail renderer retains its collection read for related content/body. JSON-embedded image storage, connection-pool limits, database indexes, production query plans and representative concurrent load remain unaudited/unmeasured. Do not claim a demonstrated latency or capacity improvement.
