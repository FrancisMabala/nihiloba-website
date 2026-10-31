# Wenze Money and Receipts refinement — 31 October 2026

## Scope and implementation

Frontend refinement of the six existing Money sections. Existing financial calculations, private-cost permissions, historical snapshots, currency separation and payment verification semantics are unchanged. No backend changes or migration. Urgent WhatsApp templates remain enabled and untouched.

| Area | Result |
| --- | --- |
| Overview | Semantic green/blue/amber/purple KPI cards, qualified known margin, ranked actual products, current/previous period comparison and expense breakdown. Mobile comparisons use readable horizontal bars. |
| Purchase costs | Compact product rows and focused editor with selling-price/current-cost context; existing revisions, cost removal and history retained. |
| Expenses | Currency-specific total and count, category donut, register, focused add/edit form and existing management/export actions. |
| Reports | Charts first, secondary analysis and report history in disclosures; PDF/Excel and existing analysis preserved. |
| Schedules | Existing frequency/formats/status, shop-local next-run display, edit/disable and re-enable using existing revision-aware API. |
| Receipts | Approximately 40/60 desktop list/preview, selected state, page-scoped search/date/payment/reversal filters, pagination, mobile focused dialog, readable preview and existing 58/80 mm PDF/print actions. |

## Files and reuse

- `app/components/shida/wenze-money-dashboard.tsx`: existing dashboard calculations and chart data reused.
- `app/components/shida/wenze-money-design.css`: focused shared visual/responsive rules.
- `app/components/shida/wenze-operations.tsx`: existing cost/expense/report/schedule APIs and forms retained.
- `app/components/shida/wenze-receipts-browser.tsx`: new list/selection presentation over existing protected receipt API.
- `app/components/shida/wenze-pos.tsx`: existing WenzeReceipt reused with optional management presentation and timezone. Checkout remains its default mode.
- `app/lib/wenze-money-copy.ts`: English, French, Lingala and Swahili labels.
- `tests/browser/wenze-money.browser.ts`: controlled financial and workflow scenarios.

Reuses SellerWorkspaceIcon, CheckoutDialog, useWenzeApi, WenzeReceipt and existing localization/formatting functions. No second receipt generator or labeling system.

## Reference comparison and truthful adaptations

Both references guide colors, hierarchy, compact tabs, charts and split receipts. Backend supplies period aggregates rather than a daily series: the comparison shows actual current/previous periods, not invented daily points. No percentage is fabricated for a zero baseline. Partial known margin remains explicitly qualified. CDF and USD are separate.

Product ranking data lacks image URLs, so ranking uses actual names and quantities rather than unrelated thumbnails. Schedules lack custom names and an email-delivery option; existing frequency and supported formats are shown. No fake email or sharing controls were introduced.

Receipt API provides paginated snapshots and a total count, but no server-wide search, today-total aggregate or printing audit. Search/filter scope is stated as the current page; Next accesses older records. No Printed/Not printed, last-printed, illustrative growth or today's-total claims. PDF invocation is not proof of physical printing. Original reversal and payment caveats are preserved.

## Validation and evidence

- Production Next.js build including TypeScript: passed.
- Focused ESLint and git diff --check: passed.
- Money unit tests: 4 passed.
- Money browser suite: 22 passed. Covers complete costs, incomplete costs, no transactions, CDF/USD, 360/390/768/1440 widths, cost and expense writes, schedule enable/disable, report export, receipt filters/PDF/print, reversed historical records, authorization failures and EN/FR/LN/SW.
- Checkout complete cash sale/receipt regression: 5 passed at 360/390/768/1024/1440.
- Focused backend reporting/schedule/POS checks: 9 passed, 25 deselected. Includes permissions, financial completeness, mixed currencies, historical receipts and PDF content. Full backend suite deliberately not run.
- A final tablet screenshot exposed a squeezed paper-size selector; minimum width/wrapping corrected, rebuilt and affected workflow layouts rerun.

Screenshots use isolated browser fixtures, never production sample transactions. Review gallery: workspace `outputs/money-receipts-refinement-review.html`, with desktop/mobile images in `outputs/money-receipts-refinement-evidence/`. Visual review covered charts, cost editor, populated/empty expenses, reports, schedules and receipt list/preview. Physical printer output was not tested; browser print/PDF invocation and backend PDF content were tested.

## Release and rollback

Previous Products & Stock release e4bb848f0c7ddf776ddc5f02d8214748dad99c1b was deployed first. Render service srv-d9s8g1c9v7es73effevg, deployment dep-dbiut7jbc2fs73bcuocg: Deploy succeeded / Live, correlated to that commit. Signed-in production labels page showed stable barcode WNP_BUXYSHRL with print/download controls. No production writes were made.

This new Money release is prepared and pushed under standing development authorization, but not deployed: the supplied brief says “Confirm production authorization before deploying this release.” Render automatic deployment is disabled. Deploy the validated new website commit after release approval, then inspect live Money and Receipts non-destructively. No backend rollout is required. Roll back by redeploying e4bb848f0c7ddf776ddc5f02d8214748dad99c1b; no database rollback is needed. GitHub combined statuses may be empty and must not be described as a green CI run.
