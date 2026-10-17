# Wenze seller operations, labels and receipts — 17 October 2026

Implemented locally after the user's design approval. Not pushed or deployed.

## Experience

- Orders use compact status controls, product/amount cards and useful empty states. Completed fixed-price and negotiated orders can generate a customer receipt.
- Catalog import shows Upload, Check columns, Review products and Publish stages above the existing mapping, correction, duplicate-review and resumable publication workflow. Nothing publishes without confirmation.
- Inventory uses selectable product cards with available, reserved and physical quantities. Counting and stock tools remain available below the list. Purchase-cost search controls align on desktop and stack on mobile.
- Reports show per-currency financial cards with missing-cost guidance, plain inventory labels and prominent PDF/Excel generation. Existing protected report artifacts/history/downloads remain the export authority.
- In-store sales provide product photos, exact variants, search, hardware-scanner input, camera scanning where the browser supports Code 128, a multi-item basket, per-currency totals and a seller-recorded payment option. Unknown/uninitialized stock cannot be sold. A mobile basket shortcut keeps checkout accessible.
- Product labels preview and download in batches, 60 × 40 mm, using black Code 128 bars. New and existing product/variant public references are the stable barcode identity; renaming or repricing does not change them. Existing INV operational codes are also accepted in exact-shop lookup. Labels do not require stock adoption. Archived/inactive targets cannot be scanned into a sale.
- Share shop exposes the public URL, public QR image, copy, device sharing and PNG download. Hidden shops show a warning. The image can be printed using the device's normal image print flow.
- Itemized receipts support 58/80 mm PDF, browser print-ready viewing, history and device file sharing. Where file sharing is unsupported, the PDF downloads with simple WhatsApp attachment instructions. No automatic message or recipient collection is added.

## Backend contracts and transaction rules

New protected routes under the existing Wenze actor/context gate:

`GET stores/{store}/pos/catalog`, `GET stores/{store}/pos/lookup/{code}`,
`POST stores/{store}/pos/checkout`, `GET stores/{store}/pos/receipts`,
`GET stores/{store}/pos/receipts/{receipt}`, `GET stores/{store}/pos/receipts/{receipt}/pdf`,
`POST orders/{reference}/receipt`, `GET stores/{store}/labels/{code}`,
`POST stores/{store}/labels/pdf`, `GET stores/{store}/share`.

Basket checkout accepts at most 50 distinct targets with positive integer quantities and valid currency/amounts. It locks targets in stable order and runs the existing priced-sale service in one transaction. Each original priced sale remains the sole financial authority; the receipt does not add another revenue record. Stock reservations, current permissions and private finance entitlements remain enforced. A failed line rolls back the entire basket. Same-key retries return the original receipt; changed payloads conflict. SQLite explicitly begins the outer transaction before the savepoint.

The immutable `wenze_sale_receipts` table stores customer-safe snapshots. Purchase costs, margins, private notes, phone numbers, buyer delivery addresses and access tokens are excluded. Receipt reads reauthorize the actor. Original totals remain immutable; later sale reversals are shown separately. Receipt QR contains only its reference, not a public bearer link, pickup token or proof of payment. Negotiated receipts retain the agreed line total; a rounded unit price is omitted when it would imply an incorrect sum.

CDF and USD never combine. Seller-recorded payment is labelled as declared by the seller. Only the existing verified payment state can produce a verified-payment label. Printing, sharing and reading a receipt never complete an order or confirm payment/handoff.

## Release

Apply additive migration **0170** (parent **0169**) before the Backend code, then release the website. The migration creates one table and its immutable triggers; it does not rewrite historical products/sales. Older product creation now assigns the same stable public identity. Legacy products without one are initialized through the existing identity helper when the catalog is read; existing identities are preserved. Downgrade intentionally refuses to delete receipt evidence; use a reviewed forward migration.

No new dependency, environment variable, worker, cron or Meta template. Existing pilot entitlements and organization authorization remain unchanged. `shida-business` and the protected project mirror are unchanged. AGENTS.md in Backend and website records the user's routine-decision/local-commit preference.

Physical label printer/scanner acceptance, camera support on real phones, native WhatsApp file sharing and live PostgreSQL concurrency remain deployment acceptance checks. No live customer data or WhatsApp messages were used. Offline transactional selling, payment collection/refunds, tax invoicing, native Bluetooth printer protocols and automatic durable customer document delivery remain outside this implementation.

## Validation

Focused backend POS/authorization/profitability: 26 passed. Migration checks: 2 passed. Publication/idempotency/catalog-import compatibility: 51 passed. Website gateway: 15 passed. Browser scenarios: 4 passed across EN/FR/LN/SW, including mobile screen checks and desktop basket. Production build, TypeScript, focused ESLint and diff whitespace checks passed. Checks include basket rollback/retry, exact variant stock, private receipt/print access, fixed and negotiated receipts, reversal projection, both paper widths, FR/EN/LN/SW output, additive SQLite migration and PostgreSQL offline compilation, protected PDF gateway tests, production website build, lint and mobile/desktop browser scenarios.

A broader priced-sales/auth run had 28 passes and one failure: `test_whatsapp_priced_sale_flow_uses_existing_interactive_renderer` expects the retired in-chat cost editor; the current platform route enters WEB_MANAGEMENT. That unrelated expectation was not changed. Full backend suite and live deployment checks were not run.
