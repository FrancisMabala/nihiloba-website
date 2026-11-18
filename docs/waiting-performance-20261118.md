# Waiting-time investigation and bounded fixes — 18 November 2026

## Scope and release boundary

The preceding country-neutral onboarding release is pushed and verified live;
see [its release record](onboarding-country-neutral-release-20261118.md).
**The performance changes described here are local only.** No performance
deployment, infrastructure change, pool increase, index or migration was made.

## Confirmed findings, ranked by impact

1. **Production backend memory pressure and a restart.** Render recorded an
   out-of-memory failure at 14:15:15 UTC, limit 512 MiB. In the separate
   17:00–17:30 window, memory was 527.5–529.8 MB against 536.9 MB, about 98–99%.
   CPU was only 0.028–0.034 CPU. This establishes insufficient memory headroom,
   not the allocation source or a correlation with a particular user's wait.
   The same window had zero reported 502/503s. Provider five-minute p95 HTTP
   latency samples ranged 0.461–2.034 seconds; these are Render aggregates,
   **not percentiles inferred from our three browser samples**.
2. **Restaurant Today has a serial request chain.** Authentication, workspace
   scope selection and then up to nine dashboard reads put multiple round trips
   on the critical path. `restaurant-today.tsx` deliberately serializes reads
   because they share backend ownership locks and four admission slots. The
   first useful metric appears before every refresh control becomes available.
   This batch preserves that protection: simply using `Promise.all` would risk
   recreating pool/lock contention. A measured backend read-model/locking change
   would be a separate, focused follow-up.
3. **Services loads inactive finance code and hidden reviews.** The initial work
   page imported counter, finance, totals, reports, branding and templates. It
   also fetched reviews whenever a service was selected, although the only
   reviews consumer is catalogue editor step four. This adds network and parse
   work before the user's requested work screen is ready.
4. **Overlapping session restoration is duplicated.** Header/navigation/page
   consumers each called `restorePersonalSession`. Before: two reads on public
   discovery and three on Mon espace/Meda. Each is private/no-store and traverses
   the gateway and backend. They run largely concurrently, so eliminating them
   reduces server work more reliably than it reduces one user's elapsed time.
5. **Business capability discovery repeats entitlement reads.** A production
   connection was held 7.035 seconds by this route during pool pressure. The
   code rereads the same grants for each registered capability. The local fix
   shares a snapshot only within that one discovery response, removing 85
   SELECTs. It does not prove that this explains the entire production wait.
6. **Other observed costs are not yet proven fix targets.** Website runs in Oregon;
   backend and Business in Frankfurt. That potentially adds a network hop, but
   the local probes do not isolate inter-region latency. Public fixture detail
   uses a roughly 2 MB illustrative PNG; it is a test asset, not evidence that
   actual customer photos all have that cost. Mon espace still eagerly loads
   several operational modules. No aggressive prefetching was added.

## Implemented changes

- `app/lib/personal-session-browser.ts`: share **only an overlapping in-flight
  read in the current browser realm**. No completed-result cache, persistence,
  cross-tab response sharing, TTL or authorization bypass. Login/session/storage
  events invalidate the flight; old responses cannot be delivered after an
  identity change. One subscriber cancelling does not cancel another; the final
  cancellation aborts transport. Failures are not cached. Browser binding,
  no-store transport, deletion redirect, test-data classification, Web Lock and
  unconfirmed-login guards remain enforced.
- `app/components/shida/services-management.tsx`: defer seven inactive
  finance/counter/template modules until rendered. Existing navigation remains
  mounted and a localized status announces loading. Work and Calendar remain
  eager so the primary work-to-calendar journey gains no extra module waterfall.
  Existing capability gates and draft/confirmation behavior remain in place.
- Reviews load only in the visible catalogue preview. Leaving it, switching
  service/account, or changing locale aborts/invalidates the read. Error and empty
  states remain distinct. No polling, endpoint or automatic retry was added.

- Backend `app/services/capability_availability_service.py`: read effective
  commercial capabilities once within `summary`, rather than once per item.
  The snapshot is a local variable, never a service/session/global cache.
  Actor, membership, activation and domain authorization still run for every
  item; the next summary and all public `evaluate` calls read fresh grants.
  Dashboard Personal and Business discovery retain the same response contract.

Business uses a separate frontend/session implementation and needs no source
change. Its capability consumers were checked with two component tests and the
existing browser activation/revocation navigation case. Financial, booking,
stock, quote, order and messaging mutations were not modified.

## Measurement method

Retained raw samples: [before](evidence/waiting-performance-20261118/before/) and
[after](evidence/waiting-performance-20261118/after/). Harness:
`playwright.waiting.config.ts` and `tests/browser/waiting-performance.browser.ts`.
Production Next.js builds, Chrome headless, 390×844 CSS pixels, one worker,
three samples per journey/profile. The baseline build ID is
`J-DoXMosi1wkabYK0nVqY`; it contains the onboarding implementation before this batch
(publication-only metadata subsequently merged into `e819c008`). Both builds use
the same guarded synthetic SSR fixtures and browser API responses. The after
build is `N9PdpT9SFuRAhwbw2Z1lf`.

