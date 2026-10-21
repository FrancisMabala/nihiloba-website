# Services redesign — Personal task navigation

## Approved workday design — 21 October 2026

The approved phone and desktop provider mockup is implemented locally. See
[behaviour, validation and the continuing release/PDF hold](services-provider-workday-2026-10-21.md).

## Current hold — 21 October 2026

The user explicitly blocked release and customer PDF uploads while approving
local scanner preparation. The later delivery request permits a development-branch
push to `codex/services-provider-workday-held-20261021`; pushing to `main` and
deployment remain blocked. The request editor shows EN/FR/LN/SW text-only guidance and no file picker
unless the current backend brief response explicitly enables PDF intake. Missing
capability also means disabled. If an older open page attempts an upload after
the backend disables it, the editor removes the picker and retains the saved
request. The backend rejects disabled intake independently of this UI.

Customers can still write, save, review and send/publish text requests. Existing
authorized document history, previews, downloads and removal remain available.
No website environment variable can override the backend gate. Scanner hosting,
certificate provisioning and activation remain future approved operations; see
the backend `docs/services_redesign_release.md` and `deploy/service-pdf-scanner`.

Validation: six production-browser journeys passed (EN/FR/LN/SW text save,
review, publish and retry; existing private document history; enabled-page
recovery when intake is disabled). The initial new case needed an accessible
textbox selector for prefilled content; the complete rerun passed. Webpack
production build, TypeScript, scoped ESLint and diff checks passed. Backend
evidence records 66 passing focused checks and the outstanding broader-suite
failures. No production configuration, runtime dependency or schema changed.

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

## R03a — local entry, money choices and contextual customer history

Customer history now opens inside the selected booking and loads only on demand.
The existing exact-provider history endpoint and financial permissions remain
authoritative. Access denial clears private history; navigation retains the
existing booking, quote, conversation, bill and job-cost destinations.

Quote inputs and reschedule proposals display Kinshasa time and convert back to
the existing UTC command format. Explicit appointment timezone is preserved.
Legacy one-UTC-day reschedule boundaries remain enforced, with a visible recovery
message rather than silently changing the scheduling policy. Timestamp displays
identify Kinshasa; historical free-text requested dates remain unchanged.

Money forms accept a decimal point or comma without rounding or exchanging CDF
and USD. Booking selectors show customer/service/date labels and offer older
pages. An obsolete page response cannot append another owner's jobs after a
context change. Totals use inclusive From/Through dates, including a single day,
and translate the final day into the existing exclusive backend boundary.
Financial effective dates remain calendar dates. Reports retain their existing
period semantics pending the separate report review.

Validation: Website 24 focused unit tests and nine production-browser scenarios;
Business 14 focused unit tests and nine production-browser scenarios, including
four-language customer history, local quote round trips, decimal entry and
financial access revocation. Both production builds/TypeScript and scoped lint
passed. Pagination context-change protection has a focused regression test.
No test removed or skipped. The old standalone history chooser tests now open
history from a real selected booking and retain access/link assertions.

No backend runtime, database, migration, dependency, environment variable,
notification worker or Meta template changes in this batch. Existing customer
and provider authorization, Owner-only money, correction history and recorded
receipt versus verified-payment distinctions remain unchanged.
Today queues, remaining panel language/recovery, saved briefs, documents,
open requests, proposals and atomic award remain unfinished.

## R03b — Today queues and exact task recovery

Personal providers and Organization managers now start with bounded Today queues:
requests still needing a reply, pending bookings, work over the next seven local
days, and unread conversations. The endpoint reuses existing exact-provider
checks and redacted projections; it is not an analytics count or booking engine.
Closed and expired requests are filtered before pagination. Workers retain their
separate permitted jobs/schedule experience. Queue links open the exact existing
request, booking or conversation even when it is absent from the first list page.

Focus refresh preserves a quotation/action draft while rechecking its current
access and revision. Revocation clears private state; stale revisions show the
existing recovery message. A generation guard prevents an older list response
from consuming a newer task handoff. This does not claim general offline draft
persistence or synchronized WhatsApp drafts.

