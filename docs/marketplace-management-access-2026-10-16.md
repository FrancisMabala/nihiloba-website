# Marketplace management access — 2026-10-16

Services presentation follow-up: the setup invitation and form have been redesigned without changing this access contract. The Services screen now uses task-focused copy instead of displaying the internal permission explanation. See [Services setup design](services-provider-setup-2026-10-16.md) for changes and focused validation; Restaurant entry remains unchanged.

## Approved behavior

One human keeps one Personal SHIDA account. A valid sign-in is reused, as explicitly chosen by the user; entering management does not require another WhatsApp verification. Authentication alone never grants marketplace management rights.

Every implemented management entry must check the requested marketplace, exact owner/context and current permissions before showing management tools. A Restaurant profile grants no Wenze, Services, Employment or other marketplace authority. A person may independently qualify for several marketplaces. Public browsing, following, favourites, customer orders and candidate activity remain Personal actions.

Signed-out visitors authenticate first. An authenticated person with no corresponding profile sees a localized invitation to create that profile through the existing supported setup flow. Creating a new profile is explicit. Failed, forbidden, malformed or unfinished discovery is not evidence that a profile is absent and must not open management or falsely suggest recreating an existing profile. Organization members must use the appropriate Organization context and module setup/access policy; personal setup does not grant Organization authority.

## Existing behavior and gap

- Wenze already waits for the protected account-owned shop list and shows a setup screen when it is empty. Its operations independently authorize the exact shop.
- Services previously showed the full provider navigation when the account had no provider offerings, because pilot capability allocation was mistaken for sufficient UI admission. The backend already scoped profile reads/writes to the exact durable owner and context.
- Restaurants already scoped its protected list and operations to the exact Personal owner, but rendered the management shell before discovery and automatically opened creation for an empty list.
- NIHILOBA currently has Personal management routes for Wenze, Services and Restaurants, plus protected restaurant receipts. Employment/company and other Organization operations use their existing backend/Business Dashboard authorization. No new management destination is introduced for an unavailable marketplace.
- Business Dashboard review confirmed separate exact-context Restaurant and Services gates, module-specific capability navigation, and server authorization. No Business Dashboard source was changed.

## Changes

Services now shows only provider setup when the protected profile list is empty. No provider overview, finance, report, template, message or booking panel mounts, including on a direct query-string destination. Setup requires an explicit choice and reuses the existing idempotent creation form. After successful creation, the first service editor opens. Archived profiles retain their existing recovery and history workflows.

Restaurants waits for discovery before rendering its management shell. An empty unfiltered list shows a setup invitation; its creation form opens only after the user chooses it. The form reuses the existing mutation, retry, revision and stale-state behavior. Existing authorized establishment operations are unchanged.

Both areas reject malformed discovery. Existing shared session binding and account-change remounts clear private state. New wording is supplied in EN/FR/LN/SW. The server remains the authority for every read and mutation; no browser flag, new human account type, inferred ownership or automatic module activation was added.

## Files

- `app/components/shida/services-management.tsx`
- `app/components/shida/restaurant-seller-workspace.tsx`
- `app/lib/marketplace-entry-copy.ts`
- `tests/browser/marketplace-access.browser.ts`
- `tests/browser/services-provider.browser.ts`
- `playwright.marketplace-access.config.ts`
- This report and mobile screenshots under `docs/evidence/marketplace-access/`.

The Backend module contract and Services/Restaurant implementation-status notes record the same rule.

## Validation

- Production webpack build: passed.
- TypeScript without incremental output: passed.
- ESLint for changed code/test files: passed.
- Gateway/session/login Vitest suites: 97 passed across 5 files. The first sandbox attempt could not rename temporary cache files and ran no tests; the permitted rerun passed. Historical `.s3a-local` copies were excluded.
- New marketplace access browser suite: 27 passed. Covers regular users, each single-marketplace owner, no session, 403/503/malformed discovery, direct URLs, account replacement, delayed discovery, explicit creation, and mobile FR/LN/SW.
- Existing Wenze browser suite under its own port/configuration: 16 passed.
- Existing Services management/provider browser suites in the production-build run: 10 passed, including uncertain creation retry, archive/restore, account replacement and four locales.
- Restaurant seller browser suite: **21 passed**, including all six previously failing cases. A rerun reproduced the original failures before correcting the stale fixtures and UI expectations. No test was skipped and no production behavior was changed to satisfy these regressions.
- Dedicated Restaurant personal-menu browser suite: **16 passed**, including four locales at three widths, preparation setup, availability and failed-read recovery.
- Final combined production-build browser invocation: **58 passed** (21 Restaurant seller, 27 marketplace access, 10 Services management/provider). The focused 97-test Vitest run also passed again.
- Backend: 91 passed on a fresh isolated SQLite database with outbound network blocked: `test_restaurant_personal_api.py`, `test_service_profile_ownership.py`, `test_wenze_management_authorization.py`, `test_wenze_store_authorization.py`, `test_security_employment_durable_pair_authorization.py`. An initial sandbox run was interrupted without results; the permitted isolated rerun completed in 110.34 seconds.
- Mobile screenshots visually inspected; no horizontal overflow in the new setup screens.
- Current Alembic head: `0168`; no migration or schema change.
- Full backend suite and live WhatsApp/production acceptance were not run; backend runtime code is unchanged.

The initial mixed browser invocation incorrectly used Wenze's port-specific fixtures on the Restaurant port, and the new fixture initially treated anonymous cart requests as authenticated calls. Those harness errors were corrected and the access/Wenze suites rerun successfully. No production authorization was weakened to satisfy a test.

## Restaurant test reconciliation

The seller tests now follow the current Today entry screen, explicit Orders navigation, Add item action, saved-item preparation editor and slash-separated amount display. Their fixture retains created items and saved hours, resolves individual item references, returns preparation routes, and honors server pagination.

Pricing checks still preserve the large decimal unit price and configured amount strings, and now check the saved editor and menu display as well as outgoing payloads. New items must remain unavailable until configured. Hours and publication tests explicitly dismiss and then accept the confirmation dialog, verify dismissal sends no write, and retain the exact QR-pixel assertion. Responsive portion editors still verify that cancelling leaves amounts unchanged and sends no write. The paginated-menu test uses 51 items, requires requests for pages 1 and 2, and searches successfully for the item on page 2 before switching language.

Reproduce against a production server on port 3013 with `RESTAURANT_TEST_EXTERNAL_SERVER=1`:

```powershell
node node_modules/@playwright/test/cli.js test --config playwright.restaurant.config.ts tests/browser/restaurant-seller.browser.ts tests/browser/marketplace-access.browser.ts tests/browser/services-provider.browser.ts tests/browser/services-management.browser.ts --output test-results/restaurant-access-regression
```

The dedicated menu suite uses the same configuration with `tests/browser/restaurant-personal-menu.browser.ts`. Test-generated changes to historical screenshots were preserved outside the repository and restored to their committed versions.

## Release

Deploy the website build to release the changed entry screens. No new environment variable, dependency, worker, cron, WhatsApp template, backend deployment or migration is required. This work adds no paid restriction and does not change pilot allocation. Live WhatsApp and production acceptance remain deployment checks; the six Restaurant UI regressions are resolved.

Access implementation: website commit `1ca1a21` and Backend documentation commit `c779ccab`. The Restaurant test follow-up changes only its fixture/assertions and this validation report.
