# Wenze mobile refinements — 16 November 2026

## Batch 1: Today and online orders

The mobile date and refresh share a row; the existing timezone select is compact underneath. Server-local day calculations, polling, readiness and mixed-currency totals are unchanged. Refresh disables immediately while loading.

Online orders start on All, followed by action required, in progress, completed and cancelled/expired. The bounded chip rail has a scroll control and reveals the selected filter. All five explicit bucket links now restore correctly (previously only action required and in progress did). Order-specific search, offset and detail reference survive refresh; returning retains the applied criteria and restores list scroll. Store changes clear that context. API ownership checks and action revisions are unchanged.

The concise introduction opens a keyboard-accessible explanation dialog. Physical sales guidance appears only for shops with the existing checkout capability. Search and empty/error states remain separate.

Validation: production webpack build, TypeScript, scoped ESLint and 7 location unit tests passed. 89 distinct browser scenarios passed on the real Next frontend with isolated intercepted API fixtures: 83 initially; two stale test selectors were corrected to select the visible shop control and passed alongside four additional touch-filter cases. Coverage includes 320/375/390/430, tablet and desktop, EN/FR/LN/SW, timezone, refresh, all filters and counts, customer/product search, direct links/refresh/detail return, readiness, denied/wrong-shop data, cancellation/stale actions and receipts. Desktop and mobile screenshots reviewed against the guidance. No backend tests or financial calculations changed.

Evidence: C:/NIHILOBA/release-evidence/wenze-mobile-20261116/batch1. Browser engine is installed Chrome with touch emulation; physical iPhone Safari, its keyboard and dynamic browser toolbar were not verified. Existing safe-area/navigation clearance retained. No migrations or configuration changes required.
