# Products page implementation

The English and French Products pages now present the NIHILOBA portfolio in the editorial style used on Home and About: ivory and cream surfaces, forest green, Georgia headings, existing sans-serif body text, fine rules, square images and restrained buttons.

## Files

| File | Change |
| --- | --- |
| `app/components/pages/products-page.tsx` | New server-rendered Products page, image helper, numbered section labels and two local line icons. |
| `app/components/pages/products-page.css` | Products-scoped styling and responsive layouts. |
| `app/lib/products-copy.ts` | Typed English/French copy, image descriptions and availability language. |
| `app/(localized)/[lang]/products/page.tsx` | Imports the dedicated page component; preserves route and metadata generation. |
| `app/components/pages/localized-pages.tsx` | Re-exports the new component; removes obsolete Products copy, page and private SHIDA panel. |
| `app/lib/i18n.ts` | Updates only the two Products descriptions, also used by OpenGraph. |
| `public/product/products-shida-hotels.png` | Corrects the supplied filename from `products-shida-hotels..png`; image bytes unchanged. |
| `tests/browser/products-review.mjs` | Repeatable production-browser verification and screenshots. |
| `docs/products-redesign.md` | This implementation report. |

Pre-existing restaurant edits and tests were left untouched. The supplied `public/product/` directory was already untracked; all eight assets are used and must accompany the page when committed.

## Sections and assets

1. **Our products:** split copy/image hero, portfolio anchor and contact CTA; `/product/product-hero.png`.
2. **01 — SHIDA:** portfolio explanation, discovery and WhatsApp links, five aligned portrait image panels, seven monochrome marketplace labels, Discover/Manage dimensions and an availability note. Images: `/product/products-shida-vendor.png`, `/product/products-shida-services.png`, `/product/products-shida-housing.png`, `/product/products-shida-hotels.png`, `/product/products-shida-transport.png`.
3. **02 — WhatsApp:** three editorial principles, with familiar, guided and connected themes.
4. **03 — Education:** explicitly planned nonprofit initiative, older-women learning focus, three learning themes and localized Education CTA; `/product/products-education-women-learning.png` retains all three women.
5. **04 — Product approach:** need → useful solution → simple experience → long-term value, with line icons and supporting text.
6. **Let’s build together:** contact invitation beside the integrated wide `/product/products-closing-pont-marechal.png` scene.

The existing `SiteDocument`, header, footer, cart, language switcher, `ButtonLink`, navigation helpers, official WhatsApp URL and shared line icons are reused. No new dependencies or client-side page logic were added. No images were generated, fetched or replaced.

## Copy and assumptions

The supplied English and French copy is implemented, including localized alt text and accessible labels. French wording was lightly refined for the guided-journey and accessible-learning themes. SHIDA management copy includes “where these tools are available” and the same availability qualification used on Home. Marketplace labels describe scope without inventing individual destination routes or promising production availability. Education is consistently described as planned/in preparation.

The mockup supplied in the follow-up is now the layout reference: integrated edge-to-edge hero and closing imagery, tall aligned marketplace panels with seven labels beneath, and compact horizontal editorial rows. Existing NIHILOBA green/ivory colors and the shared header/footer are preserved. These differ from the reference's blue palette and compact footer. Full required copy, Discover/Manage dimensions and the availability note are retained, making some rows taller. Soft image-edge masks reproduce the reference's image-to-paper transition. Original supplied imagery, including Pont Marechal, is retained rather than regenerated. English SHIDA remains `/shida/`; French remains `/fr/shida/`.

## Responsive, accessibility and SEO

- Desktop/laptop: integrated hero and closing imagery; SHIDA copy beside tall image panels; WhatsApp copy beside three principles; Education copy/image/themes in one row; approach copy beside four process steps.
- At 940px and below: section copy stacks above supporting content. Education image and themes remain side by side until mobile.
- At 700px and below: hero and closing images stack without masks; marketplace imagery scrolls horizontally; labels use two columns; principles, Education and process steps stack. The closing crop retains the bridge.
- One H1, sequential section headings, semantic sections/lists, localized nonempty alt text, decorative SVGs hidden from assistive technology, and keyboard-focusable image scrolling.
- Existing visible focus styling and skip navigation retained; all page CTAs have at least 44px height. All page buttons remain at least 44px.
- Next Image handles responsive source sizes, eager/high-priority hero loading and lazy loading elsewhere. Explicit aspect ratios reserve layout space.
- Canonical URLs, language alternates, titles and OpenGraph images are preserved. Products meta/OpenGraph descriptions now cover SHIDA, planned Education and the product approach.

## Validation

| Command/check | Result |
| --- | --- |
| `npm run lint` | Passed. |
| `npm run typecheck` | Passed. |
| `npm run build` | Passed; both Products routes prerendered, all 80 static pages generated. |
| `node node_modules/vitest/vitest.mjs run tests/button-link.test.tsx tests/production-regression.test.ts` | Passed: 2 files, 6 tests. |
| `node tests/browser/products-review.mjs` | Passed: English/French at 1440, 1024, 768 and 390px; image decoding, all asset URLs, CTA routes, hash navigation, header/footer, language switcher, cart, metadata, focus, keyboard scrolling, skip link, no overflow or runtime errors. Home/About navigation smoke checks also passed. |
| `git diff --check` | Passed. |

Baseline lint and typecheck passed before implementation. Build output contains a nonfatal external-network `fetch failed` / `connect EACCES 216.24.57.7:443` diagnostic during static generation. This is an environment/network restriction; Products uses local assets and static copy, with no external fetch. The build still exits successfully. A separate baseline build was not run, so this is recorded as a build-environment diagnostic rather than a proven pre-existing build failure.

Browser screenshots and machine-readable results are written to ignored `test-results/products/`: `en-1440.png`, `en-1024.png`, `en-768.png`, `en-390.png`, their French equivalents, and `verification.json`. Desktop, laptop, tablet and mobile screenshots were visually reviewed. No observed Products regression; browser testing uses headless Chrome, not a cross-browser matrix. Core Web Vitals were not measured in field traffic.

To reproduce locally, run `node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3033`, then the browser verification command above. Set `PRODUCTS_TEST_URL` to test a different local server.
