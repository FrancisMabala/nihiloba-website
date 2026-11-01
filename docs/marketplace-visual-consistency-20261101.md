# Marketplace visual consistency — 1 November 2026

## Audit and implementation

Search forms retain marketplace-specific markup and behavior, but already share `marketplace-surfaces.css`. Restaurant markup additionally used the older `rd-primary` layout. Removed that competing class and standardized the shared grid, equal-height fields/button, and full-width mobile stack. This also applies to Jobs, Apartments and Hotels; Wewa retains its WhatsApp request flow.

Wenze and Services previously used a lone shop icon and category tiles. They now use compact, decorative, code-native SVG illustrations: a green-awning storefront and a blue-clothed professional, with restrained greenery/city backgrounds. The existing Congolese meal SVG is preserved. A shared presentation-only hero handles spacing, typography and green/amber/blue tones. Apartments, Hotels and Wewa artwork is unchanged.

All three permanent Lingala slogans remain exact in EN/FR/LN/SW. Existing localized supporting copy and ordinary controls remain. Wenze Products/Shops tabs remain identical in hero height. Invitations are smaller, retain their account-aware actions, and reuse existing icons. The redundant Services cross-marketplace paragraph is removed; the global header and footer remain intact.

Service discovery cards show the public city separately from their existing work-mode labels, instead of joining free-text quartier/commune/area into what could look like a single address. The current public contract has no explicit served-areas list; this release does not invent one. Detailed profile/location privacy rules are unchanged. No invented availability, ratings, professional verification, popularity, listings or sample production records.

## Validation

- Production webpack build and TypeScript pass.
- 47 focused unit tests pass (Services, Wenze discovery, restaurant combined discovery, shared marketplace refinement, stay/travel).
- Wenze: 22 browser tests pass; Services: 35; Restaurants: 33, with the 20 discovery cases rerun after final typography adjustment; stay/travel: 22; Jobs: five responsive discovery/detail cases.
- Search bounding-box assertions verify equal desktop heights/alignment, mobile vertical stacking, full widths and minimum control height at 360, 390, 768, 1024 and 1440 pixels. Core three marketplaces and stay/travel cover EN/FR/LN/SW.
- Restaurant tests exercise plate groups, quantities, checkout recovery and distinct establishment baskets. Services tests preserve quotation/appointment routes, actual package references and stale-time handling. Wenze tests preserve search, price modes and empty/error states.
- Actual desktop/mobile screenshots reviewed under `test-results/wenze-final`, `test-results/services-final`, `test-results/restaurant-final`; other marketplace screenshots verify shared-search regressions.
- Changed application files pass ESLint. Full repository lint retains three unrelated existing errors: synchronous effect state updates in restaurant-review-form and restaurant-seller-reviews, and the existing CommonJS Wenze fixture import. Ten existing warnings also remain. These were not suppressed.

## Release scope

Website only; no backend change or migration. Urgent WhatsApp templates, payment semantics, authentication, account permissions, baskets and notification behavior are untouched. Controlled fixture records are test-only. Production deployment must be correlated with this release commit in Render, followed by read-only live page checks.
