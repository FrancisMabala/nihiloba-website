# Visible SHIDA sign-in on public pages — 17 October 2026

Current navigation update: [Services account navigation, 21 October](services-account-navigation-2026-10-21.md)
moves customer requests and received bills into Mon espace and checks provider
access before showing its destination. Public visitors see a text sign-in button.
The authentication and private-data boundaries described here are unchanged.

## Gap and change

The shared WhatsApp code login already worked inside protected marketplace pages.
The public website header exposed shopping and navigation but no SHIDA sign-in
entry. Visitors therefore had to discover a protected destination before signing
in. The Services links to provider management and bill notices were not a clear
platform-wide login entry.

The shared public header now shows a prominent **Sign in** button on SHIDA routes,
including the SHIDA home, Services and the other public marketplaces. The button
remains visible outside the collapsed mobile navigation. Other NIHILOBA pages
retain their existing navigation. Seller management retains its existing shell.

Sign-in opens a native accessible dialog on the current page. It reuses
`PersonalWhatsAppLogin`: send the prepared WhatsApp message, receive the code,
return to this web page and enter the code. Signing in preserves the current URL,
filters and language. Public browsing remains available without signing in.
Closing the dialog abandons its local form; it does not complete sign-in.

After session validation, the button becomes **My account**. Its dialog displays
the account name and provides continuing browsing, using another account and
sign-out. All actions reuse the shared Personal session and existing serialized
logout flow. Identity refreshes on focus and account-change events; obsolete
responses are rejected, and failed logout never restores an uncertain account.
EN/FR/LN/SW account wording follows the current route language.

## Boundaries and files

This adds a visible entry, not a new authentication protocol. Backend code,
cookies, WhatsApp message handling, code verification and marketplace permissions
are unchanged. Nothing in browser storage contains account identity or login
secrets. No new dependency, environment variable or database migration is needed.
Platform-wide bill aggregation remains separate work.

- `app/components/header.tsx`: SHIDA-route detection and account button placement.
- `app/components/shida/public-account.tsx` / `.css`: dialog, session display,
  existing sign-out integration and responsive styles.
- `app/lib/public-account-copy.ts`: four-language copy.
- `tests/public-shida-login.test.tsx`, `tests/browser/public-shida-login.browser.ts`
  and `playwright.public-login.config.ts`: focused fixtures and coverage.

## Validation and release

Focused validation passed on 17 October 2026:

- **106 unit tests** across public-header rendering, existing WhatsApp/session
  contracts and Services checks.
- **14 browser tests**: ten public-account journeys and four existing public
  Services discovery/empty/unavailable checks. Desktop and mobile widths include
  1440, 1024, 820, 390, 360 and 320 pixels; account entry covers EN/FR/LN/SW.
- Production build, including TypeScript validation, passed. Scoped ESLint passed
  with no warnings. Task-scoped diff and file-integrity checks passed.
- Browser checks verify explicit code submission, wrong-code correction,
  foreground return from WhatsApp, unchanged filters/URL, no automatic login on
  dialog dismissal, keyboard dismissal/focus return, account replacement,
  session expiry, failed logout and retry, and absence of identity/code storage.
- The initial browser run used a different port from the existing discovery
  assertions. Aligning the fixture configuration with port 3027 resolved those
  three test-only failures; the final complete focused run passed all 14.

Browser checks use synthetic sessions and codes, block external requests, and
never send a real WhatsApp message. The public Services fixture process is isolated
from production. No Backend or full platform suite was run for this frontend-only
entry change. Screenshots and a validation record are saved under
`docs/evidence/public-shida-login/`; desktop/mobile screenshots were visually checked.

Deploy the website after a separately authorized push. The backend must already
run the previously released WhatsApp code contract (migration 0171 or later).
This UI change does not apply or require an additional migration. Real-device
WhatsApp acceptance remains a deployment check.

Suggested commit: `fix(auth): expose SHIDA sign-in on public marketplace pages`.
