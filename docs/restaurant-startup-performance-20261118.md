# Restaurant startup and bounded recovery — 18 November 2026

## Status and baseline

Implemented and validated locally. **Not pushed or deployed.** This batch builds on
Website `2bd7072b2350863219a3bfaa5914e6f25e6ef814` and Backend
`ec105e07f9482537d57094077e82438de7d995b8`, including their existing local Today
summary. It is not a comparison against the deployed phase-two application.
Implementation commits: Website `0d2a4f83f5b8a0e1a357dabb3d3cb421f67751c1`;
Backend `50a3993380999adf4abd0fdeb97ca838aaf2ed36`.
This report is a subsequent documentation commit. Business is unchanged.

The historical [phase-two/follow-up report](waiting-phase2-release-and-restaurant-followup-20261118.md)
records the previous implementation. Its broad failure fallback and performance
numbers are superseded for this local batch by the behavior and matched evidence below.

## Changes

1. `restaurant-seller-workspace.tsx` now defers 24 substantial inactive panels with
   React lazy/Suspense: orders, reservations, inventory, counter, service, daily
   money, invoices, payment methods, intake, guest acceptance, menu, specials,
   batch editing, item routing, hours, profile, settings, statistics, reviews,
   sharing, photos, preview, creation and counter options. `restaurant-seller.tsx`
   defers signed-out entry and protected receipts separately. Imports start on
   rendering the destination; there is no all-panel prefetch.
2. Header, identity, navigation, Today and the shared editor remain eager. A
   compact translated status remains inside the persistent shell while a panel
   loads. The counter mounts only after first entry and stays mounted when hidden,
   retaining its existing draft and leave protections.
3. Mixed/shared CSS remains explicit: seller, mobile-pages, connected-workspace,
   refinements, focus/operations and mixed counter styles. Removing these merely
   because one panel is lazy would break other consumers. `restaurant-insights.css`
   moved to its sole owning panel; panel-owned assets can load with their chunks.
   No design, font, navigation or dependency change was introduced.
4. Today no longer requests full `order-configuration`. The authorized summary
   adds optional version-1 `intake_released`, using the existing backend flag
   exactly. It is the intake **rollout flag**, not opening hours, configured modes,
   customer eligibility or guaranteed availability. Settings still use the full
   configuration. A missing flag on an older summary is explicitly unknown.
5. Only framework missing-route 404 / method-not-allowed 405 becomes typed
   `restaurant_today_unsupported` in the private gateway. Only this condition
   invokes three serial legacy order reads. Protected 401/403/404, typed 409 limit,
   429, 5xx, malformed projections and the 12-second summary deadline do not fan out.
6. Summary failures have one group retry and FR/EN/LN/SW wording. Numeric and
   HTTP-date Retry-After are preserved; a cooldown disables the group retry.
   There are **zero automatic retries**. Refresh during cooldown can update
   independent sections without sending another summary. Explicit retries queue
   behind current reads and deduplicate; reads remain serial.
7. Transient failure retains valid prior order data with a stale notice, clears
   the intake claim, and leaves successful independent sections usable. Restricted
   results clear protected sections. Missing results render unavailable, not zero.
   Last-successful-refresh time advances only after a complete successful refresh.
   Epochs, aborts and establishment/session keys prevent late context updates.
   Browser cancellation does not claim to cancel SQL already running.

## Matched browser measurements

Three samples per profile/visit, Chrome production build, 390×844 CSS pixels.
The same populated fixture has pending, ready and accepted/preparing orders,
successful independent sections and unchanged permissions. Useful content means
the incoming count is rendered; action readiness additionally requires the work
section complete and its order action enabled. Settlement means refresh is enabled
again, with failed sections separately captured. All measured normal-path sections
succeeded; these are not error-queue timings.

The controlled harness routes API fixtures: 80ms per read for normal, 600ms for
mobile. Mobile additionally uses CDP 150ms latency, 200,000 B/s down, 93,750 B/s up,
4× CPU slowdown. **Routing disables HTTP caching**, so its second visit is named
`routed-reload-cache-disabled`, never a cached repeat. The separate real-path test
does not route APIs: Website gateway → loopback HTTPS Backend → isolated PostgreSQL
18 with real synthetic authenticated sessions, authorization and queries. It uses
the same CDP mobile settings and verifies actual browser cache hits.

Controlled medians in milliseconds, n=3; arrows are matched before → after:

