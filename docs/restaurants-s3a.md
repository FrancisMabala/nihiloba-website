# Restaurant S3-A — cross-surface verification and bounded readiness fixes

Local verification, 2026-09-10. No deployment or public-release acceptance.

## Baseline and product boundaries

Read website AGENTS, installed Next.js client/lazy-loading/custom-server guidance,
`restaurants-s2d.md`, Backend AGENTS, shared Business contract/index, S2-C and its
profile/menu/time contracts, and canonical `restaurants_malewa.md` v1.4.1.
The v1.4.1 deliverable is accessible in the Backend canonical document. Preserve
the newer S2-D implementation evidence despite older handoff text naming S2-D as
the next batch. Compatible Backend HEAD: `0ea539e6fceacbd2db97fe9a794c374592085553`.
Tests used its current working tree, which also contains unrelated Services/model
edits. Those edits were preserved, not authored or reverted by this website task.

S2-D already implemented Personal lifecycle/menu/hours/sharing using the protected
S2-C endpoints and shared Employment session. No Business membership or Pro gate
is added. Organization management stays in shida-business. Ordinary browser and
WhatsApp remain the interfaces; no app installation is required. No orders, order
inbox, analytics, payments, screen-awake control, offline store or queued writes
were added. C1 and OPEN-15 remain separate.

## Bounded fixes

- Temporary session fetch/network/5xx failure previously unmounted the workspace
  and discarded unsaved input. Keep the same mounted, session-bound editor in
  memory, pause its controls, and show EN/FR/LN/SW connection guidance. Revalidate
  on reconnect/focus. Confirmed 401/403, malformed identity or account changes
  still clear/rekey private content; every server action retains authorization.
- Coalesce concurrent session checks, abort obsolete checks, bound checks to 15s,
  and stop interval polling while offline, hidden or unauthenticated. A visible
  authenticated tab retains the existing 60-second check. Revocation is not
  claimed instantaneous while offline/hidden; Backend reauthorizes every action.
- Failed logout clears this tab and cannot silently restore its workspace on
  focus, including after a failed subsequent sign-in attempt. Only successful
  verification releases that local logout guard. A failed network request does
  not prove remote session revocation.
  A later full reload still relies on the server's actual cookie/session state.
- Use canonical trailing-slash URLs for seller requests and session restoration.
  Actual network measurement identified a 308 redirect doubling each logical
  session check. Keep query parameters, private/no-store and session binding.
- Load the QR library only when preparing a menu QR, not on every seller visit.
  Disable speculative prefetch on the seller's own language/browse navigation;
  existing destinations, layout and typography remain unchanged.
- Apply compatible dependency patches below. No forced major upgrade.

No Backend application files, contracts, migration, grant, schema or data backfill
changed. No production environment variable, cron, worker or template added.

Changed application files: `app/components/shida/restaurant-seller.tsx`,
`restaurant-seller-sharing.tsx`, `restaurant-seller.css`,
`app/lib/personal-session-browser.ts`, `restaurant-seller-browser.ts` and
`restaurant-seller-copy.ts`. Dependency changes: package.json/lockfile.
Evidence: this report, two browser test files, `personal-session-browser.test.ts`,
Playwright's optional actual-environment settings, test-only Python/HTTPS/OpenSSL
harnesses under `tests/integration`, and an ignored `.s3a-local` artifact directory.

## Dependency triage

`npm audit` initially reported six **package entries**, not six independent
vulnerabilities (Vitest and mocker share an advisory). Registry/advisory evidence
checked on 2026-09-10; clean patched install reported **0 vulnerabilities**.

