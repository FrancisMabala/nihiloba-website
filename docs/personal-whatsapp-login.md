# Shared Personal WhatsApp sign-in

Implementation evidence: 2026-09-10. Local integration, not deployment or live WhatsApp acceptance.

## Existing versus changed behavior

S2-D/S3-A supplied the shared `nihiloba_personal_session`, Employment-cookie migration,
editor fingerprint, account-change notifications and Personal seller workspace. Both
NIHILOBA login forms still requested an outbound OTP. They now mount the same
`PersonalWhatsAppLogin` component. No phone/code input or OTP fallback is rendered in
these journeys. Retained OTP routes/services and the separate shida-business frontend
are unchanged. Existing S2-D/S3-A implementation and rollback evidence remains valid;
this report supersedes only their primary-login description.

The browser creates a challenge, attempts to open the exact returned `whatsapp_url`,
and displays the same link for popup-blocked browsers. It explicitly asks the person
to SEND the prepared message and return to the originating browser. Merely opening
WhatsApp cannot exchange a pending challenge. No app installation or Organization/Pro
membership is introduced. The Backend's current prepared command remains
`SHIDA BUSINESS LOGIN …`; the website must not rewrite that namespace.

## Contracts and gateway

| Website route (trailing slash) | Released Backend route |
| --- | --- |
| POST `/api/shida/personal/auth/whatsapp/` | POST `/api/dashboard/auth/whatsapp-challenge` |
| GET `/api/shida/personal/auth/whatsapp/{ref}/` | GET `/api/dashboard/auth/whatsapp-challenge/{ref}` |
| POST `/api/shida/personal/auth/whatsapp/{ref}/session/` | POST `/api/dashboard/auth/whatsapp-challenge/{ref}/session` |
| DELETE `/api/shida/personal/auth/whatsapp/{ref}/` | No upstream request: remove this browser's matching binding |

Only these exact methods/paths are allowed; queries are rejected. Mutations require
an explicitly trusted public Origin (see the correction below). Reads require trusted Origin or browser `Sec-Fetch-Site:
same-origin`; cross-site reads fail. No caller-supplied identity/body or arbitrary
cookie is forwarded. Upstream requests use the existing HTTPS `SHIDA_API_BASE_URL`,
manual redirects, no-store and an eight-second timeout. Origin is forwarded for
Backend CSRF enforcement. Errors return safe codes, never raw upstream detail.

Create allowlists `challenge_ref`, `expires_at`, and the exact HTTPS wa.me URL.
Status allowlists pending/verified/expired/cancelled and `onboarding_required`.
Exchange exposes only `{authenticated:true}`, not the upstream session or user payload.
No endpoint accepts Organization context, changes membership or grants Restaurant access.
Existing protected APIs continue to authorize the actual Personal actor on each action.

## Cookies, cancellation and uncertainty

- The upstream `shida_dashboard_challenge` verifier is translated into
  `nihiloba_personal_challenge`: HttpOnly, production Secure, SameSite=Lax,
  Path `/api/shida`, no Domain. Its value binds the exact reference, returned deadline
  and opaque verifier; maximum age is bounded by that deadline and 600 seconds.
- The verifier is forwarded only to the selected upstream challenge. Status/exchange
  reject an absent, different-reference or expired binding before calling upstream.
- Exchange uses existing `setEmploymentToken`: shared HttpOnly session, production
  Secure, SameSite=Lax, Path `/api/shida`, seven days, high priority. It expires the
  legacy Employment-path cookie and the temporary challenge cookie.
- GET session migration, SHA-256 editor fingerprint and private/no-store headers
  remain unchanged. Logout clears both session paths and the temporary challenge.
- Client generation guards discard obsolete reads/creates. DELETE matches the
  reference, so an old tab cannot erase a newer challenge. Cancellation is local
  abandonment, not a claim of Backend revocation; the abandoned upstream challenge
  retains its Backend lifecycle but has no usable verifier in this browser.
