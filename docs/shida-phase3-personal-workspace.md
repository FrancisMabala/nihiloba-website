# Phase 3 — Personal workspace and operational usability

## Scope and architecture

Website-only implementation on top of d17e096, using the clean isolated Phase 2
checkout. The active development checkout, unpublished École work, backend and
Business Dashboard were left untouched. No database migrations, secrets,
permissions, payment-provider integration or authentication protocol changes.

Personal identity still comes from the existing browser-bound WhatsApp session.
Every private request uses the existing session and gateway; the overview has no
operational mutations. Identity changes unmount old private content and cancel
in-flight preview requests. Organization access remains in the existing Business
Dashboard, with its own authenticated context and current membership checks.
The Personal session is never forwarded through a URL to Business.

## Route and capability audit

| Area and existing destinations | Findings and implementation |
| --- | --- |
| My Space: home, orders, requests, messages/inbox, receipts, management, settings | Previously home only showed two order sources. Added a compact Personal identity indicator, scoped attention, recent orders/posted service requests/applications, quick access and honest empty/partial-load states. Kept order history and receipt destinations. |
| Manage My Activities | Added named shops, restaurants and service offerings from their authorized list endpoints. Exact entity links; existing activities first; separate setup/list options; separate organization guidance. Restaurant create options require returned `create`; Services requires `profile`. Wenze setup stays inside its existing authorized workspace. |
| Messages | Retained two supported conversation destinations: Services request context and Employment application context. No combined conversation bodies, WhatsApp mirroring, invented unread count or global notification service. |
| Account settings and switching | Existing account menu and WhatsApp sign-in remain. Visible Personal context, settings language navigation retains destination; session-change tests verify old activity disappears. |
| Wenze Today | Put real action-required/in-progress order counts and stock signals before sales statistics. Community/review details are secondary. Existing local-day selector and financial-access rules remain. |
| Wenze Orders | Kept server buckets/search, detail timelines, permitted actions, receipts and verification. Added fulfillment method and payment-verification state to the list cards. |
| Wenze Products, stock, imports and variants | Retained product editor, photo/variant controls, publication, draft-leave confirmation, inventory search, movements and import area. Shared My Space return link and named-shop selection improve access. Verified product edits/navigation and stock views in browser. |
| Wenze Checkout | Existing physical-store gate, product/category selection, calculator, multi-currency basket, payment acknowledgement, stock checks and idempotent checkout retained and tested. Online-only stores still cannot open physical checkout. |
| Wenze Money, reports, costs, expenses, schedules and receipts | Existing reporting/recorded-payment distinctions retained. No provider-recorded payment is relabelled as an integrated or verified payment. Existing grouped navigation preserved. |
| Wenze My shop | Existing profile, fulfillment, settings, public-preview and publication safeguards retained. Named-store links avoid reselecting the shop from My Space. |
| Restaurants Today, counter sales, orders | Today is now a primary mobile destination. Ready orders join accepted/preparing orders in the operational preview. Existing order states, permitted transitions, pickup/delivery and counter-sale flow remain authoritative. |
| Restaurants menu, inventory, dated offerings and intake | Grouped together as menu/availability, on desktop and mobile. Existing capability-filtered items are reused; no new menu or inventory engine. |
| Restaurants reservations, reviews, finances, recovery and insights | Grouped as customers/finances; the UI does not introduce new reservation or payment capabilities. |
| Restaurants settings, public profile, hours, sharing and preview | Consistent settings group; keyboard-dismissable mobile tools dialog restores focus. Restored the small restaurant heading on mobile. Direct establishment selection still reads the authorized detail endpoint. |
| Services Today | Reply queues remain authoritative. Prioritized reply work and removed zero-value summary counters; pending bookings now appear in the summary when present. Uses returned timezone. |
| Services requests/jobs, quotes and messages | Preserved distinct requests/reservations/messages, allowed actions, revisions, rescheduling, expiry and durable unread queues. No speculative next-action buttons. |
| Services calendar, availability and sharing | Preserved category-aware agenda, duration links, saved availability and guarded changes. Browser tests cover crowded/empty agendas, exact retries, public handoff and revoked access. |
| Services offerings, profile, packages, areas, publication, reports, finance, templates, bill settings | Existing capability-driven navigation/editor preserved. Named offering links open the correct service editor. Mobile More supports Escape and focus return; shared My Space return respects unsaved-work guards. |
| Candidate applications, details and profiles | Corrected My Space’s broken French application links to the canonical `mes-candidatures` route. Added LN/SW collection/detail routing and core candidate UI copy/status labels. Compact heading, My Space return, secondary profile help, and plain-language guidance replace backend terminology. Candidate profiles still use WhatsApp; unsupported web mutations remain absent. |
| Restaurant reservations and service invoices | Made restaurant reservations discoverable in My Requests. Kept the existing order/receipt/invoice links and customer workflows. |
| Personal recruitment, housing, hotels, Wewa | No corresponding Personal web-management routes were found. These are not fabricated or redirected into unauthorized organization tools. Public discovery and existing WhatsApp flows remain as implemented. |