Validation: 103 focused backend tests (queues, ownership, revocation, direct
requests, reservations and messages), 17 Website gateway tests, 27 Business
Today/navigation/gateway/handoff tests, and 12 production-browser scenarios per
frontend passed. Browser checks include EN/FR/LN/SW, 320px layout, unavailable
queue retry, exact task opening, access removal and existing transaction/history
journeys. Production builds, TypeScript, scoped lint and diff checks passed.
Missing template responses in new browser fixtures were corrected; old
transaction tests now explicitly navigate to Requests & jobs after the default
landing changed to Today. No tests were removed, skipped or weakened.

No schema, migration, dependency, environment variable, worker, Meta template or
production database change. No change to WhatsApp commands, booking lifecycle,
financial authority or document audience. Remaining redesign items, including
saved briefs, PDF processing, open requests and competing proposals, remain
unreleased and are tracked separately.
## R03c — clear report periods and summaries

Reports now start with This month and offer This week, inclusive From/To dates,
readable Kinshasa timestamps, and SHIDA cards, headings and touch-sized controls.
The request and CSV export both convert the included final date to the existing
exclusive API boundary, including single-day and month/year-end periods. The
report still counts UTC days; its visible date note keeps that accounting
boundary explicit. Financial effective dates are not shifted between time zones.

Current publication/booking statuses remain distinct from requests and bookings
created within the chosen period. Detailed definitions and the unavailable
quote-to-booking metric sit under an expandable explanation. Receipts and surplus
are described as provider records, not verified payments or profit. CDF and USD
remain separate. Financial capability checks and existing backend authorization
are unchanged. Dates survive failed loads, and stale downloads cannot complete
after the period changes.

Validation: 10 focused date/presentation tests and five production-browser
scenarios passed in each frontend. Browser coverage includes EN/FR/LN/SW at
320px, same-day inclusive queries and downloads, failed-load recovery, presets,
optional definitions and absent financial permission. Both webpack production
builds (including TypeScript), scoped lint and diff checks passed. Small-screen
screenshots were reviewed; Organization report styling was improved after the
first visual pass. No native-speaker or physical-device validation is claimed.
No API, schema, dependency, environment or lifecycle policy changes. Other
management panels and the unreleased customer-brief journey remain separate work.

## R03e — bill appearance continuity

Plain EN/FR/LN/SW guidance now explains that appearance changes apply to future
bills and preserve already issued bills. The French appearance destination and
form use consistent wording. A session/provider-context change remounts the
editor so a previous provider's draft or response cannot populate the new editor.
The inner appearance landmark has its own descriptive name.

Validation: four production-browser scenarios passed across EN/FR/LN/SW at
320–768px, including saving appearance and retained quote/bill template behavior.
The webpack production build, TypeScript and scoped lint passed. Existing
failed-load and uncertain-save recovery remains in place. No API, migration,
environment, dependency or financial-policy changes; no tests removed or skipped.
# Local customer requests and provider proposals — 20 October 2026

Unpublished work adds the authenticated Services request workspace: saved text
briefs, optional private PDF review, explicit summary approval, open publication,
private clarification replies, quotation comparison and exact-version acceptance.
The customer can recover the canonical booking after acceptance, reopen closed
requests and access retained originals from the customer-only brief view.

Provider navigation now exposes Available requests and My proposals through the
existing session-bound gateway. A draft is private until explicitly reviewed and
submitted. Uncertain writes retain the exact operation for retry. Changed
revisions require reload; denied access removes private state. Proposal history
shows the reviewed request associated with each quotation version. All new copy
has EN/FR/LN/SW variants; prices retain CDF/USD separation and appointment input
uses Kinshasa time.

The new card class is isolated from the existing service-settings request toggle
card. Screenshot review found that the old shared class forced mobile content
into narrow columns; the isolated class and minimum readable-width browser
assertion address that collision.

This is not a production release. Same-draft WhatsApp intake, public direct-request
entry, published-summary revision, remaining audit closeout and operational
release prerequisites are still in progress. Backend adapters remain unregistered.

Validation: 8 gateway/routing unit checks and 14 production-browser checks passed
across customer briefs, private PDF preview, stale/uncertain recovery, exact quote
acceptance, closed history and provider quotation review. Provider browser checks
cover EN/FR/LN/SW at 320/390/820/1440 px, including readable card width, no
horizontal overflow and denied-access clearing. Webpack production build,
TypeScript and scoped lint passed. Mobile Personal and desktop Organization
screenshots were inspected after fixing the card collision. This is browser
coverage, not physical-device or native-speaker validation.

