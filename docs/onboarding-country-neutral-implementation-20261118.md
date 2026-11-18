# Country-neutral account creation — local implementation

18 November 2026. Implements the product decision following
[the eligibility audit](onboarding-eligibility-audit-20261118.md).
This is local source and synthetic-test evidence, not a production release.

## Adopted contract

Account creation has no residence, nationality, telephone-country or DRC-activity
eligibility gate. The required declaration is **“Je confirme avoir au moins 18
ans.”** EN: “I confirm that I am at least 18 years old.” LN: “Nandimi ete nazali na
mbula 18 to koleka.” SW: “Ninathibitisha kuwa nina angalau miaka 18.” This remains
a required self-declaration, not independent verification of date of birth.

New clients send `X-Shida-Eligibility: adult-v1`. Website, Business and Backend
accept the exact old `adult-drc-v1` marker only **before 3 December 2026, 00:00 UTC**.
The old declaration explicitly included age 18+, so the bridge preserves an
affirmative age assertion. Missing, false, unchecked and unknown values are never
upgraded to an assertion. At/after the deadline old challenge creation returns
`eligibility_required`; localized current clients explain confirmation/reloading.
The bridge must not be silently extended if release is delayed. Existing signed-in
users and ordinary existing-account login do not repeat new-account declarations.

Residence uses the existing canonical country dictionary, independent international
telephone validation and existing number-verification proof. Country/city are
residence fields; Kinshasa retains commune/quartier and optional avenue. Service
locations, organization addresses and Meda endpoints are separate concepts.

New/incomplete Business creators additionally supply `residence_*` draft fields;
`creator_residence_required` is authoritative from Backend. The same fields are
supported by Website's existing Business-registration entry. They are validated
with Personal location rules and stored on the Personal account at atomic
organization completion, never on the organization. Existing Personal residence
is preserved, including known fields on incomplete profiles. Existing named
legacy accounts are not bulk-enriched or forced to fabricate missing residence.
Their existing profile-editing flow remains available. No phone/IP/address/journey
inference and no residence data migration or backfill are introduced.

Meda already accepted international origin/destination countries. Regression tests
publish a synthetic SE→FR journey; no DRC endpoint is added. Category, safety,
moderation, identity, ownership, participation and transaction rules are unchanged.
Country-neutral registration does not guarantee service availability or legal
authorization in every jurisdiction.

## Source map

| Repository | Changes |
|---|---|
| Website | `app/lib/registration/eligibility.ts`, `copy.ts`, `residence-copy.ts`, `return-path.ts`, `local-draft.ts`; `registration-wizard.tsx`, `registration-location.tsx`, `personal-whatsapp-login.tsx`; Personal WhatsApp gateway and browser request helper |
| Business | `lib/registration-eligibility.ts`, `residence-copy.ts`, `creator-progress.ts`, `organization-creation.ts`, `organization-creation-copy.ts`, `dashboard/onboarding.ts`; registration gateway; creator details/residence, onboarding review and Business auth components |
| Backend | `app/services/registration_eligibility.py`, `organization_onboarding_service.py`, `app/routes/registration.py`, `app/models/legal_documents.py` |

CSRF/origin checks, rate limits, purpose-bound verification, expected-phone checks,
browser bindings, session scopes and permissions remain on their existing paths.
No verification fallback, new endpoint, general chat or WhatsApp profile/Business
creation is introduced. Cached Business creator confirmations from the old
unversioned form must be reconfirmed under `adult-v1`.

The safe-return allowlist now preserves language and exact Meda public listing,
personal listing and enquiry/conversation destinations (`MED_` / `MEQ_` references).
It rejects external origins, duplicate/unknown query parameters, credentials,
encoded separators, fragments and unsupported actions. A return URL never grants
access or performs a transaction. Business's existing private POST handoff remains
separate and does not expose its token in a URL.

The shared Personal login panel now uses this same allowlist with the complete
local pathname/query for its signup link. Previously that intermediate link could
drop a Meda detail reference even though Meda's direct signup link retained it.

## Terms and coordinated release order

Terms of Use and Business Terms **1.2** are prepared in FR/EN using the existing
immutable-document process. Privacy remains **1.1**. Old 1.0/1.1 sources and recorded
acceptances are retained. LN/SW onboarding and errors are translated; legal text
continues the established explicitly labelled French fallback, not a claimed
Lingala/Swahili legal translation. New Terms acceptance is explicit and is never
recorded by viewing a page, signing in or deploying this change.

