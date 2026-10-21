# Simplified restaurant counter — 21 October 2026

## Approved experience and implementation
The previous counter required quote verification, preparation confirmation and a technical order-reference screen before collecting payment. The approved flow now uses Encaisser, a payment choice (Espèces, Mobile Money, Carte), and confirmation of the amount received. Cash has a numeric keypad and automatic change; short cash cannot finish the sale. Payer plus tard creates a real unpaid order available after reload in a paginated queue. Held drafts remain under Autres options. Portions, extras and composed plates remain available. Changed prices require review; unchanged quotes proceed automatically. Retry uses the original operation and recovers lost payment responses without another charge.

Both Personal Website and Business Dashboard have the same responsive flow. Payment completion offers receipt printing and a new sale. The printed snapshot includes food selections and the payment/change evidence. Personal kitchen controls remain absent; Dashboard kitchen and independent preparation/payment state remain intact. Existing pinning and full-screen behavior is preserved.

## Authority, privacy and channel boundaries
The unpaid queue uses the existing exact-establishment ownership/entitlement guard. No anonymous money endpoints, account policy changes, credentials or provider card data are introduced. Card and Mobile Money record payments received externally; they do not initiate or verify a provider transaction. Configured enabled methods are required. Existing ledger, audit, revision and idempotency rules remain authoritative. No WhatsApp/login flows, templates or message deliveries change; web and WhatsApp continue consuming the same services and payment truth.

## Files and schema
Backend changes are limited to restaurant money method validation/models, the unpaid counter service/route, focused tests and migration 0196. Frontends change counter/payment components, scoped styling, localized FR/EN/LN/SW copy, API allowlists and regression fixtures.

Migration 0196 follows 0195 and expands two check constraints to accept external_card. It adds no tables/columns and performs no deletion or backfill. Historical cash/mobile records are preserved. Downgrade requires an explicit preservation plan. No dependencies, environment variables, workers, cron jobs or Meta templates are added.

## Validation and release
Production builds and changed-file lint pass in both frontends. Responsive browser fixtures pass 19 scenarios per frontend at 320, 390, 820 and 1440 pixels, including cash/change, Mobile Money, Card, persistent unpaid orders, receipt printing, changed-price review and lost-response recovery. Backend focused validation and final unit results are recorded below.

Production migration 0196 requires explicit user authorization under AGENTS.md before backend push triggers deployment. Release backend/schema first, then both frontends; verify remote SHAs and each Render deployment. Nothing in this report claims deployment. Physical printer output, actual phones/tablets and live provider settlement are not verified by fixtures. Full backend suite is not required for this module-scoped change. Readiness remains Partial pending release/device acceptance.

### Recorded validation
- Backend: 74 focused SQLite tests pass across the corrected runs; the 16 counter workflow tests were rerun after adding unpaid-queue access checks. PostgreSQL offline DDL and SQLite legacy-cash preservation pass. The full migration chain was also applied successfully to a fresh local PostgreSQL 16 database through sole head 0196. All 8 focused PostgreSQL runtime/migration tests passed, covering both ownership contexts, unpaid balances, card recording/replay and constraint adoption. The initial broader PostgreSQL selection was stopped to focus on these changed paths.
- Website: all 207 Restaurant unit tests pass.
- Business: all 299 Restaurant unit tests pass. A broader suite reports 778 passed / 4 failed in unchanged session-business (2), services-transactions-recovery (1), and wenze-organization-api (1). Those failures are outside this counter change; full suite is not green.
- Both production builds, TypeScript and changed-file lint pass; duplicate backend translation keys and diff whitespace checks pass.
- 19 responsive browser scenarios per frontend pass across focused runs. Final Business phone/desktop cash screenshots were regenerated with two passing reruns. An additional Website screenshot rerun initially hit a development-server startup timeout; its retry passed (1/1).
