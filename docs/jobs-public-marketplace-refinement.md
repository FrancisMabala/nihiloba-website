# Jobs public marketplace refinement — 1 November 2026

## Audit and boundaries
The existing public Job DTO projects canonical offer type, organization identity, salary visibility and exact compensation period. Personal employers remain anonymous; public search runs over privacy-projected values. Employment remains separate from Services. Publication, expiration, moderation, matching and notification policy are unchanged.

The defect was frontend employer filtering after pagination: a page could appear empty although matching jobs existed later, and the count was misleading. The public list now accepts `view=professional|individual` and canonical `category` and applies them before counting and slicing. Keyword search also includes the existing localized category label. No title-based employer or category inference is introduced. Existing server-side projection still scans eligible rows; this change does not claim database-level search optimization.

Direct public applications currently use opaque WhatsApp continuations. The existing canonical application service checks the current account/reference pair, selected seeker profile, offer eligibility, duplicate applications and replay keys. My Applications remains account-authorized. External applications retain their own redirect/instruction capability and are not represented as SHIDA submissions. No new public browser submission form or fabricated success screen was introduced.

Saved jobs/follows already have protected continuation links; no decorative persisted heart state is added. Public job reporting currently uses the existing support-email action, while candidate invitation/application reports remain protected domain actions. There is no new anonymous moderation endpoint or automatic penalty. Dedicated public reporting and browser-native application forms remain separately scoped.

## Frontend phases
- Compact header, existing Personal/Business posting destinations, search and canonical category icons.
- Unified compact cards, authoritative employer chips, exact compensation units, deduplicated public location, real publication/deadline data only.
- Structured detail, existing employer profile, eligible same-category recommendations, safety notice and explicit WhatsApp handoff with My Applications.
- Four-language new text, responsive cards/filters/details, existing loading and distinct empty/error/unavailable states.
- No production fixture records. Browser fixtures run only behind an explicit process-local .fixture.invalid guard and reject external networking.

## Ownership, privacy and infrastructure
No ownership/authentication, permissions, private-contact consent, lifecycle, notification, WhatsApp template or financial changes. Urgent templates remain enabled. No dependencies, environment settings for deployment, workers, cron or migration. Alembic remains 0214.

## Validation and release
Focused public API, privacy, application ownership/idempotency, WhatsApp/dashboard parity and durable account-pair tests: 83 distinct tests pass (the corrected new fixture was rerun with all seven public marketplace tests). Compile and duplicate translation-key checks pass. Frontend unit/browser/build results are recorded in the website counterpart.

The previous Services release is live: backend 01160cef70780ca62800caf3debf75415a1191b9, website 52f5d7a0d2ffceb0afd0cf042b1b0b0ea728d352, backend deployed first. Both exact sources and Live status were verified in Render. No GitHub commit-status checks were reported for that release.

Jobs production deployment was explicitly authorized by the subsequent Restaurants request, after validation. Deploy backend filter support before website. Rollback uses the preceding Services commits, backend after website rollback if needed; no schema rollback is needed.

Website validation: 61 focused unit tests and 9 browser tests pass. Production webpack build, TypeScript and scoped ESLint pass. Rendered desktop/mobile screenshots were inspected at 360, 390, 768, 1024 and 1440 pixels. Browser fixtures cover employer/category/search filters, exact month/day/intervention units, empty/error/expired states and FR/LN/SW. No production applications were submitted.
