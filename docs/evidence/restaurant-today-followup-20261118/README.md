# Restaurant Today local performance evidence

Baseline Website: `46c7fa39dc1183796735cc8a3b7322eef0fdaba8`, the reviewed/live
phase-two build. After: the local follow-up committed with this evidence. Both use
production Next builds, the same synthetic fixtures and Chrome; no live account
records or messaging. Screenshots use the same populated order, money values,
filters, frozen time and viewport (390×900 or 1440×900), taken after refresh settles.
No styling changes are part of this patch. Full-page captures show the fixed bottom
bar at its viewport position; the remaining content can scroll above it.

The performance fixture is deliberately different from the visual fixture: empty
orders with a money-section 404, identical before/after. The seven enabled Today
reads become five after batching three order reads into one. `usableMs` is queue
settlement / refresh re-enabled, **not** all-success data. Three first/repeat samples
per profile; navigation follows into orders. `comparison.json` reports medians.
Raw JSON includes path-only requests, status, body bytes and relative timings;
no cookies, authorization headers, real user data or SQL parameters.

Normal: API delay 80ms. Mobile: API delay 600ms, Chrome CDP network latency 150ms,
download 200000 B/s, upload 93750 B/s, CPU 4×. Viewport 390×844. These mock backend
latencies; they do not measure deployed PostgreSQL or isolate the real gateway hop.
No production percentile or physical-device claim.

## Reproduction and focused checks

Use the repository's existing dependencies; build with the isolated fixture
configuration already used by `playwright.waiting.config.ts`. Set `ROLLOUT_BASE_URL`
to `http://127.0.0.1:3044` for browser fixtures. Playwright owns/stops that local
preview; do not connect these synthetic interceptors to a deployed origin.

- `node node_modules/next/dist/bin/next build --webpack`: passed.
- `node node_modules/typescript/bin/tsc --noEmit`: passed.
- Focused ESLint on the changed component, gateway, contracts and tests: passed.
- `node node_modules/vitest/vitest.mjs run tests/restaurant-today-contract.test.ts tests/restaurant-today-gateway.test.ts tests/restaurant-projections.test.ts tests/restaurant-operations.test.tsx`: 28 passed.
- `node node_modules/@playwright/test/cli.js test --config=playwright.today-followup.config.ts`: 14 passed; the delayed-context case was then strengthened to use the in-page establishment chooser and passed its rerun.
- `node node_modules/@playwright/test/cli.js test --config=playwright.waiting2-regression.config.ts`: existing `waiting2-regression.browser.ts` and `waiting2-space.browser.ts`, 24 passed against the same build.
- `waiting-performance.browser.ts`, Restaurant-only: two profile cases before and two after passed. Set `PERF_OUTPUT` to the evidence before/after directory.

New interactions cover FR/EN/LN/SW at 390/1440, populated/empty states, independent
money failure/retry, CDF/USD, accurate successful-refresh timestamp, summary
404/409/503 fallback, individual ready retry, order navigation, and leaving a held
summary for another venue at 320/430. Existing regression checks cover serial
admission, queued retries, Mon espace destinations/settings/history/focus and
320/375/390/430/820/1440 widths. Chrome touch and Safari focus-loss simulation are
browser emulation, not physical Safari verification.

The first run of new browser checks exposed a test readiness race: an initially
enabled refresh button could be observed before the mounting effect issued its
first request. The test now waits for the request before asserting settled state;
application behavior was not changed to satisfy it. No full backend suite ran.

See [the release and follow-up report](../../waiting-phase2-release-and-restaurant-followup-20261118.md)
for results, regressions, production verification limits and future release order.
