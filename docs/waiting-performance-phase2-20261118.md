# Waiting performance follow-up — 18 November 2026

## Release boundary and current infrastructure

The previous performance release is **pushed and deployed**:

| Project | Remote main / live commit | Verified Render deployment |
| --- | --- | --- |
| Website | `63154cdd5f8dbfc04479331be44ef59262ebea56` | `dep-dbuutfl9fdbs73b2sdj0`, live 18:33:10 UTC |
| Backend | `b60259202f461b156a9355ec91a29fe4860b8c50` | `dep-dbuurketlv9c73c4pjq0`, live 18:29:36 UTC |
| Business, unchanged | `c299b985fcd5dd3e0308af8d972bc625bd9755eb` | Existing live version retained |

Backend integrated the separately advanced public-job reference fix `d3488409`
with the approved performance commit `c12b72eb`; seven focused discovery tests
passed after that clean merge. Both release pushes were verified using
`git ls-remote origin refs/heads/main`. Post-release Backend health and Website's
public country-reference gateway returned HTTP 200. GitHub combined-status API
returned empty arrays, which is **not** a verified CI success.

**The new changes below are local only, not pushed or deployed.** Backend's new
local capability snapshot is `12e635be`; it has its own same-named report.

Render inspection confirmed Backend was already **1 CPU / 2 GiB, Frankfurt,
one instance**. Business is also 1 CPU / 2 GiB/Frankfurt. Website is Starter/Oregon,
one instance. No plan, region, pool, worker or production setting was changed.

## Changes ranked by impact

1. **Mon espace inactive code:** `app/components/shida/account-space.tsx` eagerly
   imported thirteen operational panels, including listings, job search,
   transactions, recovery/security/review, notifications and assistance. These
   now use the existing React.lazy/Suspense pattern, with the existing localized
   loading copy and persistent navigation outside the boundary. Only the selected
   panel renders. No aggressive prefetch, new dependency or API was added.
2. **Capability discovery:** Backend reuses actor/context/commercial reads within
   a single summary response. Exact decision equality was tested for six roles;
   SELECTs fell from 122–558 to 14–212. No persistent authorization cache or
   mutation-permission shortcut was introduced. See Backend's phase-two report.
3. **Restaurant actionable content/retry:** `restaurant-today.tsx` still sends
   one protected read at a time, but reads pending/ready/eligible reservations
   before secondary totals/configuration. Failed-section retries can take the next
   queue slot without waiting for the entire refresh tail; repeated taps coalesce.
   Existing cancellation/context epochs, partial-error data retention, forbidden
   data clearing, currencies, ownership and admission protections are preserved.

`usePersonalActivityData` was also inspected: its base stores/services/restaurant
reads provide sidebar and creator context even on other views. Those reads remain;
blindly deferring them would change navigation/permissions. Additional overview
reads already depend on `fullOverview`. This batch therefore reduces startup code,
not all startup API data. Account sign-in/context/event handling is unchanged.

## Comparable browser measurements

`tests/browser/waiting-performance.browser.ts`, production builds before/after,
Chrome, 390×844, three samples per journey/profile. Both stages use the same
synthetic API fixtures. Normal injects 80 ms per API response. Mobile injects
600 ms/API plus CDP 150 ms network latency, 200,000 B/s down, 93,750 B/s up and
4× CPU slowdown. Request interception disables normal HTTP caching. “Repeat”
means reload in the same context, not a production warm-cache guarantee.

Before uses `63154cdd`; after includes only this batch's application changes.
Settings readiness explicitly waits for the enabled add-passkey control, not
just its container. Restaurant section-ready waits for the actionable section's
required reads; full-ready waits for the full refresh control. The matched
Restaurant fixture includes a money-summary failure in both stages, so full-ready
means the queue has settled, **not** successful financial data. Successful finance
and failure/retry behavior are checked separately by interaction tests.