| Profile / visit | First session request | Summary request | Useful content | Action ready | Settlement |
| --- | ---: | ---: | ---: | ---: | ---: |
| Normal cold | 355 → 251 | 816 → 741 | 1208 → 1119 | 1221 → 1149 | 1309 → 1152 |
| Normal routed reload | 243 → 176 | 640 → 577 | 1124 → 1030 | 1136 → 1037 | 1140 → 1039 |
| Mobile cold | 3947 → 2887 | 6773 → 5768 | 7664 → 6459 | 7689 → 6487 | 10081 → 8368 |
| Mobile routed reload | 3814 → 2783 | 6403 → 5331 | 7320 → 6342 | 7336 → 6368 | 9759 → 8244 |

Mobile cold useful-content range: 7460–8072 → 6367–6801ms; settlement:
9894–10541 → 8266–8697ms. Routed mobile reload useful range:
7288–7342 → 6303–6375ms; settlement: 9700–9791 → 7793–8269ms.
Normal cold useful range: 1129–1322 → 1113–1330ms; normal reload:
1111–1211 → 1019–1048ms. All other individual samples remain in the raw JSON.
Thus controlled cold mobile useful content improves 1.205s / 15.7%; normal cold
ranges overlap and should not be presented as a robust speed gain.

Each routed initial/reload visit goes from 52 → 43 requests and 545703 → 376743
response-body bytes. Initial JS: 452119 → 306075 bytes; CSS: 76950 → 54334 bytes.
All three samples in each group have these same counts/byte totals.
First Orders opening changes from 5 → 13 requests, 10305 → 55872 body bytes
(40545 deferred JS + 5022 CSS bytes). Normal action/settlement median 910 → 945ms;
mobile 3111 → 3488ms, ranges 2820–3131 → 3416–3529ms. Its loading shell precedes
actual action readiness; a visible shell alone is not counted as a ready action.

### Real frontend → Backend → PostgreSQL

Medians in milliseconds; observed minimum–maximum in parentheses, n=3 each.

| Visit | Session request start | Useful content | Action ready | Refresh settlement |
| --- | --- | --- | --- | --- |
| Cold before | 3872 (3857–3888) | 6078 (5889–6091) | 6095 (5909–6101) | 7472 (7291–7491) |
| Cold after | 2911 (2819–2917) | 4864 (4863–4869) | 4884 (4881–4887) | 5264 (5245–5775) |
| Cached before | 545 (518–714) | 2541 (2504–2718) | 2558 (2523–2734) | 3900 (3620–3975) |
| Cached after | 534 (522–581) | 2498 (2471–2502) | 2514 (2483–2529) | 2777 (2734–2892) |

Cold useful content improved **1.214s / 20.0%** in this sample; cold settlement
improved 2.208s / 29.6%. Cached useful content is effectively flat (43ms difference,
overlapping ranges), while settlement improves 1.123s. These few local observations
are not production p95, a physical-device result or an authenticated live-site test.

| Real-path resource measure | Before | After |
| --- | ---: | ---: |
| Browser requests, including cached resource events | 52 | 43 |
| API reads per visit | 9 | 8 |
| Full configuration reads on Today | 1 | 0 |
| Cold total CDP encoded transfer bytes | 620748 | 438487 |
| Cold JavaScript bytes / scripts | 480805 / 20 | 331882 / 18 |
| Cold CSS bytes / stylesheets | 106837 / 21 | 75673 / 15 |
| Cached total encoded bytes | 33106 | 30932 |
| Cached JS and CSS network bytes | 0 | 0 |

Cached visits still perform every private API read; no private response cache was
added. CDP encoded transfer and the controlled harness's response-body byte totals
are different measures and should not be compared across harnesses.

### Cost paid when opening a deferred destination

Real-path first Orders opening, n=3: median **2055 → 2457ms**, ranges 1614–2151
and 2397–2505ms. This 402ms cost is a tradeoff, not an improvement. Its actual
order content and refresh control were asserted. Controlled Orders timings are
included in the raw routed samples.

Menu/Finance local routed first-opening observations, n=1 per width/destination:

| Width | Menu useful ms | Finance useful ms |
| --- | ---: | ---: |
| 390 | 267 → 293 | 199 → 192 |
| 1440 | 154 → 389 | 156 → 184 |

