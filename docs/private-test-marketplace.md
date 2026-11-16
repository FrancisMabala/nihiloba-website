# Private test marketplace

Selected testers can use ordinary Wenze, Restaurants, Hotels and Services screens
with Owner-designated test businesses. The header offers **Ouvrir le marché de
test** after signing in with a full test Personal account. The private view shows
test content only; **Revenir au marché public** permits browsing ordinary content.
Test purchases/bookings cannot target ordinary businesses. Names do not need a
special prefix. All labels are available in FR/EN/LN/SW.

Configure participants and businesses separately in Admin → **Comptes de test**.
The option that only hides public Personal publications does not enroll a tester.
Normal verified sign-in and organization authority remain required. Publish and
configure test listings normally in the seller/Business tools; test classification
does not satisfy missing prices, stock, availability, rights or plan features.
WhatsApp continuation must use the tester's verified number. Never use the SHIDA
service number as a customer identity.

## Request handling

- The mode endpoint requires exact same-origin, the current non-credential Personal
  session binding and backend-confirmed `test_data`. Exit works even after expiry.
- Explicit activation stores the current canonical session in a host-only HttpOnly
  cookie at `/`, Secure in production, SameSite Strict, with a one-hour lifetime.
  A separate non-secret display flag contains no identity. The original Personal
  session's scope/path are unchanged. Logout/new sign-in clear both mode cookies.
- Reviewed discovery requests use `/api/dashboard/test-marketplace`; credentials
  are sent only to the configured backend, with redirects prohibited. Every
  backend read checks current identity/designation. A failed private request never
  retries publicly. Private pages are private/no-store/noindex. Backend and BFF
  JSON responses vary on Cookie; Next.js owns the HTML RSC Vary header, so HTML
  privacy relies on prohibiting storage, not partitioning a shared cache key.
- Public sitemap and homepage discovery explicitly use anonymous public data.
  Query builders shared with client components do not import server transports.
- Normal and test Wenze carts use different HttpOnly cookies. The backend binds
  private carts and restaurant visits to the exact tester; anonymous bearers and
  other testers cannot resume them. Restaurant guest requests forward only the
  canonical Personal session and scoped visit cookie, never Business/arbitrary
  cookies, so signed-in testers cannot submit real guest orders with mode off.
- On sign-out/account change or mode expiry, open private pages reload outside
  private mode. The mode is not seller authority and is not an alternative login.

## Release and checks

Release backend migration `0249_private_test_guests` and matching APIs first, then
the website. No Admin update or new enrollment environment variables are required.
Do not activate against an older backend. Existing checkout flags still apply.
No production records are changed by this source change.

Focused unit coverage is in `tests/test-marketplace.test.ts`, plus affected public
clients, guest/cart gateways, session-cookie and sitemap tests. Browser coverage
uses `playwright.private-test-marketplace.config.ts` and the synthetic process-local
fixture. It checks anonymous/private separation, switching, HttpOnly cookies,
cache headers, mobile layout and discarding private pages after sign-out. The
fixture permits only its synthetic API and loopback; it does not contact production.

After release verify real sign-in, private listing discovery for each selected
tester, anonymous exclusion, and existing seller screens. Transactions should
be exercised only against operator-selected synthetic listings, with no real
payment provider. Backend documentation covers durable provenance and forward
recovery; do not erase that ledger or bypass normal cleanup blockers.

Local validation on 16 November 2026: 85 affected unit tests passed, followed by
successful typecheck, focused lint and production webpack build. Two browser
scenarios at 390px and 1440px passed, including anonymous/private separation,
switching, shared-browser sign-out, cookie protection, non-caching and panel
layout. Next owns the HTML RSC Vary header; checks assert private/no-store rather
than assuming a custom HTML Vary survives. Private mode JSON does vary on Cookie.
No full suite, deployment or production transaction was run. Existing dependencies
and the installed Chrome were reused; webpack's local disk cache was temporarily
disabled for validation only because the laptop was low on space.
