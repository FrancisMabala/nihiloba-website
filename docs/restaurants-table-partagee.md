# Restaurant discovery — La table partagée

## Implementation

Replaced the previous liboko image in the existing single decorative picture.
Used the exact supplied `restaurant-marketplace-scenes/03-la-table-partagee.png`;
no generation, alternate concept, crop or stock image. Full hands, passing bowl,
dishes, table and brush edges remain visible at each inspected width. The opaque
cream background is retained; its slight tone difference from the page is visible
as a quiet cream panel, not treated as transparency. Centered maximum width 720px
keeps the scene restrained without imposing the old shallow fixed heights.
Natural 2170:725 proportions, empty alt and reserved dimensions are shared by all
EN/FR/LN/SW discovery routes. Search spacing remains 12px mobile / 20px elsewhere.
No discovery behavior, listing imagery, API, authentication, seller, ordering,
analytics, logo, typography or navigation changes.

Changed files:

- `app/components/shida/restaurant-discovery.tsx`: replace picture sources with responsive table artwork.
- `app/components/shida/restaurant-discovery.css`: proportional, uncropped sizing instead of fixed-height cover crop.
- `public/images/restaurants/table-partagee*`: original plus four optimized WebP variants (sizes/provenance in adjacent README).
- `tests/browser/restaurant-discovery.browser.ts`: update existing checks for single banner, natural ratio, contain, new requests and screenshots.
- Asset README, historical banner report status, and this report.

Older liboko assets retained, unreferenced by the component; no second banner.
Existing dirty `docs/personal-whatsapp-rollout.md` left untouched.

## Final-state checks

Supported Node 22.23.2; Next 16.3.4. Executed installed commands directly:

- `node node_modules/typescript/bin/tsc --noEmit`: passed.
- `node node_modules/eslint/bin/eslint.js`: passed without warnings.
- `node node_modules/vitest/vitest.mjs run`: 251 passed, 23 files.
- `node node_modules/next/dist/bin/next build`: passed; 80 static pages.
- `node node_modules/@playwright/test/cli.js test -c playwright.restaurant.config.ts restaurant-discovery.browser.ts`: 12 passed against local production build.

Actual Chrome rendered journeys used the existing isolated server fixture adapter,
with external browser requests blocked. Verified combined filters, native keyboard
details interaction/focus, pagination, menu/detail/back state, language selection,
all four locales, missing-photo fallback, opening-status labels, multiple/empty
results, failure/retry and unavailable detail. Visible control height assertions
remain >=44px. No horizontal overflow. No new focusable content in the decoration.
Visually inspected screenshots at 390, 768 and 1440px for full composition, cream
edges, spacing and readable controls; no crop needed on phones.

## Actual transfer measurements

Fresh local production-page loads in Chrome, DPR 1, viewport height 900px.
Resource Timing transfer includes reported response overhead; not a cellular
usage or deployed-CDN measurement.

| Viewport width | Chosen image | Encoded bytes | Transfer bytes | Search top | First card top |
| --- | --- | ---: | ---: | ---: | ---: |
| 390 | table-partagee-480.webp | 25,882 | 26,182 | 456px | 842px |
| 768 | table-partagee-720.webp | 52,974 | 53,274 | 543px | 857px |
| 1440 | table-partagee-720.webp | 52,974 | 53,274 | 560px | 827px |

Rendered artwork is approximately 130px high on the phone and 241px on larger
screens. First results begin within the 900px test viewport; shorter screens need
a small scroll. Higher-DPR variants are provided but physical-device/high-DPR
transfer measurements were not performed. Neither original PNG nor old banner
assets downloaded. Existing routed cold/warm test disables browser caching, so
its numbers are not evidence of real repeat-visit caching.

Saved final screenshots (local ignored artifacts):

- `.s3a-local/table-partagee-390.png`
- `.s3a-local/table-partagee-768.png`
- `.s3a-local/table-partagee-1440.png`

This is local fixture-based acceptance, not live Backend/deployment acceptance.
No deployment, commit or WhatsApp message performed.

Suggested commit: `feat(restaurants): replace banner with La table partagee artwork`