Menu now fetches three deferred scripts and Finance four on first opening; the
baseline fetched none at that point. These single samples establish functionality
and deferred cost, not a reliable latency comparison.

## Backend work avoided

Three real HTTP samples per endpoint/scope, same synthetic records before/after:

| Scope | Summary queries before → after | Summary client ms before → after | Removed configuration queries / baseline client ms |
| --- | ---: | ---: | ---: |
| Personal | 51 → 51 | 391.68 → 389.35 | 76 / 563.64 |
| Organization | 66 → 66 | 519.84 → 460.91 | 85 / 662.07 |

The flag adds 23 JSON bytes and **zero queries**. Settings' full configuration
remains available and unchanged. These HTTP counts include session/authorization
overhead and populated fixtures, unlike the earlier report's service-only values.
The Backend companion report contains duration ranges, SQL/checkout measurements,
PostgreSQL test details and resource cleanup. No production database was used.

## Validation and evidence

- **92/92** frontend unit/gateway checks across Today contracts, gateway mapping,
  projections, operations, seller authorization and recovery transport.
- **76 distinct browser checks** passed across runs and affected reruns: 33 lazy
  destinations/loading/draft checks, 21 recovery cases, 14 existing Today cases,
  eight existing serial-read cases. Direct routes, 390/1440 layouts, FR/EN/LN/SW,
  partial errors, empty/populated states, old summary/unsupported compatibility,
  overload/deadline/malformed results, cooldowns, stale results, queued retry,
  logout and establishment switching are covered.
- Two lazy statistics fixtures originally returned a default protected 404;
  corrected to the intended 503 read-error fixture and reran both. One recovery
  test targeted a desktop-hidden mobile chooser; it now targets the visible
  shared chooser and passed. No application behavior was weakened for these tests.
- Both controlled profile checks and the real-path benchmark passed before/after.
  One after timing run initially lacked the loopback fixture-origin environment;
  the fixture safety guard refused navigation. The corrected run passed, and the
  failed setup log is retained separately. No timing from that attempt is used.
- Focused ESLint, TypeScript, production webpack build and diff checks passed.
  **32/32** Backend PostgreSQL tests passed, including actual lock/expiry behavior,
  scope denial, flag semantics, admission loss and the 101-order backlog.
  No full backend suite was run.

Reproduce the routed checks with `ROLLOUT_BASE_URL=http://127.0.0.1:3044` and
`PERF_OUTPUT` set to an owned evidence directory, using
`playwright.restaurant-startup.config.ts`. Use `playwright.today-followup.config.ts`
for the 14 cases and `playwright.waiting2-regression.config.ts` restricted to
`waiting2-regression.browser.ts` for eight. New lazy/recovery configs are listed
below. The integration config uses port 3045 and
`SHIDA_STARTUP_FIXTURE_WORKSPACE`; the Backend report documents its isolated HTTPS
fixture server on 8045 and PostgreSQL on 55481. Do not run CPU-heavy checks
concurrently with measurements. Production previews are started/stopped by the
test runners. The validated local `.next` build and shared dependencies remain;
task-owned database, synthetic session and TLS snapshot resources were removed.

Preserved origin/CSRF, browser binding, sessions, exact-resource permissions,
private no-store responses, projections, currency values and lifecycle rules.
Backend Personal and Organization scenarios use real HTTP/PG authorization and
cross-scope denials. Website's Restaurant UI is Personal-scoped: no Organization
dashboard-switch browser test or Business frontend implementation is claimed.

Screenshots were visually compared at matching widths; unchanged fixtures and
filters preserve the existing cream/green design and colorful cards. The actual
last-refresh clock naturally differs between captures:

- [390 before](evidence/restaurant-startup-performance-20261118/before/today-lazy-390.png) / [390 after](evidence/restaurant-startup-performance-20261118/after/today-lazy-390.png).
- [1440 before](evidence/restaurant-startup-performance-20261118/before/today-lazy-1440.png) / [1440 after](evidence/restaurant-startup-performance-20261118/after/today-lazy-1440.png).
- Populated real-path [mobile before](evidence/restaurant-startup-performance-20261118/before/real-startup-mobile.png) / [mobile after](evidence/restaurant-startup-performance-20261118/after/real-startup-mobile.png).
- [Raw samples and validation evidence](evidence/restaurant-startup-performance-20261118/). A concurrent-load timing attempt is retained under an explicitly discarded name and excluded from conclusions.