Backend read-only audit confirmed restaurant state-filter support, Wenze readiness
semantics, Personal restaurant list/actions, existing Services projections and
provider web handoff. Wenze `catalog_ready` only means enough profile information:
it is not publication, so visibility also requires active and visible state.
WhatsApp provider links with `offering` remain supported; My Space adds
`view=services` to open that exact editor. No canonical onboarding changes.

## Shared implementation

- `PersonalActivityOverview`, with small allowlisted preview adapters and four
  independent sources. Each displays its own domain status and real destination.
- `PersonalActivities`, with named entity selection and independent availability.
- `personal-workspace-copy`, four-language labels for all new workspace UI.
- `restaurantWorkspaceGroups`, shared desktop/mobile grouping without dropping
  any existing navigation item or changing capabilities.
- Existing `AccountSpace`, `WenzeHeader`, provider navigation and Today components
  improved in place. No competing dashboard.

## Accessibility, localization and performance

EN/FR/LN/SW routes and navigation are exercised at phone, tablet and desktop widths.
Keyboard Escape/focus return, semantic labels, current destinations, 44px controls
and no document overflow are checked. Existing form/draft protections stay intact.
Candidate-specific date/time/location labels and older transaction copy may still
contain existing EN/FR fallback text; this is not a claim of a complete translation
of every historic transaction screen.

The home preview reads four existing endpoints once per refresh/session mount,
with cancellation and a 12-second timeout. It displays at most five items per
source. Orders use bounded backend queries; the existing Employment list endpoint
has no server pagination option, so its response is truncated for display only.
Management reads only lists/capabilities, without per-entity notification fan-out.
There is no new polling loop, dependency, image generation or background service.

## Limits and follow-up work

- Attention covers only returned ready orders and interview/offer application
  states. It is not a complete cross-marketplace alert count or unread feed.
- The service preview includes posted requests, not every direct booking or
  conversation. The full Services destination remains available.
- Recent activity previews are bounded and are not a comprehensive combined audit
  timeline. Missing sources report partial availability rather than false zeros.
- Restaurant lists expose the first 20 entities; the existing workspace retains
  pagination. Management links remain available for the complete list.
- No Personal-to-Business SSO or organization-membership discovery API was added.
- No production operational write is needed for verification. Screenshots use
  explicitly isolated fixtures; their example identities are not production data.

## Validation and release

Validation passed: 166 unit/API checks, 106 browser checks, production build,
TypeScript, changed-file ESLint and diff whitespace checks. The additional
application-detail navigation assertions also passed in the 17-test Phase 3 suite.
Desktop/mobile fixture screenshots are in `docs/evidence/phase3/`.
Exact commit and deployment evidence are recorded in the completion report.
Focused unit/API tests cover activity adapters, capability boundaries, candidate
presentation, restaurant lifecycle/verification, Wenze checkout and Services
requests/scheduling. The repeatable browser command is:

`node node_modules/@playwright/test/cli.js test --config playwright.phase3.config.ts`

This reuses the repository’s isolated Services fixture server and intercepted
Personal APIs. The updated Wenze regression fixture now declares a physical shop,
uses the existing current payment-confirmation flow and expects the established
cream-sidebar text color. No production behavior was altered to satisfy it.

No migration or backend deployment is required. Push the validated website commit
and correlate Render’s Live deployment with its exact SHA. After release, check
public/guest routes without fabricating a production login or creating orders.

## Phase 4 recommendation

Begin with a contract audit for native web onboarding: durable Personal identity,
WhatsApp verification and return destination, eligibility, organization context
and recovery. Keep one canonical onboarding until an explicitly approved web flow
can preserve these invariants. Prioritize understandable verification/recovery and
remaining translations before adding new account types, messaging infrastructure
or notification promises.
