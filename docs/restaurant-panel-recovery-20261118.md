# Restaurant deferred-panel recovery — 18 November 2026

## Result and release status

Implemented locally; **not pushed or deployed**. A failed Restaurant panel asset
now leaves the management shell and other panels usable. An explicit retry makes
a fresh module-loading attempt. Persistent failures offer a deliberate document
reload through the existing unsaved-work guard. Business and Backend are unchanged;
there is no dependency, environment, API, database or migration change.

The starting Website revision was `e7d0f9c1dec8d75ba55ffadadabda0f4514686b6`;
Backend was `cc1ca287105bac22d648889e9b3abc950cfe34a8`. Both worktrees were clean.
This report compares against that startup implementation, not the earlier eager
panel implementation. Local implementation commit:
`b935887fcd158359fc2ca9cff7acafd575de8067`. This report and its evidence are a
subsequent local documentation commit; obtain that exact hash with
`git log -1 --format=%H -- docs/restaurant-panel-recovery-20261118.md`.

## Reproduction and cause

On the unmodified Webpack production build, the test first loaded Aujourd’hui,
then aborted the **actual Orders JavaScript chunk** found in the build by its
unique `rst-orders-screen` marker. No API error was substituted. At both 390×900
and 1440×900, React's rejected lazy import escaped Suspense and reached the
framework page error: “This page couldn’t load”, with Reload and Back. The
Restaurant header, establishment identity and workspace navigation disappeared.
The browser reported `ChunkLoadError`. Restoring the download alone did not
recover the page; a document reload did.

Suspense handles pending imports, not rejected ones. In addition, React.lazy
caches the rejected promise: resetting only an error boundary would be insufficient.
The framework fallback therefore did not satisfy workspace-preserving recovery.

Matched synthetic fixtures, selected establishment and Orders destination:

| Viewport | Before | After |
| --- | --- | --- |
| 390×900 | [Framework page error](evidence/restaurant-panel-recovery-20261118/before/download-failed-390.png) | [Scoped recovery](evidence/restaurant-panel-recovery-20261118/after/download-failed-390.png) |
| 1440×900 | [Framework page error](evidence/restaurant-panel-recovery-20261118/before/download-failed-1440.png) | [Scoped recovery](evidence/restaurant-panel-recovery-20261118/after/download-failed-1440.png) |

Those pairs use Webpack for both builds. The final default-bundler screenshots are
also retained: [Turbopack mobile](evidence/restaurant-panel-recovery-20261118/turbopack/download-failed-390.png)
and [desktop](evidence/restaurant-panel-recovery-20261118/turbopack/download-failed-1440.png).
They were visually reviewed. Before observations and console errors are saved in
the corresponding JSON files.

## Implementation

- One shared loader factory owns a stable lazy component and promise per attempt.
  Normal rerenders and successful imports retain identity. Only an explicitly
  retried, recognized asset failure creates a fresh lazy type/promise. Concurrent
  consumers share that attempt; other successful modules are untouched.
- Each of the 24 existing workspace deferred panels, signed-out seller entry and
  protected receipt has its own error boundary and loading state. The workspace
  itself is never remounted for retry. No panel is prefetched speculatively.
- The boundary handles recognized Webpack/Turbopack asset-download failures only.
  Module evaluation and render defects still reach framework error handling.
  A browser test injects a render exception into a successfully downloaded Orders
  function and verifies that it is not disguised as a network recovery prompt.
- The notice uses existing SHIDA buttons/colors, a focusable alert, readable
  wrapping text and 44px minimum button height. FR/EN/LN/SW copy avoids technical
  filenames and does not diagnose an unknown failure as “offline”. The workspace
  return action uses existing guarded navigation to Aujourd’hui.
- After a manual retry also fails, an explicit Reload action explains potential
  unsaved changes. It calls `leaveWork()` without a preserved scope, so hidden
  counter drafts are included. Cancelling keeps the draft and failure notice.
  An unmounted notice cannot reload after a late confirmation resolution.
- Counter mounting, editor state, session/establishment keys, permissions and
  existing action handlers are preserved. Loading completion has no navigation
  callback, so it cannot reopen an abandoned panel or a previous account's UI.