- **Normal:** unthrottled local transport/CPU, 80 ms artificial API response delay.
- **Mobile:** Chrome CDP 150 ms network latency, 200,000 bytes/sec download,
  93,750 bytes/sec upload, 4× CPU slowdown, 600 ms artificial API response delay.
- Every sample starts a fresh browser context. “Repeat” reloads in that context;
  the backend is already running. Browser interception disables HTTP caching,
  so this is a repeat-runtime/refetch comparison, **not a warm HTTP-cache test**.
- “Useful” means the first actual destination content: public listing, account
  activity heading, Restaurant metric, populated Services rows, or Meda listing.
  Navigation useful time is also tap-to-first-destination feedback. “Usable” waits
  for visible controls; Restaurant refresh and Services work/calendar refresh
  must finish loading. Navigation completion thus includes the relevant read.
  These are Playwright click timings, not physical-device touch measurements.
- Mon espace includes an actual selector click to settings and a separate mocked
  WhatsApp-code submission back to the activity view. Messaging, numbers, users
  and verification are synthetic. No production OTP or account was created.
- Request records contain path, start/end, HTTP status and completed response-body
  bytes, sampled through control readiness plus a short fixed settling interval.
  Headers and unfinished transfers are excluded. A slow, still-loading fixture
  PNG can be excluded from mobile bytes; compare like-profile rows only.
  Resource byte differences are not a complete metered mobile-bill estimate.
- Recorded API elapsed times include the deliberate fixture delay/browser work;
  they do **not** measure actual backend execution or database waiting. No real
  service cold start was induced. Initial local rendering and warm repeats are
  distinct from backend cold-start evidence, which remains unverified.
- Three samples show direction and variability, not production p95 or a general
  speed guarantee. Shared host scheduling and browser prefetching introduce noise;
  small timing changes are not treated as proven improvements.

## Comparable results

[All 32 before/after rows](evidence/waiting-performance-20261118/comparison.md)
include first, repeat and in-app navigation for all five journeys, plus sign-in.
[Machine-readable comparison](evidence/waiting-performance-20261118/comparison.json)
retains sample minima/maxima and API elapsed/error observations.

Selected throttled-mobile medians (three samples; milliseconds):

| Journey | Useful before → after | Controls ready before → after | Cause/change | Requests; completed bytes before → after | Limit |
|---|---:|---:|---|---|---|
| Services work, first | 7,117 → 6,791 | 7,161 → 6,844 | Inactive modules/reviews deferred | 59 → 55; 535,176 → 480,643 | ~55 KB less; local fixture |
| Services work, repeat | 6,114 → 5,809 | 6,193 → 5,856 | Same change | 58 → 54; 535,176 → 480,643 | No warm HTTP cache |
| Services → Calendar | 267 → 257 | 1,144 → 1,191 | Calendar remains eager | 2 → 2; 9,390 unchanged | Slight completion regression/no extra call |
| Mock sign-in → account | 2,187 → 2,120 | 2,221 → 2,148 | Session reads 4 → 1 | 15 → 11; 750 → 425 | Parallel reads; small timing difference |
| Mon espace, first | 6,098 → 6,069 | 6,140 → 6,111 | Session reads 3 → 1 | 104 → 102; 693,280 → 693,576 | Main bundle still large |
| Restaurant Today, first | 8,053 → 7,827 | 11,693 → 11,282 | Serial chain retained for pool safety | 53 unchanged; 542,771 → 543,331 | No direct speed fix; variability |
| Public → detail | 1,735 → 1,738 | 1,796 → 1,825 | No detail rewrite | 51 unchanged; 88,727 → 88,700 | Fixture image may finish later |
| Meda → detail | 1,126 → 1,126 | 1,149 → 1,145 | No detail rewrite | 9 unchanged; 36,945 → 36,926 | No measurable speed gain |

Normal-connection Services controls: first 1,408 → 718 ms, repeat 701 → 597 ms,
Calendar 193 → 196 ms. The first baseline was noisy, so this is not advertised
as a general 50% gain. Normal mocked sign-in was 416 → 461 ms despite fewer
requests. Deduplication reduces repeated backend work; it does not guarantee
lower elapsed time for already-parallel reads. No longer timeout, optimistic
success, additional polling or aggressive prefetch was introduced.

## Backend and production checks

Read-only diagnostics are retained in
[metrics](evidence/waiting-performance-20261118/perfBackendMetrics.json) and
[restart evidence](evidence/waiting-performance-20261118/perfBackendEvents.json).
Separate literal application-log filters over 17:00–17:30 found one pool-pressure
event (6 checked out, size 5, overflow 1), one connection held for 7.035 seconds
by `get_dashboard_business_capabilities`, and queries lasting 1.145 seconds
(`list_profiles`) and 1.253 seconds (`notifications`). See
[threshold evidence](evidence/waiting-performance-20261118/database-threshold-events.json).
An initial pipe-separated filter missed these entries; it was corrected. These
logs establish pressure, not exhaustion, a leak, the exact slow SQL, or the
amount of connection acquisition waiting. Route names are not unique across all
routers, so the two query events cannot be assigned to a specific route by name
alone. No SQL parameters, user data or credentials were collected.
Production database access was neither requested nor used.

