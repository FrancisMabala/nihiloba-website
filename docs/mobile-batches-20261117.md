# Mobile personal space and restaurant batches — 17 November 2026

## Scope and implementation

- **Mon espace:** shared mobile section selector typography and spacing now apply to activities, listings, job search, transactions, notifications, account settings and questions. Duplicate page titles remain accessible but visually hidden. Personal article sales link to the canonical transactions page with `role=seller`; direct links, refresh and return navigation retain that role. The Gérer personal-sales shortcut is compact. Existing owner-scoped catalogue data already includes personal products and drafts; no new catalogue or account logic was needed.
- **Aujourd’hui:** compact date/refresh row and sale action, two-column mobile metrics, compact action and collections sections. Figures keep each currency separate. Loading, confirmed zero, stale data, permission loss and failed requests remain distinct. Per-section retries remain available; the successful-refresh timestamp advances only when the full refresh succeeds.
- **Mon menu:** compact existing tabs, search/filter disclosure, horizontally scrollable categories and item cards. Availability is now an accessible inline switch, with a fresh revision check, existing enable blockers, server-confirmed state, same-command retry after uncertain responses and protection against concurrent writes. Editors, pricing modes, photos, stock details, batch tools, daily offerings and customer preview remain available.
- **Vendre / Plus:** mobile navigation uses Aujourd’hui, Commandes, Vendre, Plus; Mon menu leads the secondary destinations. Compact tiles show quantities and safe decrement controls for plain items. Configured portions/extras keep the existing configuration dialog. The empty basket is quiet; a populated basket exposes its summary. A failed initial basket creation has an accessible retry using the original idempotency key. Drafts, settlement, receipts, permissions and discard protections retain the established workflows.
- The release also includes the previously committed, focused **Commandes mobile header** adjustment (`3504e12e`): accessible hidden mobile heading and compact timestamp/refresh/options row, with desktop heading retained.

## Confirmed dashboard failure investigation

Read-only backend logs on 17 November around 07:12–07:14 UTC showed `db_request_capacity_exceeded`, four active requests and waiting requests, alongside 503 responses for restaurant inventory, daily summary, service groups and orders. The dashboard previously launched seven to nine reads concurrently. Backend admission control and owner-row locking were inspected from current remote source. Dashboard reads now run sequentially and publish results as they arrive, preventing this dashboard from filling the four admission slots itself.

409 responses were also observed. Owner-lock contention is a plausible explanation from the service code, but the exact response payload was not established; this report does not claim that every 409 has that cause. Broader backend contention from other traffic is outside this frontend correction and can still produce failures. The UI reports those failures accurately. No backend code, accounting logic, migration or production data changed.

## Focused validation

All browser tests used synthetic fixtures against the reusable loopback Next.js preview, with Chrome touch emulation. No real customer messages, sales, accounts or production writes were used.

- **163 unique browser checks passed across focused runs:** 139 existing personal-space, personal-article, restaurant-order, menu and counter-sale cases; 24 additional mobile batch cases. Coverage includes 320/375/390/430px phones, 820px tablet and 1440px desktop where relevant, enlarged text, menu search/filter/availability and uncertain retries, basket quantities and navigation, initial-basket recovery, canonical seller transactions, serialized dashboard reads, stale figures and permission-loss clearing. Existing checkout suites exercise configuration, drafts, payment/recovery and receipts. Failed attempts caused by preview startup, fixture route matching and obsolete navigation selectors were corrected and affected cases rerun successfully.
- **38 unit/contract checks passed:** restaurant operations, menu overview, service and daily contracts, personal transactions and transaction summary.
- Scoped ESLint, TypeScript without incremental output and `git diff --check` passed.
- Production webpack build passed (Next.js process exit 0); its retained log is in the evidence folder below. The log-printing wrapper encountered a Windows console Unicode error after the successful build; the application build itself completed. All 18 changed application files were compared with the build inputs.
- No full backend suite was run. No database migration is required.

Commands used the existing Node runtime and shared node_modules:

```text
playwright test -c playwright.mobile-batches.config.ts
playwright test -c playwright.mobile-batches-regression.config.ts
vitest run tests/restaurant-operations.test.tsx tests/restaurant-menu-overview-contract.test.ts tests/restaurant-service-contract.test.ts tests/restaurant-daily-contract.test.ts tests/personal-transactions.test.ts tests/transactions-summary.test.tsx
tsc --noEmit --incremental false
next build --webpack
```

Browser fixture environment: `SHIDA_BROWSER_BASE` and `RESTAURANT_TEST_BASE_URL` set to `http://127.0.0.1:3000`. Build environment used an unreachable loopback API, synthetic guest secret and no dotenv files.

## Evidence and limits

Matched before/after screenshots at **390 × 844 CSS pixels** are retained in `C:/NIHILOBA/release-evidence/mobile-batches-20261117`: transactions, messages, settings, questions, activities/management, personal articles, Gérer, Today (including partial failures), menu and empty/populated counter sale. An enlarged-text menu capture is also included. The earlier Commandes evidence remains in its original report/evidence folder.

Physical iPhone Safari, native keyboard overlap, changing mobile browser chrome, live WhatsApp and real production financial actions were **not** tested. Touch checks are browser emulation, not physical-device certification. Existing WhatsApp destinations and authentication were not modified.

The application files changed are the personal-space wrapper/selector/CSS, quick-sell link/copy, restaurant navigation, Today component/styles/copy, menu component/styles/copy, counter-sale component/styles and seller workspace. Dedicated synthetic browser fixtures/configuration and existing affected interaction tests accompany them. Shared dependencies, unrelated local database deletions and unfinished work are excluded from release.
