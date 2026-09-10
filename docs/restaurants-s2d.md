# Restaurant S2-D — NIHILOBA Personal seller area

Local implementation, 10 September 2026. Not a deployment or live-acceptance claim.
No Backend or shida-business source was changed.

## Existing behavior and reuse

S2-C provides protected Personal Restaurant operations using the same authenticated
SHIDA human identity as Employment. Business membership and paid plans are not
admission requirements. Previously NIHILOBA provided public Restaurant browsing
and Employment sign-in, but no Personal Restaurant maintenance workspace.

Read/reconciled Backend canonical Restaurants & Malewa v1.3, shared Business
contract/index, S2-C, S2-B, Dashboard DTOs and R2-A/R2-B time/menu contracts with
`restaurant_personal.py`, `restaurant_personal_service.py`, and existing auth.
The Organization Restaurant workspace, money/time helpers, translations, CSS and
gateway in sibling shida-business were read-only reuse references. The forms are
adapted here to Personal ownership; no Organization selector/suggestions endpoint,
grants, Business account creation or paid feature gate was copied.

## Connected pages and actions

- `/shida/seller/restaurants`, plus `/en`, `/fr`, `/ln`, `/sw` variants.
- Public Restaurant discovery links to the clearly labelled Personal seller area.
- Session restoration/sign-in, sign-out/change-account and language navigation.
- Own-establishment list, status filter, pagination, private draft creation,
  resume via selection, profile/disclosure/timezone edits and saved public preview.
- Explicit publish/unpublish, categories, fixed dishes/reusable components,
  CDF/USD unit and configured-amount prices, unknown prices, visibility,
  availability and permanent versus dated menu presentation.
- Dated offerings, unconfirmed copy then separate confirmation, backend expiry
  state, weekly windows, unknown versus explicitly closed hours, and closures.
- Eligible establishment/menu sharing through the existing link-preparation API.
  Menu QR is rendered locally from **exact `qr_content`**, without rewriting or
  rotating the destination. It opens the existing SHIDA WhatsApp journey, not a
  claimed verified website-menu destination. No message is sent by preparation.

## Session and gateway decisions

The upstream cookie remains `shida_dashboard_session`. Website issuance uses a
**different local name**, `nihiloba_personal_session`, Path `/api/shida`, HttpOnly,
SameSite=Lax, Secure in production, seven-day upper bound. Backend session expiry
and revocation remain authoritative; no periodic cookie-lifetime refresh occurs.

Existing `shida_dashboard_session` cookies at `/api/shida/employment` are read by
the Employment session endpoint, validated upstream, then migrated to the new
name/path and expired at their exact old path. Both applications use this endpoint
before rendering private state. New sign-ins expire the old-path cookie. Logout
expires both even if remote revocation is unavailable (that error is still returned).
Distinct names avoid ambiguous same-name cookies at overlapping paths. A valid
shared cookie takes precedence over obsolete legacy data.

The session response adds a one-way, domain-separated SHA-256 fingerprint of the
high-entropy opaque session token. This is a **non-credential per-login binding**,
not an identity, owner selector, bearer token or authorization substitute. Seller
requests carry it in `X-Shida-Session`; the gateway compares it with the current
HttpOnly cookie before forwarding. Old tabs cannot create or retarget a command
after another login changes the session. Backend ownership authorization remains
necessary on every read/write. No private drafts are put in localStorage: it holds
only a random cross-tab session-change notification. Focus/session polling,
session-change notifications and access-denial handling clear obsolete state.
Employment also clears/reloads private state on cross-tab changes/focus and rejects
stale async responses. Pending requests retain the original captured credential.

`/api/shida/personal/restaurants/[[...path]]` allowlists exact S2-C GET/POST/PATCH/PUT
paths, reference kinds, query names and write envelope/field names. It rejects
owner/phone/Organization selectors, unsupported paths/methods, duplicate queries,
cross-site requests and missing/mismatched write Origins. Employment mutations now
also reject absent Origin rather than treating it as browser CSRF consent.
Only the server-held session cookie is forwarded to the configured HTTPS backend;
arbitrary browser cookies/headers are not forwarded. Redirects are not followed.
Bodies have a 64-KiB actual streamed-byte limit. Domain validation, eligibility,
currency/entitlements and concurrency remain backend authority. Safe errors preserve
401/403/404/409/422/503 recovery without raw error details. Protected replies use
private/no-store, Vary Cookie/Origin and noindex headers; pages are noindex/no-store.
No private API payload is fetched into static page metadata or shared caches.

Sharing accepts only HTTPS `/go/<URL-safe-token>` destinations on the official
NIHILOBA/API origins; other configured deployment hosts require explicit review.

## Exact values, revisions and recovery

Money remains decimal strings (not JavaScript floats); unknown is null, not zero.
Expected revisions retain all timestamp digits, including microseconds. Date
conversion is for offering display/editing only, never revision comparison.
PATCH contains only deliberately changed fields. Pricing-model changes explicitly
replace their incompatible pricing tuple. Hours only replace changed windows or
closures; untouched closure metadata is preserved exactly.

Draft creation and menu/time commands retain original operation key, URL, method,
serialized body and revision through uncertain retries. Profile/publication use
the existing revision CAS, not an invented replay ledger. A stale/conflicting
response locks submission; current values must be loaded and explicitly reconciled
before a new command/key. Users can discard input and resume a persisted draft.
Only one editor can be open, bound to the exact establishment/child. No inline
category creation mutates a waiting item form's revision; categories are managed
separately before reopening an item editor.

## Changed files