**Retry bound:** the application adds no automatic retry or reload. Next 16.4.6
Turbopack itself already retries an unsuccessful chunk once after 200–600ms;
Webpack makes one request. Tests assert exactly two/one requests per failed
attempt, respectively, rather than claiming zero framework-level retries. A
manual retry after recovery performs one new successful request. These bounds
should be revisited when upgrading the framework runtime.

## Focused validation

Final results: **35 unit/gateway tests, 21 new recovery browser cases, 33 existing
deferred-panel browser cases, and 21 existing Today API-recovery browser cases**.
The final browser suites use the Turbopack production build and Chrome. TypeScript,
focused ESLint and production builds passed. Final XML/log files are under
[evidence](evidence/restaurant-panel-recovery-20261118/).

The new 21 cases cover Orders, Menu and Finance on 390/1440px; all four locales;
keyboard alert/retry focus; repeated failed requests and successful fresh retry;
retained loaded modules; return to Today and another working panel; explicit reload
for repeated asset 404s; cancelled reload with a hidden counter quantity draft;
shared hours-editor draft survival; late completion after navigation, establishment
switch and logout; and 320px with 200% root text size, 44px controls and bottom-bar
clearance. The existing 33 cases cover direct destinations, deferred signed-out
entry, protected receipts and counter leave confirmation. Today recovery covers
typed unsupported compatibility, protected errors, limits, cooldowns, stale data,
queued retries and context boundaries without expensive error fallback fanout.

### Executed validation commands and outcomes

Unless stated otherwise, working directory is
`C:\NIHILOBA\release-mobile-batches-20261117`. `node` uses the existing compatible
runtime and shared dependencies. Browser runs use task-specific OS temporary output
directories, one worker, synthetic fixtures and localhost only. The same commands
were repeated after the listed fixes; no failing case was skipped or marked xfail.

| Command / relevant environment | Execution and result |
| --- | --- |
| `node node_modules/@playwright/test/cli.js test --config=playwright.panel-recovery.config.ts`, `PANEL_RECOVERY_BASELINE=1`, `PERF_OUTPUT=docs/evidence/restaurant-panel-recovery-20261118/before`, `ROLLOUT_BASE_URL=http://127.0.0.1:3044` | Initial expected generic error wording did not match the actual framework page. Corrected to the observed heading; **2/2** baseline reproductions passed. |
| Same config, baseline variable unset, `PERF_OUTPUT=.../after` | Webpack recovery runs: initial 19 cases passed; expanded run 20/21 passed. Editor check incorrectly required a mobile bar intentionally hidden during editing; direct desktop navigation correction passed its focused rerun. All 21 distinct Webpack cases passed across these runs. Both run records retained. |
| Same config against Turbopack, `PERF_OUTPUT=.../turbopack`, `--reporter=list,junit` | Probe exposed the runtime's existing bounded extra request; asserted its exact bound. Expanded run 20/21 passed; compiled-render injection expected a named function but Turbopack emitted an anonymous export. Corrected fixture signature; **final 21/21 passed** in `recovery-turbopack-final.xml`. |
| `node node_modules/@playwright/test/cli.js test --config=playwright.restaurant-lazy-panels.config.ts --output <owned-temp> --reporter=list,junit` | Initial **32/33**. Settings also failed all three diagnostic repetitions with `--grep 'settings 1440' --repeat-each 3`. The shared fixture lacked `/guest-auto-accept`; its default 404 correctly caused an access denial after the component mounted. Added the real response shape and assert settled radio state. **Final 33/33 passed**, no permission behavior changed. |
| `node node_modules/@playwright/test/cli.js test --config=playwright.today-recovery.config.ts --reporter=list,junit`, `TODAY_RECOVERY_OUTPUT=<owned-temp>` | **Final 21/21 passed**; no full configuration on Today or unauthorized fallback fanout. |
| `node node_modules/vitest/vitest.mjs run tests/restaurant-panel-loader.test.ts tests/restaurant-today-contract.test.ts tests/restaurant-today-gateway.test.ts tests/restaurant-today-recovery.test.tsx` | **35/35 passed**, four files. Loader tests cover deduplication, stable identities, explicit retry and rejection classification. |
| `node node_modules/eslint/bin/eslint.js` with the two seller files, new loader/copy/component, three affected browser files, loader unit test and new Playwright config | Passed. Initial unused `Page` import warning was removed during fixture extraction; final log has no warnings/errors. |
| `node node_modules/typescript/bin/tsc --noEmit` | Initial generic wrapper typing corrected to retain inferred component props; final check passed. |
| `node node_modules/next/dist/bin/next build --webpack` with isolated fixture configuration | Production build passed; used for matched before/after measurements. |
| `node node_modules/next/dist/bin/next build` | Initially failed because this Windows checkout's reused `node_modules` junction is outside Turbopack's inferred root. Temporary local `turbopack.root='C:/'` allowed the same installed dependencies to resolve; build passed. Original config restored byte-for-byte in `finally`; no committed configuration/dependency change. Both logs retained. |
| `node node_modules/@playwright/test/cli.js test --config=playwright.restaurant-startup.config.ts`, `PERF_OUTPUT=.../before` then `.../after`, `PERF_TEST_OUTPUT=<owned-temp>` | Both routed normal/mobile profiles passed before and after, three samples per visit/profile. |
| `node node_modules/@playwright/test/cli.js test --config=playwright.startup-integration.config.ts --output <owned-temp>`, `SHIDA_STARTUP_FIXTURE_WORKSPACE=<owned-snapshot>`, `PERF_OUTPUT=.../before` then `.../after` | Real gateway → isolated Backend → PostgreSQL checks passed before and after, three cold/cached/Orders samples per build. No API routing or production access. |
| `git diff --check` and staged diff inspection | Staging exposed one extra blank line at the end of the browser file and trailing whitespace in generated logs. Removed only that whitespace and reran successfully. Source, evidence and paths reviewed for scope and secrets. |