- Web Locks serialize create/exchange/logout across NIHILOBA tabs. Session reads are
  held off while a cookie mutation is in flight. Exchange is never automatically
  replayed after uncertainty. A superseded/uncertain exchange attempts logout before
  releasing the lock; obsolete completions do not announce authentication.
- A non-identity `shida-personal-login-unconfirmed=1` localStorage safety marker
  prevents automatic session restoration after an uncertain response/failed cleanup,
  including reload. It is cleared only by confirmed login/logout. It is NOT a
  credential and contains no user, verifier, link, reference or Personal data. Existing
  cross-tab notification IDs likewise contain no credentials. Nothing private is
  stored in localStorage/sessionStorage. With storage disabled, only the in-memory
  uncertainty guard survives; reload recovery in that browser remains an acceptance
  limitation. Browsers without Web Locks fail closed with the unavailable state.
- No sensitive values are logged. The short-lived WhatsApp bearer link necessarily
  exists in the active page's link, but is not persisted or copied into telemetry.

Polling starts after one second, then waits three seconds between completed checks,
deduplicates foreground events, pauses network checks while hidden/offline, and stops
at expiry, terminal state, unmount or 100 checks. Cancel is unavailable during the
short exchange write: this prevents treating an aborted fetch as a cancelled server
write. An uncertain result offers explicit sign-out/reset, not silent session adoption.

Authentication is in-place: no `returnTo` string or external redirect is trusted.
The intended Restaurant/Employment page, query and locale stay in the address bar.

## Files

- `app/api/shida/personal/auth/whatsapp/[[...path]]/route.ts`: narrow gateway.
- `app/components/shida/personal-whatsapp-login.tsx`: shared lifecycle/UI.
- `app/lib/personal-login-browser.ts`, `personal-login-copy.ts`: serialization,
  uncertainty marker and EN/FR/LN/SW text.
- `app/components/shida/restaurant-seller.tsx`, `candidate-employment.tsx`: shared
  login integration; retain private content/session boundaries. Employment now avoids
  replacing its pending login on foreground and protects the local signed-out state.
- `app/lib/personal-session-browser.ts`,
  `app/services/shida/employment-browser-client.ts`,
  `app/api/shida/employment/logout/route.ts`: shared session coordination/cleanup.
- `tests/personal-whatsapp-login.test.ts`,
  `tests/browser/personal-whatsapp-login.browser.ts`,
  `tests/browser/restaurant-seller.browser.ts`: gateway, rendered login and regressions.
- `tests/integration/restaurant-backend.py`: `--auth-checks` runs existing Backend
  authentication tests against the already isolated PostgreSQL infrastructure with
  the OTP template explicitly unset. No Backend source edits.

## Verification

Supported Node 22.23.2, rather than the machine's older 22.12.0, was used.

- Vitest: 229 passing tests across 22 files, including 15 new gateway/copy tests.
- TypeScript `tsc --noEmit`, ESLint and Next production build: pass; 80 static pages
  generated, dynamic Personal gateway included. Historical sandbox build-warning
  diagnosis in S3-A is unchanged; it did not recur in this build.
- Backend: `restaurant-backend.py --auth-checks`: 10 passed against isolated local
  PostgreSQL, OTP template unset. Covers browser binding, sender binding, one-time
  and concurrent exchange, expired/incomplete users, message deduplication, rate
  limits, simulated signed-webhook validation and non-elevation of Business roles.
  One pytest imported-anyio assertion-rewrite warning. This is not the full Backend
  suite and does not replace its documented baseline.
- Browser: 31 passed (17 shared-login scenarios and 14 seller regressions), final
  stable run in 1.3 minutes. Phone/desktop screenshots visually inspected. Headless
  installed Chrome, isolated network
  fixtures, no real WhatsApp navigation/messages. Phone 390px and desktop 1366px for
  all four login locales; keyboard focus, complete exact links, message instruction,
  foreground verification, unchanged return URL, unavailable/expired/onboarding/
  cancelled/rate-limited states, stale read cancellation, uncertain exchange cleanup
  and failed-cleanup reload guard. Existing seller tests cover changed-field edits,
  stale reconciliation, logout/switch privacy, prices, hours and sharing.
  The development server showed React's debug-only eval/CSP warning (visible in the
  development badge); production CSP was not weakened to enable development eval.
