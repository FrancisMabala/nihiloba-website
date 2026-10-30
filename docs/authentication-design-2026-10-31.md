# Authentication design and passkey pilot

Implemented on a feature branch; not deployed. The approved cream/forest design
now covers the sign-in modal, six-position WhatsApp verification field, compact
desktop account dropdown and mobile bottom sheet. EN/FR/LN/SW use existing locale
selection. One native OTP input preserves paste, backspace and autofill while six
cells show the digits. Expiry comes from the server response, not a fixed claim.

The existing WhatsApp prepared-message, webhook/code and cookie-session flow is
preserved. Opening WhatsApp alone does not sign in. Existing account switching,
sign-out, public browsing, registration feature gate and lost-phone recovery remain.
No email login, password, new account type or fabricated profile context is added.

## Passkey boundary

New BFF route `/api/shida/personal/auth/passkey/[action]` supports capabilities,
options, verify and cancellation. It uses strict same-origin checks, no-store
responses, bounded input, an HttpOnly attempt cookie and the existing session cookie.
PasskeyLogin uses the existing cross-tab authentication lock and uncertain-session
cleanup. Browser assertions use the existing passkey serializer and cancellable
WebAuthn ceremony. Errors never create accounts or fall through to automatic login.

`SHIDA_PASSKEY_LOGIN_ENABLED` is false unless explicitly set to true. The backend
must also enable its independent gate. Existing passkey registration was discoverable
and user-verified; compatible mature keys identify the same canonical account. The
existing 24-hour activation delay is retained. Unsupported, missing or lost passkeys
leave WhatsApp/recovery available. Production registration settings are not changed.

## Validation

- 82 Vitest tests passed: passkey gateway, personal WhatsApp login, public login,
  account-security gateways and Services account navigation.
- 50 Playwright browser tests passed: new visuals, virtual-authenticator login,
  cancellation/gating, existing WhatsApp regressions, switching, logout, uncertain
  sessions and all four locales. Screens cover 360, 390, 768 and 1440 pixels;
  existing regressions also cover 320, 1024 and 1366 pixels.
- Production build/TypeScript and scoped ESLint passed.
- Backend: 48 focused tests passed with pinned webauthn 2.8.0, including real signed
  assertions and migration tests. Full backend suite was not run per owner preference.
- Screens use isolated fixtures. Browser passkey success uses a virtual authenticator
  with a mocked BFF; separate backend tests verify real assertion signatures. This
  is not evidence of a real-device production login or live WhatsApp delivery.

## Release plan

Approval for these exact commits is required before production changes. Visuals can
ship with the website gate off. Authentication requires additive backend migration
0209 (explicit migration approval), backend deployment before website, and a bounded
allowlisted pilot. PostgreSQL concurrency is pending because the local Docker engine
is unavailable. Runtime production HTTPS/origin/RP verification and real-device
test-account ceremonies remain required before activation. Do not make passkey the
default until returning-user, lost-device and account-switching evidence is reviewed.

Rollback: turn off the website gate, then backend gate. Preserve enrolled credentials
and the additive database table. Baseline website is 76f1b66, backend ee8a8b50.
Urgent WhatsApp templates are unchanged. See the backend's
`docs/passkey-signin-controlled-rollout-2026-10-31.md` for migration/security details.

Reproduce browser checks after building with the existing registration feature enabled:
set `UX_TEST_URL=http://localhost:3051`, then run
`npx playwright test --config playwright.auth-design.config.ts`.
Evidence is generated under `test-results/auth-evidence` and excluded from source.
