# Wenze Today final refinement — 31 October 2026

## Scope and result
Frontend-only refinement in `app/components/shida/wenze-today.tsx`, `wenze-today-design.css`, and `app/lib/wenze-today-copy.ts`. Tests extend `tests/browser/wenze-today.browser.ts`.

Retains existing header, shop selector, timezone, refresh, New Sale, setup-readiness distinction and APIs. Colored KPI icons, compact recent orders and sold-product rows, currency-separated Total Today, semantic stock dots, performance accents and a structured Financial Summary replace the old disclosures. Desktop places orders and sales left, performance and stock right; mobile preserves that reading order. Known profit is explicitly labeled and incomplete purchase costs retain the warning. No backend, schema, calculation, permission, authentication, order, checkout or WhatsApp changes.

## Data integrity and limitations
The Today response contains no previous-period comparison fields. Percentage indicators are intentionally omitted for all baselines, including zero-to-positive; no growth is inferred. Backend revenue summaries supply Total Today separately per currency without recomputing or combining sales channels. Recent historical orders remain distinct from orders_today. Unknown/loading values remain dashes; failure of any dashboard source now prevents an all-clear notice. Empty financial data uses a message rather than inventing a currency. Financial access restrictions remain intact. Recorded sales are not represented as verified payments.

## Validation
Production build including TypeScript passed. Targeted ESLint and git diff --check passed. Two existing seller-calculation/timezone unit tests passed. All 44 targeted Today browser checks passed against the production build: new/configured-empty/populated/attention/error/partial/daily-error/restricted/mixed-currency at 360, 390, 768 and 1440px; EN/FR/LN/SW; switching shops; stale response isolation; order detail; New Sale; setup; reports; loading; refresh via keyboard; timezone requests and returned local dates. Read-only requests asserted; no production records created or modified. No full backend suite was run for this visual-only change.

Screenshots manually reviewed: desktop populated and mixed currency, mobile mixed currency, with the intended restrained colors, left/right hierarchy, readable totals and partial-profit warning. Layout follows the reference while omitting unsupported comparisons and retaining real order counts. Controlled fixture examples are confined to tests. Screenshots and review gallery live in the task outputs folder, not production assets.

## Release
Previous My Shop release deployed backend first: 360d11288ebaab183ddb39024089958c7a1884a8 on Render dep-dbitkvg473hc73ajvhl0, then website 0f3cbfeded99a3a312d0cd13ea12b86065081eec on dep-dbito0jbc2fs73b9pnsg. Both verified Live. Signed-in production shop details and settings verified read-only; normal seller sees a calm commitment notice, payment choices load, unavailable methods remain disabled. No migrations or configuration changes.

Today refinement is prepared for release but not deployed: section 18 of the supplied brief requires specific approval for this visual-refinement release. Render auto-deploy remains disabled. Urgent WhatsApp templates remain unchanged. No hosted CI pass is claimed: website has no configured Actions workflow; validation above is local. After approval deploy the exact validated website commit, verify Render Live identity and read-only desktop/mobile Today. Rollback target is website 0f3cbfe; retain the backend suspension guard.