- Initial seller retry assertion raced request arrival; it now waits for two recorded
  requests before comparing unchanged payloads. The failed-logout login-state defect
  found in the first regression run was corrected, not hidden/skipped.

Browser network fixtures exercise actual rendered controls, but do NOT constitute a
browser-to-real-Backend-to-Meta end-to-end test. Backend security tests exercise actual
services/PostgreSQL separately, using simulated inbound messages. No real authentication
delivery, physical-phone app switching, Safari/Firefox, production cookies on the
deployed domain, or live network acceptance is claimed. LN/SW login text is present;
broader shared chrome/Employment localization remains the previously documented gap.

## Rollout requirements and remaining Backend finding

Deploy only after the compatible challenge schema/services are installed; retain the
existing S2-D/S3-A seller schema and session-cookie rollback instructions. No website
migration, new dependency, worker, paid requirement, template or Backend feature was
added. Configure the Backend's existing strong `DASHBOARD_AUTH_PEPPER`, official
`SHIDA_WHATSAPP_NUMBER`, signed Meta webhook/`META_APP_SECRET`, and exact NIHILOBA origin
in `DASHBOARD_ALLOWED_ORIGINS`. The adapter expects the current default upstream cookie
names `shida_dashboard_challenge` and `shida_dashboard_session`. Confirm any custom
deployment cookie configuration before rollout. Backend IP limits remain active;
without trusted proxy-IP handling upstream, gateway traffic can share one source-IP
bucket. Do not forward untrusted client IP headers to bypass this.

Historical read-only Backend finding: only pending challenges expired, and exchange
did not separately enforce verified-challenge expiry or rerun current eligibility.
The subsequent `Backend/docs/personal_whatsapp_auth_hardening.md` correction implements
those authoritative protections locally; see the rollout status below. The website
timer alone is not a Backend-wide remediation. No Backend source was changed under
this website-only batch, and local hardening is not proof of its deployment.

Preserve OPEN-05, Dashboard/delegated-access and other release gaps from prior reports.
No deployment, live messages, ordering, payments, app-install requirement or unrelated
feature work was performed. Rollback may require reauthentication as described in S3-A;
an OTP-only rollback remains unusable until its Authentication template is available.
The local development server and isolated PostgreSQL container were stopped after checks.

## Proxy-origin correction — 10 September 2026

Fresh credential-free live probes still returned website **403 forbidden** and
Backend **403 Invalid origin**, both with `Origin: https://nihiloba.com`. Response
bodies were reduced to those safe codes; no cookies, references or links were logged.
The website rejection is its own initial origin guard; upstream errors map differently.
The old guard compared against the internal request URL and forwarded that same URL's
origin. Internal HTTP/proxy host mismatch is reproduced by regression tests; the exact
production-resolved URL has NOT been inspected through hosting logs. Render's checked-in
Blueprint declares a Node Web Service, not a static site.

### Local correction and security policy

- `app/lib/personal-request-origin.ts` centralizes the explicit canonical
  `https://nihiloba.com` origin, independently of internal request scheme/host.
  Exact localhost/127.0.0.1/IPv6-loopback origins matching a local request URL remain
  supported for development and isolated HTTPS production-build testing.
- Missing/null/malformed/opaque/list/credential/path/query origins fail mutation checks.
  Arbitrary origins do not become trusted just by matching the request URL. Host,
  Forwarded and X-Forwarded-* headers never grant trust. Cross-site requests fail.
- `app/api/shida/personal/auth/whatsapp/[[...path]]/route.ts` forwards that validated
  Origin. Browser same-origin GET without Origin remains supported with its HttpOnly
  challenge binding; this read-only exception never applies to POST/DELETE.
- `app/api/shida/personal/restaurants/[[...path]]/route.ts` uses the same write policy
  and forwards validated Origin, retaining exact routes, input limits and session fingerprint.
