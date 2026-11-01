# Emplois final discovery refinement — 1 November 2026

## Audit and reuse
- Public discovery continues through `getJobs`, canonical category catalog, server employer-type filtering and pagination. No client-side unbounded search or new taxonomy.
- Canonical offer ownership determines individual versus enterprise labels. Public projections sanitize private contacts and preserve salary visibility. No private employer images are added; authorized organization images and category icons remain in use.
- Compensation retains the existing structured minimum/maximum, currency and exact period. Missing currency/period stays missing; legacy individual free text remains text. Hidden salaries stay hidden. No historical data rewrite or numerical comparison across periods.
- My Transactions already categorizes `application` as a request and links its reference to the protected My Applications detail. The candidate invitation also retains direct application-history access. Detail-page confirmation/handoff links are unchanged.
- Personal publication reuses the four-language employment-menu WhatsApp command. Candidate creation reuses the existing typed-profile command: `start_candidate_profile_choice` checks owned professional/occasional slots and offers only available types; persistence rejects duplicates. The website does not infer ownership from a public session or create a second registration system.
- Company recruitment uses the existing SHIDA Business workspace, which retains authentication, organization selection and authorization. Individual and company entry points do not share a new publisher.
- Direct applications still use authoritative opaque WhatsApp continuations. The existing backend checks eligibility, candidate identity, replay/duplicates and lifecycle. Opening WhatsApp is not submission. External opportunities retain their separate redirect/instruction behavior.
- No changes to notifications, urgent WhatsApp templates, moderation, permissions, accounts, employment models or Services. No migration or backend release.

## Implementation phases
1. Shared `JOBS_SLOGAN` constant: **Luka mosala, pesa mosala, nyonso na SHIDA!**, always `lang="ln"`; localized EN/FR/LN/SW supporting text.
2. Compact warm hero with existing briefcase, people and document SVG icons; no generated job photography.
3. Removed top application/posting controls. Existing history remains in My Space and the bottom candidate invitation.
4. Existing search/category/employer filters and cards retained, with compact horizontal category controls, four desktop columns and a mobile single-column layout. Real organization images or existing icon placeholders only.
5. Three audience invitations after results: candidate (blue), individual employer (amber), Business recruiter (green), with explicit WhatsApp/Business guidance.

## Validation
- 48 focused unit tests pass: structured/legacy/missing compensation, hidden salaries, private data, anonymous employers, application capabilities, combined filters and four-language invitation destinations.
- 17 browser scenarios pass: 360/390/768/1024/1440 widths; four languages; search, employer/category filters, pagination, empty/error/expired states, detail navigation and authoritative WhatsApp links.
- Inspected rendered French desktop and mobile screenshots. Browser fixtures are isolated behind the existing `.fixture.invalid` process guard; no production records or messages were submitted.
- Test selectors target the actual main content so Next streaming's temporary hidden duplicate does not produce a false failure. Waiting for global network idle was unsuitable because the application maintains background traffic.
- Production webpack build, TypeScript and scoped ESLint pass. The established webpack build is used because this local workspace shares a node_modules junction outside the checkout (Turbopack cannot resolve that layout).

## Limitations and release
- No job-image field is invented. Icon cards are used where the public DTO has no authorized imagery; fixture category labels are English while production uses its localized catalog.
- Location remains the current server-supported city/area/commune query. No unsupported quartier/country/remote filter is advertised.
- Candidate creation/management and Personal publication remain WhatsApp-first. The website does not provide a new candidate editor or simulate application success. Existing profiles cannot be overwritten by these navigation links; the backend controls which typed slots are available.
- Screenshots are in `test-results/jobs-final-fr-1440.png` and `test-results/jobs-final-fr-390.png` and copied to the task's `outputs/jobs-final-release` directory.
- Rollback: website `9325e7bf199f98623dcd9a4c31459e3746e439b9`. No schema rollback.
- This brief explicitly requires release-specific production authorization. Commit/push follow standing authorization; manual production deployment awaits that release approval.
