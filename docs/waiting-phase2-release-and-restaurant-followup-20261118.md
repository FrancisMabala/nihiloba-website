# Phase-two release and local Restaurant follow-up — 18 November 2026

## Release boundary

The reviewed phase-two batch is **pushed and deployed**. The new `today-orders`
work described below is **local only**; this document belongs to that follow-up.
It is not evidence that the new endpoint or client is deployed.

| Service | Verified release | Render deployment / live time (UTC) | Actual previous live revision / rollback artifact |
| --- | --- | --- | --- |
| Backend | `dde9b8469ce127df632ca89709021988a0b8b583` | `dep-dbuvc5mi0phs73ev46eg`, live 19:05:16 | `5016ac7c0305c8384b5b834c88a6a3022bcd0590`, `dep-dbuv8ke8bjmc73alua80` |
| Website | `46c7fa39dc1183796735cc8a3b7322eef0fdaba8` | `dep-dbuvetom7kps73e9tks0`, live 19:10:03 | `63154cdd5f8dbfc04479331be44ef59262ebea56`, `dep-dbuutfl9fdbs73b2sdj0` |

Backend remote main had advanced to the already-live `5016ac7c`. A clean,
conflict-free merge retained that work and reviewed performance commit `12e635be`.
The 14 affected capability tests passed again. Both pushes used explicit
`HEAD:main`; `git ls-remote` confirmed their full SHAs. Render reported those exact
commits live, not merely healthy URLs. GitHub combined-status access returned an
empty status list for both revisions: no CI-green claim is made from that result.

Business remains `c299b985fcd5dd3e0308af8d972bc625bd9755eb`; no Business release.
Its six capability/navigation consumer tests passed against the unchanged contract.
Both released services still have auto-deploy **off**. Plans, regions, instance
counts, worker settings and pool settings were not changed. No new migration,
Terms release, environment variable or dependency was introduced.

### Bounded production observations

- Backend `/health` returned 200 (one HTTP sample, 0.215s). Website Mon espace
  returned 200 (0.362s); Business root returned 200 (0.352s). These unauthenticated
  shell/health timings are **not authenticated journey performance measurements**.
- Backend new instance memory rose from 329,101,300 to 399,454,200 bytes during
  19:05–19:13 UTC (about 314–381 MiB, 2 GiB limit). One configured instance;
  old/new instances briefly overlap during the rolling release. This short warmup
  window cannot establish long-term memory behavior.
- Backend 19:07–19:13 HTTP metric buckets showed 200 responses, no nonzero error
  buckets. Three transient pool-full warnings were observed at 19:07:04,
  19:07:44 and 19:11:24 (5/5 connections; oldest holds 1.842s, .128s, .019s).
  A public-jobs read took 2.612s / 189 queries. No long-hold/admission warning or
  further matching diagnostic appeared in the 19:13–19:20:57 check. These are
  observations under unpaired traffic, not proof that pool pressure is solved or
  that phase two caused it. No material task-caused regression was established.
- Website new-instance memory was about 119–169 MiB during 19:10–19:18. Request
  metrics had no nonzero error bucket. No failure/restart events were returned
  for either service in the checked post-release windows.
- `/api/dashboard/capabilities` duration/count metrics were empty for the window.
  No production capability duration, authenticated Mon espace/settings latency,
  or Restaurant readiness result is claimed.
- An authenticated SHIDA browser session was visible. Computer Use then stopped
  because its safety check could not reliably determine the current Windows Chrome
  URL. No credentials were copied and no alternate automation was used to bypass
  that restriction. Actual post-deploy authenticated navigation remains unverified.
  No production account, OTP, message, order, booking or financial write was made.

Rollback, if a material release regression is established: use Render's retained
deployment rollback for the exact previous artifact in the table, verify its live
commit and health, and recheck the manual auto-deploy setting. Roll back only the
affected service; their contracts are compatible independently. Do not force-push
Git, reverse database data, or roll back to the older `b602e55b` from the historical
report. No rollback was required during this verification.

## Confirmed remaining request chain

`restaurant-seller.tsx` restores the browser-bound Personal session;
`restaurant-seller-workspace.tsx::loadList/select` reads establishments, selected
detail and exact-resource capabilities before mounting `RestaurantToday`.
`restaurant-today.tsx` then serializes up to nine reads. The matched fixture has
seven, because reservation capability is absent. The Website private gateway
checks route/query, cookie binding and origin, forwards HTTPS without caching,
then checks projections. Browser timings include asset/hydration/network delay;
they do not isolate the Website-to-Backend hop or database waiting.

The three order reads use the same backend `restaurant_order_api_service.orders`:
parent `FOR UPDATE`, current actor/owner/member/module authorization, outstanding
order reconciliation, state-filtered count and bounded page. Repeating this three
times repeats authority and reconciliation work. Accepted historical obligations
remain included by the existing rules; no date-based cleanup was added.

Other reads retain their separate permissions and definitions: pending/calendar
reservations, low stock, service groups, daily money and intake configuration.
The daily money query preserves per-currency recorded net amounts and current
balance due. Its obligation scan and intake's menu/availability work are not folded
into an aggregate. A nine-section batch would obscure independent failures and
combine additional variable work. Removing ownership locks or adding parallel
requests was not justified.

