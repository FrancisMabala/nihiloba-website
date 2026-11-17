> Historical first batch. [Participation improvements](meda_improvements.md) supersede anonymous discovery and initial channel limitations.

# SHIDA Meda — first web delivery

17 November 2026. Scope approved by the owner: listings and private enquiries,
with payment arranged between users. The canonical specification is in the
backend repository at `docs/business_modules/meda.md`.

Routes: `/shida/meda/`, `/fr/shida/meda/`, `/ln/shida/meda/`, `/sw/shida/meda/`.
The shared marketplace header includes Meda. The existing Personal login and
per-login session binding protect publishing and enquiries. Public browsing
remains anonymous. Account changes remount the private workspace; content and
credentials are not stored in browser storage.

## Included

- Public offers/requests for luggage, airport help and container space, filtered
  by category, side, route and departure date, with pagination.
- Private listing creation/editing, explicit review/publication and closure.
- Existing localized country selector, UTC conversion of local date inputs,
  kg/m³ capacity and optional indicative currency/price basis.
- Private enquiry creation, replies, unread counts, previous messages and closure.
- EN/FR/LN/SW labels and errors, loading/empty/retry states and mobile layout.
- Clear payment-arranged-between-users wording, no booking or shipment guarantee.

The web gateways allow only Meda paths, bound request sizes and query keys,
reject cross-site mutations, verify the Personal cookie/session binding and
forward only the backend authentication cookie. Private results are no-store.
Meda replies use its source-authorized adapter over shared thread/read-cursor
tables. They are available in Meda's enquiries tab; proactive notifications,
global inbox aggregation and Organization management are deferred.

## Validation

- Final validation: 1,088 website unit tests across 151 files pass, including
  11 new gateway/copy checks. Typecheck and lint pass with Node 24.22.1;
  lint reports 41 existing warnings and no errors.
- After merging current main, including assistance and the Next.js 16.4.6 security
  patch, the normal production Turbopack build passes in a disposable source copy
  with matching patched dependencies, a synthetic API target and no dotenv files.
  Initial dependency-junction resolution limits were confined to the first local
  checkout; the final validation uses a physical dependency copy.
- Ten production-build Playwright checks pass: discovery/private enquiry in four
  languages at 390px and 1440px, explicit draft publication, and anonymous access.
  Browser HTTP responses are synthetic fixtures, not live backend acceptance.
- [Mobile enquiry](evidence/meda/enquiry-390.png) and
  [desktop enquiry](evidence/meda/enquiry-1440.png) are synthetic visual evidence.
- The upstream [Next.js security patch](next-security-20261117.md) is preserved;
  Meda introduces no additional dependency changes.

## Release dependency

Deploy only after the matching backend and migration `0251_meda` are live.
Production Render tracks `main` with automatic deployment disabled; deployment
has not been requested. Backend deployment runs migrations and needs explicit
production database authorization. No new env variable, secret, dependency,
worker, cron or external message delivery is introduced.

The original checkout's dependency junction is preserved. Final patched validation
uses `C:/Users/mabal/AppData/Local/Temp/shida-meda-final-lrezq0u1`; it must not be
confused with the earlier dependency installation. Source and visual evidence are
retained in `C:/NIHILOBA/meda-website`.
