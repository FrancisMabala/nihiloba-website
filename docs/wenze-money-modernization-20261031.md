# Wenze Money modernization — 31 October 2026

## Release scope

Frontend presentation and integration only. No schema, financial calculation, payment-verification, sale snapshot, permissions, consent or urgent WhatsApp template changes. Products & Stock `d0c596d5228c8584c56aa23393f9cbba1638d936` was deployed first and verified Live in Render deployment `dep-dbism02jnfac73bgueb0`; the signed-in catalog and product detail were inspected without writes.

Money is validated for release but is not deployed: the supplied Money brief requires authorization for this specific release. Render automatic deployment is disabled. No migration or backend deployment is needed.

## Batch record

| Batch | Result |
|---|---|
| 1 Navigation/design | Six existing Money destinations retained, Overview label clarified, shared scoped cream/green cards and responsive layouts. |
| 2 Overview | Backend revenue, expenses, known margin and operational result displayed independently per currency. Unknown values remain unknown. |
| 3 Charts | Actual current/previous-period bar comparison, revenue ranking and top expense-category donut. Accessible numeric comparisons on narrow screens. |
| 4 Purchase costs | Searchable product/photo list, missing-cost state, same-currency unit margin, focused existing cost/variant editor and history. Private endpoint authorization retained. |
| 5 Expenses | Period summary from the complete summary endpoint, focused add form, existing history, correction/reversal and CSV retained. Paginated rows are never summed into a total. |
| 6 Reports | Shared chart-led dashboard; detailed inventory, comparisons, reports, PDF/Excel generation and history remain accessible. |
| 7 Completeness | Partial known margin and operational result are qualified independently using backend completeness flags. Revenue coverage is distinguished from inventory coverage. |
| 8 Schedules | Compact existing weekly/monthly schedules, focused format editor, disable and edit/save to enable. Actual next run and timezone. No invented email channel. |
| 9 Receipts | Desktop list/preview, mobile dialog, existing receipt fetch, payment caveat, PDF and print paths. No receipt totals recalculated. |
| 10 Responsive | Browser workflows and overflow checks at 360, 390, 768 and 1440 pixels. |
| 11 Localization/accessibility | EN/FR/LN/SW qualifications, native controls/details, SVG titles, textual chart values, existing keyboard dialogs and unsaved-work confirmation. |
| 12 Visual verification | Production-build screenshots inspected for overview, costs, expenses, schedules, receipts and complete/partial/empty/mixed reports. |
| 13 Regression | Focused backend financial/security tests, frontend tests, browser workflows, build, typecheck, lint and diff checks. |

## Files and reuse

New shared presentation: `app/components/shida/wenze-money-dashboard.tsx`, `wenze-money-design.css`, `app/lib/wenze-money-copy.ts`.

Integration: `wenze-operations.tsx`, `wenze-navigation.tsx`, `wenze-pos.tsx`. Reuses `WenzeReportFacts`, `WenzeReceipt`, existing API provider, request/revision/retry guards, confirmation and unsaved-work dialogs. Financial mutations retain their existing endpoint/body contracts.

Tests: `tests/wenze-money.test.tsx`, `tests/browser/wenze-money.browser.ts`, `playwright.wenze-money.config.ts`.

## Verification

- **105 backend tests passed**: profitability dashboard, reporting, private costs and authorization, expenses, schedules and authorization, receipt boundary and local reporting. Isolated backend checkout; no production records modified.
- **38 frontend tests passed**: financial qualification/unknown values, gateway, management formatting, product facts, seller helpers and checkout contracts.
- **18 production-build browser tests passed**: all four report scenarios, workflows at four widths, FR/LN/SW rendering, denied financial/private-cost access, historical receipt PDF and print.
- Production build, targeted ESLint, TypeScript and `git diff --check` passed.
- Controlled scenario: 30,000 CDF revenue / 10,000 known gross margin / 2,000 expenses / 8,000 operational result. Incomplete costs retain those numbers with partial labels and 50% revenue coverage. Complete costs show 100% coverage. Mixed scenario separately shows USD 85 / 25 / 5 / 20. Empty response has no fabricated chart.
- Screenshots are local artifacts in the task workspace `outputs/money-evidence`; `outputs/money-refinement-review.html` groups all views and four scenarios. Test fixture values do not ship as production data.

## Design adaptations and remaining limitations

- The existing dashboard has period totals and comparison data, not a complete daily/weekly time series. Displaying a fabricated smooth trend would be misleading. Desktop therefore uses period bars; mobile favors legible numeric comparisons. No new aggregation API was introduced.
- The overview endpoint supplies only its top expense categories; that chart is explicitly labeled accordingly. The Expenses view uses its full category summary.
- Purchase-cost rows use existing per-product reads (at most 20 per page); variant costs are loaded after explicit selection. A batch endpoint could improve latency but is outside this presentation change.
- Schedules retain existing fixed frequencies, formats and delivery eligibility; active does not mean successfully delivered. Email delivery is not introduced.
- Backend authorization suites cover personal/business access boundaries. A signed-in Business UI session was not used for this frontend review.
- Browser fixtures exercise UI/API contracts; backend tests independently verify persisted accounting semantics. Browser fixtures are not evidence of a production financial transaction.

## Release and rollback

After specific Money release approval, deploy the validated website main commit on Render, verify its exact live SHA, then inspect all six destinations using existing data without recording expenses, changing costs or sending reports. Keep urgent WhatsApp templates enabled. Roll back the website by deploying `d0c596d5228c8584c56aa23393f9cbba1638d936` if necessary; no data rollback is required.
