# Wenze inventory and product tools — 27 October 2026

The personal seller workspace keeps Wenze's cream, green and gold palette, with a compact inventory table, responsive mobile rows and summary cards for the current filtered view. Stock is grouped by catalogue product reference, with expandable variant rows; distinct products with the same name remain separate. All stock cursor pages are read before displaying totals, overlapping item references are deduplicated, and unknown quantities stay unknown.

Catalogue search displays a result count or an empty-state message. Inventory code lookup displays its loading, found, not-found or error state immediately beneath the field, including the matched product's available, reserved and physical stock. Existing authorization, revisions, reservations, counting and adjustment endpoints are retained.

Product labels are under each product's labels tab. Selecting catalogue rows exposes batch labels for those products only. The labels reader includes variants across catalogue pages. Catalogue import remains available under Products and stock, and the redundant import switch is removed from Orders.

No schema, production database, authentication, payment verification or WhatsApp message changes are required. Existing WhatsApp links to the seller workspace retain their account context and authorization checks. Orders remain individually traceable; this change aggregates inventory, not customer orders or payments.

Validation: grouping unit tests, existing management-format and gateway tests; production build with bundled Node 24; targeted ESLint; four-language browser regression covering empty search, product labels, grouped inventory, code lookup, mobile overflow, unsaved drafts and checkout. Browser screenshots are written to ignored test-results/wenze-inventory.

The seller inventory groups active catalogue options by product across all pages. Search and filter counts use the same sellable balances and thresholds as the rows. Receiving records an incremental, replay-safe delivery. Counting records an observed physical total and checks the count revision and reservations before posting.

Catalogue import stages the seller’s workbook or CSV, asks about unclear columns, and preserves explicit zero stock on review. The seller confirms a versioned list of distinct products before publication. Examples are on the template instructions sheet.