No full backend suite, production load test, real OTP/message, dependency change,
migration, worker/pool/region setting or live deployment was performed. Chrome
automation is browser emulation; Safari and physical devices remain unverified.

## Remaining bottlenecks and bounded next work

- `restaurant-seller.tsx:45` restores the session, then workspace `loadList` and
  `select` at lines 128–152 read list → detail → exact-resource capabilities.
  The real after cold sample still takes approximately 1.4–1.5s from session
  request start to summary request start. A future authorized bootstrap projection
  could combine current context/detail/capabilities while retaining fresh scope
  checks and safe account switching. No authority cache or speculative fanout here.
- Backend `restaurant_order_service.py::_reconcile` repeats customer/owner/public
  eligibility work per outstanding order and refreshes time after checks/locks.
  The summary already reconciles once per request; per-order invariant work is
  the next profiling target. Do not reuse stale authority or pre-lock time.
- The summary still refuses more than 100 outstanding orders or a response over
  128KiB. Retry-After 30 does not resolve a persistent backlog. Explicit Orders
  navigation remains available and can still incur legacy reconciliation work;
  safely bounding that work requires a separate domain design, not removed locks
  or automatic completion/archiving of historical obligations.
- The prior live public-jobs observation was 2.612s/189 queries. Code inspection
  finds `public_marketplace.py::browse_public_jobs` calling
  `public_job_marketplace.py::list_public_jobs` (line 562), loading eligible posters,
  building per-row DTO/identity/external metadata before Python filtering/paging.
  Investigate bounded SQL filtering/paging and batched DTO dependencies while
  preserving visibility rules. This task did not remeasure or change that route.
- Website Oregon → Backend Frankfurt remains a serial-hop concern from the
  previous report. Loopback TLS measurements do not measure inter-region RTT.
  Correlate real gateway/upstream spans before proposing a region change; no
  infrastructure change or new production sampling was made here.

## Compatibility, future release and rollback

If separately authorized, release the additive Backend first (including its
existing local summary parent), then Website. No Business release, migration or
new environment setting is required. Old clients ignore the added flag but retain
their old fallback behavior until Website is updated. New Website with an older
version-1 summary renders a missing flag as unknown; genuinely unsupported
backends retain the three serial legacy reads and unknown intake. Auth failures
must never be classified as compatibility.

Rollback only the affected application artifact to the reviewed baseline, without
rewriting Git or reversing data. The Backend addition remains compatible with the
older Website. Rolling Website back restores its larger startup download and
expensive failure fanout, so prefer a focused fix if those are the only issues.
Validate exact deployed commits, direct links, settings configuration and failure
behavior on any later release; local evidence is not deployment verification.

## Exact changed files

Application:

- `app/components/shida/restaurant-seller-workspace.tsx`
- `app/components/shida/restaurant-seller.tsx`
- `app/components/shida/restaurant-insights.tsx`
- `app/components/shida/restaurant-today.tsx`
- `app/lib/restaurant-seller-browser.ts`
- `app/lib/restaurant-today-contract.ts`
- `app/lib/restaurant-retry-after.ts`
- `app/lib/restaurant-today-recovery-copy.ts`
- `app/api/shida/personal/restaurants/[[...path]]/route.ts`

Tests and harnesses:

- `tests/restaurant-today-contract.test.ts`
- `tests/restaurant-today-gateway.test.ts`
- `tests/restaurant-today-recovery.test.tsx`
- `tests/browser/restaurant-lazy-panels.browser.ts`
- `tests/browser/restaurant-startup-performance.browser.ts`
- `tests/browser/restaurant-startup-integration.browser.ts`
- `tests/browser/restaurant-today-recovery.browser.ts`
- `tests/browser/restaurant-today-followup.browser.ts`
- `tests/browser/waiting-performance.browser.ts`
- `tests/browser/waiting2-regression.browser.ts`
- `playwright.restaurant-lazy-panels.config.ts`
- `playwright.restaurant-startup.config.ts`
- `playwright.startup-integration.config.ts`
- `playwright.today-recovery.config.ts`

Documentation: this report and the explicitly named screenshots, JSON samples
and check transcripts under `docs/evidence/restaurant-startup-performance-20261118/`.
Use `git show --name-only 0d2a4f83f5b8a0e1a357dabb3d3cb421f67751c1` for the exact evidence-file manifest.
