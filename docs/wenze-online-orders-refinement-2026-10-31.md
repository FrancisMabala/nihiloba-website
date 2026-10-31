# Wenze Online Orders refinement — 31 October 2026

## Audit
The existing management store DTO supplies `order_ready` and `order_ready_methods`, derived by `wenze_store_readiness_service` from actual pickup/delivery configuration. Presence (`store_type`) is distinct and is not used by this change to determine order navigation. There is no independent online-order toggle; readiness must not be represented as one. The seller order listing provides shop-scoped counts after search, so navigation uses a separate request with no search, date or status restriction. Existing backend authorization explicitly preserves existing obligations for shops no longer ready.

## Implementation
- Rename seller title/sidebar to Online orders, localized EN/FR/LN/SW. Mobile retains short Orders with full accessible label.
- Add compact blue marketplace-order notice distinguishing Checkout sales.
- Add semantic filter icons and accents; preserve exact backend buckets and counts.
- Tighten desktop rows and mobile cards; keep payment verification distinct from completion. No phone numbers added. Existing DTO has no product thumbnail or reported payment-method field, so retain product icons and genuine verification status.
- Compact contextual empty/search states; API errors stay separate.
- Hide Orders only when `order_ready === false` and the unfiltered backend history count is exactly zero. Unknown/malformed capability, unknown count, or request failure preserve access. Physical pickup shops with readiness true remain visible.
- Direct empty not-ready URL shows neutral information and existing Checkout/My shop destinations. No fictional activation endpoint or help destination. My shop leads to existing pickup/delivery configuration.
- Any historical orders keep navigation and list access; empty filtered searches cannot override history. Readiness warning explains new orders unavailable while existing ones remain manageable.
- Scope history results to shop/revision/language/view and ignore obsolete requests. Switching shops or saving existing fulfillment settings updates the derived state without a full page reload.

## Files
- app/components/shida/wenze-order-access.ts
- app/components/shida/wenze-navigation.tsx
- app/components/shida/wenze-workspace.tsx
- app/components/shida/wenze-r6-workspace.tsx
- app/components/shida/wenze-orders-view.tsx
- app/components/shida/wenze-orders-design.css
- app/lib/wenze-orders-copy.ts
- tests/browser/wenze-checkout-fixture.ts
- tests/browser/wenze-orders.browser.ts

## Validation
Production build including TypeScript and focused ESLint passed. 25 browser cases passed, including 360/390/768/1440 layouts, four locales, search/counts, filtered empty, no-history readiness, unknown data, failed history request, existing history, shop switching, details, cancellation confirmation, completion without payment verification, receipts, stale action and wrong-shop protection. Screenshots inspected against reference; mobile rows compacted after initial visual review.
Four focused existing backend tests passed: no-longer-ready history, organization permissions, multi-seller isolation and verified-payment signal. Full backend suite not run. No backend code, database migration, transaction, notification or WhatsApp changes. No production order mutations for testing.

## Deployment
Previous Checkout commit 560ad9c4526ef4978297f6e1c9fea04619fe4719 deployed first, confirmed Live on Render deployment dep-dbiu4rvlk1mc73fo76v0. Signed-in live checkout/catalog/history smoke passed; cash calculator showed 5,000 CDF change for 20,000 against 15,000, then the unsaved basket was cleared. No sale recorded. Auto-deploy remains disabled.
New Online Orders implementation is validated for release but not yet deployed; the current instruction deploys the previous work and then implements this refinement. Urgent WhatsApp templates remain enabled.

## Limits
No new online-order activation switch is invented. `order_ready` indicates fulfillment readiness, not every temporary commerce restriction. Unknown states conservatively retain access. The separate Business frontend is unchanged; backend organization access was regression-tested. Live smoke of the new Orders design awaits its deployment.
