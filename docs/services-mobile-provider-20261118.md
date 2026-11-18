# Services provider mobile release — 18 November 2026

## Scope and routes

The existing personal provider workspace at `/[locale]/shida/seller/services`
(English has no locale prefix) renders `ServicesManagement`. Its `view` values
`overview`, `work`, `calendar`, `available`, and `proposals` cover these four
batches. No new marketplace, endpoint, credential, or database migration is added.

- **Aujourd’hui:** retain the actual published-services, new-requests,
  appointments, and accepted/in-progress metrics. Mobile cards remain colorful
  and use two columns; the redundant heading is accessible but visually hidden.
  Attention, daily planning, and discovery retain separate data and failure
  states. The existing profile-sharing flow follows the work sections.
- **Demandes et missions:** retain all four existing metric definitions, tabs,
  filters, counts, detail actions, and activity messaging. Full-card colors,
  compact rows and empty panels, and a local guarded refresh replace the excess
  mobile spacing. No lifecycle or permission rule changes.
- **Calendar:** Day, Month, and List use one selected date, service filter, and
  agenda. Month embeds the shared calendar grid without a second toolbar or
  agenda; other shared-calendar consumers retain their defaults. Detail returns
  restore calendar context. Saved hours use compact weekday groups, while
  editing keeps the existing interval validation and write protocol.
- **Plus and discovery:** compact outline-icon rows preserve authorized
  destinations. The final mobile row returns directly to the canonical Mon
  espace landing page, preserving locale/session and draft guards. The former
  activity page and desktop destination remain available. Discovery shows the
  selected service and its areas, distinct loading/failure/empty states, and a
  relevant no-eligible-service route. Proposals continue to span all services.

Responsive styles are scoped to the Services workspace. The shared bottom
navigation has an opt-in Services variant: aligned icons and wrapped labels,
with a two-row fallback for enlarged text that cannot fit four columns. Its
measured height still reserves scroll clearance. Desktop navigation remains.
New copy covers French, English, Lingala, and Swahili.

## Verified data rules and defects

Backend source inspection confirmed:

- `service_provider_schedule.py`: personal `inherit_week=true` uses the
  provider's usual week; `false` uses service hours **instead**, not an
  intersection. Existing bookings, blocked periods, travel, and applicable
  Business team/resource constraints still limit real slots. Canonical timezone
  is Africa/Kinshasa. Blocked date ranges are inclusive and provider-wide for
  personal services; they do not cancel existing bookings.
- Overnight intervals are currently unsupported: the existing validator requires
  end after start. This release preserves that restriction and split-shift
  validation rather than inventing overnight semantics.
- `service_request_read_models.my_proposals` uses the service as an authorization
  anchor but returns the provider's proposals across services, including drafts
  and submitted records. `visible_to_customers` is the backend's computed
  eligibility result (`service_profiles.py`), not a new frontend permission.
- The saved-version recovery action reloads a proposal after a conflict. It
  remains explicit and guarded; the compact list refresh does not replace it.

The service selector read `event.target.value` after awaiting the leave guard;
capturing the value first fixes selection reverting during the asynchronous
guard. Proposal entry was also marked consumed before an abortable request
finished: React development effect replay could lose the exact proposal on
refresh. Entry consumption now follows successful detail loading. Existing
quotation regression tests cover refresh, denied access, exact uncertain-save
retry, review/submit, immutable sent history, and the activity-specific WhatsApp
support destination in all four languages.

Calendar save failures preserve input and show the actual failure/uncertain
notice. Uncertain writes disable editing and retry the same operation. Manual
booking still uses the existing final conflict check and operation key. No real
bookings, proposals, or notifications were created during validation.

## Focused validation

Commands from the website checkout, using the existing compatible Node modules:

```text
node node_modules/vitest/vitest.mjs run tests/services-work-model.test.ts tests/services-today-model.test.ts tests/services-calendar-presentation.test.tsx tests/services-calendar.test.tsx tests/management-mobile-navigation.test.tsx tests/services-work-inbox-gateway.test.ts tests/services-planner-refinement.test.ts tests/shida-calendar.test.ts
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js <changed TypeScript files>
node node_modules/next/dist/bin/next build --webpack
node node_modules/@playwright/test/cli.js test --config playwright.services-mobile.config.ts
git diff --check
```

The 26 unit tests pass. Scoped ESLint has no errors and three existing warnings
(two effect dependencies and an unused Today callback parameter). Type checking
passes. Local Turbopack cannot resolve Next through this checkout's external
shared node_modules junction; webpack is used for the isolated production build.
The deployment keeps its normal clean-install Turbopack build command.

The production webpack build passes. All 12 new browser checks and all four
existing quotation-flow locale checks pass against that production preview,
without a CSP bypass. One denied-access test initially expected the workspace
to remain visible after authorization failed; its assertion now verifies the
explicit denied message and absence of workspace data, and the affected check
passes on rerun.

The new browser suite uses intercepted synthetic API fixtures against real
Next.js pages. It covers widths 320/375/390/430/768/1280, 150% text, all four
languages, populated/empty/loading/error/partial states, navigation and return
context, sharing, date/month boundaries, split hours, saving/retry/conflict,
blocked periods, preview failures, denied access, and bottom-navigation clearance.
Set `SERVICES_PRODUCTION=1` to run without the development CSP bypass;
`SERVICES_PROPOSAL_REGRESSION=1` selects the four existing quotation tests.
`SERVICES_EVIDENCE_DIR` selects the retained evidence directory; otherwise output
uses a unique temporary run directory. `SERVICES_BASELINE=1` captures baseline
screenshots and must not be used after the implementation.

Matching before/after 390px screenshots for overview, work, calendar,
availability, available requests, proposals, and Plus are retained at
`C:/NIHILOBA/release-evidence/services-mobile-20261118`.

Browser evidence is desktop Chrome with touch emulation and synthetic data.
Physical iPhone Safari, changing browser chrome, native virtual keyboards,
real provider data, and live WhatsApp delivery are not device-tested. Backend
rules were inspected, not changed; the full backend suite was not run. Release
commit, push, CI, and Render status are reported separately after verification.