### Local direct-request entry and channel continuity

The public Services collection offers My requests and a new request, and each
service offers a direct quotation request. The selected service determines the
category. Customers review their summary and choose an available customer branch
before sending; exact branch/coverage revisions are checked again by the backend.
Authorized job pages show the retained reviewed summary, never the original PDF.

Lingala and Swahili direct links initially fell back to French because the shared
Services path helper omitted the new request route. The helper now preserves all
four languages, including query strings. Four direct-request browser journeys
cover this regression; the combined customer brief/comparison/history/direct
selection passed 14 browser checks. Eight gateway/routing checks passed.
Webpack production build and TypeScript passed.

Exact WhatsApp provider links can also open a saved request and its quotation.
A quotation is checked against its parent request before rendering. This is
navigation only: no operation is automatically submitted.
New request features remain unpublished with the backend adapters unregistered.
Eight additional production-browser checks passed for exact quotation links and
the existing Today/offline recovery paths in all four languages. Scoped lint
passed after moving link initialization below its loader declaration.

### Local published-request editing

An open request now offers Edit request. Customers review the backend-filtered
summary before confirming the change; the deadline stays visible and unchanged.
The screen explains that providers must send a quotation for the updated need.
Earlier quotations remain in history and cannot be accepted for the new brief.
An uncertain confirmation retries the exact saved operation.

Validation: four production-browser cases passed in EN/FR/LN/SW, including
private-contact filtering in the review, explicit confirmation, a lost response,
identical retry and disabled old-quotation acceptance at 390 px. Six gateway
checks, production webpack build/TypeScript and scoped lint passed. These changes
remain local with the new backend adapters unregistered.

### Local visibility and catalogue guidance

Overview counts, catalogue labels, publication status and preview availability
now use the backend's `visible_to_customers` decision. A historical publication
marker cannot claim current visibility. Hidden published services show a refresh
explanation rather than an invalid Publish action. Request availability remains a
separate choice. The editor explains the shared provider name and optional
quotation-based package price.

Validation: 22 affected production-browser checks passed across publication,
setup, details and bill appearance, including a published marker with false
visibility. Four old management checks needed their heading selector scoped to
the page heading after the earlier task-navigation redesign; all four passed
after that fixture correction. Production build/TypeScript and scoped lint passed.
### Saved quotes and bill layouts — local validation

Template tools now explain the task in all four languages, accept comma decimals,
and keep incomplete bill items visible for correction. Failed reads have a retry
action. A lost save or apply response locks the original operation and retries
the same content and idempotency key; it does not create another template or send
a quote or bill. Leaving an unfinished draft warns the user. Current access
denial removes the private template list.

Validation: four production-browser journeys passed in EN/FR/LN/SW, including a
failed list load, comma price and a committed save whose response was lost.
Webpack production build, TypeScript and scoped lint passed. This batch remains
local pending the coordinated release.

### Opening-hours review and missing-duration recovery

Opening hours now include a customer booking preview showing the selected mode,
duration, hours and approval choice. Unsaved changes are identified. A missing
duration links to that exact service's editor and focuses its duration field,
with confirmation before leaving unsaved hours. The saved preview leads to the
existing booking-link/QR panel; category changes do not select instant approval.

Validation: seven production-browser checks passed, including four languages,
missing-duration recovery, unchanged retry after an uncertain save, access
revocation and stale public-slot recovery before WhatsApp handoff. Production
webpack build, TypeScript and scoped lint passed. This is local, not deployed.

### R03m — Money and bill review/recovery (21 October, local)

Money entries, corrections and reversals now have an explicit review step.
Bills review exact decimal totals before saving, issuing, replacing or voiding.
Incomplete lines are rejected rather than silently omitted. Existing currency
separation, accepted-quotation requirements, immutable bill versions and
correction history remain authoritative.

An interrupted command retains its exact body, revisions and retry key. Editing
and new commands remain paused until its result is resolved. Reads and commands
are scoped to the captured account and booking; denied access clears private
content. Loading failures stay distinct from empty history. Account bill notices
and WhatsApp delivery have separate status labels. Histories are collapsed and
the financial panels use SHIDA styling with labelled mobile controls.

