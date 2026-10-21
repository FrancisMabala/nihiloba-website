# Shop-aware counter checkout — 21 October 2026

Online-only shops omit Caisse from navigation and Today actions; old counter links render Orders. Online-and-physical shops retain the counter entry. Historical receipts remain accessible from Money / Receipts even after changing shop mode. Existing Pro authorization and entitlements remain unchanged.

The counter presents searchable, category-filtered products with variant selection beside a sticky basket on larger screens. Phones use a persistent basket summary and a focused basket dialog. The centered payment dialog records cash, Mobile Money or externally processed card payments already received by the seller. It does not charge a card or initiate a transfer. Cash received and change are separate for each currency; no exchange rate is assumed. Payment references are optional; no card credentials are collected.

A local calculator never edits the basket. Receipts retain printing, PDF download and commercial/non-fiscal notices. Receipt sending remains excluded. Product labels, scanning fallback, legacy sale correction/history and existing stock protections remain available. A pending checkout freezes its payload for a same-key retry; quantities and prices cannot change while its outcome is uncertain.

Requires backend 1fd138c25a618a809b79e12617579de24dc78241 (verified live). No migration, dependency, environment variable, job, worker or WhatsApp template is added. Existing stock, sales and reservations are not backfilled or rewritten.

Validation: production webpack build and scoped ESLint; dedicated browser suite at 390×844 (phone), 820×1180 (tablet) and 1366×900 (laptop). Browser fixtures exercise physical/online modes, retained receipt history/PDF, variants, quantities, independent CDF/USD totals, calculator, cash/change, Mobile Money/card, modal cancellation, category filtering, four languages and identical retry after an uncertain response. Screenshots in docs/evidence/shop-checkout are actual browser captures using synthetic API fixtures, not production transactions. Website gateway tests additionally verify the category allowlist and metadata forwarding.

Release SHAs and deployment outcomes are recorded in the existing Wenze and Platform workbooks. Browser tests emulate viewport dimensions; they do not claim physical-device Safari testing.
