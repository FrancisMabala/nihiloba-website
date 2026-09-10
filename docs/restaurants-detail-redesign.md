# Public Restaurant/menu redesign

## Scope and implementation

Implemented the updated restaurant-detail-design handoff, using the exact fuller
`restaurant-table-header.png`, not the older hands-only board. One server-rendered
`RestaurantHeader` is shared by populated menu, unpublished menu, menu-fetch error
and establishment information. Withdrawn-parent handling still exits to the safe
unavailable page without identity or actions. No Backend, ordering, authentication,
seller or discovery-artwork changes. No deployment, messages or Git commit.

Desktop introduction places the complete illustration alongside the name; phone
uses a 200px-wide proportional picture. Cream panel tone/brush edges are retained,
not converted to transparency. Menu/Establishment are native document destinations,
preserving the sanitized result back context and current menu page through tab and
language changes. The information route now presents establishment information;
the /menu route presents the menu. Both still perform existing menu/action
eligibility checks. No prefetch or cache contracts were changed.

Scoped row layout aligns prices without turning monetary choices into controls.
Exact decimal strings, CDF/USD, sale-unit wording, optional minima, availability,
component/fixed labels and backend-current dated timestamps remain intact.
Categories link only to items loaded on the current menu page; existing pagination
remains. Zero total shows localized unpublished copy without Page 1/1. Empty later
pages with a nonzero total have a distinct message and retain pagination. Menu
fetch errors have a separate localized retry state and never claim unpublished.

Full supplied schedule windows and exceptional closures remain accessible in a
native keyboard-operable details disclosure. Windows are not grouped or reordered;
overnight windows have an explicit next-day note. No missing day is invented as
closed and no browser open-now calculation is introduced. The current closed/open/
unknown badge comes from the Backend. evaluated_at is labelled status evaluation,
not an owner update or verification badge. Closed hours no longer inherit the
generic green status dot. Information-only establishments omit empty Business
affiliation blocks; eligible Business links are preserved on the information tab.

Existing eligible WhatsApp, menu, save and follow links retain their exact URLs
and explicit SHIDA confirmation/reporting instructions. No fixed mobile action
bar is introduced, so nothing overlays content or keyboard focus. On phones the
practical-information/actions panel follows the menu in normal document flow.
Language names are centralized; both affected selectors say exactly **Lingala**,
with locale ln and translated content preserved. Broader site localization is not
claimed complete.

## Files

- `app/components/shida/restaurants.tsx`: shared header, tab routes, compact menu rows, conditional states and disclosure.
- `app/components/shida/restaurant-detail.css`: styles scoped to public detail only.
- `app/lib/restaurant-detail-copy.ts`: four-language state copy and shared language names.
- `app/components/shida/restaurant-discovery-controls.tsx`: language-name reuse only.
- `public/images/restaurants/restaurant-table-header*` and README: exact master and three WebP variants.
- `scripts/restaurants-fixture-fetch.mjs`: isolated detail fixtures, never imported by production application code.
- `tests/browser/restaurant-detail-design.browser.ts`: state/viewport/continuation regression checks.
- `tests/restaurants-marketplace.test.tsx`: localized empty state and shared-artwork checks.

## Validation and image delivery

Supported runtime Node 22.23.2, Next 16.3.4. Final commands/results:

- `node node_modules/typescript/bin/tsc --noEmit`: passed.
- `node node_modules/eslint/bin/eslint.js`: passed without warnings.
- `node node_modules/vitest/vitest.mjs run`: 255 passed, 23 files.
- `node node_modules/next/dist/bin/next build`: passed, 80 static pages.
- `node node_modules/@playwright/test/cli.js test -c playwright.restaurant.config.ts restaurant-detail-design.browser.ts restaurant-discovery.browser.ts`: 16 passed on the final production build.
- `git diff --check`: passed.

Browser tests use local production Next with the
existing isolated fixture fetch adapter; external browser network requests are
blocked. This is real browser rendering of mocked public data, not live delivery
or physical-device acceptance.

Chrome DPR 1, fresh responses; Resource Timing encoded body / transfer bytes:

| Width | Display width | Selected WebP | Encoded bytes | Transfer bytes |
| --- | ---: | --- | ---: | ---: |
| 390px | 200px | 240 | 7,370 | 7,670 |
| 768px | 280px | 480 | 23,286 | 23,586 |
| 1440px | 420px | 480 | 23,286 | 23,586 |

Identical sources and image bounding boxes verified for populated, empty and
information states, including expanded hours. Original 2,263,106-byte PNG is not
downloaded by the page. Larger DPR variant is 73,542 bytes; physical/high-DPR
measurements were not performed. Transfer numbers include browser-reported HTTP
overhead, not mobile billing or CDN measurements.

Screenshots saved to ignored local `.s3a-local/`:
`detail-populated-{390,768,1440}.png`, `detail-empty-{390,768,1440}.png`, and
`detail-information-{390,768,1440}.png` (hours expanded).

Checks exercise no overflow, same art/proportions, menu near the introduction,
unit/amount/unknown price states, Personal ownership, unknown hours, overnight
windows/closures, keyboard disclosure, four-language navigation, tab/page/back
context, exact menu retry, withdrawn-parent removal and exact eligible action
URLs. Existing discovery browser coverage is rerun for filters, pagination,
Business-navigation entry, empty/error states, missing photos and locales.
No live WhatsApp link was followed. Native-language editorial review and live
Backend acceptance remain separate. Mockup food/prices were not added to real data.

Suggested commit: `feat(restaurants): redesign public menu with shared illustrated header`
