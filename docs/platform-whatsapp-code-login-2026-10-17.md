# Platform-wide WhatsApp code login — 17 October 2026

> Public navigation follow-up: [visible SHIDA sign-in](public-shida-login-2026-10-17.md)
> adds a shared public-header entry to this existing login flow. The authentication
> contract below is unchanged; the original batch status and validation are historical.

## Implementation status

Implemented locally in Backend, NIHILOBA Website and SHIDA Business. Not deployed and not live WhatsApp acceptance. This batch implements the shared login foundation only. Provider calendars, opening hours, QR sharing, global bills and further management-copy cleanup remain separate planned work.

The same human Personal identity is used across marketplaces. Public pages remain accessible without signing in. Login never creates a provider profile, selects an Organization, or grants marketplace management rights. Existing per-request ownership, membership, legal eligibility and role/grant checks remain authoritative.

## User journey

1. Start sign-in on the intended web page. The server creates independent WhatsApp-link and HttpOnly browser-binding secrets.
2. Open WhatsApp and **send** the prepared message. Merely opening the link does nothing.
3. The signed webhook validates the official destination, sender, request expiry and current account eligibility. It creates a cryptographically random six-digit code and sends it through the existing WhatsApp text transport in response to the user's message.
4. WhatsApp explains: return to the NIHILOBA or SHIDA Business page where you started, enter the code there, and do not send it in chat or share it. Sign-in is not yet complete.
5. The web page shows the code field after the message is verified. Only an explicit correct submission from the bound browser creates a session. NIHILOBA preserves the exact current page/query/locale; Business retains its existing validated return destination.

EN/FR/LN/SW guidance covers both channels. A six-digit chat reply during an active login is intercepted before numeric menu handling and directed back to the web; it never authenticates or advances another workflow. A repeated link/message does not rotate or disclose another code. Undelivered codes can be recovered by starting a new request, subject to the existing resend policy.

This is passwordless WhatsApp verification. It is not independent-factor two-factor authentication and does not introduce passwords or password-reset management.

## Server contract and security

The existing `/api/dashboard/auth/whatsapp-challenge` creation and status routes remain. Internal `verified` means **WhatsApp sender verified**, not signed in. Polling never issues a session. The exact prepared `SHIDA BUSINESS LOGIN` command is retained for compatibility across both clients.

`POST /api/dashboard/auth/whatsapp-challenge/{ref}/session` now requires a JSON `{ "code": "six ASCII digits" }` body for a successful exchange. Missing/incorrect codes return a generic HTTP 400 `invalid_code` while attempts remain. Malformed/extra input is rejected without reflecting submitted values; the tiny payload is bounded. Wrong/expired browser binding, expired/consumed/cancelled challenges and current eligibility changes cannot issue a cookie. Existing safe 409 and 429 responses remain.