| Profile / journey | Useful content ms before → after | Controls ready ms before → after | Requests before → after | Bytes before → after |
| --- | ---: | ---: | ---: | ---: |
| normal / space first | 557 → 489 | 568 → 503 | 102 → 84 | 693573 → 435321 |
| normal / space repeat | 486 → 437 | 496 → 451 | 102 → 84 | 693577 → 435321 |
| normal / space navigation | 309 → 260 | 584 → 684 | 99 → 94 | 666634 → 483180 |
| normal / space sign-in | 381 → 388 | 393 → 400 | 11 → 11 | 425 → 425 |
| normal / restaurant first | 1114 → 1147 | 1462 → 1533 | 53 → 54 | 543331 → 544186 |
| normal / restaurant repeat | 1075 → 1182 | 1290 → 1434 | 53 → 54 | 543331 → 544186 |
| normal / restaurant navigation | 69 → 99 | 937 → 977 | 5 → 5 | 9541 → 9541 |
| mobile / space first | 6095 → 4277 | 6149 → 4316 | 102 → 84 | 693581 → 435321 |
| mobile / space repeat | 5883 → 4188 | 5918 → 4225 | 102 → 84 | 693579 → 435324 |
| mobile / space navigation | 796 → 794 | 6174 → 5027 | 96 → 87 | 665191 → 455267 |
| mobile / space sign-in | 2147 → 2153 | 2186 → 2175 | 11 → 11 | 425 → 425 |
| mobile / restaurant first | 7929 → 7766 | 11380 → 11471 | 53 → 54 | 543331 → 544186 |
| mobile / restaurant repeat | 7460 → 7506 | 10771 → 11143 | 53 → 54 | 543331 → 544186 |
| mobile / restaurant navigation | 217 → 233 | 2733 → 2782 | 5 → 5 | 9541 → 9541 |

Mobile Mon espace first-load controls improve by 1.833 s (about 30%); transferred
bytes fall by 258,260 (about 37%). Settings first-navigation controls improve
6.174 → 5.027 s under throttling, but regress .584 → .684 s normally. The latter
is the measured extra split/loading cost; it is not hidden by an earlier shell.
The existing link navigation reloads route assets in this harness, so this is a
full destination journey, not an isolated import duration. Synthetic sign-in time
is essentially unchanged. No real OTP or message was sent.

Restaurant actionable-section readiness improves **8.945 → 8.218 s** on first
mobile visit and **8.356 → 7.667 s** on repeat. Full-refresh controls do not improve:
11.380 → 11.471 s first and 10.771 → 11.143 s repeat. Normal results also regress
slightly. One extra JS resource/about 855 bytes accompanies the changed build.
This is an action-priority/retry improvement, not a claim that all nine serial
reads became faster. Preserve that distinction when deciding the next batch.

Raw before/after samples and per-request timing/bytes are under
`docs/evidence/waiting-phase2-20261118/{before-final,after}`; `comparison.json`
contains medians. These are mocked-browser measurements, not live backend speed,
production bandwidth forecasts, Core Web Vitals, p95s or physical-device results.
Three samples cannot establish a small normal-network timing change conclusively.

## Restaurant dependency/locking decision

The route restores the bound Personal session, lists the actor's establishments,
selects the authorized establishment, then mounts Today. Today requests pending,
preparing, ready and intake plus capability-dependent reservations, calendar,
on-site service groups, daily money summary and low stock (up to nine reads).
The existing backend ownership reads share establishment locks and admission
limits. Useful content can render per response; complete refresh still awaits
the serial tail. No lock scope or database pool change was justified by isolated
PostgreSQL evidence here. A new endpoint would also require reviewed aggregation,
partial-failure and permission semantics. This batch chooses the smaller safe
priority queue and keeps one in-flight request. New sale, metric navigation and
valid sections stay usable while unrelated reads continue.

## Memory and regional evidence

Backend's new isolated profiler observed roughly 284 MiB after full app imports,
311 MiB after bounded repeated requests/GC/one second idle, peak 333 MiB during
imports. It did not demonstrate sustained growth. Windows/SQLite, no image
workload/lifespan workers and a short idle interval limit that evidence; high RSS
alone is not a leak. Render's new 2 GiB allocation showed about 341–390 MiB in two
post-deployment samples, well below its current limit. No speculative memory fix
or worker/pool change was made. See Backend's raw memory evidence and limitations.