The isolated HTTP fixture used the **unchanged** Backend command
`C:\NIHILOBA\Backend\venv\Scripts\python.exe scripts\restaurant_startup_fixture_server.py`
from a task-owned source snapshot, with explicit test settings, loopback TLS on
8045 and disposable PostgreSQL on 55481. Existing installed PostgreSQL 18 image
and `compose.local.yaml` test profile were reused (`--env-file NUL --profile test
-p shida-panel-recovery-20261118`, `up -d --pull never test-db`). The disposable
schema was initialized to the existing head; no migration was authored. The
sandbox-temp snapshot was inaccessible to the external fixture process; the
OS-temp snapshot was used for the successful measurements. Backend unit/full
suites were not run because no Backend behavior changed.

There was no broad application test run, CI run, production load test, physical
device test, Safari/WebKit test or production authenticated test. Focused local
results do not replace mandatory CI for a later approved release.

## Performance: matched current-startup baseline

Three samples per build/visit; serial local runs; Chrome production Webpack builds;
390×844 CSS pixels. Real-path tests use real synthetic session authorization,
the unchanged Backend and isolated PostgreSQL, no API interception, 150ms network
latency, 200,000 B/s down, 93,750 B/s up and 4× CPU slowdown. Cached repeats verify
actual browser cache hits. These are local measurements, not production percentiles.

| Real-path metric | Before median (range), ms | After median (range), ms |
| --- | ---: | ---: |
| Cold first useful content | 4891 (4828–5383) | 4978 (4874–5067) |
| Cold refresh settled | 5719 (5638–5775) | 5880 (5774–5971) |
| HTTP-cached useful content | 2451 (2400–2538) | 2392 (2388–2556) |
| HTTP-cached refresh settled | 2778 (2719–2925) | 2765 (2757–2821) |
| First Orders opening settled | 2485 (1941–2517) | 2448 (2391–2471) |

Cold settlement increased 161ms / 2.8%, with 3.6KB extra total transferred data
and one small stylesheet. Useful-content ranges overlap; cached and Orders
differences do not establish improvements. No material unexplained regression was
observed in this small sample. The prior startup gains remain, including the
existing first-Orders lazy-loading tradeoff.

