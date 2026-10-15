# Restaurant Insights — INS01 — Partial

Implemented in Backend and NIHILOBA Website for the Personal solo seller workspace.
The [Backend handoff](../../Backend/docs/restaurants_personal_insights_2026_10_15.md)
contains the approved disclosure policy, exact ownership boundary, lifecycle,
measurement definitions, changes, deployment ordering and limitations.

Insights now has its own workspace navigation group outside Settings. It separates
current Follow inventory from delayed customer-interest blocks and existing
selectable order-period statistics. Basic access remains Free. Item details are
explicitly opened before a view is measured; menu appearance, SSR/metadata fetches,
prefetches, seller previews and automated browser traffic are not views.

Authenticated interest only: anonymous visitors are unmeasured. WhatsApp menu-button
requests and exact item selections are observed; delivery/read receipts and Meta
totals are not views. Direct-link menu entry/free-text enquiries, guest/in-person
order starts, and hostile headful automation remain coverage/release limits. No
conversion percentage or follower trend is fabricated. Current followers, retained
order counts and disclosed event counts have different periods and semantics.

## Verification

- Backend Restaurant selection: **200 passed** (528.71 s).
- Shared analytics/identity/webhook selection: **156 passed** (199.83 s).
- Final Insights/statistics/Follow rerun: **37 passed** (99.46 s).
- Website focused units: **127 passed**, 9 test project/file executions.
  Command: `npm test -- tests/restaurant-insights.test.ts tests/restaurant-seller.test.ts tests/restaurant-c1e.test.ts tests/restaurant-basic.test.ts tests/restaurant-checkout.test.tsx`.
- `npm run typecheck`: passed. ESLint on all changed TS/TSX implementation and
  test files: passed. Website repository and Backend changed-file diff checks passed. The full Backend diff check encounters pre-existing inaccessible tracked pytest temporary paths. Backend Python compilation,
  duplicate translation-key check and single Alembic-head check passed.
- Final `next build --webpack`: passed in a source-identical isolated copy under
  Backend `tmp/insights-website`. The normal Turbopack/dev path hit an unreadable
  pre-existing Website temporary directory. Existing legal content was also copied
  into the isolated build. No application workaround or permissions change shipped.
- Production Playwright: **17 passed** (28.9 s), using the existing opt-in,
  network-isolated fixture loader. Twelve final visual cases cover FR/EN/LN/SW at
  360, 820 and 1440 pixels; three cases prove empty/low-data/interest-outage behavior
  while order counts remain usable; two exercise real DOM collection/exclusion.
- Baseline production captures: **12 passed**. Evidence contains 12 before, 12
  after and 12 expanded-source PNGs. No horizontal overflow in either final state.
  Representative final screenshots were visually inspected. Automated layout
  checks are not physical-device or human-language acceptance.

Evidence: [validation manifest](evidence/restaurant-insights-2026-10-15/validation.json),
[build log](evidence/restaurant-insights-2026-10-15/build.txt),
[Restaurant tests](evidence/restaurant-insights-2026-10-15/backend-restaurant.txt),
[shared tests](evidence/restaurant-insights-2026-10-15/backend-shared.txt),
[final rerun](evidence/restaurant-insights-2026-10-15/backend-final.txt),
[phone FR](evidence/restaurant-insights-2026-10-15/after-fr-360.png),
[tablet LN](evidence/restaurant-insights-2026-10-15/after-ln-820.png),
[desktop SW](evidence/restaurant-insights-2026-10-15/after-sw-1440.png).
These runs overlap; do not sum them as unique coverage.

## Release and next batch

**Partial.** The full fresh Backend suite was started and interrupted without a
completed result. Staging/PostgreSQL concurrency and cleanup, a real WhatsApp phone,
physical-device checks, native FR/EN/LN/SW review and broader regression acceptance
remain gates. Before stronger production coverage claims, review hostile-bot and
unmarked manual-test classification. No claim of complete visitor coverage.

No migration; current Alembic head **0166**. No new environment variable, cron,
worker, Meta template, dependency or paywall. Existing order activation/no-backfill,
staff permissions, Wenze, Employment and Business Dashboard behavior are preserved.
Deploy Backend before Website only after separate release authorization. Preserve
activation/replay/release records during rollback; never backdate measurement.
No deploy, production-switch modification, commit or push occurred.

Suggested commit: `Add disclosure-controlled Personal Restaurant Insights`
