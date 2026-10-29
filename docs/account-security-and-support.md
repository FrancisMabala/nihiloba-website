# Account security and support

29 October 2026 implementation candidate. This document is not deployment proof.

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

The dependency audit reports eight pre-existing findings (one critical, five high,
two moderate), including Next.js and Sharp. Package manifests and lockfiles are
unchanged in this candidate; this work does not claim to remediate those findings.
