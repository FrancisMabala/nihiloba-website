# Wenze public marketplace and buyer safety — 31 October 2026

## Existing architecture and changes

The public API/client, category catalog, ProductCard, gallery, variant selector, shared cart, fulfillment, WhatsApp handoff, buyer relations and shop reviews remain in place. Shared styles now give fashion portrait images and other products contained square images, compact responsive cards, warm shop identity headers, and clearer product facts. Category chips use the existing category catalog; the duplicate primary category dropdown is removed while advanced filters and search parameters remain. Cards have one Add to Cart action; product details retain Buy Now. Prices use locale-aware formatting for valid numeric money, with legacy malformed values preserved rather than reinterpreted.

Public shop photos now survive the public-client projection and are checked against the existing image URL allowlist. Missing photos use a neutral placeholder. No cover-image storage, public order counter, private financial statistic, invented rating, specification or product review is added. The API currently provides condition and variant labels, not distinct brand/model/RAM/dimension fields; absent facts remain absent. Public reviews still target shops and derive eligibility from completed orders.

## Buyer safety and private reporting

EN/FR/LN/SW safety notices appear on product detail pages with a shop and once in the cart's order/fulfillment confirmation area. This checkout records an order, not a payment; no payment gateway, cash verification, fund custody or refund guarantee is implied. Multi-shop carts provide an exact-shop reporting action for each seller within the single notice.

The short accessible native dialog uses the existing Personal session and private Support proxy. It captures the shop automatically, category, description and optional order reference. It handles sign-in, invalid input, bounded requests, errors, rate limits, duplicate-click prevention, confirmation/reference and account-switch clearing. No insecure evidence upload is offered. Backend reports enter the existing authorized Support queue, not a parallel moderation system. Reports alone never penalize shops. See backend `docs/wenze/WENZE_SHOP_REPORTS_2026_10_31.md` for the ownership, moderation, notification and future product-review audit.

## Validation

- Backend: 8 new report checks, plus 24 existing buyer/review, durable Support ownership and shop-suspension checks. The first HTTP fixture used the wrong allowed test origin; corrected to the test server origin. No security rule was relaxed.
- Frontend: 54 passing focused gateway, public projection, product facts, discovery, cart and checkout tests. An old cart assertion expected the removed text “Calculated in WhatsApp”; updated to the existing current fulfillment copy and added the safety-notice assertion.
- Browser: 7 passing scenarios covering report submission, missing optional order, rate-limit retry, correct shop, sign-out clearing, guest authentication, empty search and category filtering; public layouts at 360, 390, 768, 1024 and 1440 pixels.
- Existing checkout matrix: 16 cases covering four languages, pickup/delivery, desktop/mobile and idempotent retry passed.
- Production build/TypeScript and targeted lint. All new browser records are isolated fixtures; no test reports, orders, reviews or products are inserted into production.

## Release boundary and rollback

Previous My Shop release `14833e87dc5d75c5a7f726438c62b9b3b91d43c4` was deployed and verified live on Render (`dep-dbivkom7bikc73e0nnc0`), followed by read-only checks of its three tabs.

This new public marketplace/reporting release is not deployed. Specific approval is required by the user brief. Deploy the validated backend before this website so the reporting endpoint exists. No migration or new dependency/configuration is required (backend head remains 0213). Urgent WhatsApp templates remain enabled and unchanged.

Rollback website to `14833e8` first; backend baseline is `360d1128`. Preserve any persisted reports: they are ordinary private Support tickets. After an approved deployment, verify exact live commits and perform read-only checks with existing public records. Do not submit a real complaint merely for a production smoke test.

Product-specific reviews, secure report attachments, unsupported product specifications and seller-uploaded cover images are deliberately outside this release. Existing legacy buyer-review/follow wording still uses the original EN/FR implementation for some LN/SW controls; new safety/reporting copy supports all four languages.

Three existing buyer browser tests also passed against read-only public shop data: private follows/favourites, eligible shop reviews and stale-cart/stock conflicts. All browser mutations were intercepted. Their screenshot reviews are test fixtures, not production ratings.

Evidence: [desktop shop](evidence/wenze-public/1440-WNZ_FIXTURE.png), [mobile reporting](evidence/wenze-public/390-report.png), [desktop product](evidence/wenze-public/1440-WNP_PHONE.png), [mobile product](evidence/wenze-public/360-WNP_SHIRT.png).

Final focused regressions: 9 gallery tests and 4 selected Wenze variant/currency/privacy cases passed (26 unrelated cases excluded by the test-name filter). Updated legacy card Buy Now expectations and a broad string-based privacy assertion to check an explicit sensitive fixture sentinel; the new notice legitimately says reports are private. GitHub returned no workflow runs or commit statuses for the feature releases; local validation must not be described as hosted CI success.
