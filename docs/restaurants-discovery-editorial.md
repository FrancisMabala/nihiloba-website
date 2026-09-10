# Restaurant discovery — L’adresse du jour

2026-09-10. Local frontend implementation; no deployment or Git commit.

## Design and scope

Implemented the selected editorial direction on EN/FR/LN/SW public discovery routes:
compact serif introduction, prominent search/city inputs, explicit submission,
native type chips, expandable filters, normal-width desktop cards and compact
horizontal phone cards. Preserved the actual NIHILOBA header/logo/navigation rather
than copying the mockup's fictional header. No fictional restaurants or food assets
were added to production.

The optional decorative photograph is omitted: no new image/font/dependency download
is needed, including on mobile. Existing eligible restaurant photographs still use
the shared responsive Next Image component; absent/failed photos get a small CSS
fallback rather than a generic food photograph. Desktop fallback height is 120px.
Gold accents, forest actions, cream surfaces and restrained rounded borders follow
the approved direction. Single cards do not stretch across the desktop grid.

One four-language selector replaces the competing header switch **only while the
discovery page is present**. It preserves the normalized current query/page and uses
fresh document navigation for eligibility. “Espace vendeur” and equivalent labels
retain the existing Personal seller destination. No authentication/seller code changed.
Shared LN/SW header/footer remain French fallback; this is not complete site localization.

## Preserved behavior

- Existing API client, DTO allowlists, references, no-store, foreground/history
  revalidation and backend-authoritative opening status are unchanged.
- All supported filters remain: query, city, exact name, area, dish/component,
  service mode, five establishment types and open-now. Closed native details retain
  form values; advanced active filters have a count. No keystroke requests, invented
  city list, cuisine, coverage, geolocation or distance ordering.
- Changing a search resets pagination; pagination, language switching, menu/detail
  links, result anchors and retry retain appropriate existing context.
- Collection-only menu summaries distinguish zero published items from unavailable
  items. An absent summary makes no empty-menu claim. No per-card menu requests.
  Actual menu-request failure still uses the existing detail/menu error state.
- Only authoritative `open` has a green dot. Unknown is neutral “Horaires à confirmer”.
- Names/photos link to details; “Voir le menu” links to the existing menu page, which
  supports information-only establishments with an honest empty state.
- Business ownership, exact money, Personal continuations, stable sharing/QR routes,
  hidden/withdrawn-resource handling remain in unchanged detail/menu components.
- No Backend, migration, ordering, ratings, reviews, payments or analytics changes.

## Changed files

- `app/components/shida/restaurant-discovery.tsx`: discovery rendering/form/cards/states.
- `restaurant-discovery.css`: scoped layout and responsive styles; shared detail/menu
  grids are not restyled.
- `restaurant-discovery-controls.tsx`: context-preserving language selector.
- `app/lib/restaurant-discovery-copy.ts`: four-language editorial copy.
- `app/components/shida/restaurants.tsx`: exports the new discovery implementation;
  detail/menu/Business logic preserved.
- `scripts/restaurants-fixture-fetch.mjs`: isolated multiple/status/menu fixture variants.
- `tests/restaurants-marketplace.test.tsx`: updated fallback expectation; collection-only
  menu-summary and privacy regression coverage.
- `tests/browser/restaurant-discovery.browser.ts`: actual browser interactions/screenshots
  and resource measurements against opt-in server fixtures.

## Validation and evidence

Supported Node 22.23.2. Vitest: **230 passed, 22 files**. Typecheck and lint passed.
Production build passed, including 80 generated static pages and dynamic Restaurant
routes. No historical sandbox fetch warning recurred; prior R3B.1 diagnosis is unchanged.
No Backend test suite was run because Backend source/contracts did not change.

**12 browser scenarios passed** on the final state (20.3 seconds). Chrome browser checks use isolated server-side fixtures with external browser requests
blocked, not production listings. At 390×900, 768×900 and 1440×900: no horizontal
overflow, first result begins inside the viewport, normal single-card width, 44px
primary/chip/filter/language/breadcrumb/title/menu controls. Exercised native keyboard
filter expansion/collapse, hidden values on submission, type selection, all four
language routes, pagination, menu → Back → details, exact prices, neutral/open/closed
states, empty/unavailable menu summaries, empty results, unavailable direct target,
and retry preserving query/page. Screenshots visually inspected:

- [Desktop](../.s3a-local/discovery-1440.png)
- [Tablet](../.s3a-local/discovery-768.png)
- [Mobile](../.s3a-local/discovery-390.png)

Screenshots are local ignored artifacts, not production assets. The development badge
reflects the existing React debug-eval/CSP warning; production CSP was not weakened.
Initial test failures were obsolete fallback wording, an optional CDP event type, and
ambiguous selectors seeing both hidden/visible Next revalidation trees; tests now
target the displayed menu without removing eligibility refresh.

Resource measurements use CDP encoded transfer bytes, cache cleared for cold then a
warm repeat of the same 390px, one-card fixture URL, ending at network idle. This is
the **development server**, including dev runtime, not a production performance claim:
**935,962 bytes / 25 requests / 1,149ms cold**, and
**935,963 bytes / 25 requests / 985ms warm**. One optimized site-logo image request;
zero decorative hero/card-photo requests in this missing-photo fixture. No pre-change
baseline or representative real-photo production data measurement was performed.

Reproduce using the existing opt-in fixture preload: `RESTAURANT_FIXTURE_MODE=1`,
`SHIDA_API_BASE_URL=https://restaurant-fixture.invalid`,
`NODE_OPTIONS=--import=file:///C:/NIHILOBA/nihiloba-website/scripts/restaurants-fixture-fetch.mjs`,
local Next dev at 127.0.0.1:3013; run Playwright with
`RESTAURANT_TEST_EXTERNAL_SERVER=1`, `--config=playwright.restaurant.config.ts`,
`restaurant-discovery.browser.ts`. Never put fixture variables in deployment configuration.

Remaining acceptance: real-backend/live-media journey, production-network measurements,
physical device/browser diversity and native-language review. No live messages,
deployment, authentication correction or other marketplace redesign was performed.

Suggested commit: `feat(restaurants): implement editorial public discovery redesign`