1. Review the prepared Terms and publication/notice timetable. Publish the exact
   1.2 Website document URLs first using the separate Terms-only local commit.
   That commit leaves the canonical current versions at 1.1. Set truthful
   publication metadata at publication; do not invent an effective date now.
2. Release Backend's dual-marker bridge, independent creator residence contract
   and current Terms registry (Terms/Business 1.2, Privacy 1.1). Verify the exact
   document URLs are reachable before any user is asked to accept them.
3. Release Website's final onboarding/current-document-pointer commit and Business
   together. New clients emit only `adult-v1`; old clients have the bounded bridge.
   An old Business form cannot complete a new creator without the new residence
   fields: ask it to reload during this short coordinated rollout, not bypass
   required data. Preserve `NEXT_PUBLIC_SHIDA_WEB_REGISTRATION_ENABLED` and the
   existing backend registration rollout flag; this patch does not enable them.
4. Verify synthetic registration, exact document versions, no implicit acceptance,
   safe returns and existing-account login. After the compatibility deadline,
   monitor outdated-client errors; never silently accept a missing declaration.

The prepared Terms retain other existing clauses for review, especially operator
details, governing-law/notice wording (including references to DRC rules), payment
and transport responsibilities, initial-release service exclusions, and the
notice/acceptance process for existing users. This implementation neither certifies
worldwide legal compliance nor removes feature-specific obligations. Publication
and any legal-policy decisions are still distinct from this local code delivery.

No schema migration is required: residence uses existing Personal columns and
the existing organization draft JSON. Acceptance rows remain append-only under
the existing versioned mechanism. Do not roll Backend back before the adult-only
clients: an old Backend would reject their marker.

## Focused validation

- Backend isolated synthetic suite: 120 passed before the final incomplete-profile
  preservation refinement; 56 affected cases passed on the final rerun, including a new preservation case.
  Across the backend selections, 167 distinct cases passed.
  Country dictionary/location normalization: 46 passed. Coverage includes foreign
  residence with +243, DRC residence with +46, international creators/organizations,
  SE→FR Meda, missing/invalid/expired declaration markers, expired proof, existing
  and incomplete accounts, scope restrictions, current/historical Terms and web-only
  onboarding. No full Backend suite or production database was used.
- Website: 57 focused Vitest tests passed. Business: 20 focused Vitest tests passed.
  Both production builds and TypeScript checks passed. Focused ESLint has no errors;
  Business retains one pre-existing navigation warning in `lib/dashboard/api.ts`.
- Actual Next.js production-page Chromium checks: Website 9 Personal/return cases
  at 390/1440px across FR/EN/LN/SW, plus 4 mobile Meda login-panel/signup cases and
  4 Website Business-form/private-handoff
  cases; Business 8 creator-residence/consent/completion cases at 390/1440px across
  all four locales. No horizontal page overflow in the checked residence forms.
  All messaging/OTP responses and accounts were synthetic browser fixtures.
- Initial harness failures were corrected: a Business location fixture omitted
  required canonical communes; Website's first build had registration disabled,
  then initial ISR pages lacked synthetic catalogs. No production validation or
  feature gate was weakened to make these checks pass.

Screenshots: [Website mobile declaration](evidence/onboarding-country-neutral-20261118/website-adult-390.png),
[mobile residence](evidence/onboarding-country-neutral-20261118/website-residence-390.png),
[desktop declaration](evidence/onboarding-country-neutral-20261118/website-adult-1440.png),
[desktop residence](evidence/onboarding-country-neutral-20261118/website-residence-1440.png).
Business captures are under the same evidence-directory name in its repository.

Limitations: browser emulation is not a physical phone/Safari check; no real OTP,
WhatsApp delivery, production account, live release or legal approval was tested.
Backend evidence is isolated SQLite, not new PostgreSQL migration/concurrency
evidence; no schema, locking or financial algorithm was changed. Native-language
editorial/legal review remains separate from automated four-locale checks.

For repeatable Website browser checks, build with
`NEXT_PUBLIC_SHIDA_WEB_REGISTRATION_ENABLED=true` and the existing synthetic
`scripts/marketplace-style-fixture-fetch.mjs` preload, with its guarded
`SERVICES_FIXTURE_MODE=1` / `https://services-<UUID>.fixture.invalid` origin.
Use `playwright.country-neutral.config.ts` and select the country-neutral or
Organization-handoff cases; the broader registration spec is retained. Business
uses its matching config against a loopback production preview. Do not use
production dotenv files or messaging credentials.
