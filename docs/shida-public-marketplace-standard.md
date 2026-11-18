# SHIDA public marketplace presentation standard

## Scope and references

This contract derives from the existing Wenze, Emplois, Services, Wewa / Transport,
Appartements and Hôtels discovery pages. Logement includes both housing markets;
their names, filters and rental rules are unchanged. Restaurants and Meda adopt the
same presentation foundation. It is not a new marketplace or a management rollout.

The exact collection routes `/shida/{wenze,emplois,services,transport,appartements,
hotels,restaurants,meda}` and their FR/EN/LN/SW equivalents opt in through
`SiteChrome`'s `data-public-marketplace` attribute. Details, account pages, creation,
seller workspaces, School, corporate pages and printed documents retain their own
layout contracts. Meda's existing query-based detail view retains the public shell;
its embedded account forms do not opt in.

## Adopted values and component rules

| Role | Value / behavior |
| --- | --- |
| Public canvas / ink | `#faf8f2` / `#173e32` |
| Surface / subtle border | `#fffefa` / `#e0dfd6` |
| Desktop hero | Flat `#faf5ef`, 14px radius, 28px × 30px padding, 24px column gap |
| Page width | Maximum 1180px content width; 16px side gutters on phones, 24px above |
| Title | Existing Georgia serif; desktop `clamp(2rem,3.2vw,3rem)`, 600 weight; mobile 1.75rem (28px at default text size) |
| Lingala slogan | Existing market accent and serif on larger screens; mobile .9375rem sans-serif, forest ink; never translated or removed |
| Operational information | Existing Arial/sans stack; no font dependency; form values at least 16px on compact screens |
| Controls | Minimum 44px touch height, visible focus; no clipped labels or mid-word fragmentation |
| Rhythm | 8px between adjacent controls/chips, 12–16px between compact control groups and results |
| Selected bottom destination | Pale green `#e0ebd1`, forest icon/text, equal-width items and aligned icon rows |
| Backgrounds | Flat surfaces; remove decorative invitation/photo-placeholder gradients within collections |

`IllustratedMarketplaceHero` remains the single hero component. Art is decorative
and preserves its aspect ratio. Do not add a dark-green hero or a new illustration.
Use meaningful section headings; public titles stay visible and semantic, unlike
redundant management landing headings.

## Responsive contract

- **Below 768px:** unboxed compact hero, no decorative art, visible title and slogan;
  search and actionable content take priority. Existing two-column product grids,
  restaurant rows, job cards and route-search fields retain their data-specific form.
- **768–1023px:** colored hero and art return; medium-width controls reflow; global
  bottom navigation remains available. Navigation placement is not tied to whether
  a page happens to contain a `.marketplace-public` descendant.
- **1024px and wider:** existing desktop navigation, no bottom bar; colored hero
  and search/result widths use the shared content container.
- Bottom clearance follows the actual navigation height, including translated
  labels, text enlargement and safe area. The existing visual-viewport keyboard
  behavior is preserved. Footer links remain reachable above the bar.
- Chips scroll within their own container when needed; fields and buttons wrap
  without making the entire document scroll horizontally. No fixed text heights.

## Explicit workflow exceptions

- Meda and Transport retain their short explanatory introduction on phones because
  their participation/handoff model needs context. Meda retains its signed-out gate,
  member discovery, origin/destination inputs, capacity units, price basis, agreements,
  private enquiries and canonical account destinations. Do not grant public access
  to restricted listings merely to resemble Wenze.
- Each marketplace retains its icons, accent, search parameter names, permission
  checks, labels, empty/error/loading states, pagination and WhatsApp destinations.
- Existing results differ legitimately: product grids, job cards, property imagery,
  provider lists and transport handoffs are not replaced with one generic card.

## Enforcement and review

Shared CSS enforces the palette, hero geometry, responsive boundaries, public chrome,
flat surfaces and navigation clearance. Module styles continue to own content layout.
Review must verify state truth, full translations, useful introductions, touch/focus
behavior, privacy, preserved URLs and functional search. Inheriting a token alone is
not evidence that an entire marketplace or authenticated workflow was tested.

Validation uses identical synthetic fixtures for before/after captures at 390×900
and 1440×900; browser checks include narrow phones, tablet, boundary widths, desktop,
all four locales and 200% text. Physical Safari, OS keyboards and browser-toolbar
animations must be reported separately from Chromium emulation.

## Implementation evidence — 18 November 2026

Baseline: Website `3ee2575cbcc82ddc929d2ee8cdda149609319b83`. The earlier
responsive rollout targeted management pages. Public Meda additionally overrode
the shared hero with a transparent background and independent title/slogan sizes.
Public compact chrome depended on a `.marketplace-public` descendant that Meda
did not have. These source differences explain the mismatch; browser cache was
not established as a cause.

The route marker in `app/components/site-chrome.tsx` now opts in all eight
collections. `app/components/shida/public-marketplace-standard.css` owns their
shared presentation. `marketplace-mobile.css` uses the same marker and 768px
compact boundary; `meda.css` no longer overrides shared hero geometry.
`ShidaNavigation` measures its height only inside an opted-in public shell;
account and management consumers retain their existing clearance behavior.

Paired captures use the same synthetic listings, signed-out account state,
unfiltered FR routes, and 390×900 / 1440×900 viewports. They are retained under
[`evidence/public-marketplace-standard-20261118`](evidence/public-marketplace-standard-20261118).
The `before-*` files show the development baseline (including its development
indicator); `after-*` files show the production build of the new presentation. Fixtures are supplied by
the existing test-only fetch preload, never imported by application code.

For a built local preview, run `node scripts/preview-public-standard.mjs`.
The launcher explicitly sets the isolated fixture origin and mode, loads the
existing fixture guard, and binds Next.js to loopback port 3017. Its `--check`
option verifies the three expected synthetic jobs without starting a server.
This avoids relying on environment variables copied into a different terminal.

Completed local checks: 36 tests across `marketplace-components`,
`marketplace-pages` and `marketplace-refinement`; focused ESLint; TypeScript;
production webpack build. Chromium development-page checks covered all eight
collections at 320, 375, 390, 430, 767, 768, 820, 1023, 1024 and 1440px;
EN/FR/LN/SW at 200% text; Meda filter/reload/access boundaries; search and filter
regressions in the reference markets; navigation and simulated keyboard clearance.
A long French Services heading initially overflowed at 200% text; the shared
heading wrap rule fixed it without reducing font size.

Final production-bundle verification passed all 18 focused Chromium tests (14
public-contract/state tests and four reference-market interaction regressions).
Production streaming briefly retains hidden page copies after the header hydrates;
test readiness now waits for a single visible, settled page heading instead of
using header readiness alone. The initial failures and subsequent passing reruns
were test synchronization fixes; no application behavior was bypassed.

Run the focused browser set with:

```powershell
node node_modules/@playwright/test/cli.js test --config playwright.public-standard.config.ts --grep 'public contract|public translations|Meda public controls|public chrome navigation|200 percent text, uninterrupted|Jobs search, category|Wenze categories, shops|other market searches'
```

Physical Safari/Android, real OS keyboards, toolbar animations, a screen-reader
session and authenticated business workflows were not verified by these checks.
This presentation change does not alter those workflows or establish that every
existing marketplace accessibility issue has been resolved.