- The code is generated only after the signed inbound message. Only a purpose-separated HMAC bound to the exact public challenge reference is stored. Plaintext is passed transiently to the existing WhatsApp transport, never included in status/create responses, links, audit rows, logs or browser storage.
- Request expiry is capped at five minutes from creation; it is not extended by messaging, polling or a failed code.
- At most five wrong-code attempts are allowed (or the existing OTP policy's stricter value). Attempts serialize under the existing challenge lock. Exhaustion cancels the challenge and clears its code hash. Consumption and expiry also clear the hash.
- Existing IP/sender/status/exchange limits remain. Code generation also uses the established OTP resend/hourly settings through the shared durable rate limiter: one issuance per configured cooldown window (at least 60 seconds), and the configured hourly phone limit (default five). A new browser challenge cannot bypass these sender limits.
- Code checking precedes session insertion; the existing account/legal locks, identity revalidation, browser binding, final PostgreSQL wall-clock deadline check and atomic one-time session transaction remain.
- Existing verified rows lacking a code fail closed. There is no legacy code-free exchange fallback. Retained outbound-template OTP endpoints still require an OTP and were not redesigned.
- NIHILOBA retains its HttpOnly shared Personal session, account-switch/sign-out boundaries, cross-tab mutation serialization, obsolete-response rejection and uncertain-exchange cleanup. Business keeps its existing session cookie and validated navigation and adds explicit code entry, expiry, wrong-code correction, and a non-secret uncertain-exchange reload guard.
- Gateways allowlist/validate the code body, keep credentials out of response JSON and use private no-store responses. Backend authorization remains independent of both UIs.

The provider-accepted response is not proof of delivered/read WhatsApp messaging. A transport failure can leave a verified request awaiting an unseen code; the UI offers a fresh attempt. Codes are not persisted in recoverable plaintext or automatically resent by webhook replay.

## Persistence and rollout

Migration **0171** follows the inspected sole head **0170**. It adds nullable `code_hash` and a zero-default `code_attempt_count` to `dashboard_whatsapp_challenges`, and cancels unfinished pre-migration pending/verified requests. Consumed/expired history, account data and existing authenticated sessions are preserved. No identity backfill is performed.

No new environment variable, dependency, worker, cron or Meta template is required for this user-initiated flow. Existing authentication pepper, official WhatsApp number, webhook signing secret and exact allowed origins remain required. The older optional outbound OTP method still depends on its pre-existing authentication-template configuration.

Release must be coordinated: apply migration 0171 and deploy the Backend and both frontend clients together. Old frontends cannot finish the mandatory-code flow. Drain/replace old Backend workers before reopening new sign-ins: old code could still perform code-free exchanges during a mixed-version rollout. In-flight challenges are intentionally restarted. Existing sessions are not forcibly logged out. A schema downgrade/code-free rollback is intentionally refused; use a reviewed forward correction. No deployment or production database operation was performed in this batch.

## Verification

Tests used fresh disposable databases and synthetic messages, with external backend delivery blocked. Browser fixtures never opened or sent to real WhatsApp. Local screenshots are visual evidence only, not live acceptance. The local implementation is validated by the focused checks below; the full release gates are not yet satisfied.

| Check | Result |
| --- | --- |
| Backend authentication, hardening, foundation, legal eligibility and migration tests | 94 passed; 12 PostgreSQL-only tests skipped because no local PostgreSQL runtime was available |
| Signed WhatsApp conversation tests, EN/FR/LN/SW | 4 passed; code delivered in the synthetic reply, mistaken chat entry redirected to the web, conversation state preserved, no session until web entry |
| NIHILOBA authentication/origin unit tests | 76 passed across 4 test files |
| Business login/API/gateway/localization/security unit tests | 71 passed across 5 test files |
| NIHILOBA login and affected Restaurant seller browser checks | 37 passed (19 login and 18 seller checks; artwork tests excluded from the final login-focused run) |
| Cross-marketplace access browser checks | 27 passed, including separate Services/Wenze/Restaurant permissions, setup, denials and sign-out |
| Business code-login browser checks | 8 passed on the final production build: all four languages at 390px and 1366px |
| Production builds and TypeScript | Both applications passed; NIHILOBA also passed standalone TypeScript checking |
| Scoped frontend ESLint, Backend translation-key check, in-memory Python compilation and task-file whitespace checks | Passed; 14 changed Python files compiled |
| Migration validation | Sole head 0171; fresh SQLite upgrade through the full migration chain passed; PostgreSQL offline compilation of 0170 → 0171 passed |
| Full fresh-database Backend suite | Attempted, then stopped after a confirmed pre-existing cleanup failure caused cascading setup errors; not a pass and not a completed suite |

The full-suite partition manifests collected 10,031 tests in total; this is a collection count, not an executed or passed count. The blocking failure is the teardown of `tests/test_anonymous_analytics_identity.py::test_external_directory_isolation_and_specialized_ledger_preserved`: `FOREIGN KEY constraint failed` on `DELETE FROM posters`. The immediately following `test_v2_retention_erasure_and_durable_replay` inherits the fixture failure. A fresh two-test reproduction produced **1 passed, 2 errors** on both the changed tree and a frozen unchanged baseline. Other assertion failures seen during the interrupted run remain unclassified. No tests were deleted, newly skipped or marked xfail to suppress these failures. Repair the cleanup issue and rerun the complete suite before release.

The initial broader NIHILOBA browser run also exposed an existing desktop seller-artwork assertion: it expects an artwork image request that the current shared management shell does not make. It was left unchanged and is outside the final authentication-focused selection. Two login tests initially needed updates for the new explicit code step/alert selector and now pass. The artwork failure is not represented as a passing check.

PostgreSQL row-lock/concurrency tests still require a real disposable PostgreSQL database. Docker Desktop was installed but its engine/service was unavailable in this environment; starting the service was denied by the operating system. Offline SQL compilation does not substitute for those runtime checks. No production database or live delivery was used.

### Reproduction and local evidence

The task workspace retains isolated runners and full logs under `platform-whatsapp-code/validation/`; generated databases, screenshots and logs are not committed to the repositories. Backend evidence includes `focused-ab20983f`, `conversation-final-a6a64e7d`, `cleanup-repro-85ae2a62`, `baseline-e36d573f` and `migration-3c4b7a84`. Interrupted suite output and collection manifests are preserved under `full-0-c7c3fa60`, `full-1-19b5fff4`, `full-2-665271a6` and `full-3-49589aa9`.

The isolated Backend runner disables dotenv loading and outbound network calls, allocates a fresh SQLite database for each invocation, and records JUnit results. From the task workspace:

```text
C:/NIHILOBA/Backend/venv/Scripts/python.exe platform-whatsapp-code/backend-tests.py focused test_whatsapp_code_login.py test_dashboard_whatsapp_auth.py test_personal_whatsapp_auth_hardening.py test_personal_whatsapp_auth_postgresql.py test_dashboard_foundation.py test_legal_acceptance.py
C:/NIHILOBA/Backend/venv/Scripts/python.exe platform-whatsapp-code/backend-tests.py conversation-final test_whatsapp_code_conversation.py
C:/NIHILOBA/Backend/venv/Scripts/python.exe platform-whatsapp-code/check-migration.py
```

Frontend checks used bundled Node 24.19.0. The following commands run from the respective repository; start its production server separately before Playwright (NIHILOBA port 3013 with `RESTAURANT_TEST_EXTERNAL_SERVER=1`, Business port 3015):

```text
# NIHILOBA Website
node node_modules/vitest/vitest.mjs run tests/personal-whatsapp-login.test.ts tests/personal-request-origin.test.ts
node node_modules/@playwright/test/cli.js test --config playwright.restaurant.config.ts tests/browser/personal-whatsapp-login.browser.ts tests/browser/restaurant-seller.browser.ts --grep-invert artwork
node node_modules/@playwright/test/cli.js test --config playwright.restaurant.config.ts tests/browser/marketplace-access.browser.ts

# SHIDA Business
node node_modules/vitest/vitest.mjs run tests/login.test.tsx tests/api.test.ts tests/gateway-foundation.test.ts tests/shared-i18n.test.tsx tests/security-foundation.test.ts
node node_modules/@playwright/test/cli.js test --config playwright.auth.config.ts

# Each frontend
node node_modules/next/dist/bin/next build
```

### Main changed files

- Backend: shared challenge model/service, session API, signed webhook guidance, four translation catalogs, migration 0171, focused authentication and conversation tests.
- NIHILOBA: shared Personal login component/copy/browser helper, authentication gateway, unit and rendered login tests, affected Restaurant login test.
- Business: login screen, API client, protected gateway, shared translations, unit tests and the dedicated rendered authentication configuration/tests.
- Documentation: this report in all three repositories, supersession notices in the prior Backend/NIHILOBA login documents, and the approved shared-login policy in the Backend module contract.

Before this batch, a verified WhatsApp message could be exchanged for a session without entering a code on the web, and both clients automatically attempted that exchange. This was the architectural gap. The new mandatory code check is enforced in the shared Backend as well as both clients; it does not broaden account or marketplace authorization.

## Remaining scope and live acceptance

Account recovery after loss of WhatsApp access or a phone change remains a product decision. This batch does not invent a recovery channel. Sessions on the separate Business host retain their existing cookie scope; this is shared authentication policy and identity, not a new cross-domain SSO protocol.

Before live release, complete an authorized real-phone check on both web clients: send the prepared message, receive the localized code, enter it in the originating browser, verify the intended destination and shared marketplace session, reject a wrong/replayed code, and confirm logout/account switching. Inspect deployment logs for absence of authentication secrets without copying their contents into evidence. This remains outstanding.

Suggested commit: `feat(auth): require WhatsApp code entry across SHIDA web login`.