The same-origin Personal Restaurant gateway forwards through Website to Backend
(`app/api/shida/personal/restaurants/[[...path]]/route.ts` ).
Website/Oregon → Backend/Frankfurt crosses regions; Business/Frankfurt → Backend
is colocated. No production private requests were profiled.

Three alternating unauthenticated public country-dictionary GETs from this
Sweden workstation measured median TTFB **.173 s direct to api.nihiloba.com** and
**.596 s via nihiloba.com/api/shida/registration-reference/**. All returned 200
and 124 bytes. Gateway source is `app/api/shida/registration-reference/route.ts`.
The initial no-trailing-slash gateway probe returned 308 and was excluded from
the paired comparison; raw probe and corrected observations are in `regional.json`.
Each curl used a fresh connection. The ~.423 s gap includes TLS/routing/gateway
processing and upstream latency; it is not an isolated inter-region RTT and does
not explain multi-second client download/serial waiting by itself.

A future placement review should compare regional user distribution, data/API
traffic, availability and migration/rollback costs. No geography change was
performed or is justified solely by these six successful public reads.

## Validation and remaining limits

- Production `next build --webpack`, TypeScript and focused ESLint checks passed.
- 52 focused Vitest cases passed: session-flight/context invalidation, session
  browser behavior, route parsing, activity projections, Restaurant operations
  and Services/account navigation.
- 24 production-browser interaction cases passed: Restaurant queued retries,
  no premature success timestamp and later successful refresh in all four locales
  at 390/1440; all eight Mon espace destinations at 320/375/390/430/820/1440;
  direct links/reloads/back/forward in all four locales; keyboard/cancelled gestures;
  API failure and signed-out destination preservation. Mon espace's existing
  sidebar breakpoint remains 700px; this task does not redesign it.
- Four matched benchmark cases (two journeys × two network profiles, three
  repetitions each) passed after fixing test setup. Settings checks wait for a
  real enabled control. Restaurant fixtures use the local allowlist port 3044.
- Early interaction runs exposed missing synthetic daily-money/Meda/admin-review
  responses and an outdated assumed sidebar breakpoint. Fixtures were corrected
  without changing application permissions or suppressing unexpected requests;
  the complete final 24-case run passed. The earlier incomplete run is retained
  in `C:/NIHILOBA/waiting2-regression.log`, final in `waiting2-regression-final.log`.
- Backend's 65 selected cases passed across its run and corrected memory-harness
  rerun; exact decisions, revoked grants/memberships, activation and concurrent
  separate-session scopes are covered. No PostgreSQL contention claim.
- `git diff --check` passed. No CSS, translations, routes, financial calculations,
  permissions or action payload contracts changed.

No full backend suite, production test account, real OTP, WhatsApp message,
notification or destructive production operation was run. Physical phones,
Safari, real mobile networks and PostgreSQL contention remain unverified.
No new Docker image/environment was installed; another task's PostgreSQL was
left alone. Shared dependencies, unfinished source and Ecole work are preserved.

## Release plan and artifacts

New code is local-only. If later approved, release Backend first and inspect
bounded discovery/memory telemetry, then Website and check representative
journeys. Both remain compatible with deployed counterparts; Business needs no
source release. No migration (Backend head remains `0253_restaurant_order_numbers`),
new configuration, dependency, worker, cron, Terms change or messaging template.

Retain production `.next` for reproducing the measured build and canonical JSON
samples for review. Test previews are Playwright-owned and stop on completion;
Backend runner databases/source copies are disposable and cleaned by the runner.
Focused run logs remain under `C:/NIHILOBA/waiting2-*.log`, and Backend reports
are pinned as detailed in its report. Do not remove shared node_modules or these
active checkouts. No unrelated worktree or cache cleanup was attempted.

Remaining bottlenecks: Restaurant's full protected serial tail, unchanged account
context reads, residual domain discovery queries, production pool/lock waits,
representative Linux memory attribution and inter-region placement evaluation.
