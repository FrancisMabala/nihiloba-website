# Account security and support

29 October 2026 implementation candidate. This document is not deployment proof.

30 October candidate: account settings now show masked verified primary-number
information and canonical profile fields in view mode, with explicit edit/save/
cancel. The private profile API uses the same session binding, exact origin,
no-store transport, canonical backend validation and optimistic revision policy.
It is available independently of the web-registration feature flag.

Optional secondary phone, passphrase and generated code enrollment reuse the
existing passkey/email proof UI. Adding, replacing and removing methods requires
an established independent method; every new credential matures for 24 hours.
The code is shown once in memory and must be stored outside the primary phone.
Passphrases and OTP fields are cleared after use. No credentials enter browser
storage, analytics or prepared WhatsApp messages. Recovery evidence is submitted
through the existing HttpOnly browser-bound report, followed by independent
review, new-number verification, waiting period and session revocation.

Deploy backend migration 0208/APIs first, only after explicit approval. Existing
WhatsApp authentication and urgent templates remain unchanged. Roll back UI code
if needed without dropping enrolled backend credentials. No frontend dependency
or environment variable is added by these account features.

The account space now exposes Help & Support and Account security in EN/FR/LN/SW,
including mobile navigation. Personal tickets use the existing backend support
system for creation, history, replies and closing. No Organization authority is
derived from the Personal cookie or from showing a navigation item.

Account settings add passkey enrollment, recovery-email verification, two-number
WhatsApp verification, pending/cancelled/completed number changes, other-session
revocation, and confirmed Personal account deletion. New methods mature after
24 hours; number changes have an additional 24-hour wait. Number changes always
require a passkey. An established recovery email can authorize other security
actions when the passkey is unavailable. A just-enrolled key/email can finish
initial setup only under the backend's same-browser fresh-login exception.

Lost/stolen-phone reporting is available without login. Its browser authority is
kept only in an HttpOnly Secure SameSite=Strict cookie. Contact-email verification
submits a report; it does not freeze or recover an account. A restricted review
panel is returned only to durable backend Platform Admin principals, requires
independently checked evidence and passkey proof, and cannot transfer Organization
roles. Reviewed recovery verifies the new number and observes the waiting period.

Every gateway has strict path/method allowlists, same-origin controls, bounded
JSON, no-store responses, fixed HTTPS upstream and sanitized errors. Authenticated
gateways require the existing HttpOnly session plus browser-session binding.
Credentials, OTPs and recovery evidence are not placed in browser storage or URLs.
The permissions policy permits first-party passkey ceremonies only. Biometric
verification occurs on the user's authenticator, not on this website.

Backend migration `0206` and `webauthn==2.8.0` are prerequisites. The website adds
no package dependency or secret. The backend retains existing SMTP/template
configuration. Production uses `https://nihiloba.com` as its canonical passkey
origin. Deploy the compatible backend and schema before this website.

Validation: production build and TypeScript passed; all 19 new gateway tests
passed. Browser checks cover eight desktop/mobile language combinations, support
create/reply/close, signed-out reporting, and a real Chromium virtual-authenticator
registration followed by recovery-email step-up. The virtual authenticator uses
localhost; WebAuthn correctly rejects an IP-address relying-party fixture.

The isolated current unit suite returned 674 passing and eight failing tests.
Unchanged main returned 655 passing and the same eight failing tests, covering
existing discovery/boutique/cart presentation assertions. Whole-repository lint
also reports four existing React-effect errors in Restaurant components; changed
files pass targeted lint. These are not represented as passing global checks.

The initial dependency audit reported eight findings, including critical Next.js
remote-code-execution advisories. The release therefore updates Next.js and its
ESLint configuration to 16.4.3, Sharp to 0.35.5, Vitest to 4.1.12, and compatible
transitive fixes. A fresh npm ci succeeds and npm audit reports zero vulnerabilities.
Linux SWC and Sharp optional binaries remain present in the reproducible lockfile.
See the [Next.js advisory](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw)
and [Sharp advisory](https://github.com/lovell/sharp/security/advisories/GHSA-wq5f-xc86-pv6w).