| Entry / installed before → after | Path and exposure | Finding / remediation |
| --- | --- | --- |
| next 16.3.0 → 16.3.4 | Direct production server | Critical Windows-hosted RCE [GHSA-p293-qw3h-jr36](https://github.com/advisories/GHSA-p293-qw3h-jr36), plus image-optimization AVIF RCE [GHSA-2xp9-vwfh-vxw4](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4). Both list 16.3.3 as patched; use 16.3.4. Windows-specific exposure is platform-dependent, not proof Render is exploitable. Image optimization exists globally even though seller forms do not exercise it. |
| sharp 0.35.3 → 0.35.4 | Direct production dependency, also Next image processing | High libheif advisory [GHSA-rgj7-g3m4-5g8c](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c); patch bundled native processing rather than assume all media safe. No exploit test against user media. |
| vitest 4.1.10 → 4.1.11 | Direct dev dependency; test runner, not a production route | Moderate redirect-mock arbitrary file read [GHSA-82fw-gwwq-j7x9](https://github.com/advisories/GHSA-82fw-gwwq-j7x9). Patch runner; no public test server deployed. |
| @vitest/mocker 4.1.10 → 4.1.11 | vitest → mocker, development | Same advisory, resolved together, not a second independent exploit. |
| js-yaml 4.3.1 → 4.3.2 | eslint → @eslint/eslintrc → js-yaml, development | High empty-merge CPU exhaustion [GHSA-2883-xcg3-v3hh](https://github.com/advisories/GHSA-2883-xcg3-v3hh). Compatible transitive patch; no application YAML upload endpoint added. |
| nanoid 3.3.17 → 3.3.18 | Next → postcss and @tailwindcss/postcss → postcss | High zero-size custom-generator loop [GHSA-2v37-7h3g-55p8](https://github.com/advisories/GHSA-2v37-7h3g-55p8). Present in production dependency graph but used through CSS tooling here; no demonstrated attacker-controlled custom generator. Compatible transitive patch. |

Align eslint-config-next to 16.3.4. Tailwind's PostCSS resolved to 8.5.28 within
its existing range; Next retains its pinned PostCSS 8.5.23 with patched nanoid.
No claim that an empty audit proves absence of all vulnerabilities.

System Node was 22.12.0, below `>=22.13.0`. Acceptance uses isolated **Node
22.23.2** without altering the system installation. npm 10 repeatedly failed
resolution with `Cannot read properties of null (reading 'edgesOut')`; isolated
npm 11.19.1 resolved the lockfile and completed `ci`. Its unrs-resolver postinstall
approval warning did not prevent lint/build; no broad script approval was added.
Checks started prematurely during installation produced missing Next module/type
errors; those are superseded by checks after the complete clean install.

## Actual integration harness and limitations

Website-owned `tests/integration/restaurant-backend.py` imports the actual Backend
FastAPI application, domain services and real SQLAlchemy/PostgreSQL writes. It
disables dotenv, sets only the dedicated test database, blocks external sockets,
creates synthetic accounts/session rows, and binds HTTPS to loopback. The fresh
PostgreSQL 16 container is `nihiloba-s3a-isolated`, port 55439; database name
`restaurant_r0a_test` satisfies existing test safety assertions. No existing DB
was reused. Test schema uses Backend's established APP_ENV=test bootstrap; this
is not a new Alembic migration/rehearsal.

Test controls create **synthetic sessions**, expire them and invoke the same
authoritative profile service used across channels. They are not real OTP or
WhatsApp delivery. The dummy WhatsApp recipient is never contacted. Sharing is
checked by inspecting the local `/go/` redirect with redirects disabled, never
opening a real conversation. Test tokens/certificates are not committed.

`restaurant-https.mjs` serves the production website build over local TLS only.
Use `https://localhost:3014`: Next normalizes numeric loopback hosts to localhost
in NextRequest, so using numeric loopback in the browser causes strict origin
comparison to reject writes. This is a harness correction, not a reason to relax
production origin checks. HTTP-only testing also failed because the production
CSP upgrades insecure requests; HTTPS testing retains that policy and Secure
cookies. The local certificate is trusted only by test Node/browser processes.

### Coverage ledger

- **Actual Backend/PostgreSQL:** 176 focused tests passed; one pytest anyio
  assertion-rewrite warning. API/lifecycle/menu/time and their PostgreSQL race
  tests plus Personal WhatsApp/menu simulations. Includes Personal-only ownership,
  dual Personal/Organization isolation, wrong-owner/legacy denial, replay conflicts,
  stale writes, post-lock authority checks, publication privacy and menu/time rules.
- **Browser, mocked API: 14 passed (23.3s)** on the final production build. S2-D fixtures plus transient session failure/deduplication
  and failed-logout regressions. These verify frontend interaction, not Backend or
  authentication delivery. Existing language/mobile/keyboard/QR checks retained.
- **Actual browser: 2 scenarios passed together (2.8min runner total).** Lifecycle
  journey passed in 22.5s; constrained network journey passed in approximately
  2.4min. Real browser controls exercised legacy-cookie migration,
  Personal-only creation, changed-field editing, publication, category and three
  CDF pricing models, confirmed dated offering, unknown/closed hours, stale service
  edit reconciliation, menu QR, unpublication, Employment applications navigation,
  logout, account switching and expiry. Public visibility/redirect and wrong-owner
  denial were actual API assertions inside this journey, not public-page UI checks.
  Dual Organization and legacy denial were exercised in the real Backend tests,
  not a second Business Dashboard browser journey. No Dashboard edits.
- **Inherited full Backend baseline:** S2-C's 4198 passed / 53 failed / 431 skipped
  remains historical, not rerun here and not described as fully passing.

## Low-data method and measurements

Chrome desktop engine, production build, actual local HTTPS Backend, synthetic
Personal account, 390×844 viewport; CDP emulation: 150ms latency, 50,000 B/s
download, 25,000 B/s upload. Fresh browser context for cold load; same context
reload for warm load. No Playwright route mocks (which disable browser cache).
Count `Network.requestWillBeSent`, including redirects/prefetch attempts, and sum
`Network.loadingFinished.encodedDataLength`. These are Chrome transfer counters,
not TCP/TLS overhead, billed cellular bytes or MB/day estimates. Duration includes
waiting for the usable selector and network-idle; retained private responses
continue using no-store. No persistent private storage or offline reopen claim.

Initial measured implementation (session resilience already applied; before
canonical URL/prefetch fixes): cold 258,674 B / 34 requests / 7,364ms; warm 51,929 B
/ 34 requests / 2,553ms. Visible idle 65,011ms: 1,468 B / 2 HTTP requests for one
logical session check. Offline 65,049ms: 0 B / 0 requests. Reconnect 878ms: 1,468 B
/ 2 HTTP requests. Input survived and no write was replayed automatically.

Final production-build measurements:

| Phase | Transferred bytes | HTTP requests | Session requests | Duration |
| --- | ---: | ---: | ---: | ---: |
| Cold | 264,264 | 25 | 1 | 7,541ms |
| Warm reload | 53,400 | 24 | 1 | 2,094ms |
| Visible authenticated idle | 1,468 | 1 | 1 | 65,004ms |
| Offline, editor open | 0 | 0 | 0 | 65,022ms |
| Reconnect, same input retained | 1,468 | 1 | 1 | 839ms |

The isolated account accumulated additional synthetic drafts during lifecycle
runs, so byte differences between runs are not a controlled content-identical
benchmark. Do not claim lower bytes or universal speed gains. Removing the
trailing-slash redirect demonstrably reduced two HTTP session requests to one;
removing local seller prefetch reduced the measured warm request count from 30
(after URL correction) to 24. Shared-chrome/cart prefetch still exists and is not
a seller-specific order feature. No daily usage claim. Hidden-tab interval skipping
is code-reviewed, not a separately measured real background-mobile session.

Chrome phone 390×844 and desktop 1440×1000 overflow assertions passed. Inspected
phone/desktop screenshots; existing single-column/two-column forms retained.
Artifacts from the final two-scenario run live under ignored
`.s3a-local/final-actual-results`. Earlier failures were
test-environment HTTP/host normalization, a timestamp-shaped synthetic name that
the existing privacy filter correctly redacted, and asserting cookie removal
before asynchronous logout acknowledgement. No privacy filter or origin check
was relaxed to make these tests pass.

Final application checks on Node 22.23.2: **214 tests / 21 files passed**;
TypeScript and ESLint passed; Next production build passed (80 static pages,
Restaurant and private seller routes dynamic); current npm audit **0 findings**;
`git diff --check` passed. npm scripts were exercised through their equivalent
Node CLI entry points to avoid the system npm wrapper selecting Node 22.12.0.
No Backend full-suite rerun or new migration check is claimed.

## Build-warning diagnosis, localization and rollout

Preserve R3B.1/R3B.2 diagnosis: `TypeError: fetch failed`, caused by
`connect EACCES 216.24.57.7:443`, traced to sandbox-denied build-time Hotel/public
sitemap fetching (and separate Next telemetry), not Restaurant pre-rendering.
Restaurant routes remain dynamic. Patched builds in this run completed without
that warning; absence in a cached/local run is not evidence deployment networking
is verified. No warning suppression, TLS bypass or CSP weakening in application.

Seller labels and new connection copy exist in EN/FR/LN/SW. The existing shared
chrome still has French fallbacks on LN/SW; native-speaker review and broader
shared navigation translations remain release work, not silently completed here.
No physical Android/iOS, prolonged real cellular session or live auth delivery was
verified. Emulated phone viewport is not a physical-device acceptance claim.

Preserve S2-D rollout: schema 0069 and compatible S2-C before enabling the seller
workspace; shared HttpOnly `/api/shida` cookie and successful-validation migration
from `/api/shida/employment` remain. Clear both cookie paths on logout. Rolling
back to a pre-S2-D frontend can require reauthentication because it cannot read
the new cookie; do not undo ownership migrations or backfill legacy owners.

Remaining release gates: live auth/session delivery, supported real devices and
shared-language navigation; public release/deployment acceptance; existing public
menu/QR website-vs-WhatsApp destination limitations in S2-D; OPEN-05 reviews,
delegated access, instrumentation, C1 ordering/screen-awake and separately scoped
offline feasibility. Local fixtures alone do not establish public-release readiness.

## Reproduction

Use supported Node, Backend venv, disposable PostgreSQL and the committed OpenSSL
test config. Create `.s3a-local/cert.pem` and `key.pem` with DNS localhost/IP
127.0.0.1 SANs. Run `restaurant-backend.py --checks` **before** the browser server:
the existing tests clear their isolated database. Then start `restaurant-backend.py`.
Set process-only `SHIDA_API_BASE_URL=https://127.0.0.1:3443` and
`NODE_EXTRA_CA_CERTS=<website>/.s3a-local/cert.pem`; start `restaurant-https.mjs`.
Run Playwright with `RESTAURANT_TEST_EXTERNAL_SERVER=1`,
`RESTAURANT_ACTUAL_BACKEND=1`, `RESTAURANT_TEST_BASE_URL=https://localhost:3014`,
config `playwright.restaurant.config.ts`, file `restaurant-s3a.browser.ts`.
Run `restaurant-seller.browser.ts` separately with the standard HTTP :3013 fixture
server and without ACTUAL_BACKEND/BASE_URL overrides. Never use the harness with
production data. Stop the isolated servers/container after verification.

Fresh-container example (test-only credentials, no production database):

```powershell
docker run --detach --name nihiloba-s3a-isolated --publish 127.0.0.1:55439:5432 --env POSTGRES_USER=s3a --env POSTGRES_PASSWORD=isolated_test_only --env POSTGRES_DB=restaurant_r0a_test postgres:16-alpine
New-Item -ItemType Directory -Force .s3a-local
openssl req -config tests/integration/localhost-openssl.cnf -x509 -newkey rsa:2048 -nodes -keyout .s3a-local/key.pem -out .s3a-local/cert.pem -days 2 -subj /CN=localhost -addext 'subjectAltName=DNS:localhost,IP:127.0.0.1'
$env:PYTHONDONTWRITEBYTECODE='1'
& ..\Backend\venv\Scripts\python.exe tests/integration/restaurant-backend.py --checks
```

The test container and ignored artifacts may be retained stopped for reproduction;
they contain synthetic data only. No git commit or deployment was performed.
