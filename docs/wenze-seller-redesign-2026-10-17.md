# Wenze seller workspace redesign — 17 October 2026

## What changed

Today previously led with all-date work and requested the UTC financial dashboard. It now leads with local-day sales, orders created that day, items sold and current followers. The selected day is explicit: Kinshasa by default, or Lubumbashi (preselected for a shop whose city is Lubumbashi). This is a display choice, not a newly persisted shop timezone policy. A minute refresh updates the day across midnight. Existing Reports and scheduled reports retain their documented UTC periods.

Completed fixed-price orders, completed negotiated purchases and active priced in-store sales share the existing canonical sales union. Reversed in-store sales are excluded. CDF and USD are never added together. Recorded expenses use their seller-entered occurrence date. Known-cost profit is labelled as profit before expenses, with an incompleteness message. No figure claims payment receipt or accounting profit. Existing Pro/pilot authorization remains authoritative; Free fallback does not invent zero financial figures.

Current followers and current follows created during the selected day are aggregated from existing relationship records. No follower identities are exposed. This is not a historical follow/unfollow event ledger. Reviews reuse the existing visible-review summary and independent-author filtering. Today's top eight sold product/variant lines include quantity, amount and product photos; full history remains in Reports. Orders today counts orders/requests created that day, including those subsequently cancelled; sales count only completed commercial activity.

Older unfinished orders and current low stock remain in a clearly separate attention section. Missing requests show unavailable values and retry guidance rather than false zeroes.

Shop management now separates Products, Shop details, Delivery & pickup and Settings. Product thumbnails and formatted prices appear in desktop rows and labelled mobile cards. A single Add product action starts an existing draft, with optional details preserving that draft. Editing replaces the product list instead of opening beneath it. Shop profile photos can be uploaded, replaced and removed, and are shown on the public boutique header. The public API and database already had profile-image fields; protected upload/attachment support was missing.

Account information is in Settings. During the pilot it says that all seller tools are available without a subscription; internal access-source fields, empty expiry dates and contradictory trial requests are removed. Useful product limits remain visible. Hide/archive/restore/show confirmations use a keyboard-accessible native HTML dialog styled for Nihiloba, with distinct plain-language explanations. Existing inventory, expense, cost and import confirmations reuse it. Unsaved-work navigation retains the existing platform guard.

## Backend capability audit

| Seller capability | Existing backend support / web destination |
| --- | --- |
| Shop create/edit, visibility, archive/restore, preview | Existing management services; Shop details / Settings |
| Pickup, delivery fees, public-address consent | Existing fulfillment API; Delivery & pickup |
| Product create/edit, 1–5 photos, reorder/replace, stock, variants, conversion, duplication | Existing protected product APIs; Products / Manage |
| Fixed and negotiated order actions | Existing unified order APIs; Orders |
| CSV/XLSX import, mapping, validation, photo correction, duplicate review, publication continuation | Existing import APIs; Add products from a file |
| Stock adoption/counts, thresholds, operational codes, movements, reservations | Existing shared Inventory APIs; Inventory |
| Quantity-only sales, priced sales and audited reversal/correction | Existing sales APIs; In-store sales |
| Purchase costs, history, valuation | Existing private finance APIs; Purchase costs / Reports |
| Expenses, categories, reversals, CSV | Existing expense APIs; Expenses / Reports |
| Rankings, comparisons, exports, scheduled PDF/XLSX | Existing report APIs; Reports / Scheduled reports |
| Daily local overview and follower/review counts | New exact-store `/today` projection over existing records |
| Shop profile photo | Existing storage/public projection; new upload target and revisioned `/profile-photo` adapter |

No unsupported billing, payment verification, marketing, follower identities or fabricated visitor analytics were added. Existing management functionality remains accessible.

## Security and persistence

Both new endpoints reuse current exact-store actor authorization; financial reads retain private-finance authorization. Photo attachment requires store-management authority, expected revision and an upload bound to the same actor/context/store/profile target. Product uploads cannot be substituted. Uploaded bytes use the existing supported-image checks, 8 MiB limit and hosted-media pipeline; arbitrary image URLs are never accepted from the client. Only the hosted URL is added to the seller projection. Storage identifiers and actor details stay private. Existing media-retention/reference protection is retained.

Migration `0169` follows `0168`, broadening the existing media-ledger target constraint to include `store_profile`. Existing shop profile columns are reused. No backfill, new dependency, environment variable, worker, cron or WhatsApp template is needed. Authorization, subscription policy, order/stock lifecycle and Organization management are unchanged. No Business Dashboard frontend files changed.

## Validation

- Website production webpack build and TypeScript: passed.
- Focused ESLint and git diff checks: passed.
- Personal gateway: 13 tests passed.
- New four-language browser journeys: 4 passed (daily numbers, mobile overflow, photo upload/save, settings, cancel/confirm hide).
- Existing seller browser suite: 24 passed (catalog, Inventory, costs, reports, schedules, retry idempotency, session expiry, setup gating, Free fallback, partial failure, deep links, four locales at 360px/1440px).
- Backend focused suite: 21 passed, including local date boundaries, sales/followers and foreign-seller denial, exact photo target, revision conflict, remove, role/grant checks, financial regressions, fresh SQLite migration preservation and PostgreSQL migration SQL compilation.
- Single Alembic head: `0169`. Python compilation and duplicate text key check passed.
- The first financial regression run exposed its existing pilot-setting mismatch (revoking a Pro grant cannot remove pilot access). Final entitlement regression run explicitly disabled pilot access; no product entitlement behavior was changed.

New previews are under `docs/evidence/wenze-redesign/`; browser screenshots use synthetic local data. No production data, WhatsApp messages, uploads or orders were changed. Full platform suite, live PostgreSQL migration/concurrency and actual hosted-media provider smoke tests were not run.

## Release

Local commits only. Deploy Backend with `alembic upgrade head` before deploying the website. The website's daily overview and shop-photo actions depend on those endpoints and the constraint migration. After authorized release, smoke-test an actual hosted photo upload and local-day overview. Existing historical module release gates remain open; these focused tests do not certify the whole platform. No push or deployment was performed.
