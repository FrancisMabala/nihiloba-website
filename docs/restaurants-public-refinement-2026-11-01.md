# Restaurants public refinement — architecture audit

The public discovery adapter already provides paginated name/dish/location/type and opening-hours filters. Restaurant and menu projections enforce visibility and safe public locations. Opening status is computed by the backend in the establishment timezone, including overnight intervals and exceptional closures; it is not ordering permission.

The storefront reuses RestaurantGuest for account-free pickup/table visits and RestaurantCheckout for authenticated pickup/delivery. Guest entry returns current methods/windows; checkout options and final quote/submission revalidate admission. They share canonical order services, exact-money quotations, immutable confirmation terms and operation-key replay protection. Guest authority stays in the existing protected cookie flow. No new guest identity or ordering engine is needed.

MenuChoice is shared by both customer flows. Components select a new/existing plate, while fixed dishes remain standalone. Stable plate/line keys are retained; amount-priced and unit-priced selections are distinct. Backend calculation validates composition, availability, currency and prices. Prepared fixed dishes must not be expanded into guessed component selections.

Existing reviews require an eligible completed order and reuse moderation. Save/follow/menu actions use protected opaque continuations. Establishment reporting remains in the existing WhatsApp establishment action; no new reporting or penalties are introduced. Table reservations remain separate and capability-gated. Payment recording never implies independent verification.

Implementation order: compact storefront/header and menu cards; focused selection dialog; grouped basket editing; discovery and checkout visual refinement; focused regression and responsive verification. New UI text uses EN/FR/LN/SW. No backend change or migration is currently required. Urgent WhatsApp templates and intake rollout settings stay unchanged. Production release of this new batch requires its specific approval after validation.

## Previous release completed
Jobs backend `eb2db2fbd6059152baada88ba1daf6b1239da3d1` and website `a1f959b634323f6e8eb101f1cc28ddc65f3c7b36` were pushed to origin/main and the exact sources verified Live in Render, backend first. The public Jobs page was checked without submitting an application. GitHub returned no combined commit-status checks; this is not reported as green CI.

## Current implementation checkpoint (not release-ready)
- Compact menu cards and neutral no-photo icons; shared focused native dialog for guest and authenticated ordering.
- New/existing plate choice resolves stable plate keys; fixed dishes remain standalone.
- Quantity bounds, exact decimal estimates and localized amounts; flexible increments use the seller minimum as their origin, matching backend validation.
- Guest basket quantity editing preserves line/plate identities and invalidates prior quotes; basket indicator counts actual quantities.
- Compact weekly-hours disclosure and a working Reviews destination. Opening status remains backend-provided; ordering permission remains separately controlled by entry/options/quote/submission.
- Secondary dish filter remains available, with compact discovery type icons.
- Desktop preparation basket layout and mobile dialog styles are implemented but NOT visually verified.

74 focused frontend tests pass. Scoped ESLint, TypeScript and production webpack build pass. Sixteen targeted backend guest isolation, authority, replay, closed intake and overnight-window checks pass.

Automatic approval review rejected starting the isolated localhost fixture server with the sole stated reason `blocked by policy`. No alternate launch mechanism was attempted. Interactive/browser tests and screenshot inspection are pending; test definitions are not evidence of a passing run. Do not deploy this checkpoint.

Remaining: inspect actual rendered widths 360/390/768/1024/1440; validate and refine desktop/mobile baskets including line/plate prices and complete checkout/confirmation; verify multiple plates, removal and quantity edits in both guest and authenticated flows; inspect no-photo/no-review, unavailable/loading/error, open establishment with closed ordering, and discovery filter screenshots. Review telemetry with dialog interaction. Complete all acceptance scenarios and update this record before committing/releasing the completed batch. No backend or database changes have been made.

Final automated checkpoint: the four existing pricing/order/web-checkout/schedule/review test files passed all 192 tests; together with the 16 targeted guest/intake tests, 208 backend tests passed. Frontend total remains 74 passed. Final scoped lint, TypeScript and diff whitespace checks pass. The interaction/browser release gate remains blocked. Changes remain uncommitted in the isolated feature worktree; no Restaurants changes were pushed or deployed.

## Updated implementation and user direction
On 1 November the user explicitly requested implementing all queued batches and reviewing the results live despite the local browser-server restriction. Browser verification is still outstanding and is not claimed passed. Basket/plate estimates now use exact decimal arithmetic, suppress incomplete or mixed-currency totals, and remain separate from authoritative server quotations. Dialog selection telemetry now reflects the confirmed add action. See public-marketplaces-my-space-refinement-2026-11-01.md for the consolidated implementation, validation and release limitations. The earlier checkpoint's hold is historical; release follows the latest user instruction and passing automated checks.
