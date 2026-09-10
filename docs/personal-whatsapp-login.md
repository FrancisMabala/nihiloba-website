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
the exact request Origin. Reads require exact Origin or browser `Sec-Fetch-Site:
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

Read-only Backend finding: `_expire` in `dashboard_whatsapp_auth_service.py` expires
only `pending` challenges; `exchange_dashboard_whatsapp_challenge` does not separately
check `expires_at` for a `verified` challenge. It also does not rerun
`_account_is_eligible` at exchange after the earlier signed-message verification.
The NIHILOBA adapter enforces the returned deadline, but that is not a Backend-wide
remediation. Authoritative verified-expiry and eligibility-change behavior need a
separate Backend review/correction before asserting those stronger global guarantees.
No Backend source was changed under this website-only batch.

Preserve OPEN-05, Dashboard/delegated-access and other release gaps from prior reports.
No deployment, live messages, ordering, payments, app-install requirement or unrelated
feature work was performed. Rollback may require reauthentication as described in S3-A;
an OTP-only rollback remains unusable until its Authentication template is available.
The local development server and isolated PostgreSQL container were stopped after checks.
