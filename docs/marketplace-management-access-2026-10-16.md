# Marketplace management access — 2026-10-16

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
- Existing Restaurant seller browser suite in the production-build run: 15 passed and 6 failed. Failures concern menu add/pricing, an hours confirmation assertion, three old portion-editor/Orders assertions and menu pagination. These flows were not changed by this work. The broader suite is not claimed as green; no baseline rerun or unrelated fixes were made.
- Backend: 91 passed on a fresh isolated SQLite database with outbound network blocked: `test_restaurant_personal_api.py`, `test_service_profile_ownership.py`, `test_wenze_management_authorization.py`, `test_wenze_store_authorization.py`, `test_security_employment_durable_pair_authorization.py`. An initial sandbox run was interrupted without results; the permitted isolated rerun completed in 110.34 seconds.
- Mobile screenshots visually inspected; no horizontal overflow in the new setup screens.
- Current Alembic head: `0168`; no migration or schema change.
- Full backend suite and live WhatsApp/production acceptance were not run; backend runtime code is unchanged.

The initial mixed browser invocation incorrectly used Wenze's port-specific fixtures on the Restaurant port, and the new fixture initially treated anonymous cart requests as authenticated calls. Those harness errors were corrected and the access/Wenze suites rerun successfully. No production authorization was weakened to satisfy a test.

## Release and remaining work

Deploy the website build to release the changed entry screens. No new environment variable, dependency, worker, cron, WhatsApp template, backend deployment or migration is required. This work adds no paid restriction and does not change pilot allocation. Live acceptance remains a release check; the older Restaurant menu tests should be reconciled separately.

Suggested commit: `fix: require marketplace profiles before opening management`
