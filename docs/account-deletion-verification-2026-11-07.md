# Deletion verification guidance

The deletion confirmation and review flow now checks the existing recovery-method
overview before requesting a proof. If no passkey or recovery email is configured,
it explains setup and the existing 24-hour wait. A verified sign-in email is not
treated as a recovery method. Newly added methods get distinct waiting guidance;
the settings show their exact availability time. Both settings sections are linked
beside deletion confirmation and can receive keyboard focus.

The backend remains authoritative for method age, fresh login and action proof.
Stale overview / server rejections now show the appropriate localized explanation
instead of the generic account-verification error. The selected email preference
is respected. No deletion request is sent when proof verification fails.

This fixes the shared web destination used by WhatsApp account deletion. It does
not alter WhatsApp routing, authorization rules or the deletion lifecycle. No
backend change or migration is needed. EN/FR/LN/SW browser checks cover missing
methods, new passkeys, new recovery emails, server rejections, working mature
email-only verification, review and explicit restoration. Provider delivery is
mocked; no real account is deleted by validation.

Local validation: 913/913 unit tests and 89/89 account-security browser tests
passed, as did the production webpack build and TypeScript. Full ESLint has zero
errors and 11 existing warnings. The task reused the existing checkout and Node
dependencies. Ignored browser screenshots in `test-results/account-security` are
retained as acceptance evidence; the existing `.next` output remains available
for reproduction. CI and exact-commit deployment are recorded in the release
report after completion.
