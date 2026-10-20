# Services redesign — Personal task navigation

Batch R01a prioritizes requests/jobs, calendar, services and money. Reports,
reusable quote/bill templates and bill appearance remain available through
“More tools”. Existing section URLs, capability checks and draft retention
remain in place. The overview has not yet become the planned Today queue.

EN/FR/LN/SW use simpler request, history, reply and draft wording. “Saved” means
the operation was stored; reply confirmation separately explains that WhatsApp
delivery may follow. Backend booking, billing and delivery semantics are
unchanged.

Browser tests exercise the primary navigation and the actual secondary
disclosure at small viewport sizes, retained drafts, account changes,
publication, booking, templates, bill presentation and recovery. The template
test uses the newly separated secondary navigation without removing its
quote/bill creation and application assertions.

This batch changes no database, dependency, environment variable, worker,
Meta template or production data. Public Services language continuity,
category-specific presentation, Today, contextual history, date semantics and
customer brief/open-request/competing quotation journeys remain subsequent
batches. The new open-request journey is not exposed.

Validation: 52 focused unit tests, 36 production-browser scenarios (32 initially
passed and all four template tests passed after updating their navigation),
production build/TypeScript and scoped lint passed. The 12 provider navigation
scenarios were rerun successfully after replacing programmatic disclosure
opening with actual summary clicks. Small-screen screenshots were inspected;
physical devices and native-language comprehension were not assessed.

Commit/remote/deployment evidence is maintained in:
`C:/Users/mabal/OneDrive/NIHILOBA/SHIDA/Development/SHIDA_Services_Redesign_Implementation_2026-10-20.xlsx`.

## R02a — category presentation and public languages

The seven allowed categories have four-language labels and guidance in creation
and editing. The versioned presentation-only JSON mirrors Backend
`app/models/service_category_experience.json`; it never alters saved answers,
booking policy or publication permissions. Unsupported categories remain absent.

Public Services browsing, detail, provider pages, booking controls, gallery,
loading and review labels now support EN/FR/LN/SW. A visible language selector
retains filters, service, option and date period. Provider preview links and
metadata retain the chosen language. Other NIHILOBA sections retain their
existing language support. Full saved-draft WhatsApp continuity remains later
work and is not implied by this presentation batch.

Validation: 60 focused unit tests and 14 production-browser scenarios passed,
including all seven category selections in four languages, 360px public
navigation, publication, uncertain-save retry and access revocation. Production
build/TypeScript and scoped ESLint passed. Initial added test failures were
fixture mistakes (query parameter ordering and an omitted required API field),
corrected before the successful rerun. No test removed or skipped.

No schema, dependency, configuration, worker or production-data changes.
No native-language comprehension or physical-device validation claim.