| Initial resource metric | Before | After |
| --- | ---: | ---: |
| Resource request events (including cached events on repeat) | 43 | 44 |
| JavaScript requests | 18 | 18 |
| JavaScript wire bytes | 331882 | 333580 |
| CSS requests | 15 | 16 |
| CSS wire bytes | 75673 | 77496 |
| Cached repeat JS/CSS wire bytes | 0 / 0 | 0 / 0 |
| Today API reads / summary reads / full configuration reads | 8 / 1 / 0 | 8 / 1 / 0 |

JavaScript grows 1698 bytes (~0.5%); no inactive panel moves into initial loading.
The additional stylesheet is 430 encoded response-body bytes (1823 wire bytes
including headers). All measured normal-path API reads succeed. Private API
responses remain uncached; cached resource events are not mislabeled network bytes.

The separate routed harness uses 80ms normal / 600ms mobile API delays with the
same mobile throttling. Routing disables HTTP cache; its second visit is **not**
called a cached repeat. Medians before → after:

| Routed profile/visit | Useful content, ms | Settled, ms |
| --- | ---: | ---: |
| Normal cold | 1168 → 1155 | 1178 → 1176 |
| Normal routed reload | 1033 → 1032 | 1045 → 1043 |
| Mobile cold | 6673 → 6535 | 8632 → 8462 |
| Mobile routed reload | 6343 → 6410 | 8288 → 8308 |
| Normal first Orders | — | 951 → 1002 |
| Mobile first Orders | — | 3566 → 3545 |

First Orders remains 13 requests with 40545 deferred JavaScript and 5022 CSS body
bytes in both builds. [Raw samples and aggregate ranges](evidence/restaurant-panel-recovery-20261118/performance-summary.json)
retain each measurement. Populated real-path [before](evidence/restaurant-panel-recovery-20261118/before/real-startup-mobile.png)
and [after](evidence/restaurant-panel-recovery-20261118/after/real-startup-mobile.png)
show the same content/state; the actual successful refresh clock differs.

## Dependency and deployment handoff

Read-only remote/Render checks during this task found that the earlier summary
and startup commits **have already been released**. The older reports' “not
deployed” statements describe their creation time; they are not current status.

| Repository | Required prerequisite commits | Verified live artifact / remote main |
| --- | --- | --- |
| Backend | `ec105e07f9482537d57094077e82438de7d995b8`, `50a3993380999adf4abd0fdeb97ca838aaf2ed36`, documentation `cc1ca287105bac22d648889e9b3abc950cfe34a8` | `dep-dbv1isutlv9c73fh10q0`, service `srv-d811j4ugvqtc73e0fks0`, commit `cc1ca287105bac22d648889e9b3abc950cfe34a8`, live 2026-11-18 21:35:26 UTC |
| Website | `2bd7072b2350863219a3bfaa5914e6f25e6ef814`, `0d2a4f83f5b8a0e1a357dabb3d3cb421f67751c1`, documentation `e7d0f9c1dec8d75ba55ffadadabda0f4514686b6` | `dep-dbv1kklg1s2s73dth62g`, service `srv-d9s8g1c9v7es73effevg`, commit `e7d0f9c1dec8d75ba55ffadadabda0f4514686b6`, live 2026-11-18 21:38:47 UTC |

Render workspace: **Shida**, `tea-d810dkvaqgkc73ahjdu0`. These commit SHAs also
matched `git ls-remote origin refs/heads/main`; no publication or deployment was
triggered. Recheck immediately before any authorized release, since live state
can advance independently. Only this report's new Website implementation and
evidence/documentation commits are unreleased (implementation `b935887f` and the
commit containing this report); no missing local Backend dependency
was found. Do not deploy this batch from a checkout omitting the listed parents.

Release sequence after explicit approval identifying the environment/services and
reviewed SHAs:

1. Verify Backend is still at `cc1ca287` or an approved descendant containing both
   summary/startup changes. If targeting an older environment, release that additive
   Backend prerequisite **first**, verify its exact artifact and focused health.
   Current production needs no redundant Backend deployment for this batch.
