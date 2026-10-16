# Personal Services provider area and public marketplace

Setup design follow-up: the first-service invitation and form now use a compact SHIDA card, clearer localized labels and a prominent create action. The marketplace access checks and existing creation/retry semantics are preserved. See [setup design and focused validation](services-provider-setup-2026-10-16.md).

Implemented locally on 16 October 2026. Entry: `/shida/seller/services`, with `/fr`, `/ln`, `/sw` and `/en` equivalents. The public collection remains English/French at `/shida/services` and `/fr/shida/services`.

## Existing behaviour and change

The Personal provider area already used protected Services APIs, but stacked profile editing, transactions, templates, branding, finance and reports on one long page. It lacked the seller navigation and account controls used by Wenze and Restaurant. The Backend already allocates all implemented Personal Free/Pro pilot capabilities without a purchase; no new plan policy was necessary.

The workspace now uses the Wenze/Restaurant cream, forest-green and gold design, with a desktop sidebar, horizontally scrollable phone navigation, an overview, first-service setup, and seven working destinations:

| Destination | Connected functions |
| --- | --- |
| Overview | Published active offerings, active unclassified drafts, published offerings accepting requests, and working shortcuts |
| Services & prices | Create a private offering, edit details/category, save incomplete drafts, review/publication, requests toggle, reviews, package creation/edit/archive, package description and prices, social link, public preview, service archive/restore |
| Requests & bookings | Existing requests and quotes, booking decisions/progress/rescheduling, customer history and transaction messages; bills, send/retry and reminder controls remain attached to their booking |
| Finances | Currency-separated totals, job costs, declarations, expenses and corrections |
| Reports | Existing operational/financial reports and authorized aggregate CSV exports |
| Templates | Existing quote and bill draft templates, including application from transaction work |
| Bill settings | Existing presentation and preview for new bill versions |

Navigation is derived from Backend capabilities. There is no frontend Free/Pro selector, purchase gate or self-grant. One Personal account remains the provider; multiple services do not create additional accounts. Organization staff, branches and Organization administration are outside this Personal area.

Overview figures count offerings, not bookings, customers or money. No inferred revenue or fabricated activity is displayed. `?offering=SVC_…` still opens the owned saved offering; `?view=overview|services|work|finance|reports|templates|settings` opens a permitted section. Sections stay mounted once visited so switching sections retains drafts. Leaving the account or switching offerings warns about unsaved catalog edits. A customer-history “job costs” action opens Finances with the exact selected reservation.

Catalog writes retain the same request body, revision and operation/idempotency key after an uncertain response. Editing is disabled until retry resolves the original save. Conflicts reload the current service for review. Archive confirmation is explicit, and archived offerings can be restored without deleting transaction history. Withdrawn history is labelled separately from a private draft.

## Public design

The collection now has a compact editorial hero using the existing local Services illustration, a provider entry and customer bill-notice link, a responsive search form, category chips, result counts and service cards, a short explanation of the customer journey, and a provider call to action. Search/category navigation preserves filters and resets pagination. Cards retain the validated Backend canonical service identity, but use local English/French paths instead of absolute URLs that leave the current site or language. Detail and provider pages share the refreshed cards and visual treatment.

Missing photos use category artwork; empty ratings and prices remain absent. Existing broad-area/private-address rules, availability, booking links and public review projections are unchanged. No fabricated provider photographs, ratings or testimonials were added.

## Session and API boundary

Personal WhatsApp sign-in, session polling, cross-tab account changes, sign-out, account switching and offline suspension follow the established seller implementation. Account changes unmount private work; every private request retains the current noncredential session binding. No private data is stored in browser storage.

The Services gateway additionally allows the existing exact-profile PATCH, DELETE and POST-reactivate commands. Lifecycle requests require a single positive bounded `expected_revision` query parameter. Organization/actor query injection, duplicate revision parameters, stale bindings, untrusted origins and unsupported paths are rejected. Exact ownership, state, revision and replay checks remain in Backend. Existing private/no-store headers and CSP remain enabled.

## Validation

- TypeScript and the webpack production build passed.
- Changed implementation/new-test ESLint passed; Git whitespace checks passed.
- Services unit tests: **64 passed** across six loaded files.
- Backend Services regression tests: **117 passed** in a new isolated SQLite database. Coverage: pilot capability allocation, provider web handoff/transactions, profile ownership, revision/idempotency/lifecycle operations, public marketplace and privacy.
- Services browser inventory: **51 passed** against the production build, including public collection/detail navigation, responsive layouts, four provider languages, setup/retry, archive/restore, account replacement/expiry and existing transaction, finance, report, template, bill and reminder flows.
- Screenshots: `docs/evidence/services-provider/`, with provider EN/FR/LN/SW at phone/tablet/desktop widths and public FR at 360/820/1440 px. The fixtures are synthetic examples, not live providers.

The initial unit run exposed a missing `count` in a new empty-result fixture. Browser checks exposed a trailing-slash expectation, absolute service-card navigation and stale fixture data in the persistent fetch cache. The assertions, fixtures and local navigation were corrected; every browser run now uses a fresh test origin to isolate its fetch cache. The sandboxed Backend test-client run stalled and was stopped; the successful run used the same isolated database/no-outbound-network harness outside the sandbox.

Only Services tests ran. The complete repository test suites were not run. The browser server uses an explicit process-local fixture import and a test-only origin; it does not authenticate with production or send real WhatsApp messages. Backend outbound sockets were blocked. These checks do not replace live staging/phone/Meta acceptance or the pre-existing PostgreSQL release gates.

## Deployment and remaining work

Website implementation only; Backend executable code and Business Dashboard are unchanged. No schema migration, production environment variable, dependency, worker, cron or Meta template was added. Verified Alembic head: **0168**. The fixture-only `SERVICES_FIXTURE_MODE` and per-run `services-<uuid>.fixture.invalid` origin are used only by the browser test config and must not be used for deployment.

Deploy the website against the existing Backend Services APIs through IMP-10B. Keep the existing Personal session/origin configuration. No deployment or push was performed. Fixed-slot scheduling, unimplemented future Pro features and Organization-only operations were not invented for this workspace; Services remains Partial under the canonical module specification.

Implementation files: `personal-services-manager.tsx`, `services-management.tsx`, `services-provider-overview.tsx`, `services-provider-copy.ts`, `services-provider.css`, `services-public.css`, the public `services.tsx` and collection routes, transaction/totals navigation adapters, and the Personal Services gateway. Scoped tests, isolated public fixtures and `playwright.services.config.ts` were updated alongside this note and the Backend canonical implementation status.

Suggested commit: `feat(services): add Personal provider workspace and refresh marketplace`.
