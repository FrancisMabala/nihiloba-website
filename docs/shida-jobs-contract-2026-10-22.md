# Anonymous public Jobs contract — 22 October 2026

The homepage Jobs feed failed because the backend intentionally represents individual posters with `identity_type: individual`, `public_ref: null`, and `slug: null`. The website incorrectly required a public employer reference for these records, so one legitimate individual job rejected the entire collection. The public job itself still has a valid `JOB_` identity.

The public client now accepts this specific anonymous case only for direct individual jobs. Organization, external job and employer-detail identities remain strict. Missing, malformed or numeric references are still rejected; anonymous records cannot supply a profile slug or claim employer-follow capability. No private identity is synthesized or exposed, and unknown fields remain discarded.

Employer links and sitemap enumeration share `publicJobEmployerKey`, which excludes anonymous and individual identities (including legacy personal references). Valid job links and organizational profiles remain available. Job detail, lifecycle, salary visibility, application and authorization rules are unchanged. No Backend change, migration, production data operation or new configuration is required.

Validation: 79 focused contract, parser, job and homepage tests passed; production build including TypeScript and targeted ESLint passed. A read-only check against the real public API parsed three jobs and all three detail pages and rendered the discovery feed. The browser check in `tests/browser/jobs-home-review.mjs` matches homepage titles and links to actual public API records at 390 and 1440 px in EN/FR/LN/SW, checks job detail navigation and excludes anonymous employer sitemap URLs. Evidence is in `docs/evidence/jobs-contract/`.

Render inspection found that automatic deployment is disabled following a prior commit-specific deployment. Before this fix, the live website was still at `4e538ab`, preceding the homepage redesign. Release requires a manual deployment of the validated commit; keep the existing automatic-deployment preference unchanged. Confirm Render's live SHA and the actual public homepage after release.
