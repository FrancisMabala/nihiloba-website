# Phase 2 public discovery

## Audit and implementation strategy

Inspected the website collection/detail components, public API client and parsers,
backend `routes/public_marketplace.py`, public projection services, and Wewa
conversation/command routing. Existing account and transaction boundaries remain
authoritative. The website release starts from b488282, in an isolated worktree.

| Marketplace | Actual discovery and workflows | Design response |
| --- | --- | --- |
| Wenze | Separate shop and product endpoints; product category, condition, price/currency, variants, location, stock and cursor filters. Cart, negotiation and orders already exist. | Product-first entry with explicit shops view; category-aware facts and public shop links; bounded cursor navigation. |
| Restaurants | Query/name/dish, city/area, establishment type, service mode, open-now, paginated results. Menus, reviews and capability-gated orders already work. | Compact food search, visible dish discovery, separate restaurant/menu presentation, accurate hours and menu links. |
| Services | Query/provider, city/area/commune, category, public-place location type and verified rating filters. Category-specific offerings and request flows already exist. | Compact category discovery, preserve request entry, portfolio-led creative services and compact practical services. |
| Employment | Keyword, city/area/commune and pagination only. Professional/private tabs currently filter one returned page, not the whole database. | Structured text-first cards and clearly scoped page views; no invented salary/contract API filters. |
| Apartments | Keyword, city/area, property type, rooms and price filters with pagination. Public projections and official visit links. | Image-led cards and accessible filters/reset. No invented amenities or private contacts. |
| Hotels | Backend supports query/city/area, room inventory count, rental period and bounded limit. Website previously filtered a default subset locally. No public date availability API. | Send supported filters to backend; distinguish offered inventory from confirmed availability and show room price periods/currencies accurately. |
| Wewa | Public page is informational, but WhatsApp command `wewa` routes to guarded pickup/destination and driver acceptance. No public driver directory or web dispatch API. | Compact actionable WhatsApp entry, clear send-message instruction; no fake map, fares, or web booking. |

Shared strategy: reuse existing controls/cards and public API validation, replace
promotional headers with a small title/description component, and scope responsive
layout improvements to public collections. Preserve canonical URLs, query state,
public eligibility, permission checks and all management/transaction components.
GET forms and server rendering keep discovery usable with minimal JavaScript.
No backend schema, ownership, entitlement or lifecycle changes are planned.

## Limitations to preserve

- Hotel inventory counts are not date-specific availability. Do not add dates or
  guest filters to an API that does not support them.
- Job type views apply to the current result page until the backend supports a
  server-side offer-type filter; explain that scope.
- Apartment price filters have no currency parameter in the existing API.
- Transport company subscriptions and web dispatch remain deferred.
- Restaurant dish search returns matching establishments; inspect dishes/prices
  through each live menu without fan-out requests for every result.

Validation and release evidence are recorded below after execution.

## Implemented result

- Wenze now opens the existing product catalog at its canonical landing URL.
  Shops remain available under `?view=shops`, with bounded cursor continuation.
  Product cards retain cart/negotiation controls, show shop identity and supplied
  category/condition/variant facts. Fashion uses portrait imagery; electronics
  uses contained product imagery. No invented brand/specification fields.
- Restaurants exposes dish search alongside keyword and location. Establishment
  types, opening status, service modes, verified review summaries, menu links,
  pagination and return query context remain intact.
- Services retains category/rating/location filters and the “describe my need”
  request entry. Creative categories can show portfolios; practical categories
  use compact information. Missing photos no longer create large placeholders.
- Employment retains structured professional/private cards, salary visibility,
  anonymous employer privacy, applications and pagination. A short explanation
  makes the existing page-scoped professional/private views explicit.
- Apartments retains published images, monthly rent, supplied property facts,
  property filters, pagination and visit links; basic searches now have a visible
  reset without opening advanced filters.
- Hotels sends supported search fields to the existing backend. Room counts are
  described as offered inventory, not date availability. Starting prices are
  grouped by currency and rental period, avoiding false cross-currency minima.
- Wewa now links to the implemented `wewa` WhatsApp command, explains that the
  prepared message must be sent, and describes pickup/destination/acceptance.
  No request is submitted by merely viewing the page or opening WhatsApp.

Shared changes are `MarketplaceDiscoveryHeader`, collection-only CSS, localized
discovery copy, and small improvements to existing cards and public API adapters.
The Phase 1 homepage, Business Dashboard, onboarding, authorization and lifecycle
services were not redesigned. Existing API DTO allowlists and safe URLs remain.
The Business module projection was inspected: activation and effective access
remain separate checks; no discovery link grants operational access.

## Localization, accessibility and performance

All seven collection routes were exercised in EN/FR/LN/SW. Wenze, Employment,
Apartments and Hotels now recognize LN/SW for collection controls and navigation
instead of silently choosing English. Existing older detail/transaction surfaces
retain their EN/FR fallbacks; a full translation of those flows is a separate
follow-up. User-authored listing content is not automatically translated.

GET forms retain filters and work without client-side search state. Existing
semantic labels, focus outlines, 44px action targets, result announcements and
empty/error states remain. No page-level horizontal overflow was observed at
390, 820 or 1440 pixels. Category rows intentionally scroll within their own
container on mobile. No new dependencies, animation or background queries.
Promotional hero image requests were removed from all seven landing pages.
Product/shop pagination stays bounded; Hotels retains its backend limit of 20
and has no invented pagination or date-availability API.

Canonical collection URLs omit filter parameters. LN/SW collection canonicals
and language alternates were added where the old collection only recognized
EN/FR. Existing detail metadata, indexing and transaction boundaries remain.

## Validation — 22 October 2026

- Production Next.js build including TypeScript: passed.
- ESLint for all changed TypeScript and browser verification code: passed.
- Focused discovery and transaction regression run: **223 passed, 4 failed**.
  All four failures were reproduced in the unchanged b488282 baseline:
  three outdated Wenze store-detail presentation expectations (product count
  text, legacy store-type element, expandable description), and one cart-copy
  expectation (“Calculated in WhatsApp”). No failing test was skipped or removed.
- Browser: **84 collection views** (7 markets × 4 languages × 3 widths), six
  submitted searches, retained hotel filters and the shops view passed.
- Public product, restaurant, service, job and apartment detail pages returned
  HTTP 200 with one settled heading. No published hotel was available for a live
  hotel-detail check; hotel cards/price grouping are covered with public DTO
  fixtures. These tests do not submit production orders, bookings or requests.
- Four-language rendering, backend hotel filter forwarding, malformed filter
  bounds, currency/period grouping and Wewa handoff have focused automated tests.
- Evidence: `docs/evidence/phase2/verification.json` and desktop/mobile PNGs for
  all seven markets in the same directory. Images show actual published API
  records, including existing records whose owners named them “Test”. No sample
  listings were inserted for the redesign.

## Release and Phase 3

Website-only release; no migrations, environment variables, secrets, cron jobs,
workers, templates or backend/Business commits. Render currently requires a
manual deployment of the exact website commit; confirm its Live status and rerun
the browser checks against `https://nihiloba.com` after deployment. Production
verification output is kept in ignored `test-results/phase2-live` so verifying a
release does not require another release commit.

For Phase 3, prioritize My Space task navigation and return-to-action behavior,
clear Personal/Organization context, mobile pending-action lists, consistent
status wording and the remaining LN/SW transaction translations. Fix the four
baseline test expectations alongside the corresponding management/detail review.
Server-side job offer-type filtering, date-specific hotel availability, and
transport web dispatch require separate backend/product work.
