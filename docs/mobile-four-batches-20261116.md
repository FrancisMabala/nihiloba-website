# Four mobile UI batches — 16 November 2026

Implemented locally in nihiloba-website. The four supplied batch instructions prohibit pushing and deploying. No backend, schema, dependency, authentication, or financial API changes are required.

## Changes and causes

- **Finance navigation and purchase costs:** desktop tabs and expanded cost records consumed mobile space. A shared native-dialog sheet exposes all six existing finance sections. Product groups contain compact variant rows; details and the existing cost editor open on demand. Zero, missing, denied, and failed data remain distinct. Browser history, focus, list position, revision checks, and permissions are retained.
- **Reports and receipts:** wide reports and persistent receipt previews inherited desktop proportions. Mobile reports use compact currency-specific summaries and expandable sections, with period/timezone controls and secondary exports. Receipts use compact rows and an accessible detail view with PDF and print actions. Report-history loading, failure, empty results, and retry are distinct. Desktop tables and controls remain available.
- **Job detail:** inherited grid ordering and decorative spacing displaced the offer content. Mobile detail now prioritizes the title, employer, metadata, and description. The existing application action is moved between its inline and sticky positions rather than duplicated. Protected recruiter contact retrieval remains required. Save/follow actions retain their canonical destinations. A tab-local return record preserves the originating results URL and scroll position.
- **Public marketplaces:** oversized decorative hero areas and competing search columns delayed results. Scoped mobile styles compact the existing introductions and search controls across Wenze, Restaurants, Services, Jobs, Apartments, Hotels, and Transport. Exact existing Lingala slogans, real content imagery, filters, routes, permissions, and desktop presentation are preserved. No new management modules were added.

CDF and USD are never aggregated together. Existing negative amounts, partial-cost coverage, calculated margins, exports, and cancellation semantics are preserved. Changed wording uses French, English, Lingala, and Swahili copy.

## Validation

Evidence directory: `C:/NIHILOBA/release-evidence/mobile-four-batches-20261116`.

- `node node_modules/typescript/bin/tsc --noEmit`: passed on final source (`typecheck-final.log`).
- ESLint over every changed/new TypeScript file and the browser configuration: passed (`lint-final.log`).
- Vitest: **98 tests in eight files passed** on final source (`unit-tests-final-recheck.log`). Files: mobile-finance-report, job-results-return, job-report, jobs-marketplace, marketplace-refinement, marketplace-components, wenze-money, job-search.
- Playwright/installed Chrome: **36 full-suite tests passed**, followed by **nine affected checks** (including two additional scenarios), then **two report checks** (including an additional history failure/retry scenario): **39 distinct scenarios passed** across these runs. Logs: `browser-final.log`, `browser-final-focused.log`, `browser-history-final.log`.
- Widths: 320, 375, 390, 430, 768, and 1440 CSS pixels. Coverage includes touch-emulated selection, overflow, six finance destinations in all four languages, refresh/back/forward, exact variant edits, missing and zero costs, separate currencies, period/timezone export requests, receipt search/details, permission failures, long-list scroll/focus restoration, save/follow destination content, official application destinations, signed-out protection, seven marketplaces, and enlarged text.
- Production webpack build passed (`build-final.log`) in the sanitized copy. Subsequent small report-history/empty-state and desktop receipt presentation corrections passed the final type/lint/unit and affected browser checks. A second production build was not run with disk space critically low.
- `git diff --check`: passed. No backend suite was run.

Browser command: `node node_modules/@playwright/test/cli.js test --config playwright.mobile-four.config.ts`, with a unique `SHIDA_TEST_OUTPUT` temporary directory per run and optional `SHIDA_EVIDENCE` screenshot destination.

All browser data and API responses were synthetic. The local Next development server used the repository fixture fetch hook. Playwright bypasses CSP only in its test context for Next development evaluation; application security policy is unchanged. No real user messages, payments, or production writes were sent.

## Evidence and limitations

Representative screenshots: `purchase-costs-390.png`, `cost-detail-390.png`, `reports-390.png`, `receipts-390.png`, `receipt-detail-390.png`, `job-390.png`, `market-services-390.png`, and equivalent desktop/other-width files in the evidence directory. Full-page screenshots capture fixed navigation at the viewport position; they do not represent an entire page displayed simultaneously on a phone.

- Real iPhone Safari, Android hardware, software-keyboard/browser-toolbar transitions, and physical printing remain unverified. Browser evidence is Chrome touch emulation, not a live Safari claim.
- PDF/XLSX downloads and CSV request scope were checked with synthetic responses, not production artifact generation.
- Server-rendered Wenze and Jobs listing fixtures are empty; populated landing cards for those two lists and full results-to-detail-to-results scroll restoration were not browser-verified. Return-state logic has focused unit coverage. The other marketplace fixtures include populated results.
- The cost-list DTO does not provide a literal unit-of-measure label. UI uses the neutral existing sales-unit concept rather than inventing a per-piece unit. Job data has no separate original-title field; no guessed title translation or punctuation parsing was added.

## Retained local artifacts

The running fixture server uses `C:/Users/mabal/AppData/Local/Temp/shida-web-mobile-website-tqoj0z0o`; it can be stopped with Ctrl+C once review is complete. Its `node_modules` is a junction to shared dependencies and must be preserved.

Automatic approval review rejected removal of the unused approximately 35 MB production output with `blocked by policy`. This exact disposable folder can be removed manually now:

`C:/Users/mabal/AppData/Local/Temp/shida-web-mobile-website-tqoj0z0o/.next-final`

After stopping the test server, its `.next` build output can also be deleted. Do not delete the repository, shared dependencies, evidence directory, unfinished work, or other worktrees. No existing worktree was removed. Temporary browser-run outputs were retained for diagnostics; no broad cache or Docker prune was performed.
