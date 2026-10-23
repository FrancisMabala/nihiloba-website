# Unified registration, login and account navigation — 23 October 2026

## Audit and implementation

The previous web wizard already exposed the canonical fields but split them into
small sequential screens. Its unverified values were memory-only, the public
header had no direct registration action, and the signed-out modal included
protected management links. Wenze had only a generic secondary selling link.

The public header now separates primary Sign in from secondary Create account.
On narrow phones the direct registration link is in the compact sign-in dialog.
Authenticated header controls retain My Space, management, settings, change
account and logout; no signup link is shown. Existing authorized Organization
selection and Business access remain in My Space/Business, not inferred from a
phone number or from the public header's minimal session projection.

Login has one instruction, WhatsApp action, code entry/recovery, direct signup
link and close/browse action. Ordinary login still cannot create a Personal actor.
Registration entry preserves a safe local return destination. The prepared
WhatsApp message, originating-browser proof and six-digit code remain canonical;
no Meta authentication template or new login service is introduced.

## Field parity

Source: Backend `PersonalOnboardingService.FIELDS`, `OrganizationOnboardingService`
and `OrganizationAddressService`; both WhatsApp and web consume these services.

| Field | Personal | Business | Web treatment |
| --- | --- | --- | --- |
| personal_name | Required | Required; existing actor name retained | Personal information |
| city, country_code | Required; recognized city can supply country | Required | Location/creator section, server normalizes |
| area | Optional | Not applicable | Personal location |
| name, organization_type, sector | Not applicable | Required | Organization information; canonical catalogs |
| custom_organization_type | Not applicable | Required when type is other | Conditional field |
| commune_or_municipality, street_or_avenue, building_or_parcel | Not applicable | Required | Private registered address |
| quartier_or_area, landmark | Not applicable | Optional | Private registered address |
| WhatsApp contact | Trusted sender establishes identity | Trusted sender establishes Personal actor | Explicit international input is only an expected contact, never authority |
| Terms/Privacy | Current versioned terms and privacy acknowledgement | Also current Business Terms | After verification; unchanged acceptance service/history |

No email, date of birth, commercial registration number, new account type or
student field is invented. Four steps: account choice, complete grouped form,
WhatsApp verification, canonical review/legal/completion. Saved canonical drafts
also expose their editable fields together. Existing values and concurrently
created cross-channel drafts take priority over unverified input.

## Draft recovery and security

Unverified form fields and the expected phone are stored in **sessionStorage for
the current tab**, with a fixed maximum 24-hour lifetime, schema/size limits and
an explicit Clear saved form action. No code, challenge, verifier, token, legal
acceptance or account authority is stored there. Refresh and switching to
WhatsApp retain form content. Recovery returns to the form and requires fresh
verification; it never replays a previous code or assumes a prior challenge is
valid. Closing the tab or clearing browser storage can remove this local draft.
When browser storage is unavailable, the UI explains the limitation and offers
the existing verify-first Resume route. Account-change events clear local fields.

After verification, the existing actor-owned, revision-checked server drafts
support cross-channel/device resumption and their existing 30-day inactivity
expiry. Canonical validation, duplicate protection, cancel/restart, existing
account recognition, legal version checks, session rotation and one-time Business
POST handoff remain unchanged.

The expected number is compared with the proven WhatsApp actor **after code
validation and before session creation**. A mismatch cancels that challenge,
clears its code hash and returns a generic correction action. Neither number is
reflected; no account is merged or relinked. Existing verify-first clients may
omit the optional expected contact. This is an additional consistency check, not
a replacement for sender proof, browser binding, attempt limits or atomic use.

## Wenze and navigation

Two compact invitation cards follow buyer discovery: occasional item selling and
Personal shop creation/management. Signed-out clicks go directly to registration
with the intended destination; signed-in clicks use the existing protected
journey. Availability errors are not treated as missing accounts. No automatic
social-network import or synchronization is claimed. Existing Organization
management remains in the shared Business Dashboard with its exact permissions.

Desktop keeps one header; mobile keeps the existing safe-area/keyboard-aware
bottom bar. Specialized workspaces retain their local shells. Layouts and all new
copy cover FR/EN/LN/SW. No PWA, new dashboard or education feature is activated.

## Validation and release

Production Next build, TypeScript, scoped ESLint and diff checks passed. Frontend
unit/gateway tests: **57 passed**. Registration/navigation browser matrix:
**84 distinct scenarios passed** across Chromium/WebKit, FR/EN/LN/SW and mobile,
tablet and desktop (83 in the final full run, plus the expiry test passed in both
engines after making its assertion wait for hydration). Earlier runs exposed
ambiguous translated close-button selectors, a test-output-directory collision,
and intermittent WebKit clicks; selectors/output isolation were corrected and
interactive targets/focus transitions no longer animate their position. The
final matrix passed all Personal/Business completion and selling click scenarios.
Existing shared-login regression: **19 passed**, including message-required
authentication, four languages, intended destination, code errors/expiry, rate
limits, cross-tab invalidation and uncertain-response cleanup. Other impacted
browser fixtures' literal button labels were updated; their full suites were not
rerun as part of this narrow shared-presentation change.

Backend: **56 focused tests passed**. Full-suite retry: 221 passed, 2 skipped,
then an analytics fixture teardown FK error deleting posters, independently
reproduced on unchanged `ffa348e4` (1 passed, same teardown error). The first full
attempt encountered a Windows temp-directory permission error, resolved by using
a fresh workspace basetemp. No full-suite green claim; no skips added.

Backend changes are a
narrow optional registration-contact guard and tests. No migration, new
dependency, environment variable, worker, cron, legal document or rollout flag.
Audited Alembic head: 0200. Deploy Backend compatibility first, then Website.

Backend implementation pushed and remote-verified:
`5b74d4c4d1fce1ebd874452ec980195578ed2682`, verified Live on Render deployment
`dep-dbdjt2ivcj2c7381ccag` (service `srv-d811j4ugvqtc73e0fks0`). Website release
will be recorded after verification. Existing npm advisories remain
(2 moderate, 9 high, 1 critical); no unrelated dependency changes.

Screenshots: [mobile form](evidence/unified-registration-20261023/registration-mobile.png),
[desktop form](evidence/unified-registration-20261023/registration-desktop.png),
[mobile login](evidence/unified-registration-20261023/login-mobile.png),
[desktop selling](evidence/unified-registration-20261023/wenze-desktop.png),
[mobile selling](evidence/unified-registration-20261023/wenze-mobile.png).

Physical-phone WhatsApp delivery and physical Safari/Android keyboards remain
external acceptance checks; automated tests use synthetic identities/messages.
