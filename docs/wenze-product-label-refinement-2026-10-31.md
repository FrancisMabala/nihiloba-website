# Products, stock and stable labels — 31 October 2026

## Audit

The backend already assigns permanent WNP product references and WNV variant references. Labels are rendered from these persisted identities by `wenze_print_service.label`, using the same protected lookup as Checkout. Code 128 and the existing 60 × 40 mm PDF remain unchanged. Legacy INV inventory codes continue resolving through existing inventory bindings; they are not replaced. Labels contain public product information, not private purchase costs.

The previous selected-product label screen reused the POS catalogue and showed unrelated search, categories and Add to Basket text. Product creation returned to details without retrieving labels. Stock history read `movement_kind`, `quantity` and `created_at`, whereas the current API supplies `kind`, `quantity_effect`, `effective_at` and `recorded_at`.

## Implementation batches

1. Added a focused label presentation component over existing protected product/label/PDF endpoints. After confirmed creation, it retrieves the saved product and eligible variant labels automatically. A separate retry reloads labels only. The success panel offers print preview, PDF download, view product, add another and continue without printing. Copies remain bounded by existing PDF limits. Printing opens the PDF only after a seller action.
2. Added restrained publication/stock accents, compact photo cards with cover identification and contextual actions. Existing four-step creation already collapses optional fields; its validation, photo limits, variant generation and private cost handling remain intact. Inventory shortcuts separate overview, adjustment and counting; restored count sessions open counting. Movement history renders actual signed effects, recorded dates and references, translates known reasons, and retains unavailable states for missing data.
3. Validated controlled browser fixtures at 360, 390, 768 and 1440 pixels, plus focused real-backend tests. Import staging/review/publication remains unchanged. Published imports already receive canonical WNP/WNV identities and are eligible through the same label endpoint; no label is requested for unconfirmed rows.

## Boundaries and access

This changes the Personal Wenze frontend. Organization imports and existing backend authorization remain unchanged; this does not add a Business frontend or broaden access. Every label and PDF request still uses the existing session-bound, exact-shop API. No migration, new dependency, environment variable, worker, WhatsApp template or notification change is required. Urgent WhatsApp templates remain enabled.

## Validation and release

Use `playwright.wenze-products.config.ts` for product, label, inventory and import browser regressions. `tests/integration/wenze_labels_backend.py` runs against the backend disposable test environment with its `tests.conftest` plugin and verifies repeated labels, legacy inventory lookup and independent variant codes. Existing focused backend POS and import tests cover PDF output, access protection, variant stock and idempotent publication.

Browser screenshots use isolated fixtures, not production sample records. Physical printer alignment/camera hardware have not been tested; seller print settings must retain actual size. A generated PDF and browser preview do not prove a physical print job completed.

The preceding Online Orders release e1ecbd9482bced190add521de88befe158273b4a is verified live in Render deployment dep-dbiue1m7bikc73dtg6og. The authenticated production page preserves its existing completed order and separate Payment not verified state. This new Products & Stock release is prepared separately and requires the requested change-set deployment approval; auto-deploy stays disabled.

Final local validation: 32 browser tests passed; 4 focused existing POS/backend tests passed; 3 focused import tests passed; 2 new real-backend stable/legacy/variant-label tests passed. Production build (including TypeScript), focused ESLint and diff checks passed. The complete backend suite was not run.
