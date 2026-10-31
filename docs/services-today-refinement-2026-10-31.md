# Services Today refinement — 31 October 2026

## Release status

The preceding Wenze public marketplace release is live: backend `07e6931c6d67e5eba58ce319b9a074d40a753439` (Render `dep-dbj0d9ss728c738gc09g`), followed by website `eb9f6e65210b9459c8d453eecf0a49ea0427df57` (Render `dep-dbj0fv8n74is73e1tvdg`). Remote main SHAs and both Render Live states were verified. The live product safety notice and correct-shop reporting form were inspected without submitting a complaint. GitHub returned no combined commit statuses; this is not a claim of green CI.

This Services implementation is a separate validated feature release. The brief requires authorization for this specific deployment; it has not been deployed. No backend, migration, production data, authentication or urgent WhatsApp template changes are included. Website rollback target is `eb9f6e65210b9459c8d453eecf0a49ea0427df57`.

## Implementation batches

1. Daily workspace: compact illustrated header, real KPI cards, priority attention queue, actual appointment timeline, expandable ongoing work, quick actions and matching opportunities. Published services remain a compact secondary summary. Files: `services-today.tsx`, `services-today.css`, `services-today-opportunities.tsx`, `services-today-model.ts`, `services-today-copy.ts`, and integration in `services-management.tsx`.
2. Navigation and regression validation: grouped existing provider tools without removing Counter, Money, reports, templates, sharing or settings. Updated `services-provider-navigation.tsx`; refreshed browser fixtures for the existing Counter endpoint and current WhatsApp sign-in label. No sign-in behavior changed.

## Reuse and data audit

- Existing provider Today endpoint supplies authenticated direct requests, pending reservations and unread-message previews. Each queue is capped; `has_more` is represented as a lower-bound count, never an exact total.
- Existing reservations endpoint supplies ongoing accepted, confirmed and in-progress work. References are deduplicated; completed records and proposals are not counted as ongoing work. Its bounded first page is explicitly a preview.
- Existing calendar supplies appointment references, titles, timestamps and statuses. Today's date uses the existing provider timezone; midnight boundaries are tested. Calendar presentation exposes no new customer contact information.
- Appointment UI adapts to time-slot capability and actual scheduled data. A flexible provider with no scheduled work gets a useful request-focused dashboard. Failed data remains unavailable rather than becoming zero or all-clear.
- Existing available-request endpoint retains category and service-area matching, eligibility and authentication. The selected offering is passed to the existing opportunities workflow. Opportunities are separate from incoming customer requests. No invented proximity distances or customer jobs.
- Existing ServicesCalendar, ServicesOpportunities, transaction detail workflows, provider overview, workspace icons, category copy and date formatting are reused. Server-owned permission checks remain authoritative; denied requests clear the workspace, and requests are scoped to the active session with cancellation and timeouts.
- Quick actions navigate to existing functionality. No fabricated reply-later, rescheduling, rating, prep-time or availability actions were added.
- EN, FR, LN and SW use the existing localization pattern. Category presentation uses existing service labels; scheduling depends on capability rather than a profession-name guess.

## Validation

72 focused tests passed: 37 model, calendar, account navigation, gateway and proposal-routing checks; 35 browser checks across the new Today, existing Today recovery, provider navigation and workday suites. Targeted ESLint, TypeScript and production build passed. `git diff --check` passed. The full backend suite was not run for this frontend-only change.

Browser evidence includes populated layouts at 360, 390, 768, 1024 and 1440 pixels; empty flexible providers in four languages; empty scheduled providers; active-work expansion; service selection; exact request navigation; loading, partial failure, complete failure and recovery. Existing browser checks cover sharing, mobile tools, authentication and account access. Isolated request fixtures reject unexpected writes; illustrative records were never inserted in production.

Screenshots: [desktop populated](evidence/services-today/populated-1440.png), [mobile populated](evidence/services-today/populated-390.png), [empty mobile](evidence/services-today/empty-en-390.png), [empty appointments](evidence/services-today/empty-appointments-1440.png), [partial failure](evidence/services-today/partial-error.png), [full failure](evidence/services-today/full-error-390.png). Existing navigation evidence is refreshed under `evidence/shared-workspaces` and `evidence/seller-workspace`.

Visual review confirms the reference hierarchy, pastel summaries, attention-first order and responsive cards. The actual timeline omits invented calendar filler. Opportunities appear below quick actions and the service summary stays secondary. Screenshots use controlled test records, not the signed-in provider's live workload.

## Limits and next release check

Preview endpoints do not provide exhaustive analytical totals. No new totals API was invented. Public opportunities have existing broad location data, not reliable distance measurements. Scheduled work remains distinct from service publication and customer proposals. After specific release authorization, deploy the website and verify its exact live commit, then inspect both an empty and populated authorized provider account. Backend rollout and migrations are unnecessary.
