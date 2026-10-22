# Quick Sell / Vente rapide — Batch 2

Implementation candidate, 22 October 2026. Not yet a production release.

## Architecture and scope

The backend audit is `shida-backend/docs/wenze/QUICK_SELL_BATCH_2.md`.
Wenze products, media, stock, quotas and orders require a Store. Quick Sell uses
one explicitly created, typed individual Store context per durable Personal
owner instead of introducing storeless products, another identity or orders.
Migration 0198 adds the type and Personal ownership constraints; existing shops
remain shops. Individual contexts do not appear in shop discovery. Their items
use normal product discovery and carry an individual-seller designation.

The new `/shida/wenze/sell/` route and localized equivalents reuse the Personal
session and server-resolved Wenze gateway. Wenze discovery has one Sell an item
entry. Existing full shop management remains available separately. No Business
Dashboard, registration, legal-document or authentication policy changes.

## Experience

After explicit city setup, three compact steps collect details and photographs,
fulfillment, then preview and publication. Canonical categories, conditions,
CDF/USD, fixed/negotiable prices, media validation and publication replay are
reused. New items start with one available unit. Photo selection, reordering and
removal precede publication. Public pickup locations require explicit consent;
delivery coverage and fees use the completed delivery workflow. Location and
fulfillment settings are shared across this seller's occasional items and the
form explains that scope. Private account addresses are never copied.

The minimal list supports editing metadata, hiding/showing listings and marking
sold through guarded backend commands. Manual sold cannot override active buyer
obligations. The existing seller-order component runs in orders-only mode for
this context, retaining canonical negotiations, fulfillment and delivery checks.
Personal quotas remain enforced server-side; no new pricing or unlimited plan.

## Validation

- Backend focused regression: 256 passed. The additional individual edit/hide/
  republish test passed in a subsequent seven-test Quick Sell run.
- Live PostgreSQL: 23 Quick Sell/inventory cases, 25 seller mutation cases,
  82 import/order-adapter cases and one migration case passed (131 total).
  The corrected R4 fixture also passed all 68 SQLite cases.
- Migration tests include SQLite history preservation and PostgreSQL offline
  compilation. Live PostgreSQL migration preservation and uniqueness also passed.
- Website: 28 unit tests passed; scoped ESLint, TypeScript and production build
  passed.
- Chromium browser fixtures: 12 Quick Sell cases passed, covering EN/FR/LN/SW
  at 390, 768 and 1280 pixels. Covered setup, upload failure/retry, long text,
  explicit public pickup consent, preview, no horizontal overflow, ambiguous
  publication failure/retry with unchanged payload, order entry and session
  sign-out/sign-in without duplicate publication.
- Eight existing Personal seller delivery browser regressions passed across
  four languages at mobile/desktop widths.
- Translation duplicate-key check passed. No real WhatsApp messages, paid
  transactions, private accounts or production media were used in these tests.

Regression fixture corrections: pickup dispatch coverage now creates a delivery
order. The import allowance suite explicitly selects Free rather than relying on
the Personal pilot default. Its original failure was reproduced on unchanged
backend main 215660c5. Production entitlement and lifecycle rules are unchanged.

Screenshots: [French mobile](evidence/quick-sell/fr-390.png),
[French tablet](evidence/quick-sell/fr-768.png),
[English desktop](evidence/quick-sell/en-1280.png). All twelve language/width
captures are in `docs/evidence/quick-sell`. The black photo is a synthetic image
fixture. Browser tests emulate viewports; they are not physical iOS/Android tests.

## Limits and Batch 3

New listings have one unit and no variants in this simplified flow. Size, brand
and capacity can use description. Metadata editing does not replace photographs.
Unpublished form data is lost on session change/reload; committed listings reload
from the backend. Same-session ambiguous publication retry preserves the payload.
Batch 3 should add durable draft recovery and richer listing management through
the same services. Do not migrate ownership/history merely to offer full-shop
management; any future conversion needs explicit policy and audit preservation.

A new WhatsApp Quick Sell creation conversation is deferred. Existing order and
negotiation services/notifications remain shared. Fixed-order completion retains
existing seller attestation; no new customer OTP is claimed.

## Release gates

Required live PostgreSQL concurrency checks passed. Explicit production
authorization for migration 0198 remains pending under repository AGENTS.md. Deploy
the migrated backend before publishing the website entry. Preserve additive
schema/history on application rollback; schema downgrade intentionally refuses
existing individual selling history. Do not claim this candidate is live until
the deployed commits are verified.
