# Wenze mobile refinements — 16 November 2026

## Batch 1: Today and online orders

The mobile date and refresh share a row; the existing timezone select is compact underneath. Server-local day calculations, polling, readiness and mixed-currency totals are unchanged. Refresh disables immediately while loading.

Online orders start on All, followed by action required, in progress, completed and cancelled/expired. The bounded chip rail has a scroll control and reveals the selected filter. All five explicit bucket links now restore correctly (previously only action required and in progress did). Order-specific search, offset and detail reference survive refresh; returning retains the applied criteria and restores list scroll. Store changes clear that context. API ownership checks and action revisions are unchanged.

The concise introduction opens a keyboard-accessible explanation dialog. Physical sales guidance appears only for shops with the existing checkout capability. Search and empty/error states remain separate.

Validation: production webpack build, TypeScript, scoped ESLint and 7 location unit tests passed. 89 distinct browser scenarios passed on the real Next frontend with isolated intercepted API fixtures: 83 initially; two stale test selectors were corrected to select the visible shop control and passed alongside four additional touch-filter cases. Coverage includes 320/375/390/430, tablet and desktop, EN/FR/LN/SW, timezone, refresh, all filters and counts, customer/product search, direct links/refresh/detail return, readiness, denied/wrong-shop data, cancellation/stale actions and receipts. Desktop and mobile screenshots reviewed against the guidance. No backend tests or financial calculations changed.

Evidence: C:/NIHILOBA/release-evidence/wenze-mobile-20261116/batch1. Browser engine is installed Chrome with touch emulation; physical iPhone Safari, its keyboard and dynamic browser toolbar were not verified. Existing safe-area/navigation clearance retained. No migrations or configuration changes required.


## Batch 2: Product details and stock

The old hero nested metadata, all actions and description inside the column beside the photo. The summary now keeps the photo/name/price/status together while mobile metadata and actions span the page. Desktop retains its two-column hero and stock/prices layout. The existing photo flow is accessible from the photo button; editing, sharing and secondary confirmations remain unchanged.

Stock uses the same catalogue lines and quantities. Mobile rows show arbitrary existing attribute descriptions, available quantities and secondary reservations; the first five versions are shown initially with a labelled expansion. Desktop retains the full table. The detail count uses unit-neutral wording instead of assuming every category is clothing or pieces; stock/measurement contracts and adjustment forms are unchanged. Prices and costs expand on mobile and default open on desktop, retaining variant selection, private-cost permission checks, currency-specific calculations, pending-cost recovery and product labels. Description remains expandable. Catalogue import moves into the mobile secondary menu; desktop tabs remain. Back to products restores the in-memory list scroll along with its existing URL criteria/page.

Validation: final production build, TypeScript, scoped ESLint, six inventory/product-fact unit checks and all 46 browser cases passed. The browser run uses the actual Next application with synthetic intercepted API responses. Coverage includes 320/375/390/430, 768 and desktop; EN/FR/LN/SW; missing photos, long and uninterrupted names, large CDF/USD prices, fixed/negotiable/unknown prices, generic capacity/material variants and no variants, many/zero/unknown/reserved stock, archived restrictions, free and denied cost access, keyboard disclosure, bottom-navigation clearance, photo management, editing, sharing, label PDF/printing, catalogue criteria/scroll return, inventory/import navigation, stock retry/revision conflict and creation recovery. Legacy test selectors were updated for the existing detail/label markup; an import fixture was completed. Final run: 46/46 passed.

Screenshots: C:/NIHILOBA/release-evidence/wenze-mobile-20261116/batch2. Desktop and phone captures visually reviewed. No physical iPhone Safari, native share sheet, hardware printer, camera, on-screen keyboard or dynamic Safari toolbar verification. No backend tests, migrations or API changes. Scope is the existing nihiloba.com Wenze management interface shown in the supplied reference; the separate Business application was inspected but not redesigned.

## Release sequence

Safari selector fix b2ee832fd2d3da192d331e36695c59b884ecdc6b was pushed and verified live first (Render dep-dbt8clrbc2fs73ddrbg0). Batch 1 commit 3b287a4bd6bd52e18f60812fdfd6e4d43fedcf27 was pushed and verified live next (dep-dbt8j09srm7s73ahvbq0). Render deployment status was correlated to the exact commit; the GitHub combined-status endpoint returned no status checks. Batch 2 is released separately after its focused validation.
