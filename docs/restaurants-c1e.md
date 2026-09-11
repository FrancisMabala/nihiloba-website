# Restaurant C1-E â€” NIHILOBA Personal seller workspace

11 September 2026. Website scope only. Production intake remains disabled.
No Backend or Business Dashboard repository edits, deployment, live messages or Git commit.

## Website implementation

The existing seller shell, marketplace illustration, authentication, session binding,
logout, typography and palette are preserved. EN/FR/LN/SW Personal sellers, including
Free sellers, have Orders, Counter sale, Basic activity and Order intake alongside
the existing menu, dated offerings, hours, public profile, preview and permanent QR.
The seller language selector spells **Lingala** without an accent. No Organization
management, paid requirement, payment action, staff grant or public checkout is added.

Orders provide incoming/active/history filters, real pagination and filtered counts,
selected private detail, grouped food totals, the actual response deadline and
current state. Actions cover acceptance/rejection, preparation, ready, dispatch,
actual handoff, cancellation resolution, delivery failure and uncollected pickup.
Consequential actions require explicit confirmation and applicable structured
reasons. Backend state/revision/authority remains definitive.

Counter sales use basket creation, edit, quote and finalize. Unit quantities,
configured monetary portions and independent plate groups remain distinct. Prices
are decimal strings; the server supplies food, delivery fee and total. A minimum
never becomes an amount option. A quote is not a completed sale; actual food handoff
requires a separate confirmation. Counter receipts have no fabricated buyer.

Pickup and delivery have separate forms and separate PUT transactions. All loaded
windows and areas are retained; the closed gate disables enabling/new-sale controls.
Publication, opening hours and intake remain distinct. Native local date/time inputs
cover offerings, closures and intake; weekly hours retain time controls and explicit
split/overnight guidance. A timezone selector replaces memorized IANA entry.
Repeated clocks require an occurrence choice; nonexistent clocks cannot silently
shift. Expected revision strings never pass through Date.

Fast menu maintenance offers existing/custom categories and five localized category
suggestions. It has 1â€“20 editable rows, unit/amount/unknown prices, existing currency,
compact review and one atomic batch POST. Name collisions require explicit
update/skip/separate choices. Unreviewed existing fields remain omitted and creation
defaults are disclosed. Technical bounds are not commercial quotas.

## Gateway contracts

The seller gateway `/api/shida/personal/restaurants/[[...path]]` forwards only to
`/api/dashboard/personal/restaurants`. Existing methods/routes remain. Additions:

| Method | Establishment-relative route |
| --- | --- |
| GET | order-configuration; orders; order-feed; order-summary |
| GET | orders/{order_ref}; orders/{order_ref}/receipt; orders/{order_ref}/destination |
| POST | orders/{order_ref}/actions/{allowlisted action} |
| PUT | pickup-intake; delivery-intake |
| POST | counter-baskets |
| GET/PATCH | counter-baskets/{basket_ref} |
| POST | counter-baskets/{basket_ref}/quote; counter-baskets/{basket_ref}/finalize |
| POST | order-operations/recover; order-measurement; menu-batches |

Batch save uses exactly `POST {RST}/menu-batches`, not repeated item POSTs. Strict
validation covers the 120-character batch key, raw revision, exclusive category
selector, unique stable row keys, exclusive update/skip/separate choices, bounded
rows and known item fields. Other order operation keys retain their 200-character
limit. Quantities, selections, windows, areas, fee, reasons and confirmations have
bounded allowlisted shapes. Decimal numbers must be strings.

Repeated states are allowed only for list/feed. Lists have page/page_size â‰¤50; feeds
have cursor/limit â‰¤50; summaries require from_date/to_date with documented optional
offsets and pagination. No account ID, Business path or arbitrary proxy is accepted.
The existing validated canonical Origin and trusted session are forwarded. Responses,
errors and unsupported-method handlers remain private/no-store.

The separate customer gateway permits only GET of
`/api/shida/personal/restaurant-orders/{order_ref}/receipt` and optional language,
forwarded to the documented Personal customer receipt route. It exposes neither
seller access nor customer baskets, destinations or actions.