Validation: 25 production-browser journeys passed,
including four-language money/bill review, lost-response retries and template
regressions. Production webpack/TypeScript and scoped lint passed. Organization French mobile
money and bill screenshots were inspected. Initial browser selectors were made
specific to the visible current status after history became collapsible.
These changes are local; coordinated release and operational gates remain open.
Personal setup now distinguishes the provider's public name from the specific
service name, retaining all seven category examples and explicit private-draft
creation. Four-language browser checks cover those hints, category choices,
keyboard focus and an interrupted first save. Of the initial 25 browser checks,
17 passed; eight delivery tests had ambiguous status selectors. Those eight
passed after selecting the exact visible status and explicit Kinshasa time.

### R03o — Request, quotation and booking recovery (21 October, local)

The existing direct-provider editor now freezes the exact submitted action and
retry key until an uncertain result is recovered. It keeps stale form values,
requires an explicit refresh before a new action, and warns before leaving a
draft. Failed reads are distinct from an empty queue. Account/context changes and
revoked access remove private details; delayed history reads are generation
checked. Existing quotation, booking, rescheduling and message rules are unchanged.
The editor uses SHIDA colours and touch-sized controls.

Validation: nine focused command/editor checks passed, plus nine production-browser
journeys in each frontend. The four-language direct journey now commits a quote,
loses its response and retries the identical body/key before continuing through
send, booking approval and messaging. Exact task handoffs and Personal customer
history remain covered. Both webpack/TypeScript builds and scoped lint passed.
Initial unit failures were fixture URL/label/timing mismatches; the tests were
corrected to use the actual paginated route and enabled action. Local only;
coordinated release and operational gates remain open.

### R03p — Day-first calendar and category schedules (21 October, local)

Services places the selected day's work before the month grid. Filtering a service
uses the appropriate appointment, visit, lesson, session, consultation or cleaning
label in all four languages. The all-services view retains every authorized item.
The shared calendar defaults remain unchanged for other marketplaces. Services
shows a plain Kinshasa-time label, a loading announcement, and explains that the
shared link opens the customer booking page using the provider's booking settings.
No scheduling, publication, capacity or permission policy changed.

Twelve focused calendar/gateway/presentation checks passed. Eleven browser journeys
passed: the existing four-language calendar, hours and QR flows, save recovery,
duration handoff and explicit WhatsApp booking-link selection, plus crowded/empty
schedules across all seven categories in each language. Initial crowded-test
failures were duplicate Refresh selectors, fixed by targeting the calendar panel.
The French mobile crowded agenda was visually inspected after correcting smooth-
scroll screenshot timing. Production webpack/TypeScript and scoped lint passed.
These changes are local and await the coordinated release.

### R03q / R09b — Catalogue recovery, language continuity and reporting (21 October, local)

Catalogue refreshes preserve unsaved details. A conflicting saved revision keeps
the draft visible and requires a deliberate refresh before further changes.
Package writes retry the same body and operation key after a lost response while
keeping unrelated description edits. Prices accept comma decimals; blank prices
remain unspecified. Optional social links can be removed. Service cards show the
existing review summary, and unused plan explanations have been removed.

Changing language retains the selected service and exact direct request/quote,
booking or posted-request/proposal. Lingala and Swahili management headers return
to their matching public marketplace. Navigation hints never grant access.

Available requests include a report disclosure. It lets the provider copy the
request reference and open the existing SHIDA WhatsApp support command. The
instructions require the user to send that message, choose Services and explain
the concern. No brief, document or quote is placed in the link; opening support
does not create a report, notify the customer or hide a request. Invalid/missing
support configuration has manual recovery. New-request rate limits show a plain
wait-and-retry message while retaining the form.

Six focused unit checks and 24 production-browser journeys passed, covering four
languages, narrow layouts, catalogue stale/lost-response recovery, setup,
navigation, exact task links and private proposal review/history. The first
browser run exposed trailing-slash and duplicate-heading selectors plus an old
navigation count; these were corrected to assert the current destinations.
Production webpack/TypeScript and scoped lint passed. No runtime dependency or
configuration was added to the website. The coordinated release is still pending.
