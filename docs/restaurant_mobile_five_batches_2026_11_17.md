# Restaurants mobile improvements — 17 November 2026

## Routes and scope

All five approved batches use the existing `/{locale}/shida/seller/restaurants/` workspace (and its unprefixed English route). Order/receipt links retain their existing canonical destinations. This is the Website restaurant interface, not a new Business management module. The five supplied visual references guide density; existing brand, icons, navigation, account context and domain rules are retained.

- Stock: compact toolbar with primary create action, horizontally scrollable categories, stock filters, compatible type/unit choices, optional menu-name reuse, grouped quantity fields and guarded unsaved forms. Existing receive/remove/correct semantics, thresholds, decimal quantities, history and immutable retry keys remain unchanged.
- Reservations/finance: compact mobile controls, preserved reservation counts/filtering/actions, one four-section finance navigation, compact date/refresh/currency controls, separate-currency totals and all-date outstanding links. Expenses retain every existing operation and its confirmation/recovery flow with clearer labels, amount/currency row, optional details and accurate declared-versus-recorded-date explanation. Payment-method disclosure now shows loading, errors/retry, actual methods or confirmed empty state; a failed methods request cannot enable a dependent expense write.
- Invoices: short server-assigned order numbers, permanent invoice references, compact list, searchable padded/unpadded/full references, native accessible detail dialog, curated immutable items/channel/fulfillment, net paid/due/refund breakdown and explicit collection action. Opening details does not write money. Pending/uncertain payment blocks dismissal and browser Back until explicitly resolved or abandoned. Filters/scroll and browser history are preserved. Legacy exact-reference recovery remains accessible; multi-order groups retain the bill reference and display individual orders.
- Statistics: compact presets/custom-date dialog with inclusive final-day conversion, settled initial failure state and independent visibility data. The paired backend fixes a PostgreSQL syntax failure in the aggregate date alias (`day` to `AS local_day`); metrics and cohorts are unchanged.
- Reviews/establishment: compact profile/reviews/settings/share sections, horizontal local tabs, seven-day hours with local-day highlight and overnight marker, service configuration distinguished from missing data, preview wording that does not claim verified public visibility, full long description disclosure and existing QR destinations/actions.

## Existing failures and boundaries

Inherited desktop wrappers, large shared cards and duplicate finance navigation caused the density problems. Missing service-mode values were interpreted as disabled or rendered blank; missing and confirmed-empty states are now separate. The existing intake and reservation controls already contain revision/idempotency/reconciliation protections; those were retained and exercised with synthetic lost-response and conflict tests.

The screenshot's particular production settings-save failure could not be tied to an authenticated request for that establishment. We do not claim that a specific production save was repaired. Unknown-state presentation, prerequisites, failed saves, exact retries and permissions are verified locally. Public visibility/test status is not exposed as a verified fact in this management DTO: the UI offers an authorized preview and explicitly leaves public visibility unconfirmed rather than inferring it from the restaurant name.

The money backend remains authoritative. No exchange rate, profit definition, automatic payment, refund, stock expense, publication change, real WhatsApp send or production financial mutation was introduced by validation.

## Validation

- Focused browser run: 50 passed across 320/375/390/430, tablet 820 and desktop 1440, with synthetic API fixtures.
- Additional language/touch/payment-history run: 22 passed; one test used an obsolete Swahili navigation label, corrected and rerun successfully. EN/FR/LN/SW layouts, 200% text with Chrome touch emulation, cancellation of payment confirmation, failed payment with no duplicate submission and guarded browser Back passed.
- Final finance/profile changes: 8 focused checks passed, including unknown payment-method state, failed expense values, enlarged text and overnight hours editing.
- Five focused Vitest files: 8 tests passed (dates/series, receipt/inventory contracts, exact finance display).
- TypeScript and optimized Next.js 16.4.6 webpack build passed. Relevant ESLint had no application errors; unused imports in inherited browser fixtures were removed. No full backend suite.
- Matching baseline screenshots were rendered from the pre-change source with synthetic data, then restored. Final screenshots are retained under `C:/NIHILOBA/release-evidence/restaurant-five-batches-20261117`.

The local production-preview start command was blocked by automatic approval review. Development-browser checks and the production build are separate evidence. Exact deployed commit verification and hosted frontend checks are reported in the release handoff, not assumed here. Physical Safari/iPhone keyboards, dynamic browser toolbars, real printers and live WhatsApp delivery were not verified.

## Changed files

Application: `restaurant-mobile-pages.css`; restaurant workspace, stock, reservations, daily finance, invoices, money, statistics, profile, reviews and settings components; order/list/queue/counter/receipt renderers; order-number type/helper; stock/finance/refinement/statistics translations. Only relevant browser fixtures, navigation helper and dedicated Playwright configuration changed. No dependencies or lockfiles changed.

## Backend dependency and release

The paired backend migration is now `0253_restaurant_order_numbers`, following another already-released main migration `0252_meda_participation`. This is the same schema operation the owner approved under the earlier provisional 0252 name. It adds nullable number/date/timezone fields and a unique establishment/day counter with no historical backfill. Number allocation is transactional; cancellation does not reuse numbers, replay does not allocate again, and existing references/issued documents remain intact. Deploy backend first, then Website. No new environment variables, workers, cron jobs or templates.