Three sequential anonymous GETs per target, after deployment, all returned 200:

| Target | TTFB range | Total range | Body bytes |
|---|---:|---:|---:|
| Backend `/health` | 134–222 ms | 134–224 ms | 29 |
| Public Restaurant discovery, page size 5 | 191–447 ms | 192–447 ms | 219 |
| Website FR Restaurant marketplace HTML | 302–382 ms | 659–974 ms | 41,398 |
| Business home HTML | 148–238 ms | 148–238 ms | 8,485 |

These are bounded client-to-host observations of a running service. The small
discovery response does not represent a populated production catalog. No load
test or per-listing production scrape was performed.

The existing isolated backend tests were rerun, not rewritten:
`test_restaurant_detail_performance.py` and `test_restaurant_photo_delivery_pool.py`.
**18 passed**, using the established fresh SQLite runner with durability flushes
disabled only for its disposable database. The previously shipped compact menu
projection still uses 48/60 SELECTs (Personal/organization) versus 804/816 for the
full projection in the synthetic 60-extra-dish case. Query count stays constant
as the menu grows; response/visibility/stock equivalence is checked. Concurrent
reads, projection errors and photo HTTP success/failure return checked-out
connections to zero; photo delivery releases the connection before external I/O.
These reductions predate this batch and are **not new performance gains**.
Production threshold events provide individual query durations, but not full SQL
execution traces or connection-pool acquisition wait;
pytest test durations include fixture setup and are not SQL timings.

Docker is available, but its running PostgreSQL 16 container belongs to another
test task. It was not reused or stopped without ownership verification. No new
database environment was installed. SQLite is not PostgreSQL contention evidence.
No index or pool-size change is justified by the current query evidence.

## Focused validation

- Website: 67 unit tests across login, browser-session and new concurrent-flight
  cases; 27 production-browser interaction cases (19 login plus 8 Services,
  FR/EN/LN/SW at 390/1440). All passed. The latter exercises real finance controls
  after lazy loading and ensures review failures are not successful empty states.
- Browser benchmark: ten cases before and ten after, three samples each; first,
  repeat and navigation observations retained. Initial selector/fixture failures
  were corrected: header identity uses its accessible button name, and finance
  requires its real report shape. No application guard was relaxed.
- Website production build and TypeScript check passed. Focused ESLint has zero
  errors and two pre-existing Services hook dependency warnings.
- Business: two capability component tests and one production-browser module
  activation/removal navigation test passed. This checks consumption of an
  unchanged API shape; it does not time a production authenticated Business page.
- Backend summary/entitlement results and role-by-role timings are recorded in
  Backend `docs/waiting-performance-20261118.md`; the existing Restaurant
  performance/pool subset passed 18 tests. No full backend suite was run.

## Release coordination

These performance commits remain local. No migration, index, dependency, new
configuration, Terms change or coordinated schema cutover is required. Backend
and Website changes are compatible with the currently deployed counterparts.
For a later authorized release, deploy Backend first, verify capability latency
and pool/memory telemetry, then Website and repeat browser checks. Business
requires no performance release. Prior onboarding release status is separate.

## Remaining work and infrastructure decision

Prioritize bounded backend memory profiling (startup/import footprint, resident
growth across repeated representative reads, retained objects, and a quiescent
comparison) before changing the hosting plan. Increasing memory could buy headroom
but adds recurring cost and can conceal a leak; it would not remove serial request
latency. No upgrade or price-specific plan is recommended by this batch. Compare
frontend/API regional placement separately, including migration risk and latency,
before moving services. Preserve the current pool/admission limits meanwhile.

Physical phones/Safari, real mobile networks, warm browser HTTP cache, production
sign-in/OTP, real backend cold starts and production SQL/pool traces are unverified.
No worldwide service or latency guarantee follows from these checks.

## Reproduce

Build with the existing `marketplace-style-fixture-fetch.mjs` preload,
`SERVICES_FIXTURE_MODE=1`, the guarded `https://services-<UUID>.fixture.invalid`
origin and `NEXT_PUBLIC_SHIDA_WEB_REGISTRATION_ENABLED=true`. Use `next build
--webpack`. Do not load production dotenv files.

Set `ROLLOUT_BASE_URL=http://127.0.0.1:3044`, `UX_TEST_URL` to that same origin,
and `PERF_OUTPUT` to a new evidence directory. Run the waiting Playwright config;
run `playwright.waiting-regression.config.ts` separately to avoid disturbing the
timed samples. Preview lifecycle is owned by Playwright. Preserve the measured
baseline rather than overwriting it with another code revision.

Backend diagnostic command: existing interpreter,
`scripts/run_platform_validation.py --single-process --fast-sqlite --keep-report
tests/test_restaurant_detail_performance.py tests/test_restaurant_photo_delivery_pool.py`.
The report is retained under backend `logs/platform-validation/d56174988c0046beaf261b3214e93488`.
The full backend suite was not run.