## Receipts, recovery and privacy

Protected pages exist at `/shida/seller/restaurants/{RST}/receipts/{order_ref}` and
`/shida/restaurant-orders/{order_ref}/receipt`, plus localized variants. They reuse
Personal sign-in at the current internal location. Every lookup is reauthorized;
focus/visibility/reconnect revalidate receipts, withholding stale receipt content.
Logout/replaced identity clears private state. No new redirect parser is introduced.

Receipt terms and current state remain separate. Food/fee/total are separate;
pickup's null fee means not applicable. Payment is always labelled unverified.
Online receipt dates use the saved window timezone; a missing snapshot timezone
is explicitly labelled UTC rather than inferred from a changed establishment.

On-demand QR uses the existing local qrcode encoder. Online QR targets the protected
customer receipt; counter QR targets the protected operator receipt. It contains only
a same-origin locator, never an address, credential or fulfillment right. Forwarded
authorization rejection was browser-tested before connecting QR generation. Normal
lists load no receipt QR. Existing WhatsApp RECEIPT and permanent menu QR are unchanged.

Uncertain writes retain the exact target, method, serialized body, operation key and
original revision in memory. Retry reuses that envelope; conflict requires a current
authorized read and explicit reconciliation/confirmation. Drafts survive transient
failures; leaving a pending draft warns before discarding. No persistent private
storage, offline order queue, service worker or automatic revision substitution is
introduced. Delivery addresses use only the separate selected-order endpoint and
are cleared/hidden on stale connectivity, terminal state or lost access.

## Feed and screen awake

Initial synchronization gets the scoped cursor, then the bounded list, then consumes
the feed. Foreground polling is 15 seconds with one in-flight poll per workspace;
failures back off to 30/60/120 seconds. Hidden/offline polling pauses. Returning
reconciles current state before writes. Expired cursors restart cursor/list
synchronization. Scope changes abort or ignore old work. Selected detail survives
filter removal and is fetched on demand or relevant changes only.

The feed does not supply a current filtered count. Actual changes/removals trigger
a refill of only the visible list page to restore exact count and pagination holes.
Idle polling never reloads all history or every detail. Later history pages use the
list as_of bound; explicit refresh establishes a new bound. No constant-time Backend
aggregation or monthly data-use estimate is claimed.

Screen awake is optional/off by default, capability-detected and requested following
user action. It releases on hidden/disable/unmount/logout; reacquisition requires
the current session choice. Unsupported/denied/released states show a settings
fallback without promising lock prevention or extended authentication.

## Original C1-E verification (before projection follow-up)

- Supported Node 22.23.2 final checks; initial system Node was 22.12.0.
- Vitest: 262 tests / 24 files passed.
- TypeScript, ESLint and Next 16.3.4 production build passed.
- 28 mocked browser journeys passed in the final uninterrupted run, including all
  existing seller/authentication flows, batch retry, local time controls, feed
  removal/reconnect, wake fallback and new EN/FR/LN/SW navigation.
  A focused seven-scenario C1-E rerun also passed after the reconciliation guard.
- Actual Backend browser journey passed pickup acceptance through handoff, counter
  quote/handoff, seller/customer receipt authorization and forwarded rejection,
  menu-batch collision update/stale reconciliation, QR and closed-intake controls.
- Diff whitespace check passed. Final evidence/measurements are listed below.

The real harness runs the current Backend app/services and PostgreSQL in the
loopback-only `nihiloba-s3a-isolated` container, using a dedicated `c1e_web` schema
from current metadata. This is not migration acceptance. An initial migration
attempt against old metadata-created S3-A fixtures hit DuplicateTable and rolled
back; the separate schema preserves those fixtures. Backend .env is never loaded.
Non-loopback sockets are blocked before app startup. Only the synthetic process
enables intake for a journey; it closes intake afterwards. Its explicit allowed
Origin is https://localhost:3014. Production settings are untouched.