## Local implementation

- New bounded backend `GET …/restaurants/{ref}/today-orders` supports Personal and
  Organization actors through the existing seller router. No caller-selected
  filters/scope. Version 1 returns the unchanged pending (5), ready (5), and
  accepted/preparing (1) projections and exact totals, under one freshly authorized
  transaction and reconciliation. No cross-request authority cache.
- Before reconciling, fetch at most 101 outstanding orders; over 100 returns the
  explicit budget conflict. Serialized response cap is 128 KiB. Both budget
  failures roll back. Normal reconciliation still rechecks eligibility/expiry,
  queues notices in the database and preserves admission and mutation rules;
  no external messaging I/O is introduced while holding the connection.
- Website tries the summary once per refresh. A successful snapshot supplies the
  three existing sections; all other requests remain serial and independent.
  Older backends (404/405), oversized backlogs (409), invalid projections and
  transient failures use the original individual reads. Missing endpoint support
  is remembered only for this mounted context. Authentication failures are not
  treated as endpoint compatibility.
- A failed individual section retains its own error/retry. Section retry uses its
  individual route and the existing priority queue. Last-successful-refresh time
  changes only when the full refresh succeeds. Amounts, currencies, translations,
  navigation and permissions are unchanged.
- The existing establishment/session component key, abort controllers and epoch
  protect context changes. A held old summary cannot populate the next venue.
  Client cancellation does not claim to cancel SQL already running on the server;
  that work remains bounded and the transaction closes normally.

## Matched local browser measurements

Three samples each, Chrome production build, 390×844 CSS pixels. Same empty-order
fixture, filters and API states before/after, including the intentional daily-money
404. Thus “full refresh” below is queue settlement/re-enabled refresh, **not** a
claim that every section succeeded. Separate interaction tests cover successful
CDF/USD money reads, failure/retry, populated/empty orders and correct timestamps.
Normal API fixture delay 80ms; mobile 600ms plus CDP 150ms latency, 200,000 B/s
download, 93,750 B/s upload and 4× CPU throttling. These delays mock each API read;
they do not model the new endpoint's real PostgreSQL execution cost.

| Profile / visit | Useful content ms | Action section ready ms | Full refresh ms | Requests | Transferred body bytes |
| --- | ---: | ---: | ---: | ---: | ---: |
| Normal first | 1153 → 1180 | 1173 → 1195 | 1496 → 1344 | 54 → 52 | 544186 → 544712 |
| Normal repeat | 1040 → 1110 | 1063 → 1126 | 1353 → 1132 | 54 → 52 | 544186 → 544712 |
| Mobile first | 7584 → 7906 | 8293 → 7938 | 11416 → 10379 | 54 → 52 | 544186 → 544712 |
| Mobile repeat | 7427 → 7395 | 7698 → 7443 | 11188 → 9837 | 54 → 52 | 544186 → 544712 |

Mobile completion improves by 1.037s / 9.1% first and 1.351s / 12.1% repeat in
this small local sample. First useful content regresses .322s, and normal useful
and action readiness slightly regress. No first-paint improvement, production p95
or physical-device speed claim. The added summary contract/client logic costs
526 body bytes in this build. Order navigation remains five requests / 9541 bytes;
normal control readiness .943→.927s, mobile 2.677→2.686s.

Raw comparable samples: [evidence](evidence/restaurant-today-followup-20261118/).
Paired identical populated-state screenshots retain the existing layout:
[mobile before](evidence/restaurant-today-followup-20261118/before/restaurant-390.png),
[mobile after](evidence/restaurant-today-followup-20261118/after/restaurant-390.png),
[desktop before](evidence/restaurant-today-followup-20261118/before/restaurant-1440.png),
[desktop after](evidence/restaurant-today-followup-20261118/after/restaurant-1440.png).

## Validation and future release

Production build, TypeScript, focused ESLint and 28 frontend unit/gateway tests
passed. Fourteen new browser checks passed; the held-response case was strengthened
and rerun through the in-page establishment chooser. Existing 24 phase-two browser
checks also passed: eight Restaurant serial fallback/retry cases, all Mon espace
destinations, settings, direct links/history, keyboard, signed-out/error states,
320/375/390/430/820/1440 widths and four locales. Safari focus-loss simulation is
Chrome automation, not a physical Safari check. No full backend suite was run.

Backend evidence and PostgreSQL validation are recorded in the same-named Backend
report: 124 selected cases passed across the focused run and affected reruns,
including actual parent-lock waits, fresh identity/expiry, exact Personal/Organization
scope, projection limits and connection cleanup. Two pre-existing order-number
assertions were corrected; the existing isolated database-name guard was retained.
The small before/after browser sample and local Docker database do not
establish live user latency. Remaining work includes initial discovery/asset cost,
large-backlog fallback cost, money/intake scaling and representative live traces.
No region move, pool increase or concurrency change is proposed from these data.

If approved later, deploy the additive backend first, then Website. Old clients
continue using individual reads; the new Website falls back on an old backend.
No Business frontend change, migration or new configuration is required.