- New seller pages under both route groups; `restaurant-seller*.tsx/.css` components.
- `app/lib/restaurant-seller*.ts` contracts, browser adapter, forms/types and copy;
  `personal-session-browser.ts` cross-surface session notifications.
- Employment `route-utils`, session/logout routes, browser client and workspace.
- Public `restaurants.tsx` seller entry; `next.config.ts` private-page headers.
- `tests/restaurant-seller.test.ts`, existing Employment cookie regression test,
  `tests/browser/restaurant-seller.browser.ts`, Playwright configuration.
- Dependencies: pinned `qrcode` 1.5.4, dev `@types/qrcode` 1.5.6 and
  `@playwright/test` 1.63.0. QR generation makes no external request.
- `.gitignore` excludes browser artifacts. Next dev refreshed its generated
  AGENTS.md guidance block; it is not a product-policy change.

## Validation evidence

Final results are recorded below after running the final checks. Initial focused
tests: 38 passed (28 seller/session/gateway tests plus 10 Employment regressions).
Initial browser run: 7 passed / 2 failed due to ambiguous test locators; corrected
selectors retained assertions. A nested main landmark was removed following browser
inspection. Follow-up: 11/11 browser tests passed before adding long-label snapshots.

Browser automation uses installed headless Chrome, a dedicated loopback Next server
and synthetic in-memory API fixtures; all external browser requests are blocked.
No real OTP, live account, database, WhatsApp message or production mutation is used.
These are actual rendered/control tests, not HTTP-only acceptance. Fixture tests
do not prove a deployed backend or production delivery. Gateway/security tests mock
upstream responses separately; backend owner-isolation/transaction tests were not
rerun because backend code is unchanged.

Reproduction: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
Browser: `npx playwright test --config=playwright.restaurant.config.ts`.
For Windows process cleanup or an already-started isolated server, start
`node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3013`, then set
`RESTAURANT_TEST_EXTERNAL_SERVER=1` for the test command and stop that server after
testing. This is test-only, not a new application configuration requirement.

## Rollout, rollback and remaining gaps

### Final stable-state verification

- `npm test`: **208 passed, 20 files** (including 28 new seller/session tests).
- `npm run lint`: passed without warnings; `npm run typecheck`: passed.
- `npm run build`: **passed**, all 80 static pages generated; seller/API routes
  remain dynamic. One non-fatal `fetch failed / connect EACCES 216.24.57.7:443`
  warning recurred during unrelated static collection generation. The prior
  [R3B.2 diagnosis](restaurants-r3b1.md#exact-build-warning-investigation) traces
  this sandbox-denied API fetching; no warning suppression or security weakening.
- **12/12 Playwright scenarios passed against `next start` production build**
  (19.5s final run), using isolated browser/API fixtures. Covered selection and
  pagination, draft creation/resume, changed-field editing, identical retries,
  explicit stale reconciliation, all pricing models, unknown/closed hours,
  publication, QR/sharing, expired/sold-out copy and separate confirmation,
  synthetic OTP login/logout, lost-access/account switching, four language routes,
  390×844 phone and 1440×1000 desktop, long labels, focus and horizontal overflow.
- Pixel/module comparison verified the canvas encoded exact `qr_content`, even
  when the fixture supplied a different `public_url`. No external link was opened.
- Phone/desktop full-page screenshots were inspected. Found and corrected the
  sibling project's unrecognized `content-wrap` class to use NIHILOBA's container,
  then rebuilt and reran all tests. Artifacts: ignored local
  `test-results/restaurant-seller-{phone,desktop}.png` (synthetic data only).
- Direct local production checks: default/FR seller pages 200 with private/no-store
  and noindex; unauthenticated gateway 401 with the same privacy headers.
- `git diff --check`: passed with Windows line-ending notices only.

No live backend account, production data, real delivery or deployment acceptance.
The first bundled browser-server runner stalled during Windows shutdown and was
stopped; the final tests used an explicitly managed loopback server, stopped afterward.
The additional initial mobile focus assertion was corrected to target the textarea
by accessible role/name rather than its content-containing label text.

Local Node is **22.12.0**, below the declared >=22.13.0 engine; repeat CI acceptance
on the supported production runtime. Dependency installation reports **6 audit
vulnerabilities: 2 moderate, 3 high, 1 critical**. They were not remediated or
independently triaged in this bounded feature batch; dependency-security review
remains required before a security-readiness claim.

Deploy compatible schema **0069 and S2-C backend before this frontend**. No migration,
backfill, worker, cron, template or new production environment variable is added.
Keep SHIDA_API_BASE_URL pointed at the compatible HTTPS backend. Verify real login,
legacy-session migration, owner isolation, link configuration and controlled live
acceptance in staging before release. No deployment happened in this batch.

Frontend rollback must coordinate session-cookie compatibility: an old frontend
only understands the Employment-path cookie, so existing migrated users may need
to sign in again. Do not downgrade schema or delete Personal records/replay evidence
to roll back the website. Remove the seller entry if S2-C is unavailable.

Module text and routes cover EN/FR/LN/SW; native-speaker review remains required.
Shared NIHILOBA header/footer/other surfaces still use French fallback for LN/SW,
so complete site-wide LN/SW localization is **not claimed**.
Canonical gaps remain: common ordering and Free incoming-order screen, order-derived
analytics, Pro billing, Organization Dashboard work, staff/delegated grants,
OPEN-05 reviews, public-view instrumentation policy and live release acceptance.
No fake order inbox, zero analytics, payment, stock, kitchen or composition UI.

Inherited backend S2-C report: 4,198 passed / **53 failed** / 431 skipped, one warning;
121 selected PostgreSQL tests passed. These are reported backend baseline evidence,
not tests executed here and not a wholly passing backend suite.
