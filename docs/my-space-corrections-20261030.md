# My Space corrections — 30 October 2026

## Findings and changes
The activity screen excluded archived Wenze stores and individual selling activities, and malformed names could discard a marketplace result. It now reads active and archived records authorized to the signed-in account, preserves incomplete entries, shows missing information and links to existing management. Restaurant activities support additional pages. Archived Wenze management no longer attempts the active-only product fetch or crashes on a missing name.

This fixes confirmed discovery defects, not a verified census of this user's production records. Durable account ownership remains authoritative. Phone-number equality alone never transfers ownership. Unlinked legacy Wenze records retain the existing audited administrator legacy-owner-review procedure; no production records were modified. Other marketplace management continues through its existing WhatsApp destinations.

Account security compared a browser Origin to a configured application URL containing /shida. The backend now extracts the exact configured HTTPS origin, while continuing to reject different hosts, subdomains and invalid origins. Tests reproduced the failure using the documented configuration. Profile/security/recovery reads now have bounded loading, distinct authentication/error states and retry. Failed saves retain edits; cancel restores saved data.

Desktop duplicate navigation is hidden; mobile navigation is retained. A single account-scoped notification link is in the global header near the cart. Messages explains WhatsApp, simplifies empty lists and avoids duplicate read/acknowledge controls. Repeated identity, details headings and footer destinations are removed. Transaction cards and empty states share responsive styling, restaurant orders paginate, and empty pagination is hidden. Lost-phone recovery is reachable from sign-in and uses existing verified recovery services. Copy covers FR/EN/LN/SW.

## Contracts and security
No API shapes, database models, migrations, dependencies, production secrets or scheduled jobs changed. Migration head remains 0208. Account ownership, tenant isolation, proof requirements, recovery delays/review and session revocation remain enforced by existing backend services. Notifications remain distinct from WhatsApp conversations. Urgent WhatsApp templates remain enabled; the existing 24-hour measurement target and collector are unchanged.

## Validation and release
Focused backend validation: 59 tests covering the origin correction, retained ownership, account security/boundaries, optional recovery and audited legacy recovery. Frontend validation and final release evidence are recorded in the task delivery report. Full backend tests were intentionally not rerun locally per the user's focused-testing request.

Screenshots use synthetic authenticated fixtures against the locally built application; they are not screenshots of customer production data. No live recovery or legacy ownership mutation was attempted. Backend must deploy before the website; Business has no change. No database migration is required. Production commit verification is separate from a successful push.

Final local validation: 80 frontend unit tests and 63 Chromium browser tests passed (43 account/navigation/security, 8 notification, 12 correction scenarios). Production build, TypeScript, targeted ESLint and diff whitespace checks passed. Staged changes scanned with Gitleaks. Browser fixtures exercise proof boundaries; live recovery-provider operation was not attempted.