- `app/api/shida/employment/route-utils.ts` uses the same strict origin policy for
  existing Employment mutations/logout. Session issuance/migration, both logout paths,
  cookie properties, private/no-store, exchange/cancellation and client generation guards
  are unchanged. No visual, OTP, Business frontend or Backend source changes.

Tests changed: `tests/personal-request-origin.test.ts`,
`tests/personal-whatsapp-login.test.ts`, `tests/restaurant-seller.test.ts`, and
`tests/browser/personal-whatsapp-origin.browser.ts`.

### Verification and limits

- Node **22.23.2**: **251 tests / 23 files passed**. Typecheck, lint and production
  build passed (80 static pages). Proxy-host/scheme, strict origin parsing, spoofed
  forwarding, local origins, fresh creation after expiry and upstream Origin are covered.
  Existing session/cookie/route restrictions remain tested.
- Actual local Backend/PostgreSQL through production Next HTTPS: **2 browser tests
  passed**, French seller at 390px and 1366px. Real challenge creation returned 201,
  actual polling returned pending, exact Backend link was rendered, secure HttpOnly
  challenge cookie existed, no Personal session appeared without a message, and
  cancellation removed the cookie and showed retry. All external browser destinations
  were blocked; popup opening was disabled. No API response mocking in these two tests.
  The first run expected the initial button after cancellation; corrected the test to
  assert the existing localized Retry control, not change the UI.
- Mocked browser regressions: **31 passed in 1.4 minutes**, shared-login and seller
  suites across EN/FR/LN/SW, phone/desktop, Employment return context, stale responses,
  expiry, cancellation, uncertainty, logout and account switching. Initial auto-managed
  dev-server teardown stalled after all assertions; rerunning against the same explicit
  external local server exited successfully. This is separate from the two real-Backend
  tests above. Final typecheck/lint passed again after adding the browser test.
- This is NOT actual signed-message verification/session exchange. No live WhatsApp
  message or physical-device acceptance was attempted. Successful exchange, expired,
  onboarding, uncertain responses, supersession and session isolation have separate
  existing mocked rendered regression coverage, not live delivery evidence.
- Read the current Backend hardening report and confirmed local service contains
  current-eligibility rechecking and wall-clock consumption protection. Its recorded
  PostgreSQL result is 86 passed; full baseline remains 4,291 passed / 53 existing
  failures / 472 skipped. These are Backend report evidence, NOT reruns in this batch.
  Public origin probes cannot establish which revision every worker runs.
- Production build did not reproduce the historical sandbox fetch warning. Development
  browser runs retain the known React debug eval/CSP and NO_COLOR warnings; no CSP relaxation.

### Exact remaining production steps (not performed; approval required)

1. Deploy this website correction. No website environment change or migration is needed.
2. On the Backend service, append exact `https://nihiloba.com` to the existing comma-separated
   `DASHBOARD_ALLOWED_ORIGINS` if absent. Preserve all legitimate existing Business/local
   entries; do not replace the value with only NIHILOBA or add a wildcard. The actual
   existing value is not available here and no environment file was dumped.
3. Confirm the corrected `dashboard_whatsapp_auth_service.py` from
   `Backend/docs/personal_whatsapp_auth_hardening.md` is included in the deployed artifact
   on ALL workers, restart/redeploy to load the allowed-origin setting, and verify active
   revision consistency via hosting access. No authentication migration is required.
   An old worker may retain verified-expiry/current-eligibility defects even if login works.
4. Repeat safe origin diagnostics and the live rendered seller and Employment challenge
   creation journeys. Complete message verification only with an authorized test account
   and the user's participation. No unattended message sending.

Live authentication remains **unresolved pending authorized rollout/configuration**.
Runtime worker revision and loaded setting are unverified, not inferred from local files.
Retain S2-D/S3-A rollout/session-cookie rollback guidance and Backend warning that reverting
its hardening reintroduces expiry/eligibility defects. No commit, deploy or data migration.

Suggested commit: `fix(auth): trust public origin behind proxy for Personal WhatsApp login`
