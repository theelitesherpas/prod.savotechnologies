# EVIDENCE PACK TEMPLATE (master spec Part 13)

Internal, per-project. Never published. Stored under the project's
private drive folder; referenced by the claim registry (`claims.ts`)
and the proof dashboard.

## Structure (one folder per project)

```
/project-<slug>/
  01-contract/          signed agreement, SOW, NDA
  02-proposal/          approved proposal, estimate basis
  03-approvals/         client sign-offs (case study, logo, testimonial,
                        metrics publication)
  04-delivery/          PM history export, sprint summaries, UAT notes
  05-artifacts/         design exports, Figma links, screenshots
  06-repos/             repo references (client-owned or archived)
  07-deploy/            deployment records, environments, monitoring links
  08-stores/            App Store / Play Store listings and links
  09-analytics/         performance reports, outcome measurements
  10-testimonial/       quote text, permission record, media
```

## Rules

- Reference, don't duplicate: store links to systems of record where the
  client owns the artifact (their repo, their store account).
- Permissions are per-artifact: logo permission ≠ case-study permission
  ≠ metric permission. Record each separately in `03-approvals/`.
- When the proof dashboard flags a claim, the evidence pack is where the
  answer lives. No evidence ⇒ status stays `awaiting-verification`.
- Confidentiality: the existence of a pack is not secret from the client;
  its contents are secret from everyone else, including other clients.
