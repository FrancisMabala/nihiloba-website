# Restaurants management redesign — 14 November 2026

## Batch 1: Aujourd’hui

The responsive overview separates preparation and ready counts, bounds actionable work to five rows, preserves active service access, and shows reservation/inventory panels only when configured and permitted. Refresh failures retain clearly marked stale data; access loss clears protected values. Counts with `+` are explicitly bounded lists, not exact totals.

The previous money source required a separately confirmed financial timezone and used lifetime linked-bill allocations. The read-only daily summary now uses establishment-local payment entry timestamps, separated currencies and net corrections/refunds, without creating a closing day or removing the confirmation requirement for financial closing. Coverage is explicitly service/POS records, not all restaurant revenue. Current outstanding obligations are shown separately.

Fullscreen and start-screen preference remain independent, with Escape and rejected/unsupported browser fallback. Stock counts filter before pagination. Overview links preserve selected order/reservation intent and stock attention state.

Validation: 4 new backend cases (Personal and Organization), 35 existing daily/inventory cases, Web 58 focused unit cases, Business 10 focused unit cases; TypeScript and component lint. Browser fixtures cover 20 language/viewport combinations (FR/EN/LN/SW at 320/375/390/820/1440), partial failures, access loss and fullscreen fallback. Synthetic browser API fixtures do not prove production account configuration. Webpack development tests bypass CSP only in the test browser; application policy is unchanged. Screenshots retained outside temporary worktrees in C:/NIHILOBA/release-evidence/restaurants-management-20261114.

Lingala and Swahili wording should receive native-language review. No schema migration is required.

## Batch 2: Commandes

Active/history tabs request only the current page. Reference, status, origin, fulfilment and restaurant-local history dates combine before server counts and pagination. Existing status reconciliation and ownership restrictions remain authoritative. Desktop retains the list beside a sticky complete detail; narrow screens show the detail and restore the prior list position/focus on return. Existing Personal solo preparation and Organization station preparation flows are preserved separately. Payment state is not inferred from handover. Existing wake-lock state, backoff and visibility handling remain; fullscreen is visible on mobile orders too.

Validation: 28 backend filter/adapter cases, 29 existing Web order/verification/preparation checks, 5 new queue checks on each frontend, TypeScript and changed-component lint, plus browser list/detail/pagination/combined-filter and duplicate-action checks at 320/375/390/820/1440. No full backend suite was run.

## Batch 3: Vendre

The catalogue uses compact thumbnails/icons and direct quantity addition when no portion choice is needed. Equivalent item/portion/extras/note/plate lines merge; optional customization remains editable. Composed plates retain their grouped payload. Mobile uses a native basket dialog and a separate payment dialog with focus restoration, without overlapping dialogs. Desktop keeps a scrollable basket and visible totals/actions. Catalogue readiness is independent of draft/unpaid list failures and image loading. Draft and unpaid lists have separate server counts and page reads.

Canonical lifecycle departure: checkout first records the order through the existing prepare operation, which reserves/consumes stock according to existing rules. Until payment is confirmed, the basket remains visible but recorded terms cannot be edited. Returning to payment reuses that order. Saving without payment explicitly records the order for later collection. A successful ledger response clears the basket and leaves the last receipt/change accessible. Cash is labelled Espèces; external payment methods are explicitly manual recordings. No new payment integration, schema, currency conversion or offline payment support was introduced.

Validation: 58 focused backend POS/counter/receipt-recovery cases passed (465s), 20 Web POS/money/contract unit cases and 8 Business cases passed. The combined browser fixture suite passed 48 cases across Today, Orders and POS at 320/375/390/820/1440 and FR/EN/LN/SW; a separate composed-plate/draft-resume case also passed. Browser checks include one-tap merging, options, insufficient cash, change, closing/reopening with payment entry intact, recorded-order reuse, duplicate clicks, lost-response recovery, price-review gating and receipt-print invocation. No physical printer or real payment was used. Screenshots are synthetic and retained outside worktrees. PostgreSQL concurrency was not rerun: Docker was unavailable; SQLite tests do not establish PostgreSQL concurrency behavior. Browser native fullscreen/wake-lock success on physical devices and native LN/SW wording remain device/language review items. Business shares the redesigned components and receives unit/type/build checks; browser fixtures exercise SHIDA Web.