The initial sandbox build reproduced the previously recorded public Hotel/sitemap
fetch warning `connect EACCES 216.24.57.7:443`; subsequent builds succeeded without
it. Development hot reload interrupted some intermediate browser runs; the final
uninterrupted run passed. Native datetime inputs required updating old tests that
typed offsets into textboxes. No CSP weakening or application TLS bypass was added.

## Remaining contract and acceptance limits

1. **Closed by the projection follow-up below:** authorized list/feed rows now
   provide bounded food/plate summaries and stored response deadlines.
2. **Closed by the projection follow-up below:** the Personal gateway now consumes
   the actual private customer-style menu projection alongside profile preview.
3. Full delivery/reason combinations, physical-device wake behavior, long-running
   cursor expiry and broad revocation races are
   not claimed as fresh end-to-end browser acceptance. Native-language review and
   existing shared LN/SW navigation fallbacks remain pending.
4. Optional multi-day hours copying is not added; existing split/overnight/closure
   and offering controls remain. Basic D6 summaries preserve coverage and currency
   separation, but historical backfill, verified revenue, trusted test exclusions
   and public-view analytics are not introduced.

This does not declare C1-E across both projects complete. Business Dashboard retains
Organization-only work screens and its separate acceptance. C1-F retains controlled
live/device, real transport, all-instance cookie/Origin configuration, maintenance
cadence/capacity/backlog and restore acceptance. Production intake must stay disabled.

## Reproduction

Use Node â‰¥22.13.0 for test/typecheck/lint/build. Direct CLI equivalents were used
with cached Node 22.23.2 to avoid the older system npm wrapper.

Mocked browsers: existing test server on 127.0.0.1:3013,
`playwright.restaurant.config.ts`, `restaurant-seller.browser.ts` and
`restaurant-c1e.browser.ts`. Do not edit app source during the run.

Actual integration: start the existing disposable loopback PostgreSQL container on
55439. Run `tests/integration/restaurant-c1e-backend.py` using Backend venv Python
with PYTHONDONTWRITEBYTECODE=1. Use the existing ephemeral local TLS certificate.
Set process-only SHIDA_API_BASE_URL=https://127.0.0.1:3443 and NODE_EXTRA_CA_CERTS
to that certificate; run `restaurant-https.mjs` against the production build.
Run `restaurant-c1e-actual.browser.ts` with RESTAURANT_TEST_EXTERNAL_SERVER=1,
RESTAURANT_ACTUAL_BACKEND=1 and RESTAURANT_TEST_BASE_URL=https://localhost:3014.
Never run the fixture harness with real data. Stop its servers/container afterwards.

Rollout order: compatible Backend C1-C/D plus the batch adapter, separately verified
frontends, then C1-F acceptance. No deployment or commit is part of this task.

## Changed files

- `app/(default)/shida/restaurant-orders/[orderRef]/receipt/page.tsx`
- `app/(default)/shida/seller/restaurants/[establishment]/receipts/[orderRef]/page.tsx`
- `app/(localized)/[lang]/shida/restaurant-orders/[orderRef]/receipt/page.tsx`
- `app/(localized)/[lang]/shida/seller/restaurants/[establishment]/receipts/[orderRef]/page.tsx`
- `app/api/shida/personal/restaurant-orders/[[...path]]/route.ts`
- `app/api/shida/personal/restaurants/[[...path]]/route.ts`
- `app/components/shida/restaurant-activity.tsx`
- `app/components/shida/restaurant-counter.tsx`
- `app/components/shida/restaurant-intake.tsx`
- `app/components/shida/restaurant-local-time.tsx`
- `app/components/shida/restaurant-menu-batch.tsx`
- `app/components/shida/restaurant-order-screen.tsx`
- `app/components/shida/restaurant-receipt.tsx`
- `app/components/shida/restaurant-seller-workspace.tsx`
- `app/components/shida/restaurant-seller.css`
- `app/components/shida/restaurant-seller.tsx`
- `app/lib/restaurant-orders-contract.ts`
- `app/lib/restaurant-seller-contract.ts`
- `app/lib/restaurant-work-copy.ts`
- `app/lib/restaurant-work.ts`
- `docs/evidence/restaurants-c1e/counter-phone.png`
- `docs/evidence/restaurants-c1e/intake-phone.png`
- `docs/evidence/restaurants-c1e/measurements.json`
- `docs/evidence/restaurants-c1e/orders-desktop.png`
- `docs/restaurants-c1e.md`
- `tests/browser/restaurant-c1e-actual.browser.ts`
- `tests/browser/restaurant-c1e-fixture.ts`
- `tests/browser/restaurant-c1e.browser.ts`
- `tests/browser/restaurant-seller.browser.ts`
- `tests/integration/restaurant-backend.py`
- `tests/integration/restaurant-c1e-backend.py`
- `tests/restaurant-c1e.test.ts`
- `tests/restaurant-seller.test.ts`

