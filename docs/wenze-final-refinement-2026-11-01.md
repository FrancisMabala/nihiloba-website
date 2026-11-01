# Wenze final public refinement — 1 November 2026

## Architecture audit and implementation
Products and Boutiques reuse the existing public API client, product hierarchy, shop taxonomy, public image validation, cart provider, favourites and account session. One shared WenzeDiscoveryHero and WenzePublicTabs now render both views. WENZE_SLOGAN is a single permanent Lingala constant; supporting copy is localized in EN/FR/LN/SW. Search advertises only supported search, and retains city/area and category IDs. Product subcategories remain contextual. Shop categories remain their separate existing taxonomy.

The two discovery tabs are Products and Boutiques. My Transactions already categorizes Wenze and negotiated customer purchases as Orders and links to protected buyer history. Seller orders remain in management. Checkout confirmation now includes the returned order reference as the existing history anchor. No order records, routes, account permissions or WhatsApp handoffs were removed. The inspected web checkout/history use the existing authenticated session; no new anonymous order access or guest-token system was invented. Existing external/WhatsApp access remains unchanged.

Cards use supplied product/shop images, localized presence labels and public location only. Missing images have compact fallbacks. Fixed-price eligibility and negotiation rules remain unchanged. No fabricated ratings, popularity, sales or financial data. Online-only shops do not acquire invented physical locations. Cards, category chips and search have responsive layouts. Distinct API-failure retry, empty/reset and streamed compact loading states are included.

## Files
- app/lib/brand.ts
- app/components/shida/wenze-discovery-hero.tsx
- app/components/shida/wenze-catalog.tsx
- app/components/shida/wenze.tsx
- app/components/shida/wenze-marketplace-refinement.css
- app/components/shida/wenze-cart-page.tsx
- default and localized Wenze page.tsx routes
- tests/personal-transactions.test.ts and tests/browser/wenze-checkout.browser.ts
- playwright.wenze-final.config.ts and isolated Wenze final browser fixture/spec

## Validation
- Production webpack build and TypeScript passed on Node 22.22.0; targeted ESLint and diff whitespace checks passed.
- 84 relevant unit tests across 11 files passed, covering discovery, facts, storefront, cart/checkout, customer transactions, buyer and seller session boundaries, and shop reporting.
- 22 final browser tests passed: EN/FR/LN/SW at 360, 390, 768, 1024 and 1440 pixels for both views; identical hero heights, horizontal category rows and no page overflow; search, category IDs/subcategories, fixed/negotiable behavior, missing imagery, shop presence, detail navigation, loading, empty and API failure.
- 16 public checkout tests passed across four languages, mobile/desktop, pickup/delivery, deliberate retry with the same idempotency key, and exact returned order anchor.
- 3 existing buyer tests passed: signed-in favourites/reviews, guest sign-in gate and stale-cart/stock conflicts. 2 buyer tracking mobile cases passed.
- Older seller-preparing/payment-preferences browser cases were also attempted, but timed out against their older dashboard selectors/fixtures; stopped those unrelated suites. They are not counted as passed. Seller management code is outside this change.
- Desktop and mobile screenshots visually inspected. Evidence copied to the task outputs/brand-wenze-release folder. Fixtures never write to production.

## Release and limitations
Frontend only: no migration, backend rollout, payment processing, moderation or urgent WhatsApp template changes. Supported shop presence remains online_only and online_and_physical. No unsupported ratings or search fields were added. No claim that guest users can bypass the existing authenticated web-order history.

Deploy both this batch and its preceding homepage-brand commit together after push verification. Previous known live website commit: f1c2036aff121445696bf491d660104100dc7bc1. Rollback is redeployment of that commit; no data rollback is needed. Confirm Render live source SHA and inspect both public pages after deployment. GitHub Actions workflows are absent from this website repository; Render build status is the deployment check.