2. Publish only the reviewed Website history, run required CI, then deploy the
   approved Website SHA. Verify remote SHA, CI and Render deployed SHA separately.
   No Business release, new resource, secret or database operation is required.
3. Using an authorized existing test account, check Today populated/empty/partial
   states, one summary/no full configuration, Orders/Menu/Finance first opening,
   navigation and FR/EN/LN/SW. In an isolated browser, abort that session's actual
   panel request, restore it and retry; do not disrupt shared CDN assets.
4. Check counter/editor draft preservation, protected receipt, logout/context
   switching, deliberate reload/cancel and stale-document behavior. Inspect scoped
   console errors and request counts. Exercise bounded API errors only with an
   approved isolated test mechanism, never by damaging production dependencies.

**Rollback:** the actual current Website artifact
`dep-dbv1kklg1s2s73dth62g` at `e7d0f9c1` is the preferred pre-recovery rollback.
It preserves startup improvements and bounded API recovery, but restores the
known whole-page failed-import behavior. Keep Backend at the compatible current
artifact; no schema reversal is needed. An approved rollback must verify its
deployed SHA and repeat the focused authenticated checks. The older deactivated
Website `dep-dbuvetom7kps73e9tks0` / `46c7fa39dc1183796735cc8a3b7322eef0fdaba8`
and Backend `dep-dbuvc5mi0phs73ev46eg` / `dde9b8469ce127df632ca89709021988a0b8b583`
are historical artifacts, not the preferred target: they predate the startup and
bounded-recovery work. Do not roll back by rewriting Git or reversing production data.

## Exact changed files

Application:

- `app/lib/restaurant-panel-loader.ts`
- `app/lib/restaurant-panel-recovery-copy.ts`
- `app/components/shida/restaurant-deferred-panel.tsx`
- `app/components/shida/restaurant-panel-recovery.css`
- `app/components/shida/restaurant-seller-workspace.tsx`
- `app/components/shida/restaurant-seller.tsx`

Validation:

- `tests/restaurant-panel-loader.test.ts`
- `tests/browser/restaurant-panel-fixtures.ts`
- `tests/browser/restaurant-panel-recovery.browser.ts`
- `tests/browser/restaurant-lazy-panels.browser.ts`
- `playwright.panel-recovery.config.ts`
- This report and `docs/evidence/restaurant-panel-recovery-20261118/` (the local
  evidence commit's `git show --name-only` is the exact artifact manifest).

## Limits, cleanup and follow-up work

- Chrome desktop/mobile emulation is verified; physical devices, Safari/WebKit,
  real mobile radio outages and a real rolling CDN deployment are not verified.
  The stale-asset case is an actual chunk 404 followed by an explicit reload with
  restored assets, not a claim to have tested production asset retention.
- All 26 imports use the same mechanism; exhaustive fault injection of every
  panel was not needed. Representative module/render/draft tests and affected
  direct-route regressions are recorded above. No Organization Business UI change
  or Business browser coverage is claimed.
- Default Turbopack passed with a local root adjustment needed by the existing
  shared dependency junction. The deployed checkout should not inherit that broad
  root setting. No replacement tooling or dependency installation was performed.
- Task-owned fixture process and PostgreSQL container/network were stopped/removed.
  Fresh process/link checks preceded removal of 18 owned temporary folders,
  including the synthetic credentials/TLS snapshot: **48,581,915 bytes reclaimed**.
  Unique failure contexts were copied into the evidence `diagnostics/` folder;
  [cleanup.json](evidence/restaurant-panel-recovery-20261118/cleanup.json) records
  exact removed paths and sizes. No matching task container/network remains.
  Shared PostgreSQL/dependencies,
  all worktrees, unfinished work, retained evidence and the validated `.next`
  production build are preserved. No manual deletion is required for this batch.
- Startup context consolidation, reconciliation above 100 outstanding orders,
  public-job optimization, Business changes and infrastructure/region changes
  remain separate follow-ups. None is needed to release this bounded recovery fix.

Readiness: ready for review and a separately approved Website release after required
CI and current-artifact verification. This task authorizes local commits only.