## Original captured evidence and request measurements

Screenshots were visually inspected at desktop and phone widths:

- [Actual order detail / desktop](evidence/restaurants-c1e/orders-desktop.png)
- [Actual counter sale / phone](evidence/restaurants-c1e/counter-phone.png)
- [Mocked closed intake and two windows / phone](evidence/restaurants-c1e/intake-phone.png)
- [Actual request measurements](evidence/restaurants-c1e/measurements.json)

The intake screenshot includes the development server indicator; this is not a
production UI feature. Actual integration screenshots use the production build.

| Measured phase | Seller API responses | JSON response-body bytes |
| --- | ---: | ---: |
| Settled foreground idle, 31 seconds | 2 | 325 |
| Offline then reconnect/reconciliation | 5 | 1,861 |
| Complete active operator journey, including idle and reconnect | 59 | 44,762 |

These are observed response bodies for `/api/shida/personal/restaurants/`, not
encoded wire totals: TLS, HTTP headers, assets, customer receipt requests and the
shared session endpoint are excluded. Raw timestamps and exact paths are retained
in the linked synthetic measurement file. Idle contains only two feed responses;
reconnect includes cursor/configuration/list/feed/selected-detail reconciliation.
The active total includes fixture menu size and repeated authorized reads; it is
not a content-independent benchmark or an estimate of monthly mobile usage.

Expected actual transcript events: pickup accept/start/ready/complete persisted;
counter quote then handoff persisted; menu-batches first returned 409 after an
independent synthetic edit, then saved following explicit current-state review;
forwarded customer and counter receipt lookups returned 404; closing intake disabled
new counter sales while existing history remained accessible. External transports
were blocked throughout. No physical phone or live WhatsApp delivery is claimed.

Cleanup: the local Next development server, HTTPS production test server and
Backend fixture server were stopped after verification. The disposable PostgreSQL
container was stopped; synthetic schema and screenshots remain for reproduction.


## Projection follow-up (11 September 2026)

The two NIHILOBA projection gaps are closed against the actual current Backend
contract in `../Backend/docs/restaurants_c1e_projections.md`. No Backend or Business
source was changed. Production intake remains disabled; only the existing isolated
synthetic test process temporarily enables intake and closes it after the journey.

Order list/feed cards render `food_preview` directly: standalone selections retain
one group, each plate retains its ordinal, and monetary portions remain decimal
strings with currency rather than invented quantities. Validation enforces three
groups and six lines, bounded names/units, exclusive unit/amount fields and consistent
remaining counts. Per-group omitted lines are shown separately; top-level omitted
lines already include unshown groups and are never added twice. Truncation explicitly
requires opening full detail before preparation. Missing/unavailable projections
show an unavailable summary, never guessed food. Unsafe numeric quantities are
rejected instead of displayed with lost precision.

Only pending rows say `Respond before`, using the stored deadline unchanged.
Accepted/historical detail and receipts label a retained deadline as saved, with no
response-due implication. Missing/null deadlines produce no invented deadline.
Cursor-first synchronization, complete changed-row replacement, removals, bounded
page refill, selected detail, polling/backoff, wake lock and mutation recovery remain.

