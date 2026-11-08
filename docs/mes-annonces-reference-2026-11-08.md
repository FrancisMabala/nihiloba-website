# Mes annonces reference correction — 8 November 2026

Replaced the old promotional overview in the individual-selling workspace with the approved compact summary, five primary status filters, draft progress rows and selling-advice sidebar. The My Space shell and boutique management destinations remain intact. Unpublished listings and transactions in progress remain reachable under secondary tools; orders remain reachable from the sidebar.

Counts come from complete authorized product and saved-progress collections, following the backend scan cursor even across sparse pages. Filters and twenty-row pagination reuse that snapshot. All now includes saved progress, which the previous rendering omitted. Failed/incomplete scans never replace totals with partial results. A defensive 100-page ceiling raises an error rather than displaying truncated totals; very large accounts still incur multiple existing API requests and may eventually benefit from a server aggregate.

Canonical backend listing states are preserved. Sold/unavailable remains explicit because unavailable does not establish a verified sale or payment. Onboarding progress and canonical unpublished products remain distinct. Draft save, resume, delete, publication, ownership, operation keys, WhatsApp behavior and urgent templates are unchanged. Existing 24-hour progress retention remains documented in secondary tools; this release introduces no retention or schema change.

## Validation

- Four pagination unit tests passed: sparse pages, failures, invalid cursors, inactive sessions and safety limit.
- Type checking and focused ESLint passed; git diff --check passed.
- Production webpack build passed. Default local Turbopack build could not resolve Next through the pre-existing cross-worktree dependency junction; no new dependencies were installed. Render retains its normal build command and non-junction npm installation.
- All 48 Playwright tests passed using isolated synthetic API fixtures: FR/EN/LN/SW at 360, 390, 768, 1024 and 1440 pixels, real fixture-derived counts, all-state listing visibility, draft filtering/progress, sparse pagination, save/resume, upload retry, publication retry, sign-out, and confirmation success/failure/focus/Escape.
- French 1440 and 390 pixel screenshots visually reviewed. Evidence retained in test-results/mes-annonces-{locale}-{width}.png (synthetic records, not production accounts).

## Release

Website-only release; no database migration or backend deployment. Push the validated commit to origin/main, manually trigger the existing website Render service (automatic deployment is off), and verify its exact live commit. Existing unrelated worktree files and evidence are preserved.
