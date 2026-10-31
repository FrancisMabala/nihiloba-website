# Wenze Products & Stock modernization — 31 October 2026

## Scope and release

Frontend refinement in the personal Wenze workspace, reusing the existing product, stock and import controllers. No backend changes, migrations, production test records, permission changes or WhatsApp changes. The preceding Orders release f8bccfe7cb3f965dd4ac93580a5adb3bec976b78 was deployed first and verified live, including Completed with Payment not verified. Products & Stock requires its own production rollout authorization under the supplied brief; pushing this work does not claim it is live.

## Batch record

| Batch | Result |
| --- | --- |
| 1 Products list | Compact desktop table and mobile cards, actual photos/category/price/publication state/availability, existing server search/status/pagination and batch labels. Empty, filtered-empty and load failure remain distinct. |
| 2 Guided creation | One Add product entry opens Basic information → Photos → optional Variations → Review & create. Existing draft upload target and save controller retained. |
| 3 Basic information | Name, price, currency, category and subtype remain visible. Condition, negotiation, description, category guidance and authorized private cost remain available under optional details. |
| 4 Photos | Existing five-photo/8 MiB limits; previews, remove and move-earlier controls before creation. Back retains successful uploads; failed uploads retain form data. Existing saved-photo replace/cover/order/delete operations remain. |
| 5 Variations | Shared size/colour/format choice editor, category suggestions and combinations; per-choice quantities and conversion validation retained. Simple products can skip variations and leave stock untracked. |
| 6 Review | Shows entered details, cover preview and quantities before explicit creation. Publication still follows existing shop rules. Busy lock and stale-data review retained. |
| 7 Details | Read-only details first, prominent product summary, explicit Edit, existing Photos/Stock/Labels tabs and supported duplicate/share/hide/archive actions. |
| 8 Inventory | Existing grouped stock list and truthful filtered counts, on-hand/reserved/available distinction, direct entries to stock, adjustment, count and history. |
| 9 Adjustments | Select an existing catalog stock item; set available quantity through the existing revision-protected endpoint after confirmation. No optimistic stock changes. Integer quantities, refresh and uncertain-result retry retained. |
| 10 Counts/history | Existing start/line/review/explicit-post flow, expected revisions, cancellation and persisted movements/reservations retained. Advanced tools remain collapsible. |
| 11 Imports | Four-stage indicator, focused upload surface, real CSV/XLSX and 10 MiB limits, existing mapping/review/duplicate/photo/publication pipeline. Upload does not publish. |
| 12 Mobile | Scoped responsive tables/cards, step controls, photo panels and import mapping; tested at 360, 390, 768 and 1440 pixels. |
| 13 Localization/accessibility | New copy in EN/FR/LN/SW, native labels/buttons/details, step aria-current, focused wizard headings, existing confirmation dialogs and busy states. |
| 14 Visual review | Production-build screenshots inspected for list, creation, photos, variations, details, inventory, adjustments and import. Reference hierarchy/colors/steps retained; unsupported illustrative controls omitted. |
| 15 Regression | Focused browser, frontend and backend checks below; no complete backend suite. |

## Files and reused components

Changed frontend: `wenze-workspace.tsx`, `wenze-choice-editor.tsx`, `wenze-operations.tsx`, `wenze-r6-workspace.tsx`. Added `wenze-product-wizard.tsx`, `wenze-products-design.css`, `wenze-inventory-design.css`, `wenze-import-design.css`, and `app/lib/wenze-products-copy.ts`.

Reused WenzeApiProvider, the existing personal gateway and write lock, WenzeChoiceEditor/choiceError, WenzeCategoryGuidance, WenzeProductShare, WenzePOS labels, useWenzeConfirm, useWorkDraft, SellerWorkspaceIcon, category reference data and all existing revision checks. Next regenerated its managed AGENTS.md heading; no policy changed.

## Behavior and limitations

- Quick-mode backend intentionally discards detailed fields. Editing condition/description/negotiation/stock or adding variations selects the existing detailed contract, avoiding silent loss. A simple quick product still sends null stock and no variants.
- Product list API supports name search and publication-state filters, not category/SKU/barcode filters. No page-local filter pretends to search the whole shop. Existing inventory code search remains available.
- Drafts here are upload targets, not a resumable shop-product draft library. No unsupported Save draft or camera control was invented. Native file selection can use the device capabilities provided by its browser.
- Inventory cards describe products found in the current filtered view, not fabricated global totals. Untracked is not zero. Adjustment sets available quantity; it does not claim an unsupported additive adjustment/reason API. Backend derives on-hand while preserving reservations and audit history.
- Existing import functionality is reused, including server validation and revisions. No new import parser or auto-publication logic.
- Browser fixtures exercise the personal workspace. Existing backend authorization tests cover personal/business isolation and private-cost restrictions; a live Business frontend account walkthrough was not performed and the separate Business frontend was not redesigned.
- Screenshots use clearly controlled fixtures and an existing illustrative image, never production catalog data. Fixed navigation in full-page captures can appear across the long image; normal viewport navigation remains fixed at the bottom.

## Validation

- 130 existing backend tests passed: product management, duplication, management authorization, inventory adapter, catalog import and import resource limits. Isolated test database only.
- 29 frontend tests passed across inventory, seller improvements, personal gateway, product facts and management formatting.
- 20 production-build browser tests passed: compact lists, empty/error distinction, simple creation, uploaded-photo retention/removal/order/failure, detailed variant quantities, read-only details/edit revisions, four localized creation screens, confirmed stock adjustment/count/history and explicit import publication at 360/390/768/1440.
- TypeScript, targeted ESLint, production build and git diff --check passed. Browser tests use intercepted API responses; backend tests exercise the real domain implementation separately.
- Review artifacts: workspace `outputs/products-stock-review.html` and `outputs/products-stock-evidence/`; test source screenshots under `test-results/products-evidence/` (not production assets).

## Visual comparison

Warm background, green active controls, compact rows, four numbered stages, product identity above details, stock facts and upload panels follow the approved references. Existing shell/navigation and supported controls are retained. Counts remain scoped accurately, and no absent barcode/category query, draft library, reason field or import capability is simulated merely to match an illustration.
