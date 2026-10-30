# My Transactions redesign — 30 October 2026

The previous directory of links is replaced by a real Personal customer overview
at `/shida/space/?view=transactions`. The design retains the SHIDA header, sidebar
and mobile navigation, with cream surfaces, forest-green controls, serif headings,
three summary cards, category filters, recent/oldest sorting, compact desktop rows,
stacked mobile cards and a small local SVG empty illustration. Creation, management,
Messages, account security and urgent WhatsApp templates are unchanged.

The new private gateway forwards the bound Personal session to
`/api/dashboard/personal/transactions`. It rejects cross-site/stale-session calls,
unknown/duplicate query parameters, insecure upstreams and redirects. It does not
accept caller-supplied actor or Organization authority. The backend is the source
of counts, statuses, amounts, document lineage and authorization.

`PersonalTransactions` clears visible data whenever the session, filter, locale,
sort or page changes. Aborted/failed/malformed or partial responses display an
error and retry, never a zero/empty assertion. No browser-stored transaction cache
or production sample records are introduced. Summary controls and filters are
keyboard-operable; navigation remains normal links. Locale copy covers EN/FR/LN/SW,
with existing domain status helpers and Intl formatting. Unknown statuses use a
localized detail prompt rather than raw enums or fabricated meanings.

All shows recent orders/requests and a separate document section without duplicate
rows. The Documents filter paginates all available documents. Restaurant order
receipts and issued Service bills are not labelled paid. Missing amounts/currencies
are not guessed. Details route to existing Wenze orders, food orders/receipts,
service requests/bookings/bills and candidate applications. Restaurant reservations
now accept an exact `reservation` query and use the existing authorized detail API.

Hotels, Housing and Transport have no current customer web management page. Their
safe read-only disclosures show available booking/visit details and explain that
management remains in the existing SHIDA WhatsApp conversation. No fake links or
new cancellation/acceptance/booking functionality were added.

## Validation workflow

- `npm run build`, TypeScript and scoped ESLint.
- Vitest: `tests/personal-transactions.test.ts`, `tests/transactions-gateway.test.ts`,
  existing `tests/personal-activity.test.ts`.
- `scripts/transactions-acceptance-backend.py <backend checkout>` starts a disposable
  local backend on port 8058, disables dotenv loading and creates synthetic normal
  records/session cookies. Never run it against production. Its TemporaryDirectory
  owns the fixture database.
- `npx playwright test -c playwright.transactions-design.config.ts` uses the actual
  local backend through a test-only HTTP transport adapter. No API mocks are used
  for the empty/one/mixed screenshots. Response interception is limited to explicit
  failure tests. Evidence covers 360, 390, 768 and 1440 pixels.
- Visual review compares empty/populated screenshots with the supplied reference.
  Mobile cards intentionally wrap and keep full-width 44px actions rather than
  shrinking into an unreadable table. Existing navigation is preserved. Synthetic
  records differ from the reference's illustrative businesses, prices and dates.

## Release boundary

Deploy the matching backend first. No migration, new production configuration,
scheduled job or dependency is needed. Urgent WhatsApp templates remain enabled.
Verify remote main SHAs, accessible CI and both Render live commits, then perform
read-only production navigation/filter checks. Local responsive screenshots do not
constitute a physical-device or production mobile test; report those separately.
