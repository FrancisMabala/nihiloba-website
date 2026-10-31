# Wenze Orders visual refinement — 31 October 2026

## Scope and audit

Presentation now lives in `wenze-orders-view.tsx`, with scoped CSS and EN/FR/LN/SW copy. `wenze-r6-workspace.tsx` retains the existing API controller, shop context, filtering, server counts, pagination, revision checks and action forms. Catalogue imports remain in that controller and were not redesigned.

Reused: SellerWorkspaceIcon, CheckoutDialog (native modal/focus handling), WenzeReceipt (existing print/PDF pipeline), DeliveryDetails, WenzeOrderUpdates and existing localized progress/action labels. No dependencies, schema changes or migrations.

The backend remains the authority for `allowed_actions`. The frontend recognizes only existing actions; every mutation includes the current `action_revision`. Completion requires explicit confirmation and never sets payment verification. Cancel requires the existing reason field; handoff verification retains its secret token field. A synchronous request lock prevents duplicate submissions. Conflict reloads require review and cannot resubmit an action revoked by the server. Wrong-shop detail responses are rejected.

## Implemented states

- Compact desktop rows and mobile cards with distinct fulfillment, payment verification and order status.
- Server-backed status counts/search/pagination. Back retains the selected bucket and page.
- Item snapshots, variants, quantities, stored totals, fulfillment details and authorized customer name.
- Desktop action panel and mobile action sheet. Destructive and completion actions are visually distinct.
- Creation time, current progress and explicitly labelled last-update time; actual persisted notifications remain in Order updates. Planned timeline steps are not portrayed as completed events.
- Explicit receipt access for completed orders; no receipt generation on opening details or completing an order.
- Separate initial-empty, per-status-empty, no-search-match, loading and failure states.

## API limitations deliberately respected

No edit action, date-range query, bulk mutation contract, product image, buyer phone or payment-method/received/change fields are supplied by the Orders DTO. Those illustrative controls/fields are omitted. Icons stand in for unavailable product images. Unverified payment does not mean unpaid; only the backend payment flag determines the label. The existing receipt can expose its own supported payment details.

Negotiated price is an order amount, not necessarily a per-unit price. It is not multiplied by quantity. Fixed-order item names/prices are snapshots; the existing negotiable DTO resolves the product name from the current catalogue. Historical-name capture would require separate backend work and is not added here.

## Validation

- 17 isolated browser tests: 360/390/768/1440 list/details, action sheet, all four localized empty states, completion/payment separation, unsupported actions, negotiated totals, filters/search/server counts, pagination/back, explicit receipt/PDF, cancellation, wrong shop, API failure and stale/revoked actions.
- 21 frontend tests: personal gateway and management formatting.
- 21 focused existing backend tests passed (11 unrelated cases deselected): Orders R6, seller authorization and progress tests. No complete backend suite was run.
- TypeScript, targeted ESLint, production build and diff whitespace checks.
- Test records exist only in intercepted browser responses and isolated backend test databases; no demonstration orders were inserted into production.
- Existing urgent WhatsApp templates and payment/stock/business rules were not changed.

Run browser checks after a production fixture build with `npx playwright test -c playwright.wenze-orders.config.ts`. Screenshots are generated under `test-results/orders-evidence`; the reviewed gallery is supplied separately in the task outputs.

## Release separation

The preceding Checkout change `9169df0a16e9e68ca870ce71f15db001a008cc54` was pushed to main and verified live on Render deployment `dep-dbirq4utlv9c73bi3pb0` before Orders implementation. Live Checkout basket/cash/keypad smoke checks did not record a sale. This Orders change is prepared separately for production release; do not equate the Checkout live SHA with the Orders implementation.
