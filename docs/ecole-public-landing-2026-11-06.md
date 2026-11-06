# SHIDA École public landing — 6 November 2026

## Scope and existing architecture
The public landing is a server-rendered presentation independent of internal school management. The existing bounded public directory now streams within Suspense; slow or failed public requests do not block the hero, benefits or Business links. No backend, database, authentication, WhatsApp, entitlement or school-management changes.

Reused the shared public header/footer, ButtonLink, icons, localized routes, strict public-school DTO and canonical Business entry. Added a lightweight decorative SVG of a school and two students (faithful code-native recreation, not a provider photograph). No dependencies added.

## Release and privacy audit
Release status remains preparation in app/lib/school-landing-copy.ts. End November 2026 is described as a target, with gradual availability. Changing the status requires an authorized release review; no new environment framework or notification subscription was introduced. There is no school-registration action. Business links preserve locale and retain existing downstream authorization.

The existing public directory returned HTTP 200 with zero schools during the read-only audit. Its projection accepts only school_ref, name, school_type_label, city, commune, description and verification_label. Unknown/private fields fail closed. No internal student, staff, finance or management endpoint is requested by this landing.

Backend school_public_profile_service.py inspection confirms private defaults, explicit publication consent, reviewed current content, eligible school/organization state, module/entitlement checks and revocation checks. Existing backend tests were inspected, not executed; this frontend-only batch does not claim fresh backend authorization or authenticated management end-to-end coverage. Synthetic published records exist only in isolated tests.

## Validation
- Existing Node 24.22.1 runtime reused; default host Node 22.12.0 is below the repository validation-script minimum. No runtime installed.
- python scripts/validate_frontend.py lint test typecheck: passed; 896 tests in 117 files. Existing unrelated lint warnings remain.
- next build --webpack: passed using existing Node 22.12.0 before switching validation to bundled Node 24.
- Browser coverage: 20 locale/viewport combinations (EN/FR/LN/SW at 360/390/768/1024/1440), delayed directory, unavailable/private-field rejection, and reviewed-record navigation. All 23 scenarios passed (22 in full run plus corrected streamed-DOM locator rerun).
- Screenshots inspected on desktop and mobile. Shared header and bottom navigation retained. No horizontal page overflow.
- Slow fixture delays five seconds; hero and management actions are usable within the test's 2.5-second assertion budget. This is isolation evidence, not a production latency SLA.

## Reproduce
Use the repository's compatible existing Node dependencies and Node >=22.13.0:

    python scripts/validate_frontend.py lint test typecheck
    node node_modules/next/dist/bin/next build --webpack
    node node_modules/@playwright/test/cli.js test --config playwright.school-landing.config.ts

The browser fixture binds loopback port 3048, refuses non-fixture/non-loopback fetches, and uses only synthetic public records. Playwright stops its task-owned server. Screenshots are written under test-results; acceptance copies are retained in the task workspace outputs/ecole-landing.

## Deployment and rollback
Website-only release; no migration or backend deployment required. Preserve preparation status and existing publication controls. Roll back by reverting this website commit and redeploying. No data rollback is required. Production commit/deployment verification is reported separately after release.
