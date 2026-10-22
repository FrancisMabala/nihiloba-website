# Complete Wenze program — 23 October 2026

Working report; not a production-release claim. Backend companion:
`shida-backend/docs/wenze/COMPLETE_PROGRAM_2026_10_23.md`.

## Existing released foundation

Delivery integration and Quick Sell were verified live on 22 October. Preserve
their canonical APIs, private delivery snapshots, order lifecycle and exact Personal
or Organization authorization. See `quick_sell_batch_2.md` for release evidence.

## Batch 3 — locally validated

My Space → Manage now offers My listings / Mes annonces. Existing individual
contexts no longer appear as full shops in the Personal activity list. The existing
Quick Sell route hosts status-filtered listings, saved drafts, published-photo
management, hide/show, archive/restore, public links and the canonical orders area.
No separate dashboard or identity was created. Filters operate over all retrieved
listing pages, not just the first twenty items.

Explicit draft saves reuse protected backend workflows and a 24-hour lifetime;
reload restores the details and ordered photos. Final confirmation remains required
for publication. The existing session boundary clears private state on sign-out or
account change. New provenance labels distinguish actual completed SHIDA orders,
seller-reported outside sales and unknown historical zero stock. No label asserts
verified payment. Price, media and lifecycle actions retain canonical backend checks.

Validation: production build/TypeScript and scoped ESLint passed; 22 gateway/activity
unit tests passed; 12 Chromium browser cases passed across FR/EN/LN/SW at 390, 768
and 1280 pixels. These cover draft save/reload/resume, long names, upload failure,
ambiguous publication retry, session loss and horizontal overflow. Screenshots:
`evidence/wenze-program/`. Images in these previews are synthetic fixtures.
Backend focused suite: 83 passing tests. Physical-device and provider acceptance
are not claimed. Candidate backend migration 0199 must precede website deployment.

Batch 4, Batch 5, final cross-batch checks, capability inventory, deployment and
École handoff remain in progress.


## Batch 4 — management refinement

Audit: Today already used a selected local day and separated currency totals;
Checkout already handled immutable basket receipts and ambiguous retries; Orders
already shared fixed/negotiated adapters. Repeated shop identity and switching,
duplicated Share actions, labels above every shop tab, and unstructured reporting
were presentation defects. Stock had canonical advanced tools but no visible name
search or availability filters. Money cost coverage was not a conflicting formula:
sales coverage is revenue-weighted over the selected period; current inventory
coverage counts currently valued targets. They must not be presented as equivalent.

Implemented one shop identity/control and one Share shop action; a switcher only
when multiple regular shops exist. Individual contexts redirect to My listings.
The nested Orders selector is suppressed when the enclosing workspace has selected
a shop. Product labels live under Products, not Checkout or shop settings. Stock
uses canonical server-side search, low-stock and availability filters before
pagination; advanced movements, reservations, counts, reconciliation, thresholds
and product stock adjustment remain reachable. The backend adds only an optional
read filter; default scope and every mutation remain unchanged.

Money explains UTC date scopes, recorded-sale/payment distinction, separate CDF
and USD, missing costs, and sales versus inventory cost coverage. Existing report
content is grouped under Sales, Costs and inventory, Performance, and Exports.
Dates and amounts are localized; unsupported payment or export behavior is not
introduced. Shop details, fulfillment, settings, import, variants, receipts and
history remain available through existing routes.

Validation: production build/TypeScript, scoped ESLint, two formatting tests,
ten Quick Sell/stock-filter cases, and 12 management browser cases across all four
languages at 390/768/1440 passed. Screenshots `evidence/wenze-program/stock-*`.
No duplicate bottom navigation or horizontal page overflow was observed. Real
mobile device acceptance remains distinct from emulation.

## Final candidate: scanner and cross-batch regression

The scanner now uses native Code128 detection when supported and lazy ZXing
(@zxing/browser 0.1.5, @zxing/library 0.21.3) otherwise. Actual SHIDA-generated
product and variant label geometry is decoded in automated browser tests. Product
lookup remains exact-shop and server-authorized. Store/receipt QR content is not
accepted as a product. Manual entry remains; camera tracks stop on success,
Stop, timeout, backgrounding and unmount. Permission denial has four-language
recovery guidance. No image is uploaded or recorded.

Final refinements: listing status reads are bounded (20 displayed, at most 100
candidate projections per request, next-offset paging); the browser never loads the
entire archive. Gateway tests verify listing/availability parameters reach only the
intended reads. Shop Settings preserves the shop-list/create action for one-shop
owners. No account, Business authorization, order or finance formula change.

Final validation: production build/TypeScript, scoped ESLint and 26 gateway,
activity, formatting and scan-parser unit tests passed. Browser suites: 12 Quick
Sell + 12 management + 4 scanner + 11 shop checkout + 36 delivery/checkout = 75
passing cases. FR/EN/LN/SW and mobile/tablet/desktop sizes covered. The scanner
cases use real decoder code with synthetic camera frames rendered from backend
labels; this is not a physical iPhone/Android test. Backend final focused regression
36 passed, plus 131 isolated PostgreSQL cases and earlier focused checks.

The full backend platform suite has a baseline-reproduced foreign-key fixture
teardown error (221 passed, 2 skipped, 1 error before stop); no global green claim.
Existing unchanged dependencies have audit advisories; ZXing had none reported.
Detailed capability inventory, routes, architecture, manual device procedure and
remaining external gates are in backend `docs/wenze/COMPLETE_PROGRAM_2026_10_23.md`.
Earlier all-pages loading and in-progress statements describe intermediate
checkpoints and are superseded by this final candidate section. Deployment proof
will be appended after exact-SHA verification.

Final follow-up: saved drafts now use the same bounded continuation-page pattern
as listings. Previous/Next works for drafts, and an empty filtered page no longer
claims the seller owns no items. Backend Quick Sell paging tests (10) and website
production build/TypeScript, scoped lint and 12 four-language responsive Quick Sell
browser cases passed again. No new migration; the initial backend/Business/website
rollout succeeded, and the final backend/website revision is verified below.
