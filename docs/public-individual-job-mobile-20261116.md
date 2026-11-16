# Public individual-job detail correction — 16 November 2026

## Verified route and release gap

The screenshot matches `https://nihiloba.com/fr/shida/emplois/JOB_EBML2CXL/` (Aide ménagère). Public catalogue lookup and preview returned this reference with status `open` and lifecycle `published`. The full account-specific projection requires authentication; its live eligibility was not inspected. Do not infer closure from the displayed 30 September start date.

Route: `app/(localized)/[lang]/shida/emplois/[job]/page.tsx`, through `JobDetailPage` in `job-detail-reader.tsx`, to the direct/individual branch of `JobDetailContent` in `job-presentation.tsx`.

Render website service `srv-d9s8g1c9v7es73effevg` reported deployment `dep-dbteopjrjlhs73f4lseg` live at commit `fd600075e8b71c16e5bde4f89559020bb104eac1`. Earlier public-job mobile work `379b1bef` is an ancestor, but its `.job-detail-hero` / `.job-detail-layout` styles did not target `.mission-public`. Subsequent `e8e86c2d` work also did not correct this individual branch. Local `7720a7f9` changes owner listings/editing only. The three relevant public component/style files matched the live commit before this correction. This is a component-scope gap, with no evidence requiring a cache diagnosis.

## Changes

- Mobile-only compact back link, type label, 28px/rem-based title, location and spacing; shared headers/navigation unchanged.
- One bordered summary for pay, frequency, days, hours and start date when supplied. Rows stack as text enlargement or narrow width requires. Values and salary privacy rules remain unchanged.
- Availability below the heading/location, with one applicable action. Existing application/profile/login/owner destinations are reused; save, share and reporting remain in their existing controls.
- Explicit loading, retryable errors, unavailable access, authentication, missing profile, owner, closed, expired, disabled and existing-application states in FR/EN/LN/SW.
- Previously, the private application request silently swallowed errors and only recognized existing applications. Backend `application_panel` also used `mission_closed` for both self-application and actual closure. The companion backend patch distinguishes safe reasons without changing eligibility or submission rules. The same-origin gateway allows only these four reason codes on authenticated GET apply requests, preserving all other redaction and session checks. Legacy ambiguous conflicts show retryable verification failure, never an inferred closure.

Changed application files: `app/components/shida/job-presentation.tsx`, `individual-job-action.tsx`, `mission-management.css`; `app/lib/individual-job-eligibility.ts`; `app/api/shida/personal/job-offer/route.ts`. Tests: `tests/jobs-marketplace.test.tsx`, `personal-job-offer-gateway.test.ts`, `individual-job-eligibility.test.ts`, `tests/browser/public-individual.browser.ts`, and `playwright.public-individual.config.ts`.

## Focused validation

- 48 Vitest tests passed (eligibility mapping, safe gateway reasons/redaction and existing jobs presentation/privacy behavior).
- 21 Playwright Chrome tests passed against the actual local public route with synthetic intercepted APIs: 375/390/430/1440 widths, full content, bottom-navigation clearance, loading/error/retry, explicit eligibility states, missing-profile application destination and back navigation, existing application, saving and its saved-offers navigation, share, filtered back link, long unbroken titles and 200% root-text enlargement in all four languages. Nine layout checks rerun after the final adaptive summary change passed.
- TypeScript `tsc --noEmit --incremental false`, targeted ESLint and `git diff --check` passed. Relevant routes compiled under the existing Next development runtime; no full production build or full backend suite was run.
- Companion backend: five focused PostgreSQL 18 tests passed, including the existing HTTP application journeys, exact-account access, duplicate submission prevention, privacy/history, profile requirement, distinct reasons and a past start date remaining open. Changed Python compilation, duplicate text-key check and Alembic heads passed; head is `0248_support_staff_inbox`.

Evidence retained outside Git at `C:/NIHILOBA/release-evidence/public-individual-20261116/`: `before-390.png`, `after-390.png` use the same 390×844 viewport and same synthetic listing data; `content-375.png`, `content-390.png`, `content-430.png`, `content-1440.png` and `enlarged-{fr,en,ln,sw}-375.png` cover the rendered variants. The screenshots reproduce the public screenshot facts with synthetic body/account data, not an authenticated production session. Mission content starts approximately 128px earlier in the paired screenshots.

## Release and limitations

Implemented and committed locally only. No push or deployment authorized for this batch. Release the backend reason-code change with/before the website when authorized; no migrations, environment changes or new dependencies are required. Existing production responses remain safely supported, but accurate owner/closed differentiation requires the paired backend release.

No real-user writes, WhatsApp messages, production database access or account changes were performed. Native iPhone Safari, real browser chrome/keyboard behavior, and the exact signed-in live eligibility response were not verified. Native browser tooling could not initialize, so visual/interaction evidence is automated Chrome with touch emulation and synthetic APIs. There is no claim that the live page is fixed.

Testing reused the local website runtime and installed dependencies. Task-owned PostgreSQL Compose project: `shida-public-job-20261116`, loopback port 55483, disposable tmpfs data. Source checkouts, unpublished owner-listing work, shared dependencies and evidence are retained.
