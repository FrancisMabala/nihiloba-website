# Restaurants & Malewa — La frise peinte

Historical evidence: artwork and shallow crop superseded by
`restaurants-table-partagee.md`. Keep the validation below as the previous state,
not the current design or transfer measurements.

Implemented locally, 2026-09-10. No deployment, Git commit, Backend changes or messages.

## Change and reference fidelity

- `app/components/shida/restaurant-discovery.tsx`: full-width decorative picture between introduction and search, outside the existing aligned containers. Shared EN/FR/LN/SW component, no translated text baked into artwork.
- `app/components/shida/restaurant-discovery.css`: reserved 100px phone, 140px tablet and 160px desktop band; 12/20px search gap. Existing typography, header, logo, controls and listing data remain unchanged.
- `public/images/restaurants/liboko-*`: unchanged approved master plus seven Sharp WebP derivatives; provenance, crop rectangles and file sizes in the adjacent README.
- `tests/browser/restaurant-discovery.browser.ts`: extends existing viewport checks with decorative alt, responsive source/transfer measurements, full width, reserved height and placement checks. Existing discovery interactions retained.

Used the supplied standalone asset as directed by the design notes, not the
complete mockup. It was already generated before this task and is not a
pixel-identical extraction of the reference. No regeneration here. The deliberate
deviation is a shallower crop, with dedicated mobile/tablet compositions. Kwanga,
leaf parcel and red pepper remain recognizable; yellow/blue accents retained.
Some outer/top/bottom painting is cropped to keep the search and results close.
No interface pixels, animation, added library, tracking or listing-photo substitution.

## Final validation

Node 22.23.2 (supported runtime). Executed the installed package commands directly:

- `node node_modules/typescript/bin/tsc --noEmit`: passed.
- `node node_modules/eslint/bin/eslint.js`: passed without warnings.
- `node node_modules/next/dist/bin/next build`: passed, 80 static pages generated.
- `node node_modules/vitest/vitest.mjs run`: 251 tests / 23 files passed.
- `node node_modules/@playwright/test/cli.js test -c playwright.restaurant.config.ts restaurant-discovery.browser.ts`: 12 passed against the final production build.

Actual headless Chrome rendering against the local Next production server with
the existing isolated Restaurant fixture fetch adapter. Browser external requests
blocked. This verifies fixture journeys, not live Backend data or deployed acceptance.
Checked combined search filters and native keyboard details, pagination, menu and
detail/back query preservation, language selection, all four discovery locales,
missing photos/menu, unknown/open/closed states, empty results, unavailable target,
error retry and preservation of filter values. Existing visible controls meet 44px
height assertions. No horizontal overflow at any tested width. Empty alt excludes
the artwork from the accessible image content; no new focusable control.

## Measured image transfers

Chrome Resource Timing on fresh local page loads, DPR 1, viewport height 900px.
`transferSize` includes browser-reported response overhead, not a cellular billing estimate.

| Width | Selected WebP | Encoded body bytes | Transfer bytes | Search top | First result top |
| --- | --- | ---: | ---: | ---: | ---: |
| 390 | mobile-480 | 20,956 | 21,256 | 426px | 811px |
| 768 | tablet-960 | 51,398 | 51,698 | 442px | 756px |
| 1440 | desktop-1440 | 61,630 | 61,930 | 479px | 747px |

First card begins within the 900px test viewport; shorter phones need a small
scroll. Higher-DPR devices can select the larger variants listed in the asset
README; physical-device/high-DPR measurements were not performed. The master
PNG was never downloaded. Existing routed cold/warm test disables browser cache,
so its repeated downloads are not claimed as real cache-reuse measurements.

Final production screenshots saved and visually inspected:

- `.s3a-local/discovery-390.png`
- `.s3a-local/discovery-768.png`
- `.s3a-local/discovery-1440.png`

These are local ignored artifacts, not production assets. Earlier dev inspection
showed the existing React development eval/CSP warning; final screenshots use the
production server without the dev overlay. No security policy was weakened.

Suggested commit: `feat(restaurants): add responsive La frise peinte discovery banner`
