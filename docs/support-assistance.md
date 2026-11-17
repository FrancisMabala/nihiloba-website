# Aide et assistance — local implementation, 16 November 2026

The Personal support view now uses the existing SHIDA shell with a desktop
request list/conversation split and a mobile list/detail flow. Navigation selects
“Aide et assistance”. Categories supply the headings; no subject field was added.
Stored text is rendered literally, chronologically, with customer/SHIDA author
labels and timestamps. Internal notes remain excluded by the backend.

All/active/resolved filters map to actual backend states. Filter/page/selection
are retained in the URL; mobile back retains the list scroll position. The focused
new-request form uses existing categories, labelled controls and a 4,000-character
limit. Replies follow the conversation; resolution is a secondary action. Closed
legacy support requests explain their terminal status, while general questions
retain the existing explicit reopen action.

Creation/replies use stable request IDs, a synchronous in-flight lock and success
only after the API confirms persistence. Failed sends retain the draft and key;
per-conversation reply drafts reuse existing session-bound storage. Blank input
cannot submit. Loading, empty and failed states are distinct. Focus/online and
once-per-minute visible-page refresh avoid tight polling. A read receipt includes
only the displayed message boundary and refreshes the existing notification count.
The destination URL survives sign-in, so a notification opens its exact ticket.

The gateway retains session binding, exact origin, allowlisted paths, bounded
pagination/body and private no-store responses. It forwards the new support
filters/read/reopen endpoints without adding any staff authority.

Validation: focused gateway/notification unit checks, changed-file ESLint,
TypeScript and production Next build. `tests/browser/support-assistance.mjs`
uses the real local Next build with synthetic API responses and blocks remote
requests. Set SHIDA_TEST_URL to a loopback origin and SHIDA_EVIDENCE to a directory;
SHIDA_SUPPORT_PHASE selects before/after. Matching list/detail/new screenshots
cover 320/375/390/430/1440 widths. After checks include failure/retry, duplicate
clicks, draft reload, resolution, filter restoration, long text, empty/error states,
200% text and a 390x430 reduced-height keyboard simulation.

Evidence: `C:/NIHILOBA/release-evidence/support-assistance-20261116`.
Physical mobile keyboards, live sessions and real WhatsApp delivery were not
exercised. This batch is local only. Activate after backend migration 0250 and
the matching backend/Admin release; the current production issue is not yet fixed.
No packages, worker, runtime or environment settings were added.
