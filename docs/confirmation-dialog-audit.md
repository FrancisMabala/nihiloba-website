# Confirmation dialogs: audit and first migration batch (2026-11-07)

## Contract
Use `useConfirmation` from `app/components/shida/confirmation-dialog.tsx` for new confirmations. Supply localized title, concrete consequence, and action label. Green is ordinary confirmation, amber is a reversible/disruptive operation or unsaved work, red is removal of saved data. The safe action receives initial focus. Escape cancels only while idle. Submission is locked until completion, failures remain visible, and focus returns to the trigger.

Callbacks must return their mutation promise and reject on failure. Helpers that swallow errors must be adapted explicitly. Allocate idempotency keys before opening the dialog and retain them on uncertain retries. Never turn a confirmation into a new backend lifecycle or delete operation.

## Backend behavior checked
- Candidate onboarding `cancel`: owner/revision checked, saved progress fields cleared. It does not delete a completed candidate profile. The UI now says delete saved draft, not Cancel.
- Candidate profile `archive`: sets archived/private and stops job alerts; history is retained. Amber, not permanent deletion.
- Personal job-offer progress `cancel`: clears unfinished progress, not published offers.
- Template archive: archives the reusable template; issued document snapshots remain independent.
- Cart clear: removes current basket contents, not already placed orders.

## Implemented and validated first batch
Candidate profile archive/draft removal; personal job-offer draft removal; Wenze basket clearing; Services template archive and editor exit. The same component is mirrored in the independently built Business repository for restaurant table QR rotation/retirement.

Validation: candidate browser suite 31 passed; personal-offer browser suite 8 passed; basket failure checks in all four languages passed; service template archive retry and unsaved-form preservation passed. Production build and affected lint passed. Business component has 7 focused unit/integration tests and passed production build/type checks.

## Remaining batches (not completed)
The audit finds native dialogs in Restaurant checkout/guest/counter/intake/daily/inventory/money/service/seller workspace, Services brief/bill/finance/management, and the shared `restaurant-work` navigation guard. Existing custom Wenze confirmation hooks also need migration: quick-sell, stock/sales adjustments, product import and product lifecycle. Business still has restaurant operational, Services and school confirmations beyond table QR operations.

The synchronous `leaveWork()` event contract needs a coordinated asynchronous migration across callers. Do not replace it with an immediately resolved boolean or monkey-patch window.confirm. Preserve browser `beforeunload` protection for tab closure/reload: browsers control that native prompt and do not allow a custom modal there.

False positives: local functions named `confirm` in checkout, account deletion, and Counter are business actions, not necessarily browser prompts. No window.alert/window.prompt were found in the audited app sources.

Repeat audit: `rg -n 'window\.(confirm|alert|prompt)\s*\(' app` and inspect bare `confirm` calls plus `useWenzeConfirm` separately.

## Commands
- `node node_modules/next/dist/bin/next build --webpack`
- `node node_modules/@playwright/test/cli.js test --config playwright.confirmations.config.ts`
- Existing candidate and personal-offer Playwright configurations remain unchanged.

Browser tests use isolated synthetic route responses, never production mutations. No dependency installation, backend change or migration is part of this batch. Generated Playwright evidence is retained under ignored test-results; existing unrelated outputs are untouched.

## Follow-up: Services request editor
Back from a modified published-request editor now uses the shared amber confirmation. Dismiss keeps edits; confirming discards only local edits, without deleting or revising the saved request. Pending submissions remain protected. All four locale browser tests exercise dismissal, leaving, reopening the original content, and the existing reviewed revision/retry flow. Affected lint and the webpack production build passed. Default Turbopack cannot resolve this checkout's shared node_modules junction; the established webpack command above is used without installing duplicate dependencies.