The exact GET `{RST}/menu-preview` gateway accepts only `language=en|fr|ln|sw`,
positive page and page_size 1-5, with no duplicate or authority parameters. It checks
the trusted session binding, forwards to the Personal route and validates the exact
preview envelope/item keys and pagination. Successes and errors are private/no-store.
The UI renders returned customer text with preserved newlines as React text, never
HTML or editable pricing. The private label explicitly disclaims publication and
order enablement; eligibility remains entirely in Backend. Pages load on demand.
Focus/visibility/reconnect reauthorize; stale preview text is withheld, and ownership
or authentication loss clears the workspace. Scope, language and binding changes
remount the preview and ignore previous in-flight results. The existing profile
preview and all management/atomic batch APIs remain intact.

### Follow-up verification

- Full Vitest suite: 291 tests / 25 files passed; focused projection/gateway rerun:
  60 tests passed after final validation tightening.
- TypeScript, ESLint and Next 16.3.4 production build passed with Node 22.23.2.
- 30 mocked browser journeys passed together against the production build, including
  retained C1-E/seller cases and new plain-text/pagination/access-loss/summary cases.
- Actual isolated Backend/PostgreSQL journey passed: standalone plus six plates,
  truthful four omitted lines/groups, card deadline without per-order detail,
  private six-food menu pagination, four-language GETs, oversized query rejection,
  current ownership rejection, acceptance through handoff, counter receipt/QR,
  customer receipt authorization, atomic batch conflict/recovery and closed intake.
- Whitespace check passed. No migrations, live transports, deployment or Git commit.

Intermediate test issues were corrected: an incorrect preview-button label, a
no-detail assertion that also matched the list's trailing slash, an unintended Rice
name collision in the expanded fixture, and an immediate DOM count that raced intake
loading. The DOM assertion now waits for the four controls. A development runner
finished its cases but hung during Windows server teardown; the final mocked run
used a separately controlled production server and exited successfully. Screenshots
wait for authorized data and enabled controls after viewport changes.

The isolated harness remains loopback-only with dotenv and external sockets disabled,
using the existing disposable PostgreSQL `c1e_web` schema. This is application
integration evidence, not production or migration acceptance. Existing C1-F,
Organization, device/native-language and transport acceptance limits above remain.

### Follow-up artifacts and measurements

- [Bounded incoming order card](evidence/restaurants-c1e/projection-order-summary-desktop.png)
- [Private customer menu / phone](evidence/restaurants-c1e/projection-menu-preview-phone.png)
- [Completed order detail](evidence/restaurants-c1e/projection-orders-desktop.png)
- [Counter receipt / phone](evidence/restaurants-c1e/projection-counter-phone.png)
- [Raw response measurements](evidence/restaurants-c1e/projection-measurements.json)
- [Verification record and artifact hashes](evidence/restaurants-c1e/projection-verification.json)

| Final phase | Seller responses | JSON body bytes |
| --- | ---: | ---: |
| Foreground idle, 31 seconds | 2 | 325 |
| Offline/reconnect reconciliation | 5 | 4,237 |
| Complete active journey including idle/reconnect | 62 | 94,860 |

These measurements come from the final successful synthetic journey.
Page browser response events count seller API bodies only; direct authorization/query
checks made by Playwright's API client are outside these measurements. HTTP/TLS,
assets, session/customer receipt calls and compression are excluded. The expanded
fixture contains six menu foods and seven food selections across seven groups, so
active totals are not directly comparable to the earlier single-food fixture. Idle
still contains only incremental feed responses. No monthly-data estimate is implied.

Reproduce with the existing harness/server instructions above and
`restaurant-projections.browser.ts` added to the mocked suite. Final artifact outputs
are `.s3a-local/c1e-projections-mocked-final` and `.s3a-local/c1e-projections-actual`.

Suggested commit (not created):
`feat(restaurants): integrate bounded order and private menu projections`

Cleanup: both website test servers and the Backend fixture process were stopped.
The disposable `nihiloba-s3a-isolated` PostgreSQL container was stopped.
