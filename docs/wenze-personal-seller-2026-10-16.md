# Personal Wenze seller area

Implemented in nihiloba-website. Entry: `/shida/seller/wenze`; localized entries `/fr/shida/seller/wenze`, `/ln/shida/seller/wenze`, `/sw/shida/seller/wenze` (and `/en/...`). Public Wenze collection links to the seller area. A `store` and optional `product` query can open a specific owned catalog item.

The workspace uses Restaurant’s Personal WhatsApp sign-in, session boundary, account controls, private-page headers and visual shell. It has its own Wenze navigation. It does not require an Organization. No backend schema or entitlement changes are needed.

## Connected capabilities

| Area | Implementation |
|---|---|
| Shops | Create, edit, visibility, archive/restore, public preview, plan/usage |
| Fulfillment | Pickup/delivery, public-address consent, delivery zones, fixed/free fees |
| Catalog | Quick/detailed creation, trusted photo upload and ordering, pricing, categories, variants, conversion and duplication preflight, search/pagination, stock and lifecycle |
| Orders | Fixed and negotiated order inboxes, filters, backend-provided actions and action revision, handoff verification, delivery timeframe, cancellation |
| Imports | Excel template, CSV/XLSX upload, mapping, corrections, trusted photos, duplicate resolution, reviewed selection publication, run continuation, error export, cancellation |
| Inventory | Stock and reservations, movement history, thresholds, operational codes and code lookup, eligible legacy adoption, count/review/post/cancel, stock-only physical sales |
| Pro costs/sales | Exact product/variant private costs and history, priced physical sales, reversals and replacement links |
| Pro expenses | Categories, amounts, currency/date, private notes, reversals/replacements, pagination and CSV |
| Pro reports | Currency-separated operational totals, cost completeness, previous-period comparison, top products, current valuation and low stock, physical/marketplace sales and expenses, CSV, PDF/XLSX generation and download history |
| Pro schedules | Weekly/monthly configuration, report formats/language, current status and disabling |

The backend remains authoritative for every plan, stock, revision and order transition. Free and Pro limits are not reimplemented as frontend policy. Pro screens use the effective plan returned by the existing plan endpoint, and the backend independently authorizes calls. There is no self-grant or checkout for Pro.

## Session and gateway boundary

`app/api/shida/personal/wenze/[[...path]]/route.ts` accepts only the explicit existing Wenze route surface and bounded query/body shapes. For every request it resolves the Personal actor from `/api/dashboard/contexts`, then forwards to that actor’s context. Browser-supplied Organization/actor selectors are rejected. Existing backend ownership rules additionally constrain every Store and item.

The HttpOnly Personal session is forwarded only to the configured HTTPS backend. Writes require the trusted website Origin. All private reads/writes/downloads require the current noncredential session binding, use no-store responses and reject cross-site requests. Private binary downloads use authenticated fetch. A 401 clears the local session view. The shell also handles expiry, account switching and temporary offline operation using Restaurant’s established pattern.

Financial/Inventory writes preserve the original idempotency key and body while their result is uncertain. Conflicts block another write until the user refreshes and reviews current data. A post-save refresh failure is distinguished from an uncertain write. Catalog/order/import operations retain their existing revision/preflight checks.

## Validation and limits

Production build and TypeScript checked locally. Gateway tests cover Personal actor resolution, rejected Organization/path/query injection, stale binding, Origin, bounded JSON, idempotency forwarding, binary downloads, expiry, variant costs and sanitized failures. Browser fixtures exercise catalog/navigation, Inventory, Free/Pro gates, expense retry, session expiry, four language routes, stock writes, private costs and schedules; external browser requests are blocked. Desktop and phone screenshots are under `docs/evidence/wenze-personal/`.

These are repository and synthetic local checks, not live deployment acceptance. No production data, real orders, paid services or real WhatsApp messages were used. End-to-end live authentication, actual media hosting, import parsing and report artifact generation still depend on the existing backend deployment and need staging acceptance. Wenze features absent from the backend (such as a formal receipt/accounting system) are not invented here. Broader WhatsApp restructuring and removal of the older Business Dashboard Personal entry are separate work.

The local Turbopack dev scan encountered pre-existing inaccessible `tmp/pytest-stock*` directories; production validation used `node node_modules/next/dist/bin/next build --webpack`. The browser config starts that production build so the real CSP remains enabled.
