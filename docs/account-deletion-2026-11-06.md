# Cancellable Personal deletion — local implementation

The existing account security screen fetches actual obligations on demand and
shows numbered references, localized explanations and resolution links. The
private review form opens only after blockers and an explicit review request.
Users select disputed references and explain them. Existing Support cases are
reused, linked and withdrawable. Resolving review never deletes an account.

Eligible users confirm directly using existing fresh passkey/recovery-email
verification. Backend rechecks obligations and returns the authoritative 30-day
deadline. The earlier date is labelled an estimate; receipt/status render the
exact server instant in local time. Duplicate clicks are guarded. Uncertain
confirmation retries reuse the same in-memory proof without resetting the date.

Localized `/shida/deletion/` is private/no-store. Old sessions are revoked; new
login alone never restores access. Explicit bound cancellation installs a fresh
HttpOnly cookie. Keeping deletion scheduled signs out. Expiry removes cancellation.
Failed reads never imply eligibility, restoration or completed deletion.

The shared Personal session helper redirects freshly authenticated pending
accounts from marketplaces. Business and WhatsApp use the same backend lifecycle
and secure web destination. No credential is placed in URLs, browser storage or
response bodies. A tab-local noncredential receipt is cleared after authenticated
status, cancellation or sign-out. Public content fetches use no-store to prevent
stale discovery after deactivation; identity-free job catalogs retain caching.

Cream/green/serif styling, inline next steps and accessible statuses support
EN/FR/LN/SW. Admin review replaces the old execution action with resolution and
shows pending, retry/preserved and genuine completed jobs. Retention explanations
include the existing 24-calendar-month Restaurant inventory policy and identify
unresolved financial detachment/retention and backup expiry. No all-data-at-30-days
promise is made. See backend `docs/account_deletion_lifecycle_2026_11_06.md`.

A future approved release requires backend migration 0225 and compatible auth
and worker code first. No new frontend environment variable or dependency. This
batch is local-commit only: no push or deployment.

Validation covers private gateways, origin rejection, fresh-cookie cancellation,
restricted redirects and public no-store transport. Browser tests cover review,
proof, confirmation, status without automatic restoration, explicit cancellation,
deadline and errors in four languages at 390px and 1366px. Synthetic fixtures do
not prove provider delivery. Final counts/limitations are in the completion report.

Final local frontend validation: 900/900 Vitest tests, 75/75 account-security
Playwright tests, Next.js 16.4.3 production webpack build and TypeScript passed.
Changed-file ESLint has zero errors and one full-document navigation warning.
The deliberate reload clears stale authenticated UI after scheduling. Node
24.22.1 and compatible existing dependencies were reused. No live provider or
production endpoint was exercised. Screenshots and synthetic reports remain in
ignored `test-results` as acceptance evidence.
